import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { cores, espaco } from '../theme';

type SeletorOpcoesProps<T extends string | number> = {
  opcoes: readonly T[];
  selecionada: T;
  aoSelecionar: (opcao: T) => void;
  /** Texto exibido em cada opção (por padrão, a própria opção). */
  rotulo?: (opcao: T) => string;
};

/** Linha de opções em que só uma fica marcada (moeda, categoria, horário...). */
export default function SeletorOpcoes<T extends string | number>({
  opcoes,
  selecionada,
  aoSelecionar,
  rotulo = (opcao) => String(opcao),
}: SeletorOpcoesProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.linha}
    >
      {opcoes.map((opcao) => {
        const marcada = opcao === selecionada;
        return (
          <Pressable
            key={String(opcao)}
            onPress={() => aoSelecionar(opcao)}
            accessibilityRole="button"
            accessibilityState={{ selected: marcada }}
            style={[styles.opcao, marcada && styles.opcaoMarcada]}
          >
            <Text style={[styles.texto, marcada && styles.textoMarcado]}>{rotulo(opcao)}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  linha: { gap: espaco.p, paddingVertical: espaco.pp },
  opcao: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: espaco.g,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: cores.linha,
    backgroundColor: cores.cartao,
  },
  opcaoMarcada: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  texto: { fontSize: 14, color: cores.texto },
  textoMarcado: { color: cores.branco, fontWeight: '600' },
});
