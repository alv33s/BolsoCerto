// Models (tipos) usados em todo o app.
import { NavigatorScreenParams } from '@react-navigation/native';

export type Moeda = 'BRL' | 'USD' | 'EUR';

export type Categoria =
  | 'Alimentação'
  | 'Transporte'
  | 'Lazer'
  | 'Contas'
  | 'Saúde'
  | 'Outros'
  | 'Cofrinho';

/** Categoria dos lançamentos criados pelos cofrinhos (não aparece no cadastro de gasto). */
export const CATEGORIA_COFRINHO: Categoria = 'Cofrinho';

export const MOEDAS: Moeda[] = ['BRL', 'USD', 'EUR'];

/** Categorias que o usuário pode escolher ao registrar um gasto. */
export const CATEGORIAS: Categoria[] = [
  'Alimentação',
  'Transporte',
  'Lazer',
  'Contas',
  'Saúde',
  'Outros',
];

export type Gasto = {
  id: number;
  descricao: string;
  valorOriginal: number;
  moeda: Moeda;
  /** Cotação usada na hora do cadastro (1 quando a moeda é BRL). */
  cotacao: number;
  /** Valor já convertido para reais, gravado no cadastro para o histórico não mudar. */
  valorReais: number;
  categoria: Categoria;
  /** Data no formato ISO (ex.: 2026-11-17T12:00:00.000Z). */
  data: string;
};

/** Dados que a tela de cadastro envia; id, cotação e valor em reais são calculados depois. */
export type NovoGasto = Pick<Gasto, 'descricao' | 'valorOriginal' | 'moeda' | 'categoria' | 'data'>;

export type Cotacao = {
  USD: number;
  EUR: number;
  /** Momento em que a cotação foi buscada no web service (ISO). */
  atualizadaEm: string;
};

export type OrigemCotacao = 'api' | 'cache';

export type Preferencias = {
  orcamento: number;
  alertasOrcamento: boolean;
  lembreteDiario: boolean;
  horaLembrete: number;
  /** Id da notificação agendada, guardado para poder cancelar depois. */
  lembreteId: string | null;
};

export type Sessao = {
  nome: string;
  pin: string;
};

export type Cofrinho = {
  id: number;
  nome: string;
  /** Quanto o usuário quer juntar, em reais. */
  meta: number;
  /** Soma de tudo que foi guardado menos o que foi retirado. */
  guardado: number;
  criadoEm: string;
};

export type Movimentacao = {
  id: number;
  cofrinhoId: number;
  /** Positivo quando guarda, negativo quando retira. */
  valor: number;
  data: string;
  /** Lançamento nos gastos do mês criado junto com esta movimentação. */
  gastoId: number | null;
};

// Rotas da navegação (Stack + Tabs + Modal).
export type RotasPilha = {
  Login: undefined;
  /** Permite abrir uma aba específica, ex.: navigate('Abas', { screen: 'Cofrinhos' }). */
  Abas: NavigatorScreenParams<RotasAbas> | undefined;
  DetalheGasto: { id: number };
  NovoGasto: undefined;
  /** aporteSugerido: sobra do orçamento do mês, para começar a simulação. */
  Simulador: { aporteSugerido?: number } | undefined;
  NovoCofrinho: undefined;
  DetalheCofrinho: { id: number };
};

export type RotasAbas = {
  Resumo: undefined;
  Gastos: undefined;
  Cofrinhos: undefined;
  Metas: undefined;
};
