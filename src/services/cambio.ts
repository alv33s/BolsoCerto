// Requisição a web services de cotações (REST + JSON, sem chave).
// Principal: AwesomeAPI – https://docs.awesomeapi.com.br/api-de-moedas
// Reserva:   Frankfurter – https://frankfurter.dev (usada se a principal falhar)
import { Cotacao, OrigemCotacao } from '../types';
import { lerCotacaoSalva, salvarCotacao } from './preferencias';

// Passo 1: endereços das APIs.
const URL_AWESOME = 'https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL';
const URL_FRANKFURTER = 'https://api.frankfurter.app/latest?from=BRL&to=USD,EUR';
const TEMPO_LIMITE_MS = 8000;

// Passo 2: models das respostas.
type ParDeMoedas = {
  code: string;
  codein: string;
  name: string;
  bid: string;
  ask: string;
  create_date: string;
};

type RespostaAwesome = {
  USDBRL?: ParDeMoedas;
  EURBRL?: ParDeMoedas;
};

/** Ex.: { base: "BRL", rates: { USD: 0.19, EUR: 0.17 } } = quanto 1 real vale em cada moeda. */
type RespostaFrankfurter = {
  base: string;
  rates?: { USD?: number; EUR?: number };
};

/** Faz um GET com tempo limite e devolve o JSON. Lança erro com uma mensagem legível. */
async function buscarJson<T>(url: string): Promise<T> {
  // Cancela a requisição se o servidor demorar demais.
  const controle = new AbortController();
  const temporizador = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);

  try {
    // Passo 3: requisição.
    const resposta = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controle.signal,
    });

    // Passo 4: verificar a resposta (erros do servidor, ex.: 404, 429, 500).
    if (!resposta.ok) {
      throw new Error(`O serviço respondeu com erro ${resposta.status}.`);
    }

    return (await resposta.json()) as T;
  } catch (erro) {
    if (erro instanceof Error && erro.name === 'AbortError') {
      throw new Error('O serviço demorou demais para responder.');
    }
    throw erro;
  } finally {
    clearTimeout(temporizador);
  }
}

function validar(usd: number, eur: number): Cotacao {
  // Passo 5: conferir se os dados convertidos fazem sentido.
  if (!(usd > 0) || !(eur > 0) || !Number.isFinite(usd) || !Number.isFinite(eur)) {
    throw new Error('O serviço de cotações devolveu dados inválidos.');
  }
  return { USD: usd, EUR: eur, atualizadaEm: new Date().toISOString() };
}

export async function buscarNaAwesomeApi(): Promise<Cotacao> {
  const dados = await buscarJson<RespostaAwesome>(URL_AWESOME);
  return validar(Number(dados.USDBRL?.bid), Number(dados.EURBRL?.bid));
}

export async function buscarNaFrankfurter(): Promise<Cotacao> {
  const dados = await buscarJson<RespostaFrankfurter>(URL_FRANKFURTER);
  // A API diz quanto 1 real vale em dólar; invertendo, temos quanto 1 dólar vale em reais.
  const usd = dados.rates?.USD ? 1 / dados.rates.USD : NaN;
  const eur = dados.rates?.EUR ? 1 / dados.rates.EUR : NaN;
  return validar(Number(usd.toFixed(4)), Number(eur.toFixed(4)));
}

/** Tenta a API principal e, se ela falhar, a de reserva. */
export async function buscarCotacaoNaApi(): Promise<Cotacao> {
  try {
    return await buscarNaAwesomeApi();
  } catch (erroPrincipal) {
    console.warn('[cotação] AwesomeAPI falhou, tentando a Frankfurter.', erroPrincipal);
    return buscarNaFrankfurter();
  }
}

/**
 * Busca a cotação no web service e guarda no aparelho.
 * Sem internet (ou com as APIs fora do ar), usa a última cotação salva.
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
