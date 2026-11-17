import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import Rotas from './src/navigation/Rotas';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Rotas />
        <StatusBar style="dark" />
      </AppProvider>
    </SafeAreaProvider>
  );
}
