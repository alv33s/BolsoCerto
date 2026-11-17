import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { cores, espaco, raio } from '../theme';

type BotaoProps = {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'contorno' | 'perigo';
  desabilitado?: boolean;
  carregando?: boolean;
};

export default function Botao({
  titulo,
  onPress,
  variante = 'primario',
  desabilitado = false,
  carregando = false,
}: BotaoProps) {
  const inativo = desabilitado || carregando;
  const corDoTexto =
    variante === 'primario' ? cores.branco : variante === 'perigo' ? cores.perigo : cores.texto;

  return (
    <Pressable
      onPress={onPress}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      style={({ pressed }) => [
        styles.base,
        variante === 'primario' && styles.primario,
        variante === 'contorno' && styles.contorno,
        variante === 'perigo' && styles.perigo,
        pressed && styles.pressionado,
        inativo && styles.inativo,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={corDoTexto} />
      ) : (
        <Text style={[styles.texto, { color: corDoTexto }]}>{titulo}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: raio.m,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espaco.g,
    marginTop: espaco.p,
  },
  primario: { backgroundColor: cores.primaria },
  contorno: { borderWidth: 1, borderColor: cores.linha, backgroundColor: cores.cartao },
  perigo: { borderWidth: 1, borderColor: cores.perigo, backgroundColor: cores.cartao },
  pressionado: { opacity: 0.75 },
  inativo: { opacity: 0.5 },
  texto: { fontSize: 16, fontWeight: '600' },
});
