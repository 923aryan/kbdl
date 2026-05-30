// import ExtraShiftSwap from '@/assets/images/extra-shift-swap.svg';
// import ScheduledShifts from '@/assets/images/scheduled-shift-swap.svg';
// import ShiftSwap from '@/assets/images/shift-swap-shifts.svg';
// import { OptionCard } from '@/components/option-card';
// import { Colors } from '@/constants/theme';
// import { useAuthStore } from '@/features/auth/hooks/useAuth';
// import translations from '@/translations';
// import { router, Stack } from 'expo-router'; // Assuming Expo Router
// import React from 'react';
// import { ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';

// // --- MAIN SCREEN ---
// export default function ShiftsScreen() {
//   // Theme & Language logic
//   const colorScheme = useColorScheme();
//   const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
//   const { user } = useAuthStore();
//   const selectedLanguage = user?.preferences?.language || 'en-IN';
//   const isHindi = selectedLanguage.startsWith('hi');
//   const t = isHindi ? translations.hi : translations.en;

//   return (
//     <View style={[styles.container, { backgroundColor: theme.background }]}>
//       {/* Configure Top Header for this specific screen */}
//       <Stack.Screen
//         options={{
//           title: t.headerTitle,
//           headerStyle: { backgroundColor: Colors.dark.background }, // The Navy color
//           headerTintColor: '#FFFFFF', // White text/back button
//           headerTitleAlign: 'center',
//           headerShadowVisible: false, // Removes bottom border line
//         }}
//       />

//       <ScrollView contentContainerStyle={styles.scrollContent}>
//         <Text style={[styles.heading, { color: Colors.dark.background }]}>{t.chooseOption}</Text>

//         <OptionCard
//           title={t.shiftSwap}
//           description={t.shiftSwapDesc}
//           IconComponent={ShiftSwap}
//           iconBgColor="#E5EFFF" // Light Blue from image
//           theme={theme}
//           onPress={() => router.push('/shift-swap/create-shift-swap')}
//         />

//         <OptionCard
//           title={t.scheduledShifts}
//           description={t.scheduledShiftsDesc}
//           IconComponent={ScheduledShifts}
//           iconBgColor="#E6FBEB" // Light Green from image
//           theme={theme}
//           onPress={() => router.push('/shift-swap/scheduled-shifts')}
//         />

//         <OptionCard
//           title={t.extraShifts}
//           description={t.extraShiftsDesc}
//           IconComponent={ExtraShiftSwap}
//           iconBgColor="#FFF0E3" // Light Orange from image
//           theme={theme}
//           onPress={() => router.push('/shift-swap/extra-shifts')}
//         />
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   scrollContent: {
//     padding: 20,
//   },
//   heading: {
//     fontSize: 20,
//     fontWeight: '600',
//     marginBottom: 20,
//   },
//   iconContainer: {
//     width: 64,
//     height: 64,
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 16,
//   },
// });

import { Feather } from '@expo/vector-icons';
import { Stack, router } from 'expo-router'; // Assuming Expo Router
import React from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';

import Loader from '@/components/ui/loader';
import ShiftCard from '@/components/ui/shift-swap-card';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/hooks/useAuth';
import { useGetBestMatchesShifts, useGetLatestShifts } from '@/features/shift-swap/api';
import translations from '@/translations';

const { width } = Dimensions.get('window');

// --- MAIN SCREEN ---
export default function ShiftsScreen() {
  // Theme & Language logic
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const { user } = useAuthStore();
  const selectedLanguage = user?.preferences?.language || 'en-IN';
  const isHindi = selectedLanguage.startsWith('hi');
  const t = isHindi ? translations.hi : translations.en;

  // Fetch data
  const { data: latestShiftsData, isLoading: isLatestLoading } = useGetLatestShifts();
  const { data: bestMatchesData, isLoading: isBestMatchesLoading } = useGetBestMatchesShifts();

  // Safely extract the data array
  const latestShifts = Array.isArray(latestShiftsData)
    ? latestShiftsData
    : (latestShiftsData as any)?.data || [];
  const bestMatches = Array.isArray(bestMatchesData)
    ? bestMatchesData
    : (bestMatchesData as any)?.data || [];

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FA' }]}>
      {/* Configure Top Header */}
      <Stack.Screen
        options={{
          title: t.headerTitle || 'Shifts',
          headerStyle: { backgroundColor: '#0B173F' }, // The Navy color
          headerTintColor: '#FFFFFF', // White text/back button
          headerTitleAlign: 'center',
          headerShadowVisible: false, // Removes bottom border line
        }}
      />

      {/* Dark Curved Background Extension */}
      <View style={styles.extendedHeaderBackground} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for extra shift"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Primary Toggle Buttons (Big Blue Cards) */}
        <View style={styles.mainButtonsRow}>
          <TouchableOpacity
            style={[styles.bigBtn, styles.bigBtnActive]}
            onPress={() => router.push('/shift-swap/options')}
            activeOpacity={0.8}
          >
            <View style={styles.bigBtnContent}>
              <Text style={styles.bigBtnText}>Shift{'\n'}Swap</Text>
              <Feather name="arrow-right" size={20} color="#FFF" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bigBtn, styles.bigBtnActive]}
            onPress={() => router.push('/shift-swap/activity')}
            activeOpacity={0.8}
          >
            <View style={styles.bigBtnContent}>
              <Text style={styles.bigBtnText}>My{'\n'}activity</Text>
              <Feather name="arrow-right" size={20} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Content Area */}
        <View style={styles.contentArea}>
          {/* Best Matches Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Best Shift matches for you</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>see all {'>'}</Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal Scroll for Best Matches */}
          {isBestMatchesLoading ? (
            <Loader />
          ) : bestMatches.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {bestMatches.map((shift: any) => (
                <View key={shift.id} style={styles.horizontalCardWrapper}>
                  <ShiftCard
                    shift={shift}
                    distance={
                      shift.distance_in_km !== undefined ? `${shift.distance_in_km} km` : undefined
                    }
                    buttonTitle="Apply"
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.emptyText}>No best matches found.</Text>
          )}

          {/* Latest Post Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest Post</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>see all {'>'}</Text>
            </TouchableOpacity>
          </View>

          {/* Vertical List for Latest Posts */}
          <View style={styles.verticalList}>
            {isLatestLoading ? (
              <Loader />
            ) : latestShifts.length > 0 ? (
              latestShifts.map((shift: any) => (
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  distance={
                    shift.distance_in_km !== undefined ? `${shift.distance_in_km} km` : undefined
                  }
                  buttonTitle="Apply"
                />
              ))
            ) : (
              <Text style={styles.emptyText}>No latest shifts found.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  extendedHeaderBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140, // Adjust this to push the curve further down if needed
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    zIndex: 0,
  },
  scrollContent: {
    paddingBottom: 100,
    zIndex: 1,
  },

  /* Search Bar */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#111827',
  },

  /* Big Buttons Row */
  mainButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 16, // Requires React Native 0.71+, if older, use margin/flex spacing
  },
  bigBtn: {
    flex: 1,
    height: 100,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  bigBtnActive: {
    backgroundColor: '#2563EB', // Brighter active blue
  },
  bigBtnInactive: {
    backgroundColor: '#1E3A8A', // Darker inactive blue
  },
  bigBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bigBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },

  /* Content Area */
  contentArea: {
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },

  /* Lists */
  horizontalList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  horizontalCardWrapper: {
    width: width - 40, // Match the typical width of vertical cards
  },
  verticalList: {
    paddingHorizontal: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 10,
    marginBottom: 20,
    fontSize: 14,
  },
});
