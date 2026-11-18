// Estado global do app (useReducer + useContext). Toda tela lê os dados daqui
// e pede mudanças pelas ações; o contexto cuida de persistir e notificar.
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { AppState } from 'react-native';
import { Orcamento } from '../models/Orcamento';
import * as banco from '../services/banco';
import { removerTodosOsCofrinhos } from '../services/cofrinhos';
import { obterCotacao } from '../services/cambio';
import {
  agendarLembreteDiario,
  cancelarLembrete,
  notificarAgora,
} from '../services/notificacoes';
import {
  apagarPreferencias,
  lerCotacaoSalva,
  lerPreferencias,
  PREFERENCIAS_PADRAO,
  salvarPreferencias,
} from '../services/preferencias';
import { apagarSessao, lerSessao, salvarSessao } from '../services/sessao';
import { Cotacao, Gasto, NovoGasto, OrigemCotacao, Preferencias, Sessao } from '../types';
import { arredondar, formatarMoeda, mesmoMes } from '../utils/formato';

type StatusCotacao = 'carregando' | 'pronta' | 'erro';

type Estado = {
  iniciando: boolean;
  sessao: Sessao | null;
  desbloqueado: boolean;
  gastos: Gasto[];
  preferencias: Preferencias;
  cotacao: Cotacao | null;
  origemCotacao: OrigemCotacao | null;
  statusCotacao: StatusCotacao;
};

type Acao =
  | { tipo: 'INICIADO'; sessao: Sessao | null; gastos: Gasto[]; preferencias: Preferencias; cotacao: Cotacao | null }
  | { tipo: 'SESSAO_ABERTA'; sessao: Sessao }
  | { tipo: 'SESSAO_BLOQUEADA' }
  | { tipo: 'DADOS_APAGADOS' }
  | { tipo: 'GASTO_ADICIONADO'; gasto: Gasto }
  | { tipo: 'GASTO_ATUALIZADO'; gasto: Gasto }
  | { tipo: 'GASTO_REMOVIDO'; id: number }
  | { tipo: 'PREFERENCIAS_ALTERADAS'; preferencias: Preferencias }
  | { tipo: 'COTACAO_CARREGANDO' }
  | { tipo: 'COTACAO_RECEBIDA'; cotacao: Cotacao; origem: OrigemCotacao }
  | { tipo: 'COTACAO_FALHOU' };

const estadoInicial: Estado = {
  iniciando: true,
  sessao: null,
  desbloqueado: false,
  gastos: [],
  preferencias: PREFERENCIAS_PADRAO,
  cotacao: null,
  origemCotacao: null,
  statusCotacao: 'carregando',
};

function ordenar(gastos: Gasto[]): Gasto[] {
  return [...gastos].sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id);
}

function redutor(estado: Estado, acao: Acao): Estado {
  switch (acao.tipo) {
    case 'INICIADO':
      return {
        ...estado,
        iniciando: false,
        sessao: acao.sessao,
        gastos: acao.gastos,
        preferencias: acao.preferencias,
        // Se a API já respondeu enquanto os dados eram lidos, mantém a cotação nova.
        cotacao: estado.cotacao ?? acao.cotacao,
        origemCotacao: estado.cotacao ? estado.origemCotacao : acao.cotacao ? 'cache' : null,
      };
    case 'SESSAO_ABERTA':
      return { ...estado, sessao: acao.sessao, desbloqueado: true };
    case 'SESSAO_BLOQUEADA':
      return { ...estado, desbloqueado: false };
    case 'DADOS_APAGADOS':
      // A cotação não é um dado pessoal, então continua valendo.
      return {
        ...estadoInicial,
        iniciando: false,
        cotacao: estado.cotacao,
        origemCotacao: estado.origemCotacao,
        statusCotacao: estado.statusCotacao,
      };
    case 'GASTO_ADICIONADO':
      return { ...estado, gastos: ordenar([acao.gasto, ...estado.gastos]) };
    case 'GASTO_ATUALIZADO':
      return {
        ...estado,
        gastos: estado.gastos.map((g) => (g.id === acao.gasto.id ? acao.gasto : g)),
      };
    case 'GASTO_REMOVIDO':
      return { ...estado, gastos: estado.gastos.filter((g) => g.id !== acao.id) };
    case 'PREFERENCIAS_ALTERADAS':
      return { ...estado, preferencias: acao.preferencias };
    case 'COTACAO_CARREGANDO':
      return { ...estado, statusCotacao: 'carregando' };
    case 'COTACAO_RECEBIDA':
      return {
        ...estado,
        cotacao: acao.cotacao,
        origemCotacao: acao.origem,
        statusCotacao: 'pronta',
      };
    case 'COTACAO_FALHOU':
      return { ...estado, statusCotacao: 'erro' };
    default:
      return estado;
  }
}

