import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Botao from '../components/Botao';
import CampoTexto, { CampoRef } from '../components/CampoTexto';
import SeletorOpcoes from '../components/SeletorOpcoes';
import { useApp } from '../context/AppContext';
import { cores, espaco, raio } from '../theme';
import { CATEGORIAS, Categoria, MOEDAS, Moeda, RotasPilha } from '../types';
import { arredondar, diasAtras, formatarMoeda, lerValor } from '../utils/formato';

type Props = NativeStackScreenProps<RotasPilha, 'NovoGasto'>;

const DIAS = ['Hoje', 'Ontem', 'Anteontem'] as const;
type Dia = (typeof DIAS)[number];

export default function NovoGasto({ navigation }: Props) {
  const { cotacao, origemCotacao, statusCotacao, adicionarGasto, atualizarCotacao } = useApp();
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [moeda, setMoeda] = useState<Moeda>('BRL');
  const [categoria, setCategoria] = useState<Categoria>('Alimentação');
  const [dia, setDia] = useState<Dia>('Hoje');
  const [erroDescricao, setErroDescricao] = useState<string | null>(null);
  const [erroValor, setErroValor] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const campoValor = useRef<CampoRef>(null);

  const valorNumerico = lerValor(valor);
  const taxa = moeda === 'BRL' ? 1 : cotacao?.[moeda];
  const semCotacao = moeda !== 'BRL' && !taxa;

  // Prévia da conversão, recalculada só quando o valor, a moeda ou a cotação mudam.
  const previa = useMemo(() => {
    if (moeda === 'BRL') return null;
    if (!taxa) return null;
    const emReais = valorNumerico > 0 ? arredondar(valorNumerico * taxa) : 0;
    return `1 ${moeda} = ${formatarMoeda(taxa)}. Este gasto equivale a ${formatarMoeda(emReais)}.`;
  }, [moeda, taxa, valorNumerico]);

  async function salvar() {
    const descricaoLimpa = descricao.trim();
    const descricaoValida = descricaoLimpa.length > 0;
    const valorValido = valorNumerico > 0;

    setErroDescricao(descricaoValida ? null : 'Diga com o que foi o gasto.');
    setErroValor(valorValido ? null : 'Digite um valor maior que zero, como 25,90.');
    if (!descricaoValida || !valorValido || semCotacao) return;

    try {
      setSalvando(true);
      await adicionarGasto({
        descricao: descricaoLimpa,
        valorOriginal: valorNumerico,
        moeda,
        categoria,
        data: diasAtras(DIAS.indexOf(dia)),
      });
      navigation.goBack();
    } catch (erro) {
      Alert.alert(
        'Gasto não salvo',
        erro instanceof Error ? erro.message : 'Tente de novo em instantes.',
      );
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
          rotulo="Descrição"
          placeholder="Ex.: Almoço"
          value={descricao}
          onChangeText={(texto) => {
            setDescricao(texto);
            setErroDescricao(null);
          }}
          erro={erroDescricao}
          maxLength={40}
          autoCapitalize="sentences"
          returnKeyType="next"
          onSubmitEditing={() => campoValor.current?.focus()}
        />

        <CampoTexto
          referencia={campoValor}
          rotulo="Valor"
          placeholder="0,00"
          value={valor}
          onChangeText={(texto) => {
            setValor(texto);
            setErroValor(null);
          }}
          erro={erroValor}
          keyboardType="decimal-pad"
          maxLength={12}
        />

        <Text style={styles.rotulo}>Moeda</Text>
        <SeletorOpcoes opcoes={MOEDAS} selecionada={moeda} aoSelecionar={setMoeda} />

        {previa ? (
          <View style={styles.previa}>
            <Text style={styles.textoPrevia}>{previa}</Text>
            {origemCotacao === 'cache' ? (
              <Text style={styles.textoPrevia}>Sem conexão: usando a última cotação salva.</Text>
            ) : null}
          </View>
        ) : null}

        {semCotacao ? (
          <View style={[styles.previa, styles.previaErro]}>
            <Text style={styles.textoErro}>
              Sem cotação para converter {moeda}. Conecte-se à internet e busque de novo, ou registre
              o valor em reais.
            </Text>
            <Botao
              titulo="Buscar cotação"
              variante="contorno"
              carregando={statusCotacao === 'carregando'}
              onPress={atualizarCotacao}
            />
          </View>
        ) : null}

        <Text style={styles.rotulo}>Categoria</Text>
        <SeletorOpcoes opcoes={CATEGORIAS} selecionada={categoria} aoSelecionar={setCategoria} />

        <Text style={styles.rotulo}>Quando</Text>
        <SeletorOpcoes opcoes={DIAS} selecionada={dia} aoSelecionar={setDia} />

        <View style={styles.acoes}>
          <Botao
            titulo="Salvar gasto"
            onPress={salvar}
            carregando={salvando}
            desabilitado={semCotacao}
          />
          <Botao titulo="Cancelar" variante="contorno" onPress={() => navigation.goBack()} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.g, paddingBottom: espaco.gg * 2 },
  rotulo: { fontSize: 13, color: cores.textoSuave, marginTop: espaco.p, marginBottom: espaco.pp },
  previa: {
    backgroundColor: cores.primariaClara,
    borderRadius: raio.p,
    padding: espaco.m,
    marginTop: espaco.p,
    gap: espaco.pp,
  },
  previaErro: { backgroundColor: cores.perigoClaro },
  textoPrevia: { fontSize: 14, color: cores.texto, lineHeight: 20 },
  textoErro: { fontSize: 14, color: cores.perigo, lineHeight: 20 },
  acoes: { marginTop: espaco.g },
});
