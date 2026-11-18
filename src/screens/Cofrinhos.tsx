import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import BotaoFlutuante from '../components/BotaoFlutuante';
import CartaoCofrinho from '../components/CartaoCofrinho';
import { useCofrinhos } from '../context/CofrinhosContext';
import { cores, espaco, raio } from '../theme';
import { Cofrinho, RotasPilha } from '../types';
import { formatarMoeda } from '../utils/formato';

export default function Cofrinhos() {
  const navigation = useNavigation<NativeStackNavigationProp<RotasPilha>>();
  const { cofrinhos, carregando, totalGuardado } = useCofrinhos();

  const abrir = useCallback(
    (cofrinho: Cofrinho) => navigation.navigate('DetalheCofrinho', { id: cofrinho.id }),
    [navigation],
  );

  if (carregando) {
    return (
      <View style={[styles.tela, styles.centro]}>
        <ActivityIndicator color={cores.primaria} />
      </View>
    );
  }

  return (
    <View style={styles.tela}>
      <FlatList
        data={cofrinhos}
        keyExtractor={(c) => String(c.id)}
        renderItem={({ item }) => <CartaoCofrinho cofrinho={item} onPress={abrir} />}
        contentContainerStyle={styles.lista}
        ListHeaderComponent={
          <View style={styles.resumo}>
            <Text style={styles.resumoRotulo}>Guardado nos cofrinhos</Text>
            <Text style={styles.resumoValor}>{formatarMoeda(totalGuardado)}</Text>
            <Text style={styles.resumoTexto}>
              Separe dinheiro para seus objetivos e acompanhe quanto falta para cada meta.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.vazio}>
            Você ainda não tem cofrinhos. Toque em + para criar o primeiro, como "Viagem" ou
            "Reserva de emergência".
          </Text>
        }
      />

      <BotaoFlutuante
        rotuloAcessivel="Criar cofrinho"
        onPress={() => navigation.navigate('NovoCofrinho')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  centro: { alignItems: 'center', justifyContent: 'center' },
  lista: { padding: espaco.g, gap: espaco.m, paddingBottom: 100 },
  resumo: {
    backgroundColor: cores.primaria,
    borderRadius: raio.g,
    padding: espaco.g,
    gap: espaco.pp,
    marginBottom: espaco.p,
  },
  resumoRotulo: { color: cores.branco, opacity: 0.85, fontSize: 14 },
  resumoValor: { color: cores.branco, fontSize: 30, fontWeight: '700' },
  resumoTexto: { color: cores.branco, fontSize: 14, lineHeight: 20 },
  vazio: { fontSize: 14, color: cores.textoSuave, lineHeight: 20 },
});
