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

import { useEffect } from 'react';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';

const StackScreenStructure = () => {
  const { user } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return;

    const firstSegment = segments[0] as string;
    const inAuthGroup = firstSegment === '(tabs)' || firstSegment === '(admin-tabs)';

    const isLoginPage = firstSegment === 'login';
    const isRoot = !firstSegment || firstSegment === 'index' || firstSegment === '';

    if (!user && (inAuthGroup || isRoot)) {
      // Small timeout to ensure the navigator is ready
      const timer = setTimeout(() => {
        router.replace('/login');
      }, 1);
      return () => clearTimeout(timer);
    } else if (user && (isLoginPage || isRoot)) {
      // Redirect to dashboard if logged in but on login or splash page
      const timer = setTimeout(() => {
        if (user.role === 'admin') {
          router.replace('/(admin-tabs)');
        } else {
          router.replace('/(tabs)');
        }
      }, 1);
      return () => clearTimeout(timer);
    }
  }, [user, segments, navigationState?.key]);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(admin-tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  )
}
