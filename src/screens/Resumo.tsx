import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import BotaoFlutuante from '../components/BotaoFlutuante';
import CartaoCotacao from '../components/CartaoCotacao';
import CartaoOrcamento from '../components/CartaoOrcamento';
import ItemGasto from '../components/ItemGasto';
import { useApp } from '../context/AppContext';
import { cores, espaco, raio } from '../theme';
import { Gasto, RotasPilha } from '../types';
import { mesmoMes, nomeDoMes } from '../utils/formato';

const QUANTIDADE_RECENTES = 4;

export default function Resumo() {
  const navigation = useNavigation<NativeStackNavigationProp<RotasPilha>>();
  const {
    sessao,
    gastos,
    preferencias,
    totalDoMes,
    orcamentoDoMes,
    cotacao,
    origemCotacao,
    statusCotacao,
    atualizarCotacao,
  } = useApp();

  // useRef guarda o status mais recente sem recriar a função de foco a cada mudança
  // (se ela mudasse a cada falha, a tela ficaria tentando de novo sem parar).
  const statusAtual = useRef(statusCotacao);
  useEffect(() => {
    statusAtual.current = statusCotacao;
  }, [statusCotacao]);

  // Ciclo de vida da tela: ao ganhar foco, tenta de novo uma vez se a última busca falhou.
  useFocusEffect(
    useCallback(() => {
      if (statusAtual.current === 'erro') atualizarCotacao();
    }, [atualizarCotacao]),
  );

  const recentes = useMemo(
    () => gastos.filter((g) => mesmoMes(g.data)).slice(0, QUANTIDADE_RECENTES),
    [gastos],
  );

  const abrirDetalhe = useCallback(
    (gasto: Gasto) => navigation.navigate('DetalheGasto', { id: gasto.id }),
    [navigation],
  );

  return (
    <View style={styles.tela}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <View>
          <Text style={styles.saudacao}>Olá, {sessao?.nome}</Text>
          <Text style={styles.mes}>{nomeDoMes()}</Text>
        </View>

        <CartaoOrcamento
          total={totalDoMes}
          limite={preferencias.orcamento}
          orcamento={orcamentoDoMes}
        />

        <CartaoCotacao
          cotacao={cotacao}
          origem={origemCotacao}
          status={statusCotacao}
          aoAtualizar={atualizarCotacao}
        />

        <View>
          <Text style={styles.secao}>Últimos gastos do mês</Text>
          {recentes.length === 0 ? (
            <Text style={styles.vazio}>
              Nenhum gasto registrado neste mês. Toque em + para registrar o primeiro.
            </Text>
          ) : (
            <View style={styles.lista}>
              {recentes.map((gasto) => (
                <ItemGasto key={gasto.id} gasto={gasto} onPress={abrirDetalhe} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <BotaoFlutuante
        rotuloAcessivel="Registrar novo gasto"
        onPress={() => navigation.navigate('NovoGasto')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.g, gap: espaco.g, paddingBottom: 100 },
  saudacao: { fontSize: 24, fontWeight: '700', color: cores.texto },
  mes: { fontSize: 14, color: cores.textoSuave },
  secao: { fontSize: 16, fontWeight: '600', color: cores.texto, marginBottom: espaco.p },
  lista: {
    borderRadius: raio.m,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: cores.linha,
  },
  vazio: { fontSize: 14, color: cores.textoSuave, lineHeight: 20 },
});
