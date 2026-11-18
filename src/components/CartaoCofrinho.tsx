import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cores, espaco, raio } from '../theme';
import { Cofrinho } from '../types';
import { formatarMoeda } from '../utils/formato';

type CartaoCofrinhoProps = {
  cofrinho: Cofrinho;
  onPress: (cofrinho: Cofrinho) => void;
};

/** Fração da meta já guardada, entre 0 e 1. */
export function progressoDaMeta(cofrinho: Cofrinho): number {
  if (cofrinho.meta <= 0) return 0;
  return Math.min(Math.max(cofrinho.guardado / cofrinho.meta, 0), 1);
}

export default function CartaoCofrinho({ cofrinho, onPress }: CartaoCofrinhoProps) {
  const progresso = progressoDaMeta(cofrinho);
  const completo = cofrinho.guardado >= cofrinho.meta;

  return (
    <Pressable
      onPress={() => onPress(cofrinho)}
      accessibilityRole="button"
      accessibilityLabel={`${cofrinho.nome}, ${formatarMoeda(cofrinho.guardado)} de ${formatarMoeda(cofrinho.meta)}`}
      style={({ pressed }) => [styles.cartao, pressed && styles.pressionado]}
    >
      <View style={styles.topo}>
        <View style={styles.icone}>
          <Ionicons name={completo ? 'trophy-outline' : 'wallet-outline'} size={20} color={cores.primaria} />
        </View>
        <Text style={styles.nome} numberOfLines={1}>
          {cofrinho.nome}
        </Text>
        <Text style={[styles.percentual, completo && styles.completo]}>
          {completo ? 'Meta atingida' : `${Math.round(progresso * 100)}%`}
        </Text>
      </View>

      <View style={styles.trilho}>
        <View style={[styles.barra, { width: `${progresso * 100}%` }]} />
      </View>

      <Text style={styles.valores}>
        {formatarMoeda(cofrinho.guardado)} de {formatarMoeda(cofrinho.meta)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: cores.cartao,
    borderRadius: raio.g,
    borderWidth: 1,
    borderColor: cores.linha,
    padding: espaco.g,
    gap: espaco.p,
  },
  pressionado: { backgroundColor: cores.primariaClara },
  topo: { flexDirection: 'row', alignItems: 'center', gap: espaco.m },
  icone: {
    width: 36,
    height: 36,
    borderRadius: raio.p,
    backgroundColor: cores.primariaClara,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nome: { flex: 1, fontSize: 16, fontWeight: '600', color: cores.texto },
  percentual: { fontSize: 14, fontWeight: '600', color: cores.textoSuave },
  completo: { color: cores.primaria },
  trilho: { height: 8, borderRadius: 4, backgroundColor: cores.linha, overflow: 'hidden' },
  barra: { height: '100%', borderRadius: 4, backgroundColor: cores.primaria },
  valores: { fontSize: 14, color: cores.textoSuave },
});
