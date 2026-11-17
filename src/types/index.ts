// Models (tipos) usados em todo o app.

export type Moeda = 'BRL' | 'USD' | 'EUR';

export type Categoria = 'Alimentação' | 'Transporte' | 'Lazer' | 'Contas' | 'Saúde' | 'Outros';

export const MOEDAS: Moeda[] = ['BRL', 'USD', 'EUR'];

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

// Rotas da navegação (Stack + Tabs + Modal).
export type RotasPilha = {
  Login: undefined;
  Abas: undefined;
  DetalheGasto: { id: number };
  NovoGasto: undefined;
  /** aporteSugerido: sobra do orçamento do mês, para começar a simulação. */
  Simulador: { aporteSugerido?: number } | undefined;
};

export type RotasAbas = {
  Resumo: undefined;
  Gastos: undefined;
  Metas: undefined;
};
