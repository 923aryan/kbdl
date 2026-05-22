import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';

// Import your custom UI components and theme
import CustomButton from '@/components/ui/button'; // Adjust path
import { Typography } from '@/components/ui/typography'; // Adjust path
import { ShiftStatus } from '@/constants/constants';
import { Colors } from '@/constants/theme';
import { markNotificationRead } from '@/features/notifications/api';
import { useNotificationStore } from '@/features/notifications/store/notification-store';
import { useAcceptShiftSwap, useCancelShift } from '@/features/shift-swap/api';
import { useShiftSwapStore } from '@/features/shift-swap/hooks/use-shift-swap';
import { Shift } from '@repo/db';
import Toast from 'react-native-toast-message';
import { SuccessCard } from './success-card';

type ShiftCardShift = Pick<
  Shift,
  | 'id'
  | 'shift_date'
  | 'shift_start'
  | 'shift_end'
  | 'skill_required'
  | 'shift_pay'
  | 'payType'
  | 'status'
> & {
  notificationId?: string | null;

  employer: {
    company_name: string;
    company_address: string | null;
  };
};

interface ShiftCardProps {
  shift: ShiftCardShift;
  distance?: string;
  buttonTitle?: string;
}
// Helper functions for Date & Time Formatting
const formatDate = (dateInput: string | Date) => {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  // Returns format like "20 May 2026"
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatTime = (dateInput: string | Date) => {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  // Returns format like "09:00 AM"
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

export default function ShiftCard({ shift, distance, buttonTitle }: ShiftCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  // console.log("inside card: ", shift)
  console.log('button title ', buttonTitle);
  const queryClient = useQueryClient();
  const { mutate: acceptShift } = useAcceptShiftSwap();
  const { mutate: cancelShift } = useCancelShift();
  const removeShift = useShiftSwapStore((state) => state.removeShift);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  // Destructure the needed fields from the shift object
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

  // Format data for display
  const title = skill_required || 'Unknown Skill';
  const payAmount = `Rs. ${shift_pay}`;
  const paySuffix = payType === 'HOURLY' ? ' / Hour' : ' / Shift';
  const employerName = employer?.company_name || 'Unknown Employer';
  const location = employer?.company_address;
  const displayDate = formatDate(shift_date);
  const displayTime = `${formatTime(shift_start)} - ${formatTime(shift_end)}`;

  // Helper to get Status Tag styling and text
  const getStatusConfig = (shiftStatus: ShiftStatus | string) => {
    switch (shiftStatus) {
      case ShiftStatus.open:
        return { text: 'Open', bg: '#E5EFFF', color: '#0658C2' };
      case ShiftStatus.matched:
      case ShiftStatus.approved: // Grouping approved with matched as 'Upcoming'
        return { text: 'Upcoming', bg: '#FFF0E3', color: '#F97316' };
      case ShiftStatus.completed:
        return { text: 'Completed', bg: '#E6FBEB', color: '#22C55E' };
      case ShiftStatus.cancelled:
        return { text: 'CANCELLED', bg: '#FFE5E5', color: '#EF4444' };
      default:
        return { text: String(shiftStatus), bg: theme.surface, color: theme.text };
    }
  };
  useEffect(() => {
    console.log('now its: ', isSuccessModalVisible);
  }, [isSuccessModalVisible]);
  const onAcceptPress = () => {
    acceptShift(
      { shift_id: shift.id },
      {
        onSuccess: (data) => {
          console.log('Shift accepted successfully!', data);
          setIsSuccessModalVisible(true);
        },
        onError: (error) => {
          console.error('Failed to accept the shift:', error);
          // TODO: Add your error UI logic here (e.g., show an error toast)
        },
      },
    );
  };

  const onCancelPress = async () => {
    if (shift?.notificationId) {
      // Condition A: If notificationId is present, mark the notification as read
      try {
        await markNotificationRead(shift.notificationId);
        console.log('Notification marked as read successfully');
        markAsRead(shift.notificationId);
        queryClient.invalidateQueries({ queryKey: ['employee-open-shifts'] });
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    } else {
      // Condition B: If notificationId is NOT present, cancel the shift itself
      cancelShift(
        { shift_id: shift.id },
        {
          onSuccess: (data) => {
            console.log('Shift cancelled successfully!', data);
            Toast.show({
              type: 'success',
              text1: 'Shift cancelled successfully!',
            });
            queryClient.invalidateQueries({ queryKey: ['employee-open-shifts'] });
            queryClient.invalidateQueries({ queryKey: ['employee-shifts'] });
          },
          onError: (error) => {
            console.error('Failed to cancel the shift:', error);
            Toast.show({
              type: 'error',
              text1: error.message,
            });
          },
        },
      );
    }
  };
  const statusConfig = getStatusConfig(status);

  return (
    <View
      style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border }]}
    >
      {/* Header Section (Light Blue background) */}
      <View style={[styles.header, { backgroundColor: theme.primary + '15' }]}>
        <View style={styles.headerLeft}>
          <Feather name="tool" size={20} color={theme.text} />
          <Typography variant="button" style={[styles.headerTitle, { color: theme.text }]}>
            {title.toUpperCase()}
          </Typography>
        </View>
        <View style={styles.headerRight}>
          <Typography variant="caption" style={{ color: theme.text, fontWeight: '800' }}>
            {payAmount}
          </Typography>
          <Typography variant="caption" style={{ color: theme.text, fontWeight: 800 }}>
            {paySuffix}
          </Typography>
        </View>
      </View>

      {/* Body Section */}
      <View style={styles.body}>
        {/* Employer Row */}
        <View style={styles.infoRow}>
          <Feather name="calendar" size={16} color={theme.textSecondary} />
          <Typography
            variant="caption"
            style={[styles.infoText, { color: theme.text, fontWeight: '700' }]}
          >
            {employerName}
          </Typography>
        </View>

        {/* Location Row (Conditional) */}
        {location && (
          <View style={styles.infoRow}>
            <Feather name="map-pin" size={16} color={theme.textSecondary} />
            <Typography variant="caption" style={[styles.infoText, { color: theme.text }]}>
              {location}
              {distance ? ' | ' : ''}
            </Typography>
            {distance && (
              <View style={[styles.distanceTag, { backgroundColor: '#E6FBEB' }]}>
                <Typography variant="caption" style={{ color: '#22C55E', fontWeight: '600' }}>
                  {distance}
                </Typography>
              </View>
            )}
          </View>
        )}

        {/* Date Row */}
        <View style={styles.infoRow}>
          <Feather name="calendar" size={16} color={theme.textSecondary} />
          <Typography variant="caption" style={[styles.infoText, { color: theme.text }]}>
            {displayDate}
          </Typography>
        </View>

        {/* Time & Status Row */}
        <View style={[styles.infoRow, styles.timeRow]}>
          <View style={styles.timeContainer}>
            <Feather name="clock" size={16} color={theme.textSecondary} />
            <Typography variant="caption" style={[styles.infoText, { color: theme.text }]}>
              {displayTime}
            </Typography>
          </View>

          {/* Dynamic Status Tag */}
          <View style={[styles.statusTag, { backgroundColor: statusConfig.bg }]}>
            <Typography variant="caption" style={{ color: statusConfig.color, fontWeight: '800' }}>
              {statusConfig.text}
            </Typography>
          </View>
        </View>

        {/* Action Buttons (Conditional) */}
        {buttonTitle && (
          <View style={styles.buttonContainer}>
            {buttonTitle !== 'Apply' && (
              <CustomButton
                title="Cancel shift"
                variant="destructive"
                size="small"
                onPress={onCancelPress}
                containerStyle={{ flex: 1 }}
              />
            )}
            {status !== ShiftStatus.matched && status !== ShiftStatus.approved && (
              <CustomButton
                title={buttonTitle === 'Apply' ? 'Apply' : 'Approve Request'}
                variant="primary"
                size="small"
                onPress={onAcceptPress}
                containerStyle={{ flex: 1 }}
              />
            )}
          </View>
        )}
      </View>

      <SuccessCard
        visible={isSuccessModalVisible}
        message="Shift accepted successfully!"
        onClose={async () => {
          setIsSuccessModalVisible(false);

          await queryClient.invalidateQueries({
            queryKey: ['employee-open-shifts'],
          });

          await queryClient.invalidateQueries({
            queryKey: ['extra-shifts'],
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  headerTitle: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '800',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  body: {
    padding: 16,
    paddingBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingRight: 10,
  },
  infoText: {
    marginLeft: 10,
  },
  distanceTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  timeRow: {
    justifyContent: 'space-between',
    marginBottom: 0, // Removes bottom margin since it's the last text row
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  buttonContainer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
});
