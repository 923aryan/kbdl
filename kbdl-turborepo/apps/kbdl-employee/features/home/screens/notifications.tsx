import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Loader from '@/components/ui/loader';
import OnboardRequestCard from '@/components/ui/onboard-request-card';
import ShiftCard from '@/components/ui/shift-swap-card';
import { Colors } from '@/constants/theme';
import { getNotifications, markNotificationRead } from '@/features/notifications/api';
import { useGetPendingEmployments } from '@/features/operations/hooks/use-operation-hook';
import { useGetOpenShifts } from '@/features/shift-swap/api';
import { useShiftSwapStore } from '@/features/shift-swap/hooks/use-shift-swap';

export default function Notifications() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = Colors.light;
  const queryClient = useQueryClient();

  const { data, isLoading: isLoadingShifts } = useGetOpenShifts();
  const { data: pendingEmployments, isLoading: isLoadingEmployments } = useGetPendingEmployments();
  const setShifts = useShiftSwapStore((s) => s.setShifts);
  const scrollViewRef = useRef<ScrollView>(null);

  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<'shifts' | 'jobs'>(
    (params.tab as 'shifts' | 'jobs') || 'shifts',
  );

  useEffect(() => {
    if (params.tab === 'shifts' || params.tab === 'jobs') {
      setActiveTab(params.tab);
    }
  }, [params.tab]);

  useEffect(() => {
    if (data) {
      setShifts(data);
    }
  }, [data, setShifts]);

  useFocusEffect(
    useCallback(() => {
      if (data) {
        const processNotifications = async () => {
          try {
            const response = await getNotifications();
            console.log('response of was ', response);
            if (!response.data) return;

            const invitedShiftNotificationIds = data
              .filter((shift) => shift.shiftApplication?.type === 'invited')
              .map((shift) => shift.notificationId)
              .filter((id): id is string => Boolean(id));

            const idsToMark = response.data
              .filter((n) => {
                if (n.isRead) return false;
                if (n.type === 'onboard_request') return false;
                if (n.type === 'shift_swap_request') return false; // invited requests
                if (invitedShiftNotificationIds.includes(n.id)) return false;
                return true; // Any other leftover notifications will get marked as read
              })
              .map((n) => n.id);
            console.log('final marks id ', idsToMark);
            if (idsToMark.length > 0) {
              await markNotificationRead(idsToMark);
            }
          } catch (error) {
            console.error('Failed to process notifications:', error);
          }
        };

        processNotifications();
      }
    }, [data]),
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        // Invalidate when leaving the screen so Home screen and next visits get fresh data
        queryClient.invalidateQueries({ queryKey: ['employee-open-shifts'] });
      };
    }, [queryClient]),
  );

  // Bounce animation effect to indicate scrollability
  useEffect(() => {
    if (data && data.length > 1 && activeTab === 'shifts') {
      const scrollDownTimeout = setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 50, animated: true });

        const scrollUpTimeout = setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }, 400);

        return () => clearTimeout(scrollUpTimeout);
      }, 600); // 600ms delay gives the user a moment to see the screen first

      return () => clearTimeout(scrollDownTimeout);
    }
  }, [data, activeTab]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'shifts'
              ? { backgroundColor: theme.primary, borderColor: theme.primary }
              : { backgroundColor: theme.card, borderColor: theme.border },
          ]}
          onPress={() => setActiveTab('shifts')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'shifts' ? styles.activeTabText : { color: theme.textSecondary },
            ]}
          >
            Shift Swap
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'jobs'
              ? { backgroundColor: theme.primary, borderColor: theme.primary }
              : { backgroundColor: theme.card, borderColor: theme.border },
          ]}
          onPress={() => setActiveTab('jobs')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'jobs' ? styles.activeTabText : { color: theme.textSecondary },
            ]}
          >
            Job Onboard
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'shifts' && (
          <>
            {isLoadingShifts ? (
              <View style={styles.listContainer}>
                <Loader />
              </View>
            ) : data && data.length > 0 ? (
              <View style={styles.listContainer}>
                {data.map((shift) => (
                  <ShiftCard key={shift.id} shift={shift} buttonTitle="Notification" />
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No new shift swap requests
                </Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'jobs' && (
          <>
            {isLoadingEmployments ? (
              <View style={styles.listContainer}>
                <Loader />
              </View>
            ) : pendingEmployments && pendingEmployments.length > 0 ? (
              <View style={styles.listContainer}>
                {pendingEmployments.map((employment) => (
                  <OnboardRequestCard key={employment.id} employment={employment} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No new job onboard requests
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: { fontSize: 15, fontWeight: '600' },
  activeTabText: { color: '#FFFFFF' },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 110, paddingTop: 10 },
  listContainer: { paddingTop: 4, marginBottom: 20, gap: 16 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, marginTop: 12, textAlign: 'center' },
});
