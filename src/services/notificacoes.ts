// Notificações locais externas (expo-notifications): aparecem fora do app,
// podem ser agendadas e precisam da permissão do usuário.
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export type TipoNotificacao = 'orcamento' | 'lembrete' | 'cofrinho';

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

// O canal só é criado uma vez; a Promise guardada evita repetir a chamada.
let canalPronto: Promise<string | undefined> | null = null;

/**
 * No Android toda notificação precisa de um canal. Tenta criar o canal do app;
 * se o aparelho recusar (acontece no Expo Go), devolve undefined e a notificação
 * usa o canal padrão que o expo-notifications cria sozinho.
 */
function prepararCanal(): Promise<string | undefined> {
  if (Platform.OS !== 'android') return Promise.resolve(undefined);
  if (!canalPronto) {
    canalPronto = Notifications.setNotificationChannelAsync(CANAL, {
      name: 'Avisos do BolsoCerto',
      importance: Notifications.AndroidImportance.HIGH,
    })
      .then(() => CANAL)
      .catch((erro) => {
        console.warn('[notificações] Canal próprio indisponível, usando o canal padrão.', erro);
        return undefined;
      });
  }
  return canalPronto;
}

/** Pede a permissão (se ainda não foi dada) e devolve se o app pode notificar. Nunca lança erro. */
export async function pedirPermissao(): Promise<boolean> {
  try {
    await prepararCanal();
    const atual = await Notifications.getPermissionsAsync();
    if (atual.granted) return true;
    if (!atual.canAskAgain) {
      console.warn('[notificações] Permissão negada e o aparelho não deixa perguntar de novo.');
      return false;
    }
    const resposta = await Notifications.requestPermissionsAsync();
    if (!resposta.granted) {
      console.warn(`[notificações] Permissão não concedida (status: ${resposta.status}).`);
    }
    return resposta.granted;
  } catch (erro) {
    console.warn('[notificações] Não foi possível verificar a permissão.', erro);
    return false;
  }
}

/** Dispara uma notificação na hora. Devolve false se não foi possível notificar. */
export async function notificarAgora(
  titulo: string,
  corpo: string,
  tipo: TipoNotificacao,
): Promise<boolean> {
  if (!(await pedirPermissao())) return false;
  try {
    const canal = await prepararCanal();
    await Notifications.scheduleNotificationAsync({
      content: { title: titulo, body: corpo, data: { tipo } },
      // trigger null = imediato; com canal, o Android exige o objeto { channelId }.
      trigger: canal ? { channelId: canal } : null,
    });
    return true;
  } catch (erro) {
    console.warn('[notificações] Falha ao enviar a notificação.', erro);
    return false;
  }
}

/** Agenda o lembrete que se repete todo dia no horário escolhido. Devolve o id para cancelar. */
export async function agendarLembreteDiario(hora: number): Promise<string | null> {
  if (!(await pedirPermissao())) return null;
  try {
    const canal = await prepararCanal();
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Já registrou seus gastos de hoje?',
        body: 'Toque para anotar o que você gastou e manter o orçamento em dia.',
        data: { tipo: 'lembrete' satisfies TipoNotificacao },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hora,
        minute: 0,
        ...(canal ? { channelId: canal } : {}),
      },
    });
  } catch (erro) {
    console.warn('[notificações] Falha ao agendar o lembrete.', erro);
    return null;
  }
}

export async function cancelarLembrete(id: string | null): Promise<void> {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (erro) {
    console.warn('[notificações] Falha ao cancelar o lembrete.', erro);
  }
}

/** Chama `aoTocar` quando o usuário toca em uma notificação. Devolve a função de limpeza. */
export function ouvirToqueEmNotificacao(aoTocar: (tipo: TipoNotificacao) => void): () => void {
  const inscricao = Notifications.addNotificationResponseReceivedListener((resposta) => {
    const tipo = resposta.notification.request.content.data?.tipo;
    if (tipo === 'orcamento' || tipo === 'lembrete' || tipo === 'cofrinho') aoTocar(tipo);
  });
  return () => inscricao.remove();
}
