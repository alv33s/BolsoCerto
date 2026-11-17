// Requisição ao web service do Banco Central (SGS – Sistema Gerenciador de Séries Temporais).
// Série 432 = meta da Selic definida pelo Copom, em % ao ano. Gratuito e sem chave.
// Documentação: https://dadosabertos.bcb.gov.br/dataset/432-taxa-de-juros---meta-selic-definida-pelo-copom
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buscarJson } from './http';

const URL_SELIC = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json';
const CHAVE_SELIC = '@bolsocerto/selic';

/** Model da resposta: uma lista com { data: "dd/mm/aaaa", valor: "14.25" }. */
type RespostaSgs = { data: string; valor: string }[];

export type TaxaSelic = {
  /** Meta da Selic em % ao ano. */
  valor: number;
  /** Data de referência informada pelo Banco Central (dd/mm/aaaa). */
  referencia: string;
  /** Momento em que foi buscada (ISO). */
  buscadaEm: string;
};

export type OrigemSelic = 'api' | 'cache';

export async function buscarSelicNaApi(): Promise<TaxaSelic> {
  const dados = (await buscarJson(URL_SELIC)) as RespostaSgs;
  const ultimo = Array.isArray(dados) ? dados[dados.length - 1] : undefined;
  const valor = Number(String(ultimo?.valor ?? '').replace(',', '.'));

  // A Selic é positiva e, no Brasil, nunca passou de 50% ao ano desde o Plano Real.
  if (!ultimo || !(valor > 0) || valor > 50) {
    throw new Error('O Banco Central devolveu dados inválidos.');
  }

  return { valor, referencia: ultimo.data, buscadaEm: new Date().toISOString() };
}

/** Busca a Selic e guarda no aparelho. Sem internet, usa a última salva. */
export async function obterSelic(): Promise<{ selic: TaxaSelic; origem: OrigemSelic }> {
  try {
    const selic = await buscarSelicNaApi();
    await AsyncStorage.setItem(CHAVE_SELIC, JSON.stringify(selic)).catch(() => undefined);
    console.log(`[selic] Selic obtida no Banco Central: ${selic.valor}% ao ano (${selic.referencia})`);
    return { selic, origem: 'api' };
  } catch (erro) {
    console.warn('[selic] Banco Central não respondeu.', erro);
    const json = await AsyncStorage.getItem(CHAVE_SELIC).catch(() => null);
    if (json) return { selic: JSON.parse(json) as TaxaSelic, origem: 'cache' };
    throw erro;
  }
}
