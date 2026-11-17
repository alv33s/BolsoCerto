import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { cores } from '../theme';

type BotaoFlutuanteProps = {
  onPress: () => void;
  rotuloAcessivel: string;
};

export default function BotaoFlutuante({ onPress, rotuloAcessivel }: BotaoFlutuanteProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel}
      style={({ pressed }) => [styles.botao, pressed && styles.pressionado]}
    >
      <Ionicons name="add" size={30} color={cores.branco} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: cores.texto,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  pressionado: { opacity: 0.8 },
});
