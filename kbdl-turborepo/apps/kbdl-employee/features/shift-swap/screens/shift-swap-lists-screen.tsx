import { useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import Loader from '@/components/ui/loader';
import SearchBar from '@/components/ui/search-bar';
import ShiftCard from '@/components/ui/shift-swap-card';
import { Typography } from '@/components/ui/typography';
import { useAuthStore } from '@/features/auth/hooks/useAuth';
import {
  useGetBestMatchesShifts,
  useGetExtraShifts,
  useGetLatestShifts,
} from '@/features/shift-swap/api';
import translations from '@/translations';
import { GetLatestShiftsResponse } from '@repo/types';

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

export default function ShiftSwapListsScreen() {
  const { type, query } = useLocalSearchParams<{ type: string; query?: string }>();
  const isBestMatches = type === 'best-matches';
  const isExtraShifts = type === 'extra-shifts';

  const { user } = useAuthStore();
  const selectedLanguage = user?.preferences?.language || 'en-IN';
  const isHindi = selectedLanguage.startsWith('hi');
  const t = isHindi ? translations.hi : translations.en;

  // Both queries are instantiated, but tanstack query optimally handles cache
  const { data: latestShiftsData, isLoading: isLatestLoading } = useGetLatestShifts();
  const { data: bestMatchesData, isLoading: isBestMatchesLoading } = useGetBestMatchesShifts();
  const { data: extraShiftsData, isLoading: isExtraLoading } = useGetExtraShifts(query || '');

  const rawData = isBestMatches
    ? bestMatchesData
    : isExtraShifts
      ? extraShiftsData
      : latestShiftsData;
  const isLoading = isBestMatches
    ? isBestMatchesLoading
    : isExtraShifts
      ? isExtraLoading
      : isLatestLoading;

  const shifts = Array.isArray(rawData) ? rawData : (rawData as any)?.data || [];

  const [searchQuery, setSearchQuery] = useState('');

  const filteredShifts = useMemo(() => filterShifts(shifts, searchQuery), [shifts, searchQuery]);

  return (
    <View style={styles.container}>
      <SearchBar
        placeholder={t.searchPlaceholder || 'Search shifts...'}
        containerStyle={styles.searchContainer}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {isLoading ? (
        <Loader />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredShifts.length > 0 ? (
            filteredShifts.map((shift: any) => (
              <View key={shift.id} style={styles.verticalCardWrapper}>
                <ShiftCard
                  shift={shift}
                  distance={
                    shift.distance_in_km !== undefined ? `${shift.distance_in_km} km` : undefined
                  }
                  buttonTitle="Apply"
                />
              </View>
            ))
          ) : (
            <View style={styles.emptySearchContainer}>
              <Typography style={styles.emptySearchText}>
                {t.noShiftsFound || 'No shifts found'} {searchQuery ? `"${searchQuery}"` : ''}
              </Typography>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  searchContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  verticalCardWrapper: {
    width: '100%',
  },
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
