import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StackScreenStructure />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}

const StackScreenStructure = () => {
    const { user } = useAuth();
    
    return (
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          {user && <Stack.Screen name="(tabs)" options={{ headerShown: false }} />}
          {user && <Stack.Screen name="(admin-tabs)" options={{ headerShown: false }} />}
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
    )
}
