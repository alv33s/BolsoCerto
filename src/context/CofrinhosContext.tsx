// Estado dos cofrinhos, compartilhado entre a lista, o cadastro e o detalhe.
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as servico from '../services/cofrinhos';
import { notificarAgora } from '../services/notificacoes';
import { Cofrinho } from '../types';
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
  removerMovimentacao: (id: number) => Promise<void>;
};

const CofrinhosContext = createContext<ValorDoContexto | null>(null);

export function CofrinhosProvider({ children }: { children: ReactNode }) {
  const { sessao } = useApp();
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

  const criar = useCallback(
    async (nome: string, meta: number, valorInicial: number) => {
      await servico.criarCofrinho(nome, meta, valorInicial);
      await recarregar();
    },
    [recarregar],
  );

  const excluir = useCallback(
    async (id: number) => {
      await servico.excluirCofrinho(id);
      await recarregar();
    },
    [recarregar],
  );

  const movimentar = useCallback(
    async (id: number, valor: number) => {
      const cofrinho = cofrinhos.find((c) => c.id === id);
      if (!cofrinho) throw new Error('Este cofrinho não existe mais.');
      if (cofrinho.guardado + valor < 0) {
        throw new Error(`Só há ${formatarMoeda(cofrinho.guardado)} guardados neste cofrinho.`);
      }

      await servico.adicionarMovimentacao(id, valor);
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
    [cofrinhos, recarregar],
  );

  const removerMovimentacao = useCallback(
    async (id: number) => {
      await servico.removerMovimentacao(id);
      await recarregar();
    },
    [recarregar],
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
