import { Feather, Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, StyleSheet, View, useColorScheme } from 'react-native';

import Loader from '@/components/ui/loader';
import { Typography } from '@/components/ui/typography';
import { Colors } from '@/constants/theme';
import { useGetCreatedShiftsForEmployee } from '@/features/shift-swap/api';

// Helper functions for Date & Time Formatting
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

export default function CreatedShiftsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const styles = createStyles(theme);

  const { data: shifts, isLoading, isError } = useGetCreatedShiftsForEmployee();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'Waiting Approval', bg: '#FEF3C7', color: '#D97706' };
      case 'open':
        return { text: 'Open', bg: '#E5EFFF', color: '#0658C2' };
      case 'matched':
        return { text: 'Upcoming', bg: '#FFF0E3', color: '#F97316' };
      case 'approved':
        return { text: 'Approved', bg: '#DCFCE7', color: '#059669' };
      case 'completed':
        return { text: 'Completed', bg: '#E6FBEB', color: '#22C55E' };
      case 'cancelled':
        return { text: 'Cancelled', bg: '#FFE5E5', color: '#EF4444' };
      default:
        return { text: String(status), bg: theme.surface, color: theme.text };
    }
  };

  const renderItem = ({ item: shift }: { item: any }) => {
    const title = shift.skill_required || 'Unknown Skill';
    const employerName = shift.employer?.company_name || 'Unknown Employer';
    const location = shift.employer?.company_address;
    const displayDate = formatDate(shift.shift_date);
    const displayTime = `${formatTime(shift.shift_start)} - ${formatTime(shift.shift_end)}`;
    const payAmount = `₹${shift.shift_pay}`;
    const paySuffix = shift.payType === 'HOURLY' ? '/hr' : '/shift';
    const statusConfig = getStatusConfig(shift.status);

    return (
      <View style={styles.cardContainer}>
        {/* Top Section */}
        <View style={styles.topRow}>
          <View style={styles.avatar}>
            <Typography variant="h3" style={styles.avatarText}>
              {employerName.charAt(0).toUpperCase()}
            </Typography>
          </View>

          <View style={styles.titleContainer}>
            <Typography variant="bodySmall" style={styles.title}>
              {title}
            </Typography>
            <Typography variant="caption" style={styles.employerText}>
              {employerName}
            </Typography>
          </View>

          <View style={styles.rightHeader}>
            <View style={styles.payPill}>
              <Typography variant="bodySmall" style={styles.payAmount}>
                {payAmount}
              </Typography>
              <Typography variant="caption" style={styles.paySuffix}>
                {paySuffix}
              </Typography>
            </View>
            <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
              <Typography
                variant="caption"
                style={{ color: statusConfig.color, fontWeight: '600' }}
              >
                {statusConfig.text}
              </Typography>
            </View>
          </View>
        </View>

        {/* Dotted Divider */}
        <View style={styles.dashedDivider} />

        {/* Details Section */}
        <View style={styles.infoCol}>
          {location && (
            <View style={styles.infoRow}>
              <Feather name="map-pin" size={14} color={theme.icon} />
              <Typography variant="caption" style={styles.infoText} numberOfLines={1}>
                {location}
              </Typography>
            </View>
          )}
          <View style={styles.infoRow}>
            <Feather name="clock" size={14} color={theme.icon} />
            <Typography variant="caption" style={styles.infoText}>
              {displayTime}
            </Typography>
          </View>
          <View style={[styles.infoRow, { marginBottom: 0 }]}>
            <Feather name="calendar" size={14} color={theme.icon} />
            <Typography variant="caption" style={styles.infoText}>
              {displayDate}
            </Typography>
          </View>
        </View>

        {/* Replacement Employee Info */}
        {shift.replacement_employee && (
          <View style={styles.replacementContainer}>
            <Typography variant="caption" style={styles.replacementTitle}>
              Replacement Worker:
            </Typography>
            <View style={styles.replacementDetails}>
              <Ionicons name="person-outline" size={14} color={theme.textSecondary} />
              <Typography variant="caption" style={styles.replacementText}>
                {shift.replacement_employee.name}
              </Typography>
              <Typography variant="caption" style={styles.separator}>
                |
              </Typography>
              <Ionicons name="call-outline" size={14} color={theme.textSecondary} />
              <Typography variant="caption" style={styles.replacementText}>
                {shift.replacement_employee.phone_no}
              </Typography>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.centerContainer}>
          <Loader />
        </View>
      ) : isError ? (
        <View style={styles.centerContainer}>
          <Typography variant="body" style={{ color: theme.textSecondary }}>
            Failed to load created shifts.
          </Typography>
        </View>
      ) : (
        <FlatList
          data={shifts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Typography variant="body" style={{ color: theme.textSecondary }}>
                No created shifts found.
              </Typography>
            </View>
          }
        />
      )}
    </View>
  );
}

const createStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 40,
    },
    listContent: {
      padding: 16,
    },
    cardContainer: {
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#000',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: { color: '#FFF' },
    titleContainer: { flex: 1, marginLeft: 12 },
    title: { color: theme.text, fontWeight: '600' },
    employerText: { color: theme.textSecondary, marginTop: 2 },
    rightHeader: { alignItems: 'flex-end' },
    payPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#E6FFEA',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    payAmount: { fontWeight: '700', color: '#059669' },
    paySuffix: { color: theme.textSecondary },
    statusPill: { marginTop: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    dashedDivider: {
      borderTopWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.border,
      marginVertical: 16,
    },
    infoCol: { flex: 1 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    infoText: { color: theme.textSecondary, marginLeft: 8 },
    replacementContainer: {
      marginTop: 16,
      padding: 12,
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    replacementTitle: {
      color: theme.text,
      fontWeight: '600',
      marginBottom: 6,
    },
    replacementDetails: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    replacementText: {
      color: theme.textSecondary,
      marginLeft: 6,
    },
    separator: { marginHorizontal: 8, color: theme.border },
  });
