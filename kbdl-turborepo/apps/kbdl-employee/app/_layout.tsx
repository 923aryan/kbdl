import { useAuthStore } from '@/features/auth/hooks/useAuth';
import { SocketProvider } from '@/features/notifications/providers/socket-provider';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { queryClient } from '@/lib/api/query-client';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { toastConfig } from '@/components/ui/toast';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
export const unstable_settings = {
  initialRouteName: '(tabs)',
};
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const hydrateAuth = useAuthStore((s) => s.hydrateAuth);
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      await hydrateAuth();

      // Keep splash screen visible for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));

      await SplashScreen.hideAsync();
    }

    prepare();
  }, []);

  if (!fontsLoaded) return null;
  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <QueryClientProvider client={queryClient}>
          <SocketProvider>
            {/* <SafeAreaView style={{ flex: 1 }} edges={['top']}> */}
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            {/* </SafeAreaView> */}
          </SocketProvider>
          <Toast config={toastConfig} />
          <StatusBar style="auto" />
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
