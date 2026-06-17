import { useColorScheme } from '@/hooks/use-color-scheme';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ShiftCard from '@/components/ui/shift-swap-card';
import { Typography } from '@/components/ui/typography';
import { Colors } from '@/constants/theme';
import { useSyncSavedShifts } from '@/features/shift-swap/api';
import { useShiftSwapStore } from '@/features/shift-swap/hooks/use-shift-swap';

export default function SavedShiftsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();

  const savedShifts = useShiftSwapStore((state) => state.savedShifts);
  const updateSavedShifts = useShiftSwapStore((state) => state.updateSavedShifts);
  const toggleSavedShift = useShiftSwapStore((state) => state.toggleSavedShift);
  const { mutate: syncSavedShifts } = useSyncSavedShifts();

  const savedShiftIdsRef = useRef<string[]>([]);
  savedShiftIdsRef.current = savedShifts.map((s: any) => s.id);

  useFocusEffect(
    useCallback(() => {
      const ids = savedShiftIdsRef.current;
      if (ids.length === 0) return;

      syncSavedShifts(
        { shift_ids: ids },
        {
          onSuccess: (response: any) => {
            if (response?.data) {
              updateSavedShifts(response.data);
            }
          },
          onError: (error) => {
            console.error('Failed to sync saved shifts:', error);
          },
        },
      );
    }, [updateSavedShifts, syncSavedShifts]),
  );

  const renderItem = ({ item: shift }: { item: any }) => {
    return (
      <View style={styles.cardWrapper}>
        <ShiftCard shift={shift} buttonTitle="Apply" />
        <TouchableOpacity
          style={[styles.removeIconWrapper, { backgroundColor: theme.surface }]}
          onPress={() => toggleSavedShift(shift)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="x" size={16} color="#FF0000" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {savedShifts.length > 0 ? (
        <FlatList
          data={savedShifts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.centerContainer}>
          <Typography variant="body" style={{ color: theme.textSecondary }}>
            No saved shifts found.
          </Typography>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
    listContent: { padding: 16, paddingTop: 10, gap: 16 },
    cardWrapper: { position: 'relative' },
    removeIconWrapper: {
      position: 'absolute',
      top: -8,
      right: -8,
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
    },
  });
