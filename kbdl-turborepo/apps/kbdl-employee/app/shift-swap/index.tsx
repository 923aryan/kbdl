import { Feather } from '@expo/vector-icons';
import { Stack, router } from 'expo-router'; // Assuming Expo Router
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';

import Loader from '@/components/ui/loader';
import SearchBar from '@/components/ui/search-bar';
import ShiftCard from '@/components/ui/shift-swap-card';
import { Typography } from '@/components/ui/typography';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/hooks/useAuth';
import { useGetBestMatchesShifts, useGetLatestShifts } from '@/features/shift-swap/api';
import translations from '@/translations';
import { GetLatestShiftsResponse } from '@repo/types';

const { width } = Dimensions.get('window');

const filterShifts = (shifts: any[], query: string) => {
  if (!query.trim()) return shifts;
  const lowerQuery = query.toLowerCase().trim();
  return shifts.filter((shift: GetLatestShiftsResponse[number]) => {
    const skillMatch = shift.skill_required?.toLowerCase().includes(lowerQuery);
    const companyMatch = shift.employer?.company_name?.toLowerCase().includes(lowerQuery);
    const addressMatch = shift.employer?.company_address?.toLowerCase().includes(lowerQuery);
    const payMatch = shift.shift_pay?.toString().toLowerCase().includes(lowerQuery);

    return skillMatch || companyMatch || addressMatch || payMatch;
  });
};

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

  const [searchQuery, setSearchQuery] = useState('');

  const filteredLatestShifts = useMemo(
    () => filterShifts(latestShifts, searchQuery),
    [latestShifts, searchQuery],
  );
  const filteredBestMatches = useMemo(
    () => filterShifts(bestMatches, searchQuery),
    [bestMatches, searchQuery],
  );

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

      {/* Dark Curved Background Extension (Absolute at Top) */}
      <View style={styles.extendedHeaderBackground} />

      {/* FIXED HEADER SECTION (Sticks to top) */}
      <View style={styles.fixedTopSection}>
        {/* Search Bar */}
        <SearchBar
          placeholder={t.searchPlaceholder}
          containerStyle={styles.searchContainer}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Primary Toggle Buttons (Big Blue Cards) */}
        <View style={styles.mainButtonsRow}>
          <TouchableOpacity
            style={[styles.bigBtn, styles.bigBtnActive]}
            onPress={() => router.push('/shift-swap/options')}
            activeOpacity={0.8}
          >
            <View style={styles.bigBtnContent}>
              <Typography style={styles.bigBtnText}>{t.shiftSwapBtn}</Typography>
              <Feather name="arrow-right" size={20} color="#FFF" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bigBtn, styles.bigBtnActive]}
            onPress={() => router.push('/shift-swap/activity')}
            activeOpacity={0.8}
          >
            <View style={styles.bigBtnContent}>
              <Typography style={styles.bigBtnText}>{t.myActivityBtn}</Typography>
              <Feather name="arrow-right" size={20} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* SCROLLABLE CONTENT AREA */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View>
          {/* Best Matches Section */}
          {(isBestMatchesLoading || filteredBestMatches.length > 0) && (
            <>
              <View style={styles.sectionHeader}>
                <Typography variant="button">{t.bestShiftMatches}</Typography>
                <TouchableOpacity>
                  <Typography style={styles.seeAllText}>
                    {t.seeAll} {'>'}
                  </Typography>
                </TouchableOpacity>
              </View>

              {/* Horizontal Scroll for Best Matches */}
              {isBestMatchesLoading ? (
                <Loader />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                >
                  {filteredBestMatches.map((shift: any) => (
                    <View key={shift.id} style={styles.horizontalCardWrapper}>
                      <ShiftCard
                        shift={shift}
                        distance={
                          shift.distance_in_km !== undefined
                            ? `${shift.distance_in_km} km`
                            : undefined
                        }
                        buttonTitle="Apply"
                      />
                    </View>
                  ))}
                </ScrollView>
              )}
            </>
          )}

          {/* Latest Post Section */}
          {(isLatestLoading || filteredLatestShifts.length > 0) && (
            <>
              <View style={styles.sectionHeader}>
                <Typography variant="button">{t.latestPost}</Typography>
                <TouchableOpacity>
                  <Typography style={styles.seeAllText}>
                    {t.seeAll} {'>'}
                  </Typography>
                </TouchableOpacity>
              </View>

              {/* Horizontal Scroll for Latest Posts */}
              {isLatestLoading ? (
                <Loader />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                >
                  {filteredLatestShifts.map((shift: any) => (
                    <View key={shift.id} style={styles.horizontalCardWrapper}>
                      <ShiftCard
                        shift={shift}
                        distance={
                          shift.distance_in_km !== undefined
                            ? `${shift.distance_in_km} km`
                            : undefined
                        }
                        buttonTitle="Apply"
                      />
                    </View>
                  ))}
                </ScrollView>
              )}
            </>
          )}

          {/* Empty Search State */}
          {!isBestMatchesLoading &&
            !isLatestLoading &&
            searchQuery.trim() !== '' &&
            filteredBestMatches.length === 0 &&
            filteredLatestShifts.length === 0 && (
              <View style={styles.emptySearchContainer}>
                <Typography style={styles.emptySearchText}>
                  {t.noShiftsFound} "{searchQuery}"
                </Typography>
              </View>
            )}
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
    height: 160,
    backgroundColor: '#0B173F',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    zIndex: 0,
  },

  /* Pinned Top Section */
  fixedTopSection: {
    zIndex: 10, // Ensures this stays above the scroll view and absolute background
    paddingBottom: 8, // Little bit of padding before scroll view starts
  },

  scrollContent: {
    paddingBottom: 100, // Safe padding for bottom tab bar or overflow
    zIndex: 1,
  },

  /* Search Bar */
  searchContainer: {
    marginHorizontal: 20,
    marginTop: 20,
  },

  /* Big Buttons Row */
  mainButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 32,
    marginBottom: 8,
    gap: 16,
  },
  bigBtn: {
    flex: 1,
    height: 80,
    borderRadius: 28,
    paddingHorizontal: 18,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 8,
  },
  bigBtnActive: {
    backgroundColor: '#2F49C7',
  },
  bigBtnInactive: {
    backgroundColor: '#1E3A8A',
  },
  bigBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  bigBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 24,
  },

  /* Content Area */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24, // Space between sections
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
  },
  seeAllText: {
    fontSize: 14,
    color: '#2563EB',
  },

  /* Lists */
  horizontalList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  horizontalCardWrapper: {
    width: width - 40,
  },

  /* Empty Search State */
  emptySearchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
  },
  emptySearchText: {
    color: '#6B7280',
    textAlign: 'center',
  },
});
