import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useApp } from '../context/AppContext';
import DetalheGasto from '../screens/DetalheGasto';
import Gastos from '../screens/Gastos';
import Login from '../screens/Login';
import Metas from '../screens/Metas';
import NovoGasto from '../screens/NovoGasto';
import Resumo from '../screens/Resumo';
import { ouvirToqueEmNotificacao } from '../services/notificacoes';
import { cores } from '../theme';
import { RotasAbas, RotasPilha } from '../types';

// Os navegadores ficam fora dos componentes para não serem recriados a cada renderização.
const Pilha = createNativeStackNavigator<RotasPilha>();
const Abas = createBottomTabNavigator<RotasAbas>();
const navegacao = createNavigationContainerRef<RotasPilha>();

type NomeDoIcone = keyof typeof Ionicons.glyphMap;

const ICONE_DA_ABA: Record<keyof RotasAbas, NomeDoIcone> = {
  Resumo: 'home-outline',
  Gastos: 'receipt-outline',
  Metas: 'flag-outline',
};

// Navegação por abas: as três áreas principais do app.
function TelasEmAbas() {
  return (
    <Abas.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSuave,
        headerStyle: { backgroundColor: cores.fundo },
        headerTintColor: cores.texto,
        headerShadowVisible: false,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONE_DA_ABA[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Abas.Screen name="Resumo" component={Resumo} />
      <Abas.Screen name="Gastos" component={Gastos} />
      <Abas.Screen name="Metas" component={Metas} />
    </Abas.Navigator>
  );
}

export default function Rotas() {
  const { iniciando, desbloqueado } = useApp();

  // useRef: o ouvinte de notificações precisa saber o valor atual sem ser recriado.
  const liberado = useRef(desbloqueado);
  useEffect(() => {
    liberado.current = desbloqueado;
  }, [desbloqueado]);

  // Ao tocar em uma notificação, leva o usuário para a tela certa.
  // A função devolvida faz a limpeza (cleanup) quando o componente é desmontado.
  useEffect(() => {
    return ouvirToqueEmNotificacao((tipo) => {
      if (!liberado.current || !navegacao.isReady()) return;
      if (tipo === 'lembrete') {
        navegacao.navigate('NovoGasto');
      } else {
        navegacao.navigate('Abas');
      }
    });
  }, []);

  if (iniciando) {
    return (
      <View style={styles.carregando}>
        <ActivityIndicator size="large" color={cores.primaria} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navegacao}>
      <Pilha.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: cores.fundo },
          headerTintColor: cores.texto,
          headerShadowVisible: false,
          headerBackTitle: 'Voltar',
        }}
      >
        {desbloqueado ? (
          <>
            <Pilha.Screen name="Abas" component={TelasEmAbas} options={{ headerShown: false }} />
            {/* Navegação em pilha: abre por cima das abas e volta com o botão Voltar. */}
            <Pilha.Screen
              name="DetalheGasto"
              component={DetalheGasto}
              options={{ title: 'Detalhe do gasto' }}
            />
            {/* Modal: sobe de baixo para cima para uma tarefa rápida. */}
            <Pilha.Screen
              name="NovoGasto"
              component={NovoGasto}
              options={{ title: 'Novo gasto', presentation: 'modal' }}
            />
          </>
        ) : (
          <Pilha.Screen name="Login" component={Login} options={{ headerShown: false }} />
        )}
      </Pilha.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  carregando: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.fundo,
  },
});
