import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Botao from '../components/Botao';
import CampoTexto, { CampoRef } from '../components/CampoTexto';
import SeletorOpcoes from '../components/SeletorOpcoes';
import { useCofrinhos } from '../context/CofrinhosContext';
import { cores, espaco } from '../theme';
import { RotasPilha } from '../types';
import { lerValor } from '../utils/formato';

type Props = NativeStackScreenProps<RotasPilha, 'NovoCofrinho'>;

const SUGESTOES = ['Viagem', 'Reserva de emergência', 'Celular novo', 'Curso'] as const;

export default function NovoCofrinho({ navigation }: Props) {
  const { criar } = useCofrinhos();
  const [nome, setNome] = useState('');
  const [meta, setMeta] = useState('');
  const [inicial, setInicial] = useState('');
  const [erroNome, setErroNome] = useState<string | null>(null);
  const [erroMeta, setErroMeta] = useState<string | null>(null);
  const [erroInicial, setErroInicial] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const campoMeta = useRef<CampoRef>(null);

  async function salvar() {
    const nomeLimpo = nome.trim();
    const valorMeta = lerValor(meta);
    const valorInicial = inicial.trim() === '' ? 0 : lerValor(inicial);

    const nomeValido = nomeLimpo.length > 0;
    const metaValida = valorMeta > 0;
    const inicialValido = valorInicial >= 0;

    setErroNome(nomeValido ? null : 'Dê um nome ao cofrinho.');
    setErroMeta(metaValida ? null : 'Digite quanto quer juntar, como 3000.');
    setErroInicial(inicialValido ? null : 'Digite um valor em reais ou deixe em branco.');
    if (!nomeValido || !metaValida || !inicialValido) return;

    try {
      setSalvando(true);
      await criar(nomeLimpo, valorMeta, valorInicial);
      navigation.goBack();
    } catch {
      Alert.alert('Cofrinho não criado', 'Tente de novo em instantes.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.tela}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <CampoTexto
          rotulo="Nome do cofrinho"
          placeholder="Ex.: Viagem"
          value={nome}
          onChangeText={(texto) => {
            setNome(texto);
            setErroNome(null);
          }}
          erro={erroNome}
          maxLength={30}
          autoCapitalize="sentences"
          returnKeyType="next"
          onSubmitEditing={() => campoMeta.current?.focus()}
        />

        <View style={styles.sugestoes}>
          <SeletorOpcoes
            opcoes={SUGESTOES}
            selecionada={nome as (typeof SUGESTOES)[number]}
            aoSelecionar={(sugestao) => {
              setNome(sugestao);
              setErroNome(null);
            }}
          />
        </View>

        <CampoTexto
          referencia={campoMeta}
          rotulo="Meta (R$)"
          placeholder="Ex.: 3000"
          value={meta}
          onChangeText={(texto) => {
            setMeta(texto);
            setErroMeta(null);
          }}
          erro={erroMeta}
          keyboardType="decimal-pad"
          maxLength={12}
        />

        <CampoTexto
          rotulo="Já quer guardar algo agora? (opcional)"
          placeholder="0,00"
          value={inicial}
          onChangeText={(texto) => {
            setInicial(texto);
            setErroInicial(null);
          }}
          erro={erroInicial}
          keyboardType="decimal-pad"
          maxLength={12}
        />

        <Text style={styles.ajuda}>
          O valor guardado agora entra nos gastos do mês, na categoria Cofrinho, e conta no seu
          orçamento. Se retirar depois, ele volta para o orçamento.
        </Text>

        <View style={styles.acoes}>
          <Botao titulo="Criar cofrinho" onPress={salvar} carregando={salvando} />
          <Botao titulo="Cancelar" variante="contorno" onPress={() => navigation.goBack()} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.g, paddingBottom: espaco.gg * 2 },
  sugestoes: { marginTop: -espaco.p, marginBottom: espaco.m },
  ajuda: { fontSize: 13, color: cores.textoSuave, lineHeight: 18 },
  acoes: { marginTop: espaco.g },
});