type ValorDoContexto = Estado & {
  /** Soma dos gastos do mês atual, em reais. */
  totalDoMes: number;
  orcamentoDoMes: Orcamento;
  cadastrar: (nome: string, pin: string) => Promise<void>;
  desbloquear: (pin: string) => boolean;
  bloquear: () => void;
  apagarTudo: () => Promise<void>;
  adicionarGasto: (novo: NovoGasto) => Promise<void>;
  editarGasto: (gasto: Gasto) => Promise<void>;
  excluirGasto: (id: number) => Promise<void>;
  alterarPreferencias: (mudancas: Partial<Preferencias>) => Promise<void>;
  /** Liga/desliga o lembrete diário. Devolve false se o usuário negou a permissão. */
  definirLembrete: (ligado: boolean, hora: number) => Promise<boolean>;
  atualizarCotacao: () => Promise<void>;
};

const AppContext = createContext<ValorDoContexto | null>(null);

const INTERVALO_COTACAO_MS = 10 * 60 * 1000;

export function AppProvider({ children }: { children: ReactNode }) {
  const [estado, dispatch] = useReducer(redutor, estadoInicial);

  // useRef: guarda valores entre renderizações sem provocar uma nova renderização.
  const ultimaBusca = useRef(0);
  const buscando = useRef(false);
  const preferenciasAtuais = useRef(estado.preferencias);
  useEffect(() => {
    preferenciasAtuais.current = estado.preferencias;
  }, [estado.preferencias]);

  const atualizarCotacao = useCallback(async () => {
    if (buscando.current) return;
    buscando.current = true;
    dispatch({ tipo: 'COTACAO_CARREGANDO' });
    try {
      const { cotacao, origem } = await obterCotacao();
      ultimaBusca.current = Date.now();
      dispatch({ tipo: 'COTACAO_RECEBIDA', cotacao, origem });
    } catch {
      dispatch({ tipo: 'COTACAO_FALHOU' });
    } finally {
      buscando.current = false;
    }
  }, []);

  /** Busca a cotação só se a última busca bem-sucedida já passou do intervalo. */
  const atualizarCotacaoSeVelha = useCallback(() => {
    if (Date.now() - ultimaBusca.current > INTERVALO_COTACAO_MS) atualizarCotacao();
  }, [atualizarCotacao]);

  // Montagem: carrega tudo o que está salvo no aparelho e busca a cotação.
  useEffect(() => {
    let montado = true;
    (async () => {
      const [sessao, gastos, preferencias, cotacao] = await Promise.all([
        lerSessao().catch(() => null),
        banco.listarGastos().catch(() => []),
        lerPreferencias().catch(() => PREFERENCIAS_PADRAO),
        lerCotacaoSalva().catch(() => null),
      ]);
      if (!montado) return;
      dispatch({ tipo: 'INICIADO', sessao, gastos, preferencias, cotacao });
      atualizarCotacaoSeVelha();
    })();
    return () => {
      montado = false;
    };
  }, [atualizarCotacaoSeVelha]);

  // Ciclo de vida do app: ao voltar para o primeiro plano, renova a cotação se estiver velha.
  useEffect(() => {
    const inscricao = AppState.addEventListener('change', (situacao) => {
      if (situacao === 'active') atualizarCotacaoSeVelha();
    });
    return () => inscricao.remove();
  }, [atualizarCotacaoSeVelha]);

  // useMemo: só recalcula o total quando a lista de gastos muda.
  const totalDoMes = useMemo(
    () =>
      arredondar(
        estado.gastos.filter((g) => mesmoMes(g.data)).reduce((soma, g) => soma + g.valorReais, 0),
      ),
    [estado.gastos],
  );

  const orcamentoDoMes = useMemo(
    () => new Orcamento(estado.preferencias.orcamento, totalDoMes),
    [estado.preferencias.orcamento, totalDoMes],
  );

  const cadastrar = useCallback(async (nome: string, pin: string) => {
    const sessao: Sessao = { nome, pin };
    await salvarSessao(sessao);
    dispatch({ tipo: 'SESSAO_ABERTA', sessao });
  }, []);

  const desbloquear = useCallback(
    (pin: string) => {
      if (!estado.sessao || estado.sessao.pin !== pin) return false;
      dispatch({ tipo: 'SESSAO_ABERTA', sessao: estado.sessao });
      return true;
    },
    [estado.sessao],
  );

  const bloquear = useCallback(() => dispatch({ tipo: 'SESSAO_BLOQUEADA' }), []);

  const apagarTudo = useCallback(async () => {
    await cancelarLembrete(preferenciasAtuais.current.lembreteId).catch(() => undefined);
    await Promise.all([
      apagarSessao(),
      apagarPreferencias(),
      banco.removerTodosOsGastos(),
      removerTodosOsCofrinhos(),
    ]);
    dispatch({ tipo: 'DADOS_APAGADOS' });
  }, []);

  const adicionarGasto = useCallback(
    async (novo: NovoGasto) => {
      const cotacao = novo.moeda === 'BRL' ? 1 : estado.cotacao?.[novo.moeda];
      if (!cotacao) {
        throw new Error('Sem cotação disponível para converter esta moeda. Conecte-se à internet e tente de novo.');
      }

      const gasto = await banco.inserirGasto({
        ...novo,
        cotacao,
        valorReais: arredondar(novo.valorOriginal * cotacao),
      });
      dispatch({ tipo: 'GASTO_ADICIONADO', gasto });

      // Notificação: avisa quando este gasto fez o mês cruzar 80% ou 100% do orçamento.
      const { orcamento, alertasOrcamento } = estado.preferencias;
      if (!alertasOrcamento || orcamento <= 0 || !mesmoMes(gasto.data)) return;

      const antes = new Orcamento(orcamento, totalDoMes);
      const depois = new Orcamento(orcamento, totalDoMes + gasto.valorReais);
      const limite = depois.cruzouLimiteDesde(antes);

      if (limite === 'estourado') {
        await notificarAgora(
          'Orçamento estourado',
          `Você passou do limite de ${formatarMoeda(orcamento)} em ${formatarMoeda(-depois.saldo)}.`,
          'orcamento',
        ).catch(() => undefined);
      } else if (limite === 'atencao') {
        await notificarAgora(
          'Você já usou 80% do orçamento',
          `Restam ${formatarMoeda(depois.saldo)} para o resto do mês.`,
          'orcamento',
        ).catch(() => undefined);
      }
    },
    [estado.cotacao, estado.preferencias, totalDoMes],
  );

  const editarGasto = useCallback(async (gasto: Gasto) => {
    const atualizado = { ...gasto, valorReais: arredondar(gasto.valorOriginal * gasto.cotacao) };
    await banco.atualizarGasto(atualizado);
    dispatch({ tipo: 'GASTO_ATUALIZADO', gasto: atualizado });
  }, []);

  const excluirGasto = useCallback(async (id: number) => {
    await banco.removerGasto(id);
    dispatch({ tipo: 'GASTO_REMOVIDO', id });
  }, []);

  const alterarPreferencias = useCallback(async (mudancas: Partial<Preferencias>) => {
    const preferencias = { ...preferenciasAtuais.current, ...mudancas };
    preferenciasAtuais.current = preferencias;
    dispatch({ tipo: 'PREFERENCIAS_ALTERADAS', preferencias });
    await salvarPreferencias(preferencias);
  }, []);

  const definirLembrete = useCallback(
    async (ligado: boolean, hora: number) => {
      await cancelarLembrete(preferenciasAtuais.current.lembreteId).catch(() => undefined);

      if (!ligado) {
        await alterarPreferencias({ lembreteDiario: false, lembreteId: null, horaLembrete: hora });
        return true;
      }

      const lembreteId = await agendarLembreteDiario(hora);
      await alterarPreferencias({
        lembreteDiario: lembreteId !== null,
        lembreteId,
        horaLembrete: hora,
      });
      return lembreteId !== null;
    },
    [alterarPreferencias],
  );

  const valor = useMemo<ValorDoContexto>(
    () => ({
      ...estado,
      totalDoMes,
      orcamentoDoMes,
      cadastrar,
      desbloquear,
      bloquear,
      apagarTudo,
      adicionarGasto,
      editarGasto,
      excluirGasto,
      alterarPreferencias,
      definirLembrete,
      atualizarCotacao,
    }),
    [
      estado,
      totalDoMes,
      orcamentoDoMes,
      cadastrar,
      desbloquear,
      bloquear,
      apagarTudo,
      adicionarGasto,
      editarGasto,
      excluirGasto,
      alterarPreferencias,
      definirLembrete,
      atualizarCotacao,
    ],
  );

  return <AppContext.Provider value={valor}>{children}</AppContext.Provider>;
}

/** Hook próprio para as telas acessarem o estado global. */
export function useApp(): ValorDoContexto {
  const contexto = useContext(AppContext);
  if (!contexto) throw new Error('useApp precisa ser usado dentro de <AppProvider>.');
  return contexto;
}
