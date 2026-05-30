import { Feather, Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import CustomButton from '@/components/ui/button';
import { SuccessCard } from '@/components/ui/success-card';
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
  const queryClient = useQueryClient();

  const { mutate: acceptShift } = useAcceptShiftSwap();
  const { mutate: cancelShift } = useCancelShift();
  const markAsRead = useNotificationStore((state) => state.markAsRead);

  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  if (!shift) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load shift details.</Text>
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
              <Text style={styles.title}>{title}</Text>
              <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
                <Text style={[styles.statusText, { color: statusConfig.color }]}>
                  {statusConfig.text}
                </Text>
              </View>
            </View>

            <View style={styles.payContainer}>
              <Text style={styles.payAmount}>{payAmount}</Text>
              <Text style={styles.paySuffix}>{paySuffix}</Text>
            </View>
          </View>

          {/* Employer Info */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Employer</Text>
            <View style={styles.employerRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{employerName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.employerInfo}>
                <View style={styles.employerNameRow}>
                  <Text style={styles.employerName}>{employerName}</Text>
                  {employer?.is_verified && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#10B981"
                      style={styles.verifiedIcon}
                    />
                  )}
                </View>
                {location && <Text style={styles.addressText}>{location}</Text>}
              </View>
            </View>
          </View>

          {/* Shift Details Info */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Shift Details</Text>
            <View style={styles.detailRow}>
              <Feather name="calendar" size={20} color="#4B5563" />
              <Text style={styles.detailText}>{displayDate}</Text>
            </View>
            <View style={styles.detailRow}>
              <Feather name="clock" size={20} color="#4B5563" />
              <Text style={styles.detailText}>{displayTime}</Text>
            </View>
            {distance && (
              <View style={styles.detailRow}>
                <Feather name="map" size={20} color="#4B5563" />
                <Text style={styles.detailText}>{distance} Away</Text>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#6B7280' },
  scrollContent: { padding: 20, paddingBottom: 120 },

  headerBlock: { marginBottom: 24 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#111827', flex: 1, marginRight: 10 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  payContainer: { flexDirection: 'row', alignItems: 'baseline' },
  payAmount: { fontSize: 28, fontWeight: '800', color: '#059669' },
  paySuffix: { fontSize: 16, color: '#4B5563', fontWeight: '500', marginLeft: 4 },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },

  employerRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#FFF', fontSize: 24, fontWeight: '700' },
  employerInfo: { flex: 1, marginLeft: 16 },
  employerNameRow: { flexDirection: 'row', alignItems: 'center' },
  employerName: { fontSize: 18, fontWeight: '600', color: '#111827' },
  verifiedIcon: { marginLeft: 6 },
  addressText: { fontSize: 14, color: '#6B7280', marginTop: 4, lineHeight: 20 },

  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  detailText: { fontSize: 16, color: '#374151', marginLeft: 12, fontWeight: '500' },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30, // For safe area
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  logicButtons: { flexDirection: 'row', alignItems: 'center' },
});
