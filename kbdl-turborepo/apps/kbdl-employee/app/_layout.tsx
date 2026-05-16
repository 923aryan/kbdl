import { useAuthStore } from '@/features/auth/hooks/useAuth';
import { SocketProvider } from '@/features/notifications/providers/socket-provider';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { queryClient } from '@/lib/api/query-client';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
export const unstable_settings = {
  initialRouteName: '(public)',
};
SplashScreen.preventAutoHideAsync();
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const hydrateAuth = useAuthStore((s) => s.hydrateAuth);

  useEffect(() => {
    async function prepare() {
      await hydrateAuth();
      await SplashScreen.hideAsync();
    }
    prepare();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <QueryClientProvider client={queryClient}>
          <SocketProvider>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(public)" options={{ headerShown: false }} />
                <Stack.Screen name="(protected)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              </Stack>
            </SafeAreaView>
          </SocketProvider>
          <Toast />
          <StatusBar style="auto" />
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
