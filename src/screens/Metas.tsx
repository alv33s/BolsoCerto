import Slider from '@react-native-community/slider';
import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Botao from '../components/Botao';
import CampoTexto from '../components/CampoTexto';
import SeletorOpcoes from '../components/SeletorOpcoes';
import { useApp } from '../context/AppContext';
import { notificarAgora, pedirPermissao } from '../services/notificacoes';
import { cores, espaco, raio } from '../theme';
import { formatarMoeda, lerValor } from '../utils/formato';

const ORCAMENTO_MAXIMO = 10000;
const PASSO = 50;
const HORARIOS = [8, 12, 18, 20, 22] as const;

export default function Metas() {
  const { preferencias, totalDoMes, alterarPreferencias, definirLembrete, bloquear, sessao } =
    useApp();
  const [orcamento, setOrcamento] = useState(preferencias.orcamento);
  const [texto, setTexto] = useState(String(preferencias.orcamento));
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  // Mantém o formulário igual ao que está salvo (ex.: depois de apagar os dados).
  useEffect(() => {
    setOrcamento(preferencias.orcamento);
    setTexto(String(preferencias.orcamento));
  }, [preferencias.orcamento]);

  const mudou = orcamento !== preferencias.orcamento;

  function aoDigitar(novoTexto: string) {
    setTexto(novoTexto);
    const numero = lerValor(novoTexto);
    if (numero >= 0) {
      setOrcamento(numero);
      setErro(null);
    } else {
      setErro('Digite um valor em reais, como 1500.');
    }
  }

  function aoDeslizar(valor: number) {
    setOrcamento(valor);
    setTexto(String(valor));
    setErro(null);
  }

  async function salvarOrcamento() {
    if (erro) return;
    await alterarPreferencias({ orcamento });
    Alert.alert('Orçamento salvo', `Seu limite do mês agora é ${formatarMoeda(orcamento)}.`);
  }

  async function alternarAlertas(ligado: boolean) {
    if (ligado && !(await pedirPermissao())) {
      avisarPermissaoNegada();
      return;
    }
    await alterarPreferencias({ alertasOrcamento: ligado });
  }

  async function alternarLembrete(ligado: boolean, hora: number = preferencias.horaLembrete) {
    setOcupado(true);
    try {
      const deuCerto = await definirLembrete(ligado, hora);
      if (!deuCerto) avisarPermissaoNegada();
    } catch {
      Alert.alert('Lembrete não agendado', 'Tente de novo em instantes.');
    } finally {
      setOcupado(false);
    }
  }

  async function testarNotificacao() {
    if (!(await pedirPermissao())) {
      avisarPermissaoNegada();
      return;
    }
    const enviou = await notificarAgora(
      'Notificações funcionando',
      `Você gastou ${formatarMoeda(totalDoMes)} neste mês.`,
      'orcamento',
    );
    if (!enviou) {
      Alert.alert('Notificação não enviada', 'O aparelho recusou a notificação. Tente de novo.');
    }
  }

  function avisarPermissaoNegada() {
    // No Expo Go, quem recebe a permissão é o próprio Expo Go; os ajustes abertos são os dele.
    Alert.alert(
      'Notificações desativadas',
      'Para receber avisos, ative as notificações nos ajustes do aparelho e volte para o app.',
      [
        { text: 'Agora não', style: 'cancel' },
        {
          text: 'Abrir ajustes',
          onPress: () => {
            Linking.openSettings().catch(() => undefined);
          },
        },
      ],
    );
  }

  return (
    <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo}>
      <View style={styles.cartao}>
        <Text style={styles.titulo}>Orçamento do mês</Text>
        <Text style={styles.valor}>{formatarMoeda(orcamento)}</Text>

        <Slider
          minimumValue={0}
          maximumValue={ORCAMENTO_MAXIMO}
          step={PASSO}
          value={Math.min(orcamento, ORCAMENTO_MAXIMO)}
          onValueChange={aoDeslizar}
          minimumTrackTintColor={cores.primaria}
          maximumTrackTintColor={cores.linha}
          thumbTintColor={cores.primaria}
          accessibilityLabel="Orçamento do mês"
        />

        <CampoTexto
          rotulo="Ou digite o valor em reais"
          value={texto}
          onChangeText={aoDigitar}
          keyboardType="decimal-pad"
          maxLength={9}
          erro={erro}
        />

        <Botao
          titulo="Salvar orçamento"
          onPress={salvarOrcamento}
          desabilitado={!mudou || erro !== null}
        />
      </View>

      <View style={styles.cartao}>
        <Text style={styles.titulo}>Notificações</Text>

        <View style={styles.opcao}>
          <View style={styles.textoOpcao}>
            <Text style={styles.nomeOpcao}>Alertas de orçamento</Text>
            <Text style={styles.ajuda}>Avisa ao chegar em 80% e em 100% do limite.</Text>
          </View>
          <Switch
            value={preferencias.alertasOrcamento}
            onValueChange={alternarAlertas}
            trackColor={{ true: cores.primaria, false: cores.linha }}
            accessibilityLabel="Alertas de orçamento"
          />
        </View>

        <View style={styles.opcao}>
          <View style={styles.textoOpcao}>
            <Text style={styles.nomeOpcao}>Lembrete diário</Text>
            <Text style={styles.ajuda}>Lembra você de registrar os gastos do dia.</Text>
          </View>
          <Switch
            value={preferencias.lembreteDiario}
            onValueChange={(ligado) => alternarLembrete(ligado)}
            disabled={ocupado}
            trackColor={{ true: cores.primaria, false: cores.linha }}
            accessibilityLabel="Lembrete diário"
          />
        </View>

        {preferencias.lembreteDiario ? (
          <View>
            <Text style={styles.ajuda}>Horário do lembrete</Text>
            <SeletorOpcoes
              opcoes={HORARIOS}
              selecionada={preferencias.horaLembrete}
              aoSelecionar={(hora) => alternarLembrete(true, hora)}
              rotulo={(hora) => `${hora}h`}
            />
          </View>
        ) : null}

        <Botao titulo="Enviar notificação de teste" variante="contorno" onPress={testarNotificacao} />
      </View>

      <View style={styles.cartao}>
        <Text style={styles.titulo}>Acesso</Text>
        <Text style={styles.ajuda}>
          Conectado como {sessao?.nome}. Ao bloquear, o app pede o PIN para abrir de novo.
        </Text>
        <Botao titulo="Bloquear app" variante="contorno" onPress={bloquear} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.g, gap: espaco.g, paddingBottom: espaco.gg * 2 },
  cartao: {
    backgroundColor: cores.cartao,
    borderRadius: raio.g,
    borderWidth: 1,
    borderColor: cores.linha,
    padding: espaco.g,
    gap: espaco.m,
  },
  titulo: { fontSize: 18, fontWeight: '700', color: cores.texto },
  valor: { fontSize: 30, fontWeight: '700', color: cores.primaria },
  opcao: { flexDirection: 'row', alignItems: 'center', gap: espaco.m },
  textoOpcao: { flex: 1 },
  nomeOpcao: { fontSize: 16, fontWeight: '600', color: cores.texto },
  ajuda: { fontSize: 13, color: cores.textoSuave, lineHeight: 18 },
});
