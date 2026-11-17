import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cores, espaco, raio } from '../theme';
import { Categoria, Gasto } from '../types';
import { formatarData, formatarMoeda } from '../utils/formato';

type NomeDoIcone = keyof typeof Ionicons.glyphMap;

export const ICONE_DA_CATEGORIA: Record<Categoria, NomeDoIcone> = {
  Alimentação: 'cart-outline',
  Transporte: 'bus-outline',
  Lazer: 'film-outline',
  Contas: 'bulb-outline',
  Saúde: 'medkit-outline',
  Outros: 'pricetag-outline',
};

type ItemGastoProps = {
  gasto: Gasto;
  onPress: (gasto: Gasto) => void;
};

export default function ItemGasto({ gasto, onPress }: ItemGastoProps) {
  const emOutraMoeda = gasto.moeda !== 'BRL';

  return (
    <Pressable
      onPress={() => onPress(gasto)}
      accessibilityRole="button"
      accessibilityLabel={`${gasto.descricao}, ${formatarMoeda(gasto.valorReais)}`}
      style={({ pressed }) => [styles.linha, pressed && styles.pressionada]}
    >
      <View style={styles.icone}>
        <Ionicons name={ICONE_DA_CATEGORIA[gasto.categoria]} size={20} color={cores.primaria} />
      </View>

      <View style={styles.textos}>
        <Text style={styles.descricao} numberOfLines={1}>
          {gasto.descricao}
        </Text>
        <Text style={styles.detalhe} numberOfLines={1}>
          {gasto.categoria} • {formatarData(gasto.data)}
          {emOutraMoeda ? ` • ${formatarMoeda(gasto.valorOriginal, gasto.moeda)}` : ''}
        </Text>
      </View>

      <Text style={styles.valor}>{formatarMoeda(gasto.valorReais)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.m,
    paddingVertical: espaco.m,
    paddingHorizontal: espaco.g,
    backgroundColor: cores.cartao,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: cores.linha,
  },
  pressionada: { backgroundColor: cores.primariaClara },
  icone: {
    width: 40,
    height: 40,
    borderRadius: raio.p,
    backgroundColor: cores.primariaClara,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: { flex: 1 },
  descricao: { fontSize: 16, fontWeight: '600', color: cores.texto },
  detalhe: { fontSize: 13, color: cores.textoSuave, marginTop: 2 },
  valor: { fontSize: 16, fontWeight: '600', color: cores.texto },
});
