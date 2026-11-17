import { StyleSheet, View } from 'react-native';
import { NivelOrcamento } from '../models/Orcamento';

type BarraProgressoProps = {
  /** Fração preenchida, de 0 a 1 (valores maiores são limitados a 1). */
  progresso: number;
  nivel: NivelOrcamento;
};

const COR_DO_NIVEL: Record<NivelOrcamento, string> = {
  ok: '#FFFFFF',
  atencao: '#FFD27A',
  estourado: '#FF9D96',
};

export default function BarraProgresso({ progresso, nivel }: BarraProgressoProps) {
  const largura = Math.min(Math.max(progresso, 0), 1) * 100;

  return (
    <View
      style={styles.trilho}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(largura) }}
    >
      <View
        style={[styles.preenchimento, { width: `${largura}%`, backgroundColor: COR_DO_NIVEL[nivel] }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  trilho: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.28)',
    overflow: 'hidden',
  },
  preenchimento: { height: '100%', borderRadius: 5 },
});
