import { Feather, Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import CustomButton from '@/components/ui/button';
import { SuccessCard } from '@/components/ui/success-card';
import { Typography } from '@/components/ui/typography';
import { ShiftStatus } from '@/constants/constants';
import { Colors } from '@/constants/theme';
import { markNotificationRead } from '@/features/notifications/api';
import { useNotificationStore } from '@/features/notifications/store/notification-store';
import { useAcceptShiftSwap, useCancelShift } from '@/features/shift-swap/api';

const formatDate = (dateInput: string | Date) => {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatTime = (dateInput: string | Date) => {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

export default function ShiftDetailsScreen({ shift, distance, buttonTitle }: any) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const styles = createStyles(theme);
  const queryClient = useQueryClient();

  const { mutate: acceptShift } = useAcceptShiftSwap();
  const { mutate: cancelShift } = useCancelShift();
  const markAsRead = useNotificationStore((state) => state.markAsRead);

  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  if (!shift) {
    return (
      <View style={styles.errorContainer}>
        <Typography variant="body" style={styles.errorText}>
          Unable to load shift details.
        </Typography>
      </View>
    );
  }

  const {
    skill_required,
    shift_pay,
    payType,
    shift_date,
    shift_start,
    shift_end,
    status,
    employer,
  } = shift;

  const title = skill_required || 'Unknown Skill';
  const employerName = employer?.company_name || 'Unknown Employer';
  const location = employer?.company_address;
  const displayDate = formatDate(shift_date);
  const displayTime = `${formatTime(shift_start)} - ${formatTime(shift_end)}`;

  const payAmount = `₹${shift_pay}`;
  const paySuffix = payType === 'HOURLY' ? '/hr' : '/shift';

  const getStatusConfig = (shiftStatus: ShiftStatus | string) => {
    switch (shiftStatus) {
      case ShiftStatus.open:
        return { text: 'Open', bg: '#E5EFFF', color: '#0658C2' };
      case ShiftStatus.matched:
      case ShiftStatus.approved:
        return { text: 'Upcoming', bg: '#FFF0E3', color: '#F97316' };
      case ShiftStatus.completed:
        return { text: 'Completed', bg: '#E6FBEB', color: '#22C55E' };
      case ShiftStatus.cancelled:
        return { text: 'CANCELLED', bg: '#FFE5E5', color: '#EF4444' };
      default:
        return { text: String(shiftStatus), bg: theme.surface, color: theme.text };
    }
  };

  const statusConfig = getStatusConfig(status);

  const onAcceptPress = () => {
    acceptShift(
      { shift_id: shift.id },
      {
        onSuccess: () => {
          setIsSuccessModalVisible(true);
        },
        onError: (error) => {
          console.error('Failed to accept the shift:', error);
          Toast.show({ type: 'error', text1: 'Failed to accept the shift' });
        },
      },
    );
  };

  const onCancelPress = async () => {
    if (shift?.notificationId) {
      try {
        await markNotificationRead(shift.notificationId);
        markAsRead(shift.notificationId);
        queryClient.invalidateQueries({ queryKey: ['employee-open-shifts'] });
        router.back();
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    } else {
      cancelShift(
        { shift_id: shift.id },
        {
          onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Shift cancelled successfully!' });
            queryClient.invalidateQueries({ queryKey: ['employee-open-shifts'] });
            queryClient.invalidateQueries({ queryKey: ['extra-shifts'] });
            queryClient.invalidateQueries({ queryKey: ['employee-latest-shifts'] });
            queryClient.invalidateQueries({ queryKey: ['employee-best-matches-shifts'] });
            router.back();
          },
          onError: (error) => {
            Toast.show({ type: 'error', text1: error.message });
          },
        },
      );
    }
  };
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}
    >
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header Block */}
          <View style={styles.headerBlock}>
            <View style={styles.titleRow}>
              <Typography variant="h2" style={[styles.title, { color: theme.text }]}>
                {title}
              </Typography>
              <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
                <Typography
                  variant="caption"
                  style={[styles.statusText, { color: statusConfig.color }]}
                >
                  {statusConfig.text}
                </Typography>
              </View>
            </View>

            <View style={styles.payContainer}>
              <Typography variant="h2" style={styles.payAmount}>
                {payAmount}
              </Typography>
              <Typography variant="body" style={[styles.paySuffix, { color: theme.textSecondary }]}>
                {paySuffix}
              </Typography>
            </View>
          </View>

          {/* Employer Info */}
          <View style={styles.sectionCard}>
            <Typography variant="h3" style={[styles.sectionTitle, { color: theme.text }]}>
              Employer
            </Typography>
            <View style={styles.employerRow}>
              <View style={[styles.avatar, { backgroundColor: theme.primary + '15' }]}>
                <Typography variant="h2" style={[styles.avatarText, { color: theme.primary }]}>
                  {employerName.charAt(0).toUpperCase()}
                </Typography>
              </View>
              <View style={styles.employerInfo}>
                <View style={styles.employerNameRow}>
                  <Typography variant="body" style={[styles.employerName, { color: theme.text }]}>
                    {employerName}
                  </Typography>
                  {employer?.is_verified && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#10B981"
                      style={styles.verifiedIcon}
                    />
                  )}
                </View>
                {location && (
                  <Typography
                    variant="caption"
                    style={[styles.addressText, { color: theme.textSecondary }]}
                  >
                    {location}
                  </Typography>
                )}
              </View>
            </View>
          </View>

          {/* Shift Details Info */}
          <View style={styles.sectionCard}>
            <Typography variant="h3" style={[styles.sectionTitle, { color: theme.text }]}>
              Shift Details
            </Typography>
            <View style={styles.detailRow}>
              <View style={[styles.iconBox, { backgroundColor: theme.primary + '10' }]}>
                <Feather name="calendar" size={20} color={theme.primary} />
              </View>
              <Typography
                variant="body"
                style={[styles.detailText, { color: theme.textSecondary }]}
              >
                {displayDate}
              </Typography>
            </View>
            <View style={styles.detailRow}>
              <View style={[styles.iconBox, { backgroundColor: theme.primary + '10' }]}>
                <Feather name="clock" size={20} color={theme.primary} />
              </View>
              <Typography
                variant="body"
                style={[styles.detailText, { color: theme.textSecondary }]}
              >
                {displayTime}
              </Typography>
            </View>
            {distance && (
              <View style={[styles.detailRow, styles.lastDetailRow]}>
                <View style={[styles.iconBox, { backgroundColor: theme.primary + '10' }]}>
                  <Feather name="map" size={20} color={theme.primary} />
                </View>
                <Typography
                  variant="body"
                  style={[styles.detailText, { color: theme.textSecondary }]}
                >
                  {distance} Away
                </Typography>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Fixed Footer Logic Buttons */}
        {buttonTitle && (
          <View style={styles.footer}>
            <View style={styles.logicButtons}>
              {(buttonTitle === 'Notification' || shift?.replacement_employee_id) && (
                <View style={{ flex: 1, marginRight: 12 }}>
                  <CustomButton
                    title={!shift?.replacement_employee_id ? 'Remove' : 'Reject Request'}
                    variant="destructive"
                    onPress={onCancelPress}
                  />
                </View>
              )}
              {status !== ShiftStatus.matched && status !== ShiftStatus.approved && (
                <View style={{ flex: 1 }}>
                  <CustomButton
                    title={
                      buttonTitle === 'Apply' || !shift?.replacement_employee_id
                        ? 'Apply for Shift'
                        : 'Approve Request'
                    }
                    variant="primary"
                    onPress={onAcceptPress}
                  />
                </View>
              )}
            </View>
          </View>
        )}

        <SuccessCard
          visible={isSuccessModalVisible}
          message="Shift accepted successfully!"
          onClose={async () => {
            setIsSuccessModalVisible(false);
            await queryClient.invalidateQueries({ queryKey: ['employee-open-shifts'] });
            await queryClient.invalidateQueries({ queryKey: ['extra-shifts'] });
            await queryClient.invalidateQueries({ queryKey: ['employee-latest-shifts'] });
            await queryClient.invalidateQueries({ queryKey: ['employee-best-matches-shifts'] });
            router.back();
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    container: { flex: 1, backgroundColor: theme.background },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: theme.textSecondary },
    scrollContent: { padding: 20, paddingBottom: 120 },

    headerBlock: { marginBottom: 24, marginTop: 10 },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    title: { flex: 1, marginRight: 10 },
    statusPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      alignSelf: 'flex-start',
    },
    statusText: { fontWeight: '700', textTransform: 'uppercase' },
    payContainer: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
    payAmount: { color: '#059669' }, // Keeping the accent green color for visibility
    paySuffix: { marginLeft: 4 },

    sectionCard: {
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
      borderWidth: 1,
      borderColor: theme.border,
    },
    sectionTitle: { marginBottom: 16 },

    employerRow: { flexDirection: 'row', alignItems: 'center' },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: { fontWeight: '700' },
    employerInfo: { flex: 1, marginLeft: 16 },
    employerNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    employerName: { fontWeight: '600' },
    verifiedIcon: { marginLeft: 6 },
    addressText: { marginTop: 2, lineHeight: 20 },

    detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    lastDetailRow: { marginBottom: 0 },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    detailText: { flex: 1, fontWeight: '500' },

    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.card,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 30, // For safe area padding
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    logicButtons: { flexDirection: 'row', alignItems: 'center' },
  });
