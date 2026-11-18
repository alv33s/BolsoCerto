import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
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
import CampoTexto from '../components/CampoTexto';
import SeletorOpcoes from '../components/SeletorOpcoes';
import { useApp } from '../context/AppContext';
import { cores, espaco, raio } from '../theme';
import { CATEGORIAS, CATEGORIA_COFRINHO, Gasto, RotasPilha } from '../types';
import { arredondar, formatarData, formatarMoeda, formatarNumero, lerValor } from '../utils/formato';

type Props = NativeStackScreenProps<RotasPilha, 'DetalheGasto'>;

export default function DetalheGasto({ route, navigation }: Props) {
  const { gastos } = useApp();
  const gasto = gastos.find((g) => g.id === route.params.id);

  // O gasto some da lista logo depois de excluído, um instante antes de a tela fechar.
  if (!gasto) {
    return (
      <View style={styles.tela}>
        <Text style={styles.ausente}>Este gasto não existe mais.</Text>
      </View>
    );
  }

  // Lançamentos de cofrinho só mudam pelo próprio cofrinho, para os dois ficarem sempre iguais.
  if (gasto.categoria === CATEGORIA_COFRINHO) {
    return (
      <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo}>
        <View style={styles.resumo}>
          <Linha rotulo="Descrição" valor={gasto.descricao} />
          <Linha rotulo="Data" valor={formatarData(gasto.data)} />
          <Linha
            rotulo={gasto.valorReais < 0 ? 'Devolvido ao orçamento' : 'Valor guardado'}
            valor={formatarMoeda(Math.abs(gasto.valorReais))}
            destaque
          />
        </View>
        <Text style={styles.aviso}>
          Este lançamento foi criado por um cofrinho. Para mudar ou apagar, abra o cofrinho e
          toque e segure a movimentação no histórico.
        </Text>
        <Botao
          titulo="Abrir cofrinhos"
          variante="contorno"
          onPress={() => navigation.navigate('Abas', { screen: 'Cofrinhos' })}
        />
      </ScrollView>
    );
  }

  return <Formulario gasto={gasto} aoFechar={() => navigation.goBack()} />;
}

type FormularioProps = {
  gasto: Gasto;
  aoFechar: () => void;
};

function Formulario({ gasto, aoFechar }: FormularioProps) {
  const { editarGasto, excluirGasto } = useApp();
  const [descricao, setDescricao] = useState(gasto.descricao);
  const [valor, setValor] = useState(formatarNumero(gasto.valorOriginal).replace(/\./g, ''));
  const [categoria, setCategoria] = useState(gasto.categoria);
  const [erroDescricao, setErroDescricao] = useState<string | null>(null);
  const [erroValor, setErroValor] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const valorNumerico = lerValor(valor);
  const emOutraMoeda = gasto.moeda !== 'BRL';
  const emReais = valorNumerico > 0 ? arredondar(valorNumerico * gasto.cotacao) : 0;

  const mudou =
    descricao.trim() !== gasto.descricao ||
    categoria !== gasto.categoria ||
    valorNumerico !== gasto.valorOriginal;

  async function salvar() {
    const descricaoLimpa = descricao.trim();
    const descricaoValida = descricaoLimpa.length > 0;
    const valorValido = valorNumerico > 0;

    setErroDescricao(descricaoValida ? null : 'Diga com o que foi o gasto.');
    setErroValor(valorValido ? null : 'Digite um valor maior que zero, como 25,90.');
    if (!descricaoValida || !valorValido) return;

    try {
      setSalvando(true);
      await editarGasto({ ...gasto, descricao: descricaoLimpa, valorOriginal: valorNumerico, categoria });
      aoFechar();
    } catch {
      Alert.alert('Alterações não salvas', 'Tente de novo em instantes.');
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusao() {
    Alert.alert('Excluir este gasto?', `"${gasto.descricao}" será apagado. Não é possível desfazer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir gasto',
        style: 'destructive',
        onPress: async () => {
          try {
            await excluirGasto(gasto.id);
            aoFechar();
          } catch {
            Alert.alert('Gasto não excluído', 'Tente de novo em instantes.');
          }
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={styles.tela}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <View style={styles.resumo}>
          <Linha rotulo="Data" valor={formatarData(gasto.data)} />
          <Linha rotulo="Moeda" valor={gasto.moeda} />
          {emOutraMoeda ? (
            <Linha rotulo="Cotação usada no cadastro" valor={formatarMoeda(gasto.cotacao)} />
          ) : null}
          <Linha rotulo="Total em reais" valor={formatarMoeda(emReais)} destaque />
        </View>

        <CampoTexto
          rotulo="Descrição"
          value={descricao}
          onChangeText={(texto) => {
            setDescricao(texto);
            setErroDescricao(null);
          }}
          erro={erroDescricao}
          maxLength={40}
        />

        <CampoTexto
          rotulo={`Valor em ${gasto.moeda}`}
          value={valor}
          onChangeText={(texto) => {
            setValor(texto);
            setErroValor(null);
          }}
          erro={erroValor}
          keyboardType="decimal-pad"
          maxLength={12}
        />

        <Text style={styles.rotulo}>Categoria</Text>
        <SeletorOpcoes opcoes={CATEGORIAS} selecionada={categoria} aoSelecionar={setCategoria} />

        <View style={styles.acoes}>
          <Botao
            titulo="Salvar alterações"
            onPress={salvar}
            carregando={salvando}
            desabilitado={!mudou}
          />
          <Botao titulo="Excluir gasto" variante="perigo" onPress={confirmarExclusao} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type LinhaProps = {
  rotulo: string;
  valor: string;
  destaque?: boolean;
};

function Linha({ rotulo, valor, destaque = false }: LinhaProps) {
  return (
    <View style={styles.linha}>
      <Text style={styles.linhaRotulo}>{rotulo}</Text>
      <Text style={[styles.linhaValor, destaque && styles.linhaDestaque]}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.g, paddingBottom: espaco.gg * 2 },
  ausente: { padding: espaco.g, fontSize: 16, color: cores.textoSuave },
  aviso: { fontSize: 14, color: cores.textoSuave, lineHeight: 20, marginBottom: espaco.p },
  resumo: {
    backgroundColor: cores.cartao,
    borderRadius: raio.m,
    borderWidth: 1,
    borderColor: cores.linha,
    paddingHorizontal: espaco.g,
    marginBottom: espaco.g,
  },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: espaco.m,
    paddingVertical: espaco.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: cores.linha,
  },
  linhaRotulo: { fontSize: 14, color: cores.textoSuave, flexShrink: 1 },
  linhaValor: { fontSize: 15, fontWeight: '600', color: cores.texto },
  linhaDestaque: { fontSize: 18, color: cores.primaria },
  rotulo: { fontSize: 13, color: cores.textoSuave, marginBottom: espaco.pp },
  acoes: { marginTop: espaco.g },
});
