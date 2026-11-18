// Estado dos cofrinhos, compartilhado entre a lista, o cadastro e o detalhe.
// Guardar dinheiro num cofrinho também lança o valor nos gastos do mês
// (categoria Cofrinho); retirar lança o valor negativo, devolvendo ao orçamento.
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as servico from '../services/cofrinhos';
import { notificarAgora } from '../services/notificacoes';
import { CATEGORIA_COFRINHO, Cofrinho, Movimentacao } from '../types';
import { arredondar, formatarMoeda } from '../utils/formato';
import { useApp } from './AppContext';

type ValorDoContexto = {
  cofrinhos: Cofrinho[];
  carregando: boolean;
  /** Soma do que está guardado em todos os cofrinhos. */
  totalGuardado: number;
  criar: (nome: string, meta: number, valorInicial: number) => Promise<void>;
  excluir: (id: number) => Promise<void>;
  /** Guarda (valor positivo) ou retira (valor negativo) dinheiro de um cofrinho. */
  movimentar: (id: number, valor: number) => Promise<void>;
  removerMovimentacao: (movimentacao: Movimentacao) => Promise<void>;
};

/** O que é preciso saber do cofrinho para registrar uma movimentação. */
type DadosDoCofrinho = Pick<Cofrinho, 'id' | 'nome' | 'meta' | 'guardado'>;

const CofrinhosContext = createContext<ValorDoContexto | null>(null);

export function CofrinhosProvider({ children }: { children: ReactNode }) {
  const { sessao, adicionarGasto, excluirGastos } = useApp();
  const [cofrinhos, setCofrinhos] = useState<Cofrinho[]>([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    try {
      setCofrinhos(await servico.listarCofrinhos());
    } catch (erro) {
      console.warn('[cofrinhos] Não foi possível ler os cofrinhos.', erro);
    } finally {
      setCarregando(false);
    }
  }, []);

  // Carrega ao abrir o app e de novo quando a sessão muda (ex.: depois de apagar tudo).
  useEffect(() => {
    recarregar();
  }, [recarregar, sessao]);

  const totalGuardado = useMemo(
    () => arredondar(cofrinhos.reduce((soma, c) => soma + c.guardado, 0)),
    [cofrinhos],
  );

  /** Lança o valor nos gastos do mês e registra a movimentação ligada a esse lançamento. */
  const registrar = useCallback(
    async (cofrinho: DadosDoCofrinho, valor: number) => {
      const gasto = await adicionarGasto({
        descricao:
          valor > 0 ? `Guardado no cofrinho ${cofrinho.nome}` : `Retirado do cofrinho ${cofrinho.nome}`,
        valorOriginal: valor,
        moeda: 'BRL',
        categoria: CATEGORIA_COFRINHO,
        data: new Date().toISOString(),
      });

      try {
        await servico.adicionarMovimentacao(cofrinho.id, valor, gasto.id);
      } catch (erro) {
        // Se a movimentação não foi salva, desfaz o lançamento para os dois não ficarem diferentes.
        await excluirGastos([gasto.id]).catch(() => undefined);
        throw erro;
      }
      await recarregar();

      // Notificação: avisa quando este depósito fez o cofrinho chegar na meta.
      const depois = cofrinho.guardado + valor;
      if (valor > 0 && cofrinho.guardado < cofrinho.meta && depois >= cofrinho.meta) {
        await notificarAgora(
          'Meta atingida!',
          `Você juntou ${formatarMoeda(depois)} no cofrinho "${cofrinho.nome}".`,
          'cofrinho',
        );
      }
    },
    [adicionarGasto, excluirGastos, recarregar],
  );

  const criar = useCallback(
    async (nome: string, meta: number, valorInicial: number) => {
      const id = await servico.criarCofrinho(nome, meta);
      await recarregar();
      if (valorInicial > 0) {
        await registrar({ id, nome, meta, guardado: 0 }, valorInicial);
      }
    },
    [recarregar, registrar],
  );

  const excluir = useCallback(
    async (id: number) => {
      const gastosLigados = await servico.excluirCofrinho(id);
      await excluirGastos(gastosLigados);
      await recarregar();
    },
    [excluirGastos, recarregar],
  );

  const movimentar = useCallback(
    async (id: number, valor: number) => {
      const cofrinho = cofrinhos.find((c) => c.id === id);
      if (!cofrinho) throw new Error('Este cofrinho não existe mais.');
      if (cofrinho.guardado + valor < 0) {
        throw new Error(`Só há ${formatarMoeda(cofrinho.guardado)} guardados neste cofrinho.`);
      }
      await registrar(cofrinho, valor);
    },
    [cofrinhos, registrar],
  );

  const removerMovimentacao = useCallback(
    async (movimentacao: Movimentacao) => {
      // Apagar um depósito não pode deixar o cofrinho com saldo negativo.
      const cofrinho = cofrinhos.find((c) => c.id === movimentacao.cofrinhoId);
      if (cofrinho && cofrinho.guardado - movimentacao.valor < 0) {
        throw new Error('Apague antes as retiradas feitas depois deste depósito.');
      }
      const gastoId = await servico.removerMovimentacao(movimentacao.id);
      if (gastoId !== null) await excluirGastos([gastoId]);
      await recarregar();
    },
    [cofrinhos, excluirGastos, recarregar],
  );

  const valor = useMemo(
    () => ({ cofrinhos, carregando, totalGuardado, criar, excluir, movimentar, removerMovimentacao }),
    [cofrinhos, carregando, totalGuardado, criar, excluir, movimentar, removerMovimentacao],
  );

  return <CofrinhosContext.Provider value={valor}>{children}</CofrinhosContext.Provider>;
}

export function useCofrinhos(): ValorDoContexto {
  const contexto = useContext(CofrinhosContext);
  if (!contexto) throw new Error('useCofrinhos precisa ser usado dentro de <CofrinhosProvider>.');
  return contexto;
}
