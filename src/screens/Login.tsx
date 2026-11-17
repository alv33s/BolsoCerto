import { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Botao from '../components/Botao';
import CampoTexto, { CampoRef } from '../components/CampoTexto';
import { useApp } from '../context/AppContext';
import { cores, espaco } from '../theme';

const TAMANHO_PIN = 4;

export default function Login() {
  const { sessao, cadastrar, desbloquear, apagarTudo } = useApp();
  const [nome, setNome] = useState('');
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const campoPin = useRef<CampoRef>(null);

  // Renderização condicional: primeiro acesso (cadastro) ou volta ao app (desbloqueio).
  const primeiroAcesso = sessao === null;

  function alterarPin(texto: string) {
    setPin(texto.replace(/\D/g, ''));
    setErro(null);
  }

  async function entrar() {
    if (pin.length !== TAMANHO_PIN) {
      setErro(`O PIN precisa ter ${TAMANHO_PIN} números.`);
      return;
    }

    if (primeiroAcesso) {
      if (nome.trim().length < 2) {
        setErro('Digite seu nome para começar.');
        return;
      }
      try {
        setSalvando(true);
        await cadastrar(nome.trim(), pin);
      } catch {
        setErro('Não foi possível salvar seu acesso neste aparelho. Tente de novo.');
      } finally {
        setSalvando(false);
      }
      return;
    }

    if (!desbloquear(pin)) {
      setErro('PIN incorreto. Tente de novo.');
      setPin('');
    }
  }

  function confirmarRecomeco() {
    // Notificação interna: alerta de confirmação antes de uma ação que não tem volta.
    Alert.alert(
      'Apagar tudo e recomeçar?',
      'Sem o PIN não dá para abrir seus dados. Isto apaga seu acesso, seus gastos e suas metas deste aparelho. Não é possível desfazer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar tudo',
          style: 'destructive',
          onPress: () => {
            apagarTudo().catch(() =>
              Alert.alert('Não foi possível apagar', 'Feche o app e tente de novo.'),
            );
            setPin('');
            setErro(null);
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.tela}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
          <Text style={styles.marca}>BolsoCerto</Text>
          <Text style={styles.titulo}>
            {primeiroAcesso ? 'Controle seus gastos em qualquer moeda' : `Olá de novo, ${sessao.nome}`}
          </Text>
          <Text style={styles.texto}>
            {primeiroAcesso
              ? 'Crie um acesso para proteger seus dados. O nome e o PIN ficam guardados só neste aparelho.'
              : 'Digite seu PIN para abrir seus gastos.'}
          </Text>

          {primeiroAcesso ? (
            <CampoTexto
              rotulo="Seu nome"
              placeholder="Ex.: Ana"
              value={nome}
              onChangeText={(texto) => {
                setNome(texto);
                setErro(null);
              }}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={30}
              returnKeyType="next"
              onSubmitEditing={() => campoPin.current?.focus()}
            />
          ) : null}

          <CampoTexto
            referencia={campoPin}
            rotulo={primeiroAcesso ? `Crie um PIN de ${TAMANHO_PIN} números` : 'PIN'}
            placeholder="••••"
            value={pin}
            onChangeText={alterarPin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={TAMANHO_PIN}
            erro={erro}
            returnKeyType="done"
            onSubmitEditing={entrar}
          />

          <Botao
            titulo={primeiroAcesso ? 'Criar acesso' : 'Entrar'}
            onPress={entrar}
            carregando={salvando}
          />

          {!primeiroAcesso ? (
            <Botao titulo="Esqueci meu PIN" variante="contorno" onPress={confirmarRecomeco} />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  flex: { flex: 1 },
  conteudo: { flexGrow: 1, justifyContent: 'center', padding: espaco.gg },
  marca: { fontSize: 16, fontWeight: '700', color: cores.primaria, marginBottom: espaco.p },
  titulo: { fontSize: 28, fontWeight: '700', color: cores.texto, lineHeight: 34 },
  texto: {
    fontSize: 16,
    color: cores.textoSuave,
    lineHeight: 22,
    marginTop: espaco.p,
    marginBottom: espaco.gg,
  },
});
