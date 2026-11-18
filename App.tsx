import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import { CofrinhosProvider } from './src/context/CofrinhosContext';
import Rotas from './src/navigation/Rotas';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <CofrinhosProvider>
          <Rotas />
          <StatusBar style="dark" />
        </CofrinhosProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
