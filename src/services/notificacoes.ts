// Notificações locais externas (expo-notifications): aparecem fora do app,
// podem ser agendadas e precisam da permissão do usuário.
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export type TipoNotificacao = 'orcamento' | 'lembrete';

const CANAL = 'avisos';

// Define como a notificação aparece quando o app está aberto em primeiro plano.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function prepararCanal(): Promise<void> {
  // No Android toda notificação precisa de um canal.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: 'Avisos do BolsoCerto',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

/** Pede a permissão (se ainda não foi dada) e devolve se o app pode notificar. */
export async function pedirPermissao(): Promise<boolean> {
  await prepararCanal();
  const atual = await Notifications.getPermissionsAsync();
  if (atual.granted) return true;
  if (!atual.canAskAgain) return false;
  const resposta = await Notifications.requestPermissionsAsync();
  return resposta.granted;
}

/** Dispara uma notificação na hora (trigger null = imediato). */
export async function notificarAgora(
  titulo: string,
  corpo: string,
  tipo: TipoNotificacao,
): Promise<void> {
  if (!(await pedirPermissao())) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: titulo, body: corpo, data: { tipo } },
    trigger: Platform.OS === 'android' ? { channelId: CANAL } : null,
  });
}

/** Agenda o lembrete que se repete todo dia no horário escolhido. Devolve o id para cancelar. */
export async function agendarLembreteDiario(hora: number): Promise<string | null> {
  if (!(await pedirPermissao())) return null;
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Já registrou seus gastos de hoje?',
      body: 'Toque para anotar o que você gastou e manter o orçamento em dia.',
      data: { tipo: 'lembrete' satisfies TipoNotificacao },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hora,
      minute: 0,
      channelId: CANAL,
    },
  });
}

export async function cancelarLembrete(id: string | null): Promise<void> {
  if (id) await Notifications.cancelScheduledNotificationAsync(id);
}

/** Chama `aoTocar` quando o usuário toca em uma notificação. Devolve a função de limpeza. */
export function ouvirToqueEmNotificacao(aoTocar: (tipo: TipoNotificacao) => void): () => void {
  const inscricao = Notifications.addNotificationResponseReceivedListener((resposta) => {
    const tipo = resposta.notification.request.content.data?.tipo;
    if (tipo === 'orcamento' || tipo === 'lembrete') aoTocar(tipo);
  });
  return () => inscricao.remove();
}
