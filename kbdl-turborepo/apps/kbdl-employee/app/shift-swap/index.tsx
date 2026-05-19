import ExtraShiftSwap from '@/assets/images/extra-shift-swap.svg';
import ScheduledShifts from '@/assets/images/scheduled-shift-swap.svg';
import ShiftSwap from '@/assets/images/shift-swap-shifts.svg';
import { OptionCard } from '@/components/option-card';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/hooks/useAuth';
import translations from '@/translations';
import { router, Stack } from 'expo-router'; // Assuming Expo Router
import React from 'react';
import { ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';

// --- MAIN SCREEN ---
export default function ShiftsScreen() {
  // Theme & Language logic
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const { user } = useAuthStore();
  const selectedLanguage = user?.preferences?.language || 'en-IN';
  const isHindi = selectedLanguage.startsWith('hi');
  const t = isHindi ? translations.hi : translations.en;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Configure Top Header for this specific screen */}
      <Stack.Screen
        options={{
          title: t.headerTitle,
          headerStyle: { backgroundColor: Colors.dark.background }, // The Navy color
          headerTintColor: '#FFFFFF', // White text/back button
          headerTitleAlign: 'center',
          headerShadowVisible: false, // Removes bottom border line
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.heading, { color: Colors.dark.background }]}>{t.chooseOption}</Text>

        <OptionCard
          title={t.shiftSwap}
          description={t.shiftSwapDesc}
          IconComponent={ShiftSwap}
          iconBgColor="#E5EFFF" // Light Blue from image
          theme={theme}
          onPress={() => router.push('/shift-swap/create-shift-swap')}
        />

        <OptionCard
          title={t.scheduledShifts}
          description={t.scheduledShiftsDesc}
          IconComponent={ScheduledShifts}
          iconBgColor="#E6FBEB" // Light Green from image
          theme={theme}
          onPress={() => router.push('/shift-swap/scheduled-shifts')}
        />

        <OptionCard
          title={t.extraShifts}
          description={t.extraShiftsDesc}
          IconComponent={ExtraShiftSwap}
          iconBgColor="#FFF0E3" // Light Orange from image
          theme={theme}
          onPress={() => router.push('/shift-swap/extra-shifts')}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
});
