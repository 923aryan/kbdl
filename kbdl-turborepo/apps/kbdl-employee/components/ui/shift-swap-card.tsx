import { useColorScheme } from '@/hooks/use-color-scheme';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

// Import your custom UI components and theme
import CustomButton from '@/components/ui/button'; // Adjust path
import { Typography } from '@/components/ui/typography';
import { ShiftApplicationStatus, ShiftApplicationType, ShiftStatus } from '@/constants/constants';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/hooks/useAuth';
import {
  useAcceptShiftSwap,
  useApplyForPublicShift,
  useWithdrawShiftApplication,
} from '@/features/shift-swap/api';
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
  | 'request_accepted'
  | 'status'
> & {
  notificationId?: string | null;

  employer: {
    company_name: string;
    company_address: string | null;
  };

  shiftApplication?: {
    id: string;
    type: ShiftApplicationType;
    status: ShiftApplicationStatus;
  } | null;
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
  const { mutate: applyForShift } = useApplyForPublicShift();
  const { mutate: withdrawShift, isPending: isWithdrawing } = useWithdrawShiftApplication();
  const removeShift = useShiftSwapStore((state) => state.removeShift);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Shift accepted successfully!');
  const authStatus = useAuthStore((state) => state.status);

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
    shiftApplication,
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
      case ShiftStatus.open:
        return { text: 'Open', bg: '#E5EFFF', color: '#0658C2' };
      case ShiftStatus.approved:
        return { text: 'Approved', bg: '#DCFCE7', color: '#059669' };
      case ShiftStatus.completed:
        return { text: 'Completed', bg: '#E6FBEB', color: '#22C55E' };
      case ShiftStatus.cancelled:
        return { text: 'Cancelled', bg: '#FFE5E5', color: '#EF4444' };
      default:
        return { text: String(shiftStatus), bg: theme.surface, color: theme.text };
    }
  };

  const isSaved = savedShifts.some((s) => s.id === shift.id);

  useEffect(() => {
    console.log('now its: ', isSuccessModalVisible);
  }, [isSuccessModalVisible]);

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

  const onAcceptPress = () => {
    if (authStatus !== 'authenticated') {
      handleCardPress();
      return;
    }

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

  const onApplyPress = () => {
    console.log('apply - id:  ', shift.id);
    if (authStatus !== 'authenticated') {
      handleCardPress();
      return;
    }

    applyForShift(
      { shift_id: shift.id },
      {
        onSuccess: (data: any) => {
          console.log('Applied to shift successfully!', data);
          setSuccessMessage(data?.message || 'Applied to shift successfully!');
          setIsSuccessModalVisible(true);
        },
        onError: (error: any) => {
          console.error('Failed to apply to the shift:', error);
          Toast.show({
            type: 'error',
            text1: error?.message || 'Failed to apply to shift',
          });
        },
      },
    );
  };

  const onWithdrawPress = () => {
    if (authStatus !== 'authenticated') {
      handleCardPress();
      return;
    }

    withdrawShift(
      { shift_application_id: shift.id },
      {
        onSuccess: (data: any) => {
          console.log('Shift application withdrawn successfully!', data);
          Toast.show({
            type: 'success',
            text1: 'Application withdrawn successfully!',
          });
          queryClient.invalidateQueries({ queryKey: ['employee-open-shifts'] });
          queryClient.invalidateQueries({ queryKey: ['extra-shifts'] });
          queryClient.invalidateQueries({ queryKey: ['employee-shifts'] });
        },
        onError: (error: any) => {
          console.error('Failed to withdraw application:', error);
          Toast.show({
            type: 'error',
            text1: error?.message || 'Failed to withdraw application',
          });
        },
      },
    );
  };

  const statusConfig = getStatusConfig(status);

  const getPrimaryAction = () => {
    if (shiftApplication) {
      // When there is an application
      if (
        shiftApplication.type === ShiftApplicationType.invited &&
        shiftApplication.status === ShiftApplicationStatus.pending &&
        !shift.request_accepted
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
      // When there is no application, show Apply if the shift is open
      if (shift.status === ShiftStatus.open) {
        return { label: 'Apply', onPress: onApplyPress, disabled: false };
      }
    }

    return null;
  };

  const getSecondaryAction = () => {
    if (shiftApplication?.type === ShiftApplicationType.invited) {
      if (shiftApplication.status === ShiftApplicationStatus.pending && !shift.request_accepted) {
        return { label: 'Reject Request', onPress: onWithdrawPress, disabled: isWithdrawing };
      } else if (
        shiftApplication.status === ShiftApplicationStatus.accepted ||
        shift.request_accepted
      ) {
        return { label: 'Withdraw', onPress: onWithdrawPress, disabled: isWithdrawing };
      }
    }

    // can withdraw the shift if its ShiftApplicationType is applied
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

  const getApplicationLabel = () => {
    return null;
  };

  const primaryAction = getPrimaryAction();
  const secondaryAction = getSecondaryAction();
  const appLabel = getApplicationLabel();

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
          <View style={styles.badgesContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Typography
                variant="caption"
                style={[styles.statusText, { color: statusConfig.color }]}
              >
                {statusConfig.text}
              </Typography>
            </View>
            {appLabel && (
              <View
                style={[
                  styles.statusBadge,
                  styles.appLabelBadge,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Typography
                  variant="caption"
                  style={[styles.statusText, { color: theme.textSecondary }]}
                >
                  {appLabel}
                </Typography>
              </View>
            )}
          </View>
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
            <View style={[styles.infoRow, !distance && { marginBottom: 0 }]}>
              <Feather name="calendar" size={14} color={theme.icon} />
              <Typography variant="bodySmall" style={styles.infoText}>
                {displayDate}
              </Typography>
            </View>

            {/* Distance Row */}
            {distance && (
              <View style={[styles.infoRow, { marginBottom: 0 }]}>
                <Feather name="map" size={14} color={theme.icon} />
                <Typography variant="bodySmall" style={styles.infoText}>
                  {distance}
                </Typography>
              </View>
            )}
          </View>

          {/* Bookmark UI Element is now a sibling to infoCol for alignment */}
          <TouchableOpacity
            style={styles.bookmarkBtn}
            onPress={(e) => {
              e.stopPropagation();
              if (authStatus !== 'authenticated') {
                handleCardPress();
                return;
              }
              toggleSavedShift(shift);
            }}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={theme.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Action Buttons Section */}
        {(primaryAction || secondaryAction) && (
          <View style={styles.actionContainer}>
            {/* Preserved Business Logic Buttons */}
            <View style={styles.logicButtons}>
              {secondaryAction && (
                <View style={{ flex: 1, marginRight: primaryAction ? 8 : 0 }}>
                  <CustomButton
                    title={secondaryAction.label}
                    variant="destructive"
                    size="small"
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
                    size="small"
                    onPress={primaryAction.onPress}
                    disabled={primaryAction.disabled}
                  />
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      <SuccessCard
        visible={isSuccessModalVisible}
        message={successMessage}
        onClose={async () => {
          setIsSuccessModalVisible(false);
          setSuccessMessage('Shift accepted successfully!');
          await queryClient.invalidateQueries({
            queryKey: ['employee-shifts'],
          });

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
    statusBadge: {
      marginTop: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    statusText: {
      fontWeight: '600',
    },
    badgesContainer: {
      alignItems: 'flex-end',
    },
    appLabelBadge: {
      borderWidth: 1,
      marginTop: 4,
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
