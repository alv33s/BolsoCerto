import { StyleSheet, Text, View } from 'react-native';
import { ResultadoSimulacao } from '../models/Simulador';
import { cores, espaco, raio } from '../theme';
import { formatarMoeda, formatarNumero } from '../utils/formato';

type CartaoInvestimentoProps = {
  resultado: ResultadoSimulacao;
  /** Marca o investimento que terminou com mais dinheiro. */
  melhor: boolean;
};

export default function CartaoInvestimento({ resultado, melhor }: CartaoInvestimentoProps) {
  return (
    <View style={[styles.cartao, melhor && styles.cartaoMelhor]}>
      <View style={styles.topo}>
        <View style={styles.titulo}>
          <Text style={styles.nome}>{resultado.nome}</Text>
          <Text style={styles.taxa}>
            Cerca de {formatarNumero(resultado.taxaAnual)}% ao ano
            {resultado.isentoDeIR ? ' • sem IR' : ''}
          </Text>
        </View>
        {melhor ? <Text style={styles.selo}>Rende mais</Text> : null}
      </View>

      <Text style={styles.valorFinal}>{formatarMoeda(resultado.valorFinal)}</Text>

      <Linha rotulo="Total investido" valor={formatarMoeda(resultado.totalInvestido)} />
      <Linha rotulo="Rendimento bruto" valor={formatarMoeda(resultado.rendimentoBruto)} />
      {resultado.isentoDeIR ? null : (
        <Linha rotulo="Imposto de Renda" valor={`- ${formatarMoeda(resultado.impostoRenda)}`} />
      )}
      <Linha rotulo="Você ganha" valor={formatarMoeda(resultado.rendimentoLiquido)} destaque />
    </View>
  );
}

function Linha({ rotulo, valor, destaque = false }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <View style={styles.linha}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <Text style={[styles.valor, destaque && styles.valorDestaque]}>{valor}</Text>
    </View>
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
  cartaoMelhor: { borderColor: cores.primaria, borderWidth: 2 },
  topo: { flexDirection: 'row', alignItems: 'flex-start', gap: espaco.p },
  titulo: { flex: 1 },
  nome: { fontSize: 17, fontWeight: '700', color: cores.texto },
  taxa: { fontSize: 13, color: cores.textoSuave },
  selo: {
    fontSize: 12,
    fontWeight: '700',
    color: cores.branco,
    backgroundColor: cores.primaria,
    borderRadius: raio.p,
    paddingHorizontal: espaco.p,
    paddingVertical: espaco.pp,
    overflow: 'hidden',
  },
  valorFinal: { fontSize: 26, fontWeight: '700', color: cores.texto },
  linha: { flexDirection: 'row', justifyContent: 'space-between', gap: espaco.m },
  rotulo: { fontSize: 14, color: cores.textoSuave },
  valor: { fontSize: 14, color: cores.texto },
  valorDestaque: { fontWeight: '700', color: cores.primaria },
});
