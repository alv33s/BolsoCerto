import { ComponentRef, Ref } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { cores, espaco, raio } from '../theme';

/** Tipo da instância do TextInput, usado nas referências criadas com useRef. */
export type CampoRef = ComponentRef<typeof TextInput>;

type CampoTextoProps = TextInputProps & {
  rotulo: string;
  /** Mensagem de erro exibida abaixo do campo. */
  erro?: string | null;
  /** Permite que a tela dê foco neste campo (useRef). */
  referencia?: Ref<CampoRef>;
};

export default function CampoTexto({ rotulo, erro, referencia, style, ...resto }: CampoTextoProps) {
  return (
    <View style={styles.bloco}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <TextInput
        ref={referencia}
        style={[styles.campo, erro ? styles.campoComErro : null, style]}
        placeholderTextColor={cores.textoSuave}
        accessibilityLabel={rotulo}
        {...resto}
      />
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: { marginBottom: espaco.m },
  rotulo: { fontSize: 13, color: cores.textoSuave, marginBottom: espaco.pp },
  campo: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: cores.linha,
    borderRadius: raio.p,
    paddingHorizontal: espaco.m,
    fontSize: 16,
    color: cores.texto,
    backgroundColor: cores.cartao,
  },
  campoComErro: { borderColor: cores.perigo },
  erro: { color: cores.perigo, fontSize: 13, marginTop: espaco.pp },
});
