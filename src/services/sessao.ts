// Persistência segura com SecureStore (Keychain no iOS, Keystore no Android):
// guarda o nome e o PIN que protegem os dados financeiros do usuário.
import * as SecureStore from 'expo-secure-store';
import { Sessao } from '../types';

const CHAVE = 'bolsocerto.sessao';

export async function salvarSessao(sessao: Sessao): Promise<void> {
  await SecureStore.setItemAsync(CHAVE, JSON.stringify(sessao));
}

export async function lerSessao(): Promise<Sessao | null> {
  const json = await SecureStore.getItemAsync(CHAVE);
  return json ? (JSON.parse(json) as Sessao) : null;
}

export async function apagarSessao(): Promise<void> {
  await SecureStore.deleteItemAsync(CHAVE);
}
