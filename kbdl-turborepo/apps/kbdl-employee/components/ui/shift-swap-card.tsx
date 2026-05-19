import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';

// Import your custom UI components and theme
import CustomButton from '@/components/ui/button'; // Adjust path
import { Typography } from '@/components/ui/typography'; // Adjust path
import { ShiftStatus } from '@/constants/constants';
import { Colors } from '@/constants/theme';
import { OpenShift } from '@/features/shift-swap/types/shift-swap-types';
interface ShiftCardProps {
  shift: OpenShift;
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

export default function ShiftCard({
  shift,
  distance,
  buttonTitle,
}: ShiftCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  // console.log("inside card: ", shift)
  console.log("button title ", buttonTitle)
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
      case 'open':
        return { text: 'Open', bg: '#E5EFFF', color: '#0658C2' };
      case ShiftStatus.matched:
      case 'matched':
      case 'approved': // Grouping approved with matched as 'Upcoming'
        return { text: 'Upcoming', bg: '#FFF0E3', color: '#F97316' };
      case ShiftStatus.completed:
      case 'completed':
        return { text: 'Completed', bg: '#E6FBEB', color: '#22C55E' };
      case ShiftStatus.cancelled:
      case 'cancelled':
        return { text: 'CANCELLED', bg: '#FFE5E5', color: '#EF4444' };
      default:
        return { text: String(shiftStatus), bg: theme.surface, color: theme.text };
    }
  };

  const onButtonPress = () => {

  }

  const onCancelPress = () => {

  }

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
            <CustomButton
              title="Cancel"
              variant="outline"
              size="small"
              onPress={onCancelPress}
              containerStyle={{ flex: 1 }}
            />
            <CustomButton
              title="Approve Request"
              variant="primary"
              size="small"
              onPress={onButtonPress}
              containerStyle={{ flex: 1 }}
            />

          </View>
        )}
      </View>
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
    fontWeight: "800"
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