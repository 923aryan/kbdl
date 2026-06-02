import { Feather, Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';

// Import your custom UI components and theme
import CustomButton from '@/components/ui/button'; // Adjust path
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { Typography } from '@/components/ui/typography';
import { ShiftStatus } from '@/constants/constants';
import { Colors } from '@/constants/theme';
import { markNotificationRead } from '@/features/notifications/api';
import { useNotificationStore } from '@/features/notifications/store/notification-store';
import { useAcceptShiftSwap, useCancelShift } from '@/features/shift-swap/api';
import { useShiftSwapStore } from '@/features/shift-swap/hooks/use-shift-swap';
import { Shift } from '@repo/db';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { SuccessCard } from './success-card';

type ShiftCardShift = Pick<
  Shift,
  | 'id'
  | 'shift_date'
  | 'original_employee_id'
  | 'replacement_employee_id'
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
  const styles = createStyles(theme);
  console.log('button title ', buttonTitle);
  const queryClient = useQueryClient();
  const { mutate: acceptShift } = useAcceptShiftSwap();
  const { mutate: cancelShift, isPending: isCancelling } = useCancelShift();
  const removeShift = useShiftSwapStore((state) => state.removeShift);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Shift accepted successfully!');
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);

  const toggleSavedShift = useShiftSwapStore((state) => state.toggleSavedShift);
  const savedShifts = useShiftSwapStore((state) => state.savedShifts);

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
  const employerName = employer?.company_name || 'Unknown Employer';
  const location = employer?.company_address;
  const displayDate = formatDate(shift_date);
  const displayTime = `${formatTime(shift_start)} - ${formatTime(shift_end)}`;

  // UI specifically asks for ₹ and /shift or /hr
  const payAmount = `₹${shift_pay}`;
  const paySuffix = payType === 'HOURLY' ? '/hr' : '/shift';

  // Helper to get Status Tag styling and text
  const getStatusConfig = (shiftStatus: ShiftStatus | string) => {
    switch (shiftStatus) {
      case ShiftStatus.pending:
      case 'pending':
        return { text: 'Waiting Approval', bg: '#FEF3C7', color: '#D97706' };
      case ShiftStatus.open:
        return { text: 'Open', bg: '#E5EFFF', color: '#0658C2' };
      case ShiftStatus.matched:
        return { text: 'Upcoming', bg: '#FFF0E3', color: '#F97316' };
      case ShiftStatus.approved:
        return { text: 'Approved', bg: '#DCFCE7', color: '#059669' };
      case ShiftStatus.completed:
        return { text: 'Completed', bg: '#E6FBEB', color: '#22C55E' };
      case ShiftStatus.cancelled:
        return { text: 'CANCELLED', bg: '#FFE5E5', color: '#EF4444' };
      default:
        return { text: String(shiftStatus), bg: theme.surface, color: theme.text };
    }
  };

  const isSaved = savedShifts.some((s) => s.id === shift.id);

  useEffect(() => {
    console.log('now its: ', isSuccessModalVisible);
  }, [isSuccessModalVisible]);

  const onAcceptPress = () => {
    acceptShift(
      { shift_id: shift.id },
      {
        onSuccess: (data: any) => {
          console.log('Shift accepted successfully!', data);
          setSuccessMessage(data?.message || 'Shift accepted successfully!');
          setIsSuccessModalVisible(true);
        },
        onError: (error) => {
          console.error('Failed to accept the shift:', error);
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
      // Condition B: If notificationId is NOT present, show confirmation modal
      setIsCancelModalVisible(true);
    }
  };

  const handleConfirmCancel = () => {
    cancelShift(
      { shift_id: shift.id },
      {
        onSuccess: (data) => {
          setIsCancelModalVisible(false);
          console.log('Shift cancelled successfully!', data);
          Toast.show({
            type: 'success',
            text1: 'Shift cancelled successfully!',
          });
          queryClient.invalidateQueries({ queryKey: ['employee-open-shifts'] });
          queryClient.invalidateQueries({ queryKey: ['employee-shifts'] });
        },
        onError: (error) => {
          setIsCancelModalVisible(false);
          console.error('Failed to cancel the shift:', error);
          Toast.show({
            type: 'error',
            text1: error.message,
          });
        },
      },
    );
  };

  const statusConfig = getStatusConfig(status);

  const showPrimaryButton =
    status !== ShiftStatus.matched &&
    status !== ShiftStatus.approved &&
    status !== ShiftStatus.pending;

  const handleCardPress = () => {
    router.push({
      pathname: '/shift-swap/[id]',
      params: {
        id: shift.id,
        // Stringify the object to pass via URL params
        shiftData: JSON.stringify(shift),
        distance: distance || '',
        buttonTitle: buttonTitle || '',
      },
    });
  };

  return (
    <TouchableOpacity style={styles.cardContainer} activeOpacity={0.9} onPress={handleCardPress}>
      {/* Top Section */}
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Typography variant="h3" style={styles.avatarText}>
            {employerName.charAt(0).toUpperCase()}
          </Typography>
        </View>

        <View style={styles.titleContainer}>
          <Typography variant="body" style={styles.title}>
            {title ? title.charAt(0).toUpperCase() + title.slice(1).toLowerCase() : ''}
          </Typography>
          <View style={styles.employerRow}>
            <Typography variant="caption" style={styles.employerText}>
              {employerName}
            </Typography>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color="#10B981"
              style={styles.verifiedIcon}
            />
          </View>
        </View>

        <View style={styles.rightHeader}>
          <View style={styles.payPill}>
            <Typography variant="bodySmall" style={styles.payAmount}>
              {payAmount}
            </Typography>
            <Typography variant="bodySmall" style={styles.paySuffix}>
              {paySuffix}
            </Typography>
          </View>
          <Typography variant="caption" style={styles.statusText}>
            {statusConfig.text}
          </Typography>
        </View>
      </View>

      {/* Dotted Divider */}
      <View style={styles.dashedDivider} />

      <View style={styles.bottomSection}>
        <View style={styles.detailsAndBookmarkRow}>
          <View style={styles.infoCol}>
            {/* Location Row */}
            {location && (
              <View style={styles.infoRow}>
                <Feather name="map-pin" size={14} color={theme.icon} />
                <Typography variant="bodySmall" style={styles.infoText} numberOfLines={1}>
                  {location}
                </Typography>
                {distance && (
                  <View style={styles.distanceContainer}>
                    <Typography variant="bodySmall" style={styles.separator}>
                      |
                    </Typography>
                    <View style={styles.distancePill}>
                      <Typography variant="bodySmall" style={styles.distanceText}>
                        {distance}
                      </Typography>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Time Row */}
            <View style={styles.infoRow}>
              <Feather name="clock" size={14} color={theme.icon} />
              <Typography variant="bodySmall" style={styles.infoText}>
                {displayTime}
              </Typography>
            </View>

            {/* Date Row */}
            <View style={[styles.infoRow, { marginBottom: 0 }]}>
              <Feather name="calendar" size={14} color={theme.icon} />
              <Typography variant="bodySmall" style={styles.infoText}>
                {displayDate}
              </Typography>
            </View>
          </View>

          {/* Bookmark UI Element is now a sibling to infoCol for alignment */}
          {buttonTitle && (
            <TouchableOpacity
              style={styles.bookmarkBtn}
              onPress={(e) => {
                e.stopPropagation();
                toggleSavedShift(shift);
              }}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={theme.primary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons Section */}
        {buttonTitle && (
          <View style={styles.actionContainer}>
            {/* Preserved Business Logic Buttons */}
            <View style={styles.logicButtons}>
              {(buttonTitle === 'Notification' || shift?.replacement_employee_id) && (
                <View style={{ flex: 1, marginRight: showPrimaryButton ? 8 : 0 }}>
                  <CustomButton
                    title={
                      !shift?.replacement_employee_id
                        ? 'Remove'
                        : status === ShiftStatus.pending
                          ? 'Cancel Request'
                          : status === ShiftStatus.approved || status === ShiftStatus.matched
                            ? 'Cancel'
                            : 'Reject Request'
                    }
                    variant="destructive"
                    size="small"
                    onPress={onCancelPress}
                  />
                </View>
              )}
              {showPrimaryButton && (
                <View style={{ flex: 1 }}>
                  <CustomButton
                    title={
                      buttonTitle === 'Apply' || !shift.replacement_employee_id
                        ? 'Apply'
                        : 'Approve Request'
                    }
                    variant="primary"
                    size="small"
                    onPress={onAcceptPress}
                  />
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Pending Status Notice for Employee */}
      {status === ShiftStatus.pending && (
        <View style={styles.pendingNotice}>
          <Ionicons name="time-outline" size={16} color="#D97706" style={{ marginRight: 6 }} />
          <Typography variant="caption" style={{ color: '#D97706', flex: 1 }}>
            Waiting for approval from employer
          </Typography>
        </View>
      )}

      <SuccessCard
        visible={isSuccessModalVisible}
        message={successMessage}
        onClose={async () => {
          setIsSuccessModalVisible(false);
          setSuccessMessage('Shift accepted successfully!');
          await queryClient.invalidateQueries({
            queryKey: ['employee-open-shifts'],
          });

          await queryClient.invalidateQueries({
            queryKey: ['extra-shifts'],
          });

          await queryClient.invalidateQueries({
            queryKey: ['employee-latest-shifts'],
          });

          await queryClient.invalidateQueries({
            queryKey: ['employee-best-matches-shifts'],
          });
        }}
      />

      <ConfirmationModal
        visible={isCancelModalVisible}
        title="Cancel Shift Request"
        message="Are you sure you want to cancel this shift request? This action cannot be undone."
        confirmText="Yes, Cancel"
        cancelText="No, Keep It"
        confirmVariant="destructive"
        loading={isCancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setIsCancelModalVisible(false)}
      />
    </TouchableOpacity>
  );
}

const createStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    cardContainer: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      // marginBottom: 16,
      // shadowColor: '#000',
      // shadowOpacity: 0.05,
      // shadowRadius: 10,
      // shadowOffset: { width: 0, height: 4 },
      // elevation: 2,
      // borderWidth: 1,
      // borderColor: theme.border,
    },

    /* Top Section Styles */
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#000',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      color: '#FFF',
    },
    titleContainer: {
      flex: 1,
      marginLeft: 12,
    },
    title: {
      color: theme.text,
    },
    employerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    employerText: {
      color: theme.textSecondary,
    },
    verifiedIcon: {
      marginLeft: 6,
    },
    rightHeader: {
      alignItems: 'flex-end',
    },
    payPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#E6FFEA',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    payAmount: {
      color: '#059669',
    },
    paySuffix: {
      color: theme.text,
    },
    statusText: {
      color: theme.text,
      marginTop: 6,
      marginRight: 4,
    },

    /* Divider Styles */
    dashedDivider: {
      borderTopWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.border,
      marginVertical: 10,
    },

    /* Bottom Section Styles */
    bottomSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      flexWrap: 'wrap', // Prevents buttons from squishing horizontally
    },
    infoCol: {
      flex: 1, // Takes up available space in the row
    },
    detailsAndBookmarkRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end', // Aligns info text block with the bottom of the taller bookmark button
      width: '100%',
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8, // Using explicit margin instead of gap for stable layout
    },
    infoText: {
      color: theme.text,
      marginLeft: 8,
    },
    distanceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    separator: {
      marginHorizontal: 8,
      color: theme.text,
    },
    distancePill: {
      backgroundColor: '#FFF7ED',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    distanceText: {
      color: '#F97316',
      fontWeight: '600',
    },

    /* Action Buttons Styles */
    actionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8, // Gives space if the buttons wrap below the info text
      width: '100%',
    },
    bookmarkBtn: {
      paddingRight: 10,
      paddingBottom: 5,
      // The bookmark button is now outside the main info column flow.
      // Its height no longer stretches the vertical spacing of the info text.
      marginLeft: 12, // Add some space between info text and the button
    },
    logicButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    pendingNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FEF3C7',
      padding: 10,
      borderRadius: 8,
      marginTop: 12,
      width: '100%',
    },
  });
