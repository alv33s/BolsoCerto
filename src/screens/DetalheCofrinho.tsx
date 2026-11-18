import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Botao from '../components/Botao';
import CampoTexto from '../components/CampoTexto';
import { progressoDaMeta } from '../components/CartaoCofrinho';
import { useCofrinhos } from '../context/CofrinhosContext';
import { listarMovimentacoes } from '../services/cofrinhos';
import { cores, espaco, raio } from '../theme';
import { Movimentacao, RotasPilha } from '../types';
import { formatarData, formatarMoeda, lerValor } from '../utils/formato';

type Props = NativeStackScreenProps<RotasPilha, 'DetalheCofrinho'>;

export default function DetalheCofrinho({ route, navigation }: Props) {
  const { cofrinhos, movimentar, removerMovimentacao, excluir } = useCofrinhos();
  const cofrinho = cofrinhos.find((c) => c.id === route.params.id);

  const [valor, setValor] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);

  const guardado = cofrinho?.guardado;

  const carregarMovimentacoes = useCallback(async () => {
    try {
      setMovimentacoes(await listarMovimentacoes(route.params.id));
    } catch {
      setMovimentacoes([]);
    }
  }, [route.params.id]);

  // Recarrega o histórico sempre que o total guardado muda.
  useEffect(() => {
    carregarMovimentacoes();
  }, [carregarMovimentacoes, guardado]);

  // O cofrinho some da lista logo depois de excluído, um instante antes de a tela fechar.
  if (!cofrinho) {
    return (
      <View style={styles.tela}>
        <Text style={styles.ausente}>Este cofrinho não existe mais.</Text>
      </View>
    );
  }

  const falta = Math.max(cofrinho.meta - cofrinho.guardado, 0);
  const progresso = progressoDaMeta(cofrinho);

  async function registrar(sinal: 1 | -1) {
    const numero = lerValor(valor);
    if (!(numero > 0)) {
      setErro('Digite um valor maior que zero, como 50,00.');
      return;
    }
    try {
      setSalvando(true);
      await movimentar(route.params.id, sinal * numero);
      setValor('');
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Tente de novo em instantes.');
    } finally {
      setSalvando(false);
    }
  }

  function confirmarRemocao(movimentacao: Movimentacao) {
    Alert.alert(
      'Apagar esta movimentação?',
      `${movimentacao.valor > 0 ? 'Depósito' : 'Retirada'} de ${formatarMoeda(Math.abs(movimentacao.valor))} em ${formatarData(movimentacao.data)}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: () => {
            removerMovimentacao(movimentacao.id).catch(() =>
              Alert.alert('Não foi possível apagar', 'Tente de novo em instantes.'),
            );
          },
        },
      ],
    );
  }

  function confirmarExclusao() {
    Alert.alert(
      'Excluir este cofrinho?',
      `"${cofrinho?.nome}" e todo o histórico dele serão apagados. Não é possível desfazer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir cofrinho',
          style: 'destructive',
          onPress: async () => {
            try {
              await excluir(route.params.id);
              navigation.goBack();
            } catch {
              Alert.alert('Cofrinho não excluído', 'Tente de novo em instantes.');
            }
          },
        },
      ],
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.tela}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <View style={styles.resumo}>
          <Text style={styles.nome}>{cofrinho.nome}</Text>
          <Text style={styles.guardado}>{formatarMoeda(cofrinho.guardado)}</Text>
          <View style={styles.trilho}>
            <View style={[styles.barra, { width: `${progresso * 100}%` }]} />
          </View>
          <Text style={styles.situacao}>
            {falta === 0
              ? `Meta de ${formatarMoeda(cofrinho.meta)} atingida!`
              : `${Math.round(progresso * 100)}% de ${formatarMoeda(cofrinho.meta)}. Faltam ${formatarMoeda(falta)}.`}
          </Text>
        </View>

        <View style={styles.cartao}>
          <CampoTexto
            rotulo="Valor (R$)"
            placeholder="0,00"
            value={valor}
            onChangeText={(texto) => {
              setValor(texto);
              setErro(null);
            }}
            erro={erro}
            keyboardType="decimal-pad"
            maxLength={12}
          />
          <View style={styles.botoes}>
            <View style={styles.botao}>
              <Botao titulo="Guardar" onPress={() => registrar(1)} carregando={salvando} />
            </View>
            <View style={styles.botao}>
              <Botao
                titulo="Retirar"
                variante="contorno"
                onPress={() => registrar(-1)}
                desabilitado={salvando || cofrinho.guardado <= 0}
              />
            </View>
          </View>
        </View>

        <View>
          <Text style={styles.secao}>Histórico</Text>
          {movimentacoes.length === 0 ? (
            <Text style={styles.vazio}>Nada guardado ainda. Digite um valor e toque em Guardar.</Text>
          ) : (
            <View style={styles.lista}>
              {movimentacoes.map((m) => (
                <Pressable
                  key={m.id}
                  onLongPress={() => confirmarRemocao(m)}
                  accessibilityHint="Toque e segure para apagar"
                  style={({ pressed }) => [styles.item, pressed && styles.itemPressionado]}
                >
                  <View style={styles.itemTextos}>
                    <Text style={styles.itemTipo}>{m.valor > 0 ? 'Depósito' : 'Retirada'}</Text>
                    <Text style={styles.itemData}>{formatarData(m.data)}</Text>
                  </View>
                  <Text style={[styles.itemValor, m.valor < 0 && styles.itemRetirada]}>
                    {m.valor > 0 ? '+ ' : '- '}
                    {formatarMoeda(Math.abs(m.valor))}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          {movimentacoes.length > 0 ? (
            <Text style={styles.dica}>Toque e segure uma movimentação para apagá-la.</Text>
          ) : null}
        </View>

        <Botao titulo="Excluir cofrinho" variante="perigo" onPress={confirmarExclusao} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.g, gap: espaco.g, paddingBottom: espaco.gg * 2 },
  ausente: { padding: espaco.g, fontSize: 16, color: cores.textoSuave },
  resumo: { backgroundColor: cores.primaria, borderRadius: raio.g, padding: espaco.g, gap: espaco.p },
  nome: { color: cores.branco, opacity: 0.9, fontSize: 15 },
  guardado: { color: cores.branco, fontSize: 32, fontWeight: '700' },
  trilho: { height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.28)', overflow: 'hidden' },
  barra: { height: '100%', borderRadius: 5, backgroundColor: cores.branco },
  situacao: { color: cores.branco, fontSize: 14, lineHeight: 20 },
  cartao: {
    backgroundColor: cores.cartao,
    borderRadius: raio.g,
    borderWidth: 1,
    borderColor: cores.linha,
    padding: espaco.g,
  },
  botoes: { flexDirection: 'row', gap: espaco.m },
  botao: { flex: 1 },
  secao: { fontSize: 16, fontWeight: '600', color: cores.texto, marginBottom: espaco.p },
  vazio: { fontSize: 14, color: cores.textoSuave, lineHeight: 20 },
  lista: { borderRadius: raio.m, borderWidth: 1, borderColor: cores.linha, overflow: 'hidden' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: espaco.m,
    paddingHorizontal: espaco.g,
    backgroundColor: cores.cartao,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: cores.linha,
  },
  itemPressionado: { backgroundColor: cores.primariaClara },
  itemTextos: { flex: 1 },
  itemTipo: { fontSize: 15, fontWeight: '600', color: cores.texto },
  itemData: { fontSize: 13, color: cores.textoSuave },
  itemValor: { fontSize: 15, fontWeight: '600', color: cores.primaria },
  itemRetirada: { color: cores.perigo },
  dica: { fontSize: 12, color: cores.textoSuave, marginTop: espaco.p },
});
