// Persistência simples (chave-valor) com AsyncStorage:
// preferências do usuário e a última cotação consultada (cache para uso offline).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cotacao, Preferencias } from '../types';

const CHAVE_PREFERENCIAS = '@bolsocerto/preferencias';
const CHAVE_COTACAO = '@bolsocerto/cotacao';

export const PREFERENCIAS_PADRAO: Preferencias = {
  orcamento: 2000,
  alertasOrcamento: true,
  lembreteDiario: false,
  horaLembrete: 20,
  lembreteId: null,
};

async function salvar<T>(chave: string, valor: T): Promise<void> {
  await AsyncStorage.setItem(chave, JSON.stringify(valor));
}

async function ler<T>(chave: string): Promise<T | null> {
  const json = await AsyncStorage.getItem(chave);
  return json ? (JSON.parse(json) as T) : null;
}

export async function lerPreferencias(): Promise<Preferencias> {
  const salvas = await ler<Partial<Preferencias>>(CHAVE_PREFERENCIAS);
  return { ...PREFERENCIAS_PADRAO, ...salvas };
}

export function salvarPreferencias(preferencias: Preferencias): Promise<void> {
  return salvar(CHAVE_PREFERENCIAS, preferencias);
}

export function lerCotacaoSalva(): Promise<Cotacao | null> {
  return ler<Cotacao>(CHAVE_COTACAO);
}

export function salvarCotacao(cotacao: Cotacao): Promise<void> {
  return salvar(CHAVE_COTACAO, cotacao);
}

export async function apagarPreferencias(): Promise<void> {
  await AsyncStorage.removeItem(CHAVE_PREFERENCIAS);
}
