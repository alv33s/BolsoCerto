// Requisição ao web service de cotações (AwesomeAPI, REST + JSON, sem chave).
// Documentação: https://docs.awesomeapi.com.br/api-de-moedas
import { Cotacao, OrigemCotacao } from '../types';
import { lerCotacaoSalva, salvarCotacao } from './preferencias';

// Passo 1: endereço da API.
const URL_COTACAO = 'https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL';
const TEMPO_LIMITE_MS = 8000;

// Passo 2: model da resposta.
type ParDeMoedas = {
  code: string;
  codein: string;
  name: string;
  bid: string;
  ask: string;
  create_date: string;
};

type RespostaCotacao = {
  USDBRL?: ParDeMoedas;
  EURBRL?: ParDeMoedas;
};

export async function buscarCotacaoNaApi(): Promise<Cotacao> {
  // Cancela a requisição se o servidor demorar demais.
  const controle = new AbortController();
  const temporizador = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);

  try {
    // Passo 3: requisição.
    const resposta = await fetch(URL_COTACAO, { method: 'GET', signal: controle.signal });

    // Passo 4: verificar a resposta (erros do servidor, ex.: 404, 429, 500).
    if (!resposta.ok) {
      throw new Error(`O serviço de cotações respondeu com erro ${resposta.status}.`);
    }

    // Passo 5: converter de acordo com o model.
    const dados: RespostaCotacao = await resposta.json();
    const usd = Number(dados.USDBRL?.bid);
    const eur = Number(dados.EURBRL?.bid);
    if (!(usd > 0) || !(eur > 0)) {
      throw new Error('O serviço de cotações devolveu dados inválidos.');
    }

    return { USD: usd, EUR: eur, atualizadaEm: new Date().toISOString() };
  } finally {
    clearTimeout(temporizador);
  }
}

/**
 * Busca a cotação no web service e guarda no aparelho.
 * Sem internet (ou com a API fora do ar), usa a última cotação salva.
 */
export async function obterCotacao(): Promise<{ cotacao: Cotacao; origem: OrigemCotacao }> {
  try {
    const cotacao = await buscarCotacaoNaApi();
    await salvarCotacao(cotacao);
    return { cotacao, origem: 'api' };
  } catch (erro) {
    const salva = await lerCotacaoSalva();
    if (salva) return { cotacao: salva, origem: 'cache' };
    throw erro;
  }
}
