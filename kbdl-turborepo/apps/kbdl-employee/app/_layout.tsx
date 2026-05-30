import { toastConfig } from '@/components/ui/toast';
import { useAuthStore } from '@/features/auth/hooks/useAuth';
import { SocketProvider } from '@/features/notifications/providers/socket-provider';
import { updateUserLocation } from '@/features/profile/api';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { queryClient } from '@/lib/api/query-client';

import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';

import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';

import * as Location from 'expo-location';

import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useEffect, useRef } from 'react';

import 'react-native-reanimated';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const CustomDefaultTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F8F9FA',
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const hydrateAuth = useAuthStore((s) => s.hydrateAuth);
  const user = useAuthStore((s) => s.user);

  const hasRequestedLocation = useRef(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  async function requestLocation() {
    try {
      const existing = await Location.getForegroundPermissionsAsync();

      let status = existing.status;

      // Ask politely only if not already granted
      if (status !== 'granted') {
        const result = await Location.requestForegroundPermissionsAsync();

        status = result.status;
      }

      // User denied/skipped → continue app normally
      if (status !== 'granted') {
        console.log('User skipped location permission');
        return;
      }

      // Prevent hanging forever on some Android devices
      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Location timeout')), 10000),
      );

      const location = await Promise.race([locationPromise, timeoutPromise]);

      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;

      console.log('Location:', latitude, longitude);

      // Optional reverse geocode
      const geocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (geocode && geocode.length > 0) {
        const place = geocode[0];

        const locationName =
          place.street ||
          place.name ||
          place.city ||
          place.district ||
          place.subregion ||
          place.region ||
          'Unknown Location';

        console.log(`${locationName} ✓`);
      }

      await updateUserLocation({
        latitude,
        longitude,
      });

      console.log('User location updated successfully');
    } catch (err) {
      console.log('Location error:', err);
    }
  }

  // Initial startup logic
  useEffect(() => {
    async function prepare() {
      try {
        await hydrateAuth();

        // Optional splash delay
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } finally {
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  // Reset guard on logout
  useEffect(() => {
    if (!user) {
      hasRequestedLocation.current = false;
    }
  }, [user]);

  // Request location once when authenticated
  useEffect(() => {
    if (!user) return;

    // Prevent duplicate calls in React Strict Mode
    if (hasRequestedLocation.current) return;

    hasRequestedLocation.current = true;

    requestLocation().catch(console.error);
  }, [user]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : CustomDefaultTheme}>
        <QueryClientProvider client={queryClient}>
          <SocketProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                // Optimize navigation performance
                animation: 'slide_from_right',
                fullScreenGestureEnabled: true,
                freezeOnBlur: true, // Freezes previous screens to save CPU/memory
              }}
            >
              <Stack.Screen
                name="modal"
                options={{
                  presentation: 'modal',
                  title: 'Modal',
                }}
              />
            </Stack>
          </SocketProvider>

          <Toast config={toastConfig} />

          <StatusBar style="auto" />
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
