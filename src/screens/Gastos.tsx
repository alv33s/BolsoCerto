import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import BotaoFlutuante from '../components/BotaoFlutuante';
import CampoTexto from '../components/CampoTexto';
import ItemGasto from '../components/ItemGasto';
import SeletorOpcoes from '../components/SeletorOpcoes';
import { useApp } from '../context/AppContext';
import { cores, espaco } from '../theme';
import { CATEGORIAS, CATEGORIA_COFRINHO, Categoria, Gasto, RotasPilha } from '../types';
import { arredondar, formatarMoeda } from '../utils/formato';

type Filtro = 'Todas' | Categoria;
const FILTROS: Filtro[] = ['Todas', ...CATEGORIAS, CATEGORIA_COFRINHO];

export default function Gastos() {
  const navigation = useNavigation<NativeStackNavigationProp<RotasPilha>>();
  const { gastos } = useApp();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('Todas');

  // useMemo: a lista filtrada só é refeita quando os gastos, a busca ou o filtro mudam.
  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return gastos.filter(
      (g) =>
        (filtro === 'Todas' || g.categoria === filtro) &&
        (termo === '' || g.descricao.toLowerCase().includes(termo)),
    );
  }, [gastos, busca, filtro]);

  const totalFiltrado = useMemo(
    () => arredondar(filtrados.reduce((soma, g) => soma + g.valorReais, 0)),
    [filtrados],
  );

  // useCallback: mantém a mesma função entre renderizações, evitando redesenhar cada item.
  const abrirDetalhe = useCallback(
    (gasto: Gasto) => navigation.navigate('DetalheGasto', { id: gasto.id }),
    [navigation],
  );

  const semNenhumGasto = gastos.length === 0;

  return (
    <View style={styles.tela}>
      <View style={styles.filtros}>
        <CampoTexto
          rotulo="Buscar"
          placeholder="Ex.: mercado"
          value={busca}
          onChangeText={setBusca}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        <SeletorOpcoes opcoes={FILTROS} selecionada={filtro} aoSelecionar={setFiltro} />
        <Text style={styles.contagem}>
          {filtrados.length} {filtrados.length === 1 ? 'gasto' : 'gastos'} • {formatarMoeda(totalFiltrado)}
        </Text>
      </View>

      <FlatList
        data={filtrados}
        keyExtractor={(gasto) => String(gasto.id)}
        renderItem={({ item }) => <ItemGasto gasto={item} onPress={abrirDetalhe} />}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <Text style={styles.vazio}>
            {semNenhumGasto
              ? 'Você ainda não registrou gastos. Toque em + para registrar o primeiro.'
              : 'Nenhum gasto corresponde à busca. Mude o texto ou a categoria.'}
          </Text>
        }
      />

      <BotaoFlutuante
        rotuloAcessivel="Registrar novo gasto"
        onPress={() => navigation.navigate('NovoGasto')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  filtros: { padding: espaco.g, paddingBottom: espaco.p },
  contagem: { fontSize: 13, color: cores.textoSuave, marginTop: espaco.p },
  lista: { paddingBottom: 100 },
  vazio: { fontSize: 14, color: cores.textoSuave, lineHeight: 20, padding: espaco.g },
});
