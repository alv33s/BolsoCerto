// Requisição a web services de cotações (REST + JSON, todos sem chave).
// O app tenta um por vez, na ordem abaixo, até um responder:
//   1. AwesomeAPI        – https://docs.awesomeapi.com.br/api-de-moedas
//   2. ExchangeRate-API  – https://www.exchangerate-api.com/docs/free
//   3. Frankfurter       – https://frankfurter.dev
import { Cotacao, OrigemCotacao } from '../types';
import { lerCotacaoSalva, salvarCotacao } from './preferencias';

const TEMPO_LIMITE_MS = 8000;

// Models das respostas de cada API.
type RespostaAwesome = {
  USDBRL?: { bid: string };
  EURBRL?: { bid: string };
};

/** ExchangeRate-API: quanto 1 real vale em cada moeda. */
type RespostaExchangeRate = {
  result: string;
  rates?: { USD?: number; EUR?: number };
};

/** Frankfurter: quanto 1 real vale em cada moeda. */
type RespostaFrankfurter = {
  base: string;
  rates?: { USD?: number; EUR?: number };
};

/** Cada fonte sabe o endereço e como transformar a resposta em { USD, EUR } em reais. */
type FonteDeCotacao = {
  nome: string;
  url: string;
  converter: (dados: unknown) => { usd: number; eur: number };
};

/** Transforma "1 real = 0,19 dólar" em "1 dólar = 5,26 reais". */
function inverter(valor: number | undefined): number {
  return valor ? Number((1 / valor).toFixed(4)) : NaN;
}

const FONTES: FonteDeCotacao[] = [
  {
    nome: 'AwesomeAPI',
    url: 'https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL',
    converter: (dados) => {
      const d = dados as RespostaAwesome;
      return { usd: Number(d.USDBRL?.bid), eur: Number(d.EURBRL?.bid) };
    },
  },
  {
    nome: 'ExchangeRate-API',
    url: 'https://open.er-api.com/v6/latest/BRL',
    converter: (dados) => {
      const d = dados as RespostaExchangeRate;
      if (d.result !== 'success') throw new Error('O serviço devolveu um erro.');
      return { usd: inverter(d.rates?.USD), eur: inverter(d.rates?.EUR) };
    },
  },
  {
    nome: 'Frankfurter',
    url: 'https://api.frankfurter.dev/v1/latest?base=BRL&symbols=USD,EUR',
    converter: (dados) => {
      const d = dados as RespostaFrankfurter;
      return { usd: inverter(d.rates?.USD), eur: inverter(d.rates?.EUR) };
    },
  },
];

/** Faz um GET com tempo limite e devolve o JSON. Lança erro com uma mensagem legível. */
async function buscarJson(url: string): Promise<unknown> {
  // Cancela a requisição se o servidor demorar demais.
  const controle = new AbortController();
  const temporizador = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);

  try {
    const resposta = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controle.signal,
    });

    // Erros do servidor (ex.: 404, 429 = limite de requisições, 500).
    if (!resposta.ok) {
      throw new Error(`O serviço respondeu com erro ${resposta.status}.`);
    }

    return await resposta.json();
  } catch (erro) {
    if (erro instanceof Error && erro.name === 'AbortError') {
      throw new Error('O serviço demorou demais para responder.');
    }
    throw erro;
  } finally {
    clearTimeout(temporizador);
  }
}

async function buscarNaFonte(fonte: FonteDeCotacao): Promise<Cotacao> {
  const { usd, eur } = fonte.converter(await buscarJson(fonte.url));
  if (!(usd > 0) || !(eur > 0) || !Number.isFinite(usd) || !Number.isFinite(eur)) {
    throw new Error('O serviço de cotações devolveu dados inválidos.');
  }
  return { USD: usd, EUR: eur, atualizadaEm: new Date().toISOString() };
}

/** Tenta cada fonte, na ordem, até uma responder. */
export async function buscarCotacaoNaApi(): Promise<Cotacao> {
  let ultimoErro: unknown = new Error('Nenhuma fonte de cotação configurada.');
  for (const fonte of FONTES) {
    try {
      const cotacao = await buscarNaFonte(fonte);
      console.log(`[cotação] Cotação obtida na ${fonte.nome}: USD ${cotacao.USD}, EUR ${cotacao.EUR}`);
      return cotacao;
    } catch (erro) {
      console.warn(`[cotação] ${fonte.nome} falhou.`, erro);
      ultimoErro = erro;
    }
  }
  throw ultimoErro;
}

/**
 * Busca a cotação nos web services e guarda no aparelho.
 * Sem internet (ou com todas as APIs fora do ar), usa a última cotação salva.
 */
export async function obterCotacao(): Promise<{ cotacao: Cotacao; origem: OrigemCotacao }> {
  let cotacao: Cotacao;
  try {
    cotacao = await buscarCotacaoNaApi();
  } catch (erro) {
    console.warn('[cotação] Nenhuma API respondeu.', erro);
    const salva = await lerCotacaoSalva().catch(() => null);
    if (salva) return { cotacao: salva, origem: 'cache' };
    throw erro;
  }

  // Se não der para gravar no aparelho, a cotação recém-buscada continua valendo.
  await salvarCotacao(cotacao).catch(() => undefined);
  return { cotacao, origem: 'api' };
}
