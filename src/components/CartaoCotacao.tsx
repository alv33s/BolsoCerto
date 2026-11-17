import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { cores, espaco, raio } from '../theme';
import { Cotacao, OrigemCotacao } from '../types';
import { formatarDataHora, formatarMoeda } from '../utils/formato';
import Botao from './Botao';

type CartaoCotacaoProps = {
  cotacao: Cotacao | null;
  origem: OrigemCotacao | null;
  status: 'carregando' | 'pronta' | 'erro';
  aoAtualizar: () => void;
};

/** Mostra o resultado da requisição ao web service: carregando, erro ou as cotações. */
export default function CartaoCotacao({ cotacao, origem, status, aoAtualizar }: CartaoCotacaoProps) {
  // Primeira busca, ainda sem nada salvo no aparelho.
  if (!cotacao && status === 'carregando') {
    return (
      <View style={[styles.cartao, styles.centro]}>
        <ActivityIndicator color={cores.primaria} />
        <Text style={styles.aviso}>Buscando cotações...</Text>
      </View>
    );
  }

  // Falhou e não há cotação salva para usar no lugar.
  if (!cotacao) {
    return (
      <View style={styles.cartao}>
        <Text style={styles.titulo}>Cotações indisponíveis</Text>
        <Text style={styles.aviso}>
          Não foi possível falar com o serviço de cotações. Verifique a internet. Gastos em reais
          continuam funcionando.
        </Text>
        <Botao titulo="Tentar novamente" variante="contorno" onPress={aoAtualizar} />
      </View>
    );
  }

  return (
    <View style={styles.cartao}>
      <View style={styles.linha}>
        <View style={styles.moeda}>
          <Text style={styles.rotulo}>Dólar</Text>
          <Text style={styles.valor}>{formatarMoeda(cotacao.USD)}</Text>
        </View>
        <View style={styles.moeda}>
          <Text style={styles.rotulo}>Euro</Text>
          <Text style={styles.valor}>{formatarMoeda(cotacao.EUR)}</Text>
        </View>
      </View>

      <Text style={styles.aviso}>
        {status === 'carregando'
          ? 'Atualizando...'
          : origem === 'cache'
            ? `Sem conexão. Usando a cotação salva em ${formatarDataHora(cotacao.atualizadaEm)}.`
            : `Atualizada em ${formatarDataHora(cotacao.atualizadaEm)}.`}
      </Text>

      <Botao
        titulo="Atualizar cotações"
        variante="contorno"
        carregando={status === 'carregando'}
        onPress={aoAtualizar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: cores.cartao,
    borderRadius: raio.g,
    padding: espaco.g,
    gap: espaco.p,
    borderWidth: 1,
    borderColor: cores.linha,
  },
  centro: { alignItems: 'center' },
  linha: { flexDirection: 'row', gap: espaco.g },
  moeda: { flex: 1 },
  titulo: { fontSize: 16, fontWeight: '600', color: cores.texto },
  rotulo: { fontSize: 13, color: cores.textoSuave },
  valor: { fontSize: 20, fontWeight: '700', color: cores.texto },
  aviso: { fontSize: 13, color: cores.textoSuave, lineHeight: 18 },
});
