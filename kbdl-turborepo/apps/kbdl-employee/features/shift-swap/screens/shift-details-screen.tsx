import { useColorScheme } from '@/hooks/use-color-scheme';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import CustomButton from '@/components/ui/button';
import { SuccessCard } from '@/components/ui/success-card';
import { Typography } from '@/components/ui/typography';
import { ShiftApplicationStatus, ShiftApplicationType, ShiftStatus } from '@/constants/constants';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/hooks/useAuth';
import {
  useAcceptShiftSwap,
  useApplyForPublicShift,
  useGetShiftDetails,
  useWithdrawShiftApplication,
} from '@/features/shift-swap/api';

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
  const { id } = useLocalSearchParams();

  const { user, status: authStatus } = useAuthStore();

  const { mutate: acceptShift } = useAcceptShiftSwap();
  const { mutate: applyForShift } = useApplyForPublicShift();
  const { mutate: withdrawShift, isPending: isWithdrawing } = useWithdrawShiftApplication();

  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Shift accepted successfully!');

  // Fetch shift details if navigating from notification where only ID is available
  const shiftId = (id as string) || shift?.id;
  const { data: fetchedShift, isLoading } = useGetShiftDetails(shiftId);
  const currentShift = fetchedShift || shift;

  if (isLoading && !currentShift) {
    return (
      <View style={styles.errorContainer}>
        <Typography variant="body" style={styles.errorText}>
          Loading shift details...
        </Typography>
      </View>
    );
  }

  if (!currentShift) {
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
  } = currentShift;

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

  const shiftApplication =
    currentShift.shiftApplication ||
    currentShift.shiftApplications?.find((app: any) => app.user_id === user?.id);

  const onAcceptPress = () => {
    if (authStatus !== 'authenticated') return;
    acceptShift(
      { shift_id: currentShift.id },
      {
        onSuccess: (data: any) => {
          setSuccessMessage(data?.message || 'Shift accepted successfully!');
          setIsSuccessModalVisible(true);
        },
        onError: (error) => {
          console.error('Failed to accept the shift:', error);
          Toast.show({ type: 'error', text1: 'Failed to accept the shift' });
        },
      },
    );
  };

  const onApplyPress = () => {
    if (authStatus !== 'authenticated') return;
    applyForShift(
      { shift_id: currentShift.id },
      {
        onSuccess: (data: any) => {
          setSuccessMessage(data?.message || 'Applied to shift successfully!');
          setIsSuccessModalVisible(true);
        },
        onError: (error: any) => {
          Toast.show({ type: 'error', text1: error?.message || 'Failed to apply to shift' });
        },
      },
    );
  };

  const onWithdrawPress = () => {
    if (authStatus !== 'authenticated') return;
    withdrawShift(
      { shift_application_id: currentShift.id },
      {
        onSuccess: (data: any) => {
          Toast.show({ type: 'success', text1: 'Application withdrawn successfully!' });
          queryClient.invalidateQueries({ queryKey: ['employee-open-shifts'] });
          queryClient.invalidateQueries({ queryKey: ['extra-shifts'] });
          queryClient.invalidateQueries({ queryKey: ['employee-shifts'] });
          router.back();
        },
        onError: (error: any) => {
          Toast.show({ type: 'error', text1: error?.message || 'Failed to withdraw application' });
        },
      },
    );
  };

  const getPrimaryAction = () => {
    if (shiftApplication) {
      if (
        shiftApplication.type === ShiftApplicationType.invited &&
        shiftApplication.status === ShiftApplicationStatus.pending &&
        !currentShift.request_accepted
      ) {
        return { label: 'Accept Request', onPress: onAcceptPress, disabled: false };
      }
      if (
        shiftApplication.type === ShiftApplicationType.applied &&
        shiftApplication.status === ShiftApplicationStatus.pending
      ) {
        return { label: 'Applied', onPress: undefined, disabled: true };
      }
      if (shiftApplication.status === ShiftApplicationStatus.accepted) {
        return { label: 'Accepted', onPress: undefined, disabled: true };
      }
      if (shiftApplication.status === ShiftApplicationStatus.rejected) {
        return { label: 'Rejected', onPress: undefined, disabled: true };
      }
    } else {
      if (currentShift.status === ShiftStatus.open) {
        return { label: 'Apply', onPress: onApplyPress, disabled: false };
      }
    }
    return null;
  };

  const getSecondaryAction = () => {
    if (shiftApplication?.type === ShiftApplicationType.invited) {
      if (
        shiftApplication.status === ShiftApplicationStatus.pending &&
        !currentShift.request_accepted
      ) {
        return { label: 'Reject Request', onPress: onWithdrawPress, disabled: isWithdrawing };
      } else if (
        shiftApplication.status === ShiftApplicationStatus.accepted ||
        currentShift.request_accepted
      ) {
        return { label: 'Withdraw', onPress: onWithdrawPress, disabled: isWithdrawing };
      }
    }

    if (shiftApplication?.type === ShiftApplicationType.applied) {
      if (
        shiftApplication.status === ShiftApplicationStatus.pending ||
        shiftApplication.status === ShiftApplicationStatus.accepted
      ) {
        return { label: 'Withdraw', onPress: onWithdrawPress, disabled: isWithdrawing };
      }
    }

    return null;
  };

  const primaryAction = getPrimaryAction();
  const secondaryAction = getSecondaryAction();

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
        {(primaryAction || secondaryAction) && (
          <View style={styles.footer}>
            <View style={styles.logicButtons}>
              {secondaryAction && (
                <View style={{ flex: 1, marginRight: primaryAction ? 12 : 0 }}>
                  <CustomButton
                    title={secondaryAction.label}
                    variant="destructive"
                    onPress={secondaryAction.onPress}
                    disabled={secondaryAction.disabled}
                  />
                </View>
              )}
              {primaryAction && (
                <View style={{ flex: 1 }}>
                  <CustomButton
                    title={primaryAction.label}
                    variant="primary"
                    onPress={primaryAction.onPress}
                    disabled={primaryAction.disabled}
                  />
                </View>
              )}
            </View>
          </View>
        )}

        <SuccessCard
          visible={isSuccessModalVisible}
          message={successMessage}
          onClose={async () => {
            setIsSuccessModalVisible(false);
            await queryClient.invalidateQueries({ queryKey: ['employee-shifts'] });
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
