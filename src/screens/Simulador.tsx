import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Botao from '../components/Botao';
import CampoTexto from '../components/CampoTexto';
import CartaoInvestimento from '../components/CartaoInvestimento';
import SeletorOpcoes from '../components/SeletorOpcoes';
import { Simulador as Calculadora } from '../models/Simulador';
import { OrigemSelic, TaxaSelic, obterSelic } from '../services/indicadores';
import { cores, espaco, raio } from '../theme';
import { RotasPilha } from '../types';
import { formatarDataHora, formatarNumero, lerValor } from '../utils/formato';

type Props = NativeStackScreenProps<RotasPilha, 'Simulador'>;

const PRAZOS = [6, 12, 24, 36, 60] as const;
const PERCENTUAIS_CDI = [100, 110, 120] as const;

type StatusSelic = 'carregando' | 'pronta' | 'erro';

/** Texto que aparece no campo para um número (ex.: 14.25 -> "14,25"). */
function paraCampo(valor: number): string {
  return formatarNumero(valor).replace(/\./g, '');
}

function rotuloPrazo(meses: number): string {
  if (meses % 12 === 0) return meses === 12 ? '1 ano' : `${meses / 12} anos`;
  return `${meses} meses`;
}

export default function Simulador({ route }: Props) {
  const sugerido = route.params?.aporteSugerido;

  const [valorInicial, setValorInicial] = useState('');
  const [aporte, setAporte] = useState(sugerido ? paraCampo(sugerido) : '');
  const [meses, setMeses] = useState<number>(12);
  const [percentualCdi, setPercentualCdi] = useState<number>(100);
  const [selicTexto, setSelicTexto] = useState('');
  const [selic, setSelic] = useState<TaxaSelic | null>(null);
  const [origem, setOrigem] = useState<OrigemSelic | null>(null);
  const [status, setStatus] = useState<StatusSelic>('carregando');

  // useRef: lembra se o usuário mudou a Selic à mão, para a API não apagar o que ele digitou.
  const selicEditada = useRef(false);

  const carregarSelic = useCallback(async () => {
    setStatus('carregando');
    try {
      const resposta = await obterSelic();
      setSelic(resposta.selic);
      setOrigem(resposta.origem);
      if (!selicEditada.current) setSelicTexto(paraCampo(resposta.selic.valor));
      setStatus('pronta');
    } catch {
      setStatus('erro');
    }
  }, []);

  // Busca a Selic quando a tela abre.
  useEffect(() => {
    carregarSelic();
  }, [carregarSelic]);

  function usarSelicDoBanco() {
    if (!selic) return;
    selicEditada.current = false;
    setSelicTexto(paraCampo(selic.valor));
  }

  // useMemo: a simulação só é refeita quando algum dado muda.
  const simulacao = useMemo(() => {
    const calculadora = new Calculadora({
      valorInicial: lerValor(valorInicial || '0'),
      aporteMensal: lerValor(aporte || '0'),
      meses,
      selicAnual: lerValor(selicTexto),
      percentualCdi,
    });
    const erro = calculadora.erro;
    return { erro, resultados: erro ? [] : calculadora.resultados() };
  }, [valorInicial, aporte, meses, selicTexto, percentualCdi]);

  const selicDigitada = lerValor(selicTexto);
  const selicDiferente = selic !== null && selicDigitada !== selic.valor;

  return (
    <KeyboardAvoidingView
      style={styles.tela}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <Text style={styles.introducao}>
          Veja quanto seu dinheiro renderia em três investimentos de renda fixa, com a taxa Selic
          atual do Banco Central.
        </Text>

        <View style={styles.cartao}>
          <Text style={styles.titulo}>Taxa Selic</Text>

          {status === 'carregando' && !selic ? (
            <View style={styles.linhaCarregando}>
              <ActivityIndicator color={cores.primaria} />
              <Text style={styles.ajuda}>Buscando no Banco Central...</Text>
            </View>
          ) : null}

          {status === 'erro' && !selic ? (
            <Text style={styles.erro}>
              Não foi possível falar com o Banco Central. Digite a Selic abaixo ou tente de novo.
            </Text>
          ) : null}

          {selic ? (
            <Text style={styles.ajuda}>
              {origem === 'cache'
                ? `Sem conexão. Usando a Selic salva em ${formatarDataHora(selic.buscadaEm)}: `
                : `Meta da Selic definida pelo Copom (${selic.referencia}): `}
              {formatarNumero(selic.valor)}% ao ano.
            </Text>
          ) : null}

          <CampoTexto
            rotulo="Selic usada na simulação (% ao ano)"
            placeholder="Ex.: 14,25"
            value={selicTexto}
            onChangeText={(texto) => {
              selicEditada.current = true;
              setSelicTexto(texto);
            }}
            keyboardType="decimal-pad"
            maxLength={6}
          />

          {selicDiferente ? (
            <Botao titulo="Voltar para a Selic do Banco Central" variante="contorno" onPress={usarSelicDoBanco} />
          ) : null}
          {status === 'erro' || origem === 'cache' ? (
            <Botao titulo="Buscar de novo" variante="contorno" onPress={carregarSelic} />
          ) : null}
        </View>

        <View style={styles.cartao}>
          <Text style={styles.titulo}>Quanto você vai investir</Text>
          <CampoTexto
            rotulo="Valor inicial (R$)"
            placeholder="0,00"
            value={valorInicial}
            onChangeText={setValorInicial}
            keyboardType="decimal-pad"
            maxLength={12}
          />
          <CampoTexto
            rotulo="Aporte todo mês (R$)"
            placeholder="0,00"
            value={aporte}
            onChangeText={setAporte}
            keyboardType="decimal-pad"
            maxLength={12}
          />
          {sugerido ? (
            <Text style={styles.ajuda}>
              O aporte começou com a sobra do seu orçamento deste mês.
            </Text>
          ) : null}

          <Text style={styles.rotulo}>Por quanto tempo</Text>
          <SeletorOpcoes opcoes={PRAZOS} selecionada={meses} aoSelecionar={setMeses} rotulo={rotuloPrazo} />

          <Text style={styles.rotulo}>Quanto o CDB paga do CDI</Text>
          <SeletorOpcoes
            opcoes={PERCENTUAIS_CDI}
            selecionada={percentualCdi}
            aoSelecionar={setPercentualCdi}
            rotulo={(p) => `${p}%`}
          />
        </View>

        {simulacao.erro ? (
          <Text style={styles.aviso}>{simulacao.erro}</Text>
        ) : (
          <View style={styles.resultados}>
            <Text style={styles.titulo}>Depois de {rotuloPrazo(meses)}</Text>
            {simulacao.resultados.map((resultado, indice) => (
              <CartaoInvestimento key={resultado.tipo} resultado={resultado} melhor={indice === 0} />
            ))}
          </View>
        )}

        <Text style={styles.observacao}>
          Simulação educativa, não é recomendação de investimento. Os valores são aproximados:
          consideram a Selic de hoje fixa durante todo o prazo, o CDI 0,10 ponto abaixo da Selic e o
          Imposto de Renda pela tabela regressiva. Não incluem a TR da poupança nem taxas de custódia.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.g, gap: espaco.g, paddingBottom: espaco.gg * 2 },
  introducao: { fontSize: 15, color: cores.textoSuave, lineHeight: 21 },
  cartao: {
    backgroundColor: cores.cartao,
    borderRadius: raio.g,
    borderWidth: 1,
    borderColor: cores.linha,
    padding: espaco.g,
    gap: espaco.p,
  },
  titulo: { fontSize: 18, fontWeight: '700', color: cores.texto },
  rotulo: { fontSize: 13, color: cores.textoSuave, marginTop: espaco.p },
  ajuda: { fontSize: 13, color: cores.textoSuave, lineHeight: 18 },
  erro: { fontSize: 14, color: cores.perigo, lineHeight: 20 },
  linhaCarregando: { flexDirection: 'row', alignItems: 'center', gap: espaco.p },
  resultados: { gap: espaco.m },
  aviso: {
    fontSize: 14,
    color: cores.alerta,
    backgroundColor: cores.alertaClaro,
    borderRadius: raio.p,
    padding: espaco.m,
    lineHeight: 20,
  },
  observacao: { fontSize: 12, color: cores.textoSuave, lineHeight: 17 },
});
