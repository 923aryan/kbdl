import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ShiftCard from '@/components/ui/shift-swap-card';
import { Typography } from '@/components/ui/typography';
import { Colors } from '@/constants/theme';
import { useShiftSwapStore } from '@/features/shift-swap/hooks/use-shift-swap';

export default function SavedShiftsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();

  const savedShifts = useShiftSwapStore((state) => state.savedShifts);

  const renderItem = ({ item: shift }: { item: any }) => {
    return <ShiftCard shift={shift} buttonTitle="Apply" />;
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
  });
