import { StyleSheet, Text, View } from 'react-native';
import { Orcamento } from '../models/Orcamento';
import { cores, espaco, raio } from '../theme';
import { formatarMoeda } from '../utils/formato';
import BarraProgresso from './BarraProgresso';

type CartaoOrcamentoProps = {
  total: number;
  limite: number;
  orcamento: Orcamento;
};

export default function CartaoOrcamento({ total, limite, orcamento }: CartaoOrcamentoProps) {
  let situacao: string;
  if (limite <= 0) {
    situacao = 'Defina um orçamento na aba Metas para acompanhar o mês.';
  } else if (orcamento.nivel === 'estourado') {
    situacao = `${orcamento.percentual}% de ${formatarMoeda(limite)}. Passou ${formatarMoeda(-orcamento.saldo)} do limite.`;
  } else {
    situacao = `${orcamento.percentual}% de ${formatarMoeda(limite)}. Restam ${formatarMoeda(orcamento.saldo)}.`;
  }

  return (
    <View style={styles.cartao}>
      <Text style={styles.rotulo}>Gasto no mês</Text>
      <Text style={styles.total}>{formatarMoeda(total)}</Text>
      <BarraProgresso progresso={orcamento.usado} nivel={orcamento.nivel} />
      <Text style={styles.situacao}>{situacao}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: cores.primaria,
    borderRadius: raio.g,
    padding: espaco.g,
    gap: espaco.p,
  },
  rotulo: { color: cores.branco, opacity: 0.85, fontSize: 14 },
  total: { color: cores.branco, fontSize: 34, fontWeight: '700' },
  situacao: { color: cores.branco, fontSize: 14, lineHeight: 20 },
});
