import { useColorScheme } from '@/hooks/use-color-scheme';
import { Feather, Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomButton from '@/components/ui/button';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { Typography } from '@/components/ui/typography';
import { Colors } from '@/constants/theme';
import {
  useAcceptEmployment,
  useDeclineEmployment,
} from '@/features/operations/hooks/use-operation-hook';
import { EmployeeEmploymentWithEmployerDTO } from '@repo/types';
import Toast from 'react-native-toast-message';

interface OnboardRequestCardProps {
  employment: EmployeeEmploymentWithEmployerDTO;
}

const formatDate = (dateInput: string | Date) => {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function OnboardRequestCard({ employment }: OnboardRequestCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const styles = createStyles(theme);

  const employmentId = employment.id;
  const employerName = employment.employer?.company_name || 'Unknown Employer';
  const location = employment.employer?.company_address;
  const displayDate = formatDate(employment.created_at);

  const acceptMutation = useAcceptEmployment();
  const declineMutation = useDeclineEmployment();

  const isAccepting = acceptMutation.isPending;
  const isDeclining = declineMutation.isPending;
  const [isAcceptModalVisible, setIsAcceptModalVisible] = useState(false);

  const handleAcceptConfirm = () => {
    acceptMutation.mutate(employmentId, {
      onSuccess: () => {
        setIsAcceptModalVisible(false);
        Toast.show({
          type: 'success',
          text1: 'Job offer accepted successfully!',
        });
      },
      onError: (error: any) => {
        setIsAcceptModalVisible(false);
        Toast.show({
          type: 'error',
          text1: error?.message || 'Failed to accept job offer',
        });
      },
    });
  };

  const onAcceptPress = () => {
    setIsAcceptModalVisible(true);
  };

  const onDeclinePress = () => {
    declineMutation.mutate(employmentId, {
      onSuccess: () => {
        Toast.show({
          type: 'success',
          text1: 'Job offer declined',
        });
      },
      onError: (error: any) => {
        Toast.show({
          type: 'error',
          text1: error?.message || 'Failed to decline job offer',
        });
      },
    });
  };

  return (
    <>
      <TouchableOpacity style={styles.cardContainer} activeOpacity={0.9}>
        <View style={styles.topRow}>
          <View style={styles.avatar}>
            <Typography variant="h3" style={styles.avatarText}>
              {employerName.charAt(0).toUpperCase()}
            </Typography>
          </View>

          <View style={styles.titleContainer}>
            <Typography variant="bodySmall" style={styles.title}>
              Job Offer
            </Typography>
            <View style={styles.employerRow}>
              <Typography variant="caption" style={styles.employerText}>
                {employerName}
              </Typography>
              {employment.employer?.is_verified && (
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color="#10B981"
                  style={styles.verifiedIcon}
                />
              )}
            </View>
          </View>

          <View style={styles.rightHeader}>
            <View style={styles.payPill}>
              <Typography variant="caption" style={styles.payAmount}>
                {(employment.is_active ? 'ACTIVE' : (employment.separation_reason ?? 'INACTIVE')).toString().toUpperCase()}
              </Typography>
            </View>
          </View>
        </View>

        <View style={styles.dashedDivider} />

        <View style={styles.bottomSection}>
          <View style={styles.infoCol}>
            {location && (
              <View style={styles.infoRow}>
                <Feather name="map-pin" size={14} color={theme.icon} />
                <Typography variant="caption" style={styles.infoText} numberOfLines={1}>
                  {location}
                </Typography>
              </View>
            )}

            <View style={[styles.infoRow, { marginBottom: 0 }]}>
              <Feather name="calendar" size={14} color={theme.icon} />
              <Typography variant="caption" style={styles.infoText}>
                Requested on: {displayDate}
              </Typography>
            </View>
          </View>

          <View style={styles.actionContainer}>
            <View style={styles.logicButtons}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <CustomButton
                  title="Decline"
                  variant="destructive"
                  size="small"
                  loading={isDeclining}
                  disabled={isAccepting}
                  onPress={onDeclinePress}
                />
              </View>
              <View style={{ flex: 1 }}>
                <CustomButton
                  title="Accept Offer"
                  variant="primary"
                  size="small"
                  loading={isAccepting}
                  disabled={isDeclining}
                  onPress={onAcceptPress}
                />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <ConfirmationModal
        visible={isAcceptModalVisible}
        title="Warning"
        message="Accepting this job offer will automatically resign you from your current active employment. Do you wish to proceed?"
        confirmText="Accept"
        cancelText="Cancel"
        onConfirm={handleAcceptConfirm}
        onCancel={() => setIsAcceptModalVisible(false)}
        loading={isAccepting}
      />
    </>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    cardContainer: {
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
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
    title: { color: theme.text, fontWeight: 'bold' },
    employerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    employerText: { color: theme.textSecondary },
    verifiedIcon: { marginLeft: 6 },
    rightHeader: { alignItems: 'flex-end' },
    payPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF0E3',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    payAmount: { fontWeight: '700', color: '#F97316' },
    dashedDivider: {
      borderTopWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.border,
      marginVertical: 16,
    },
    bottomSection: { flexDirection: 'column', justifyContent: 'space-between' },
    infoCol: { marginBottom: 12 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    infoText: { color: theme.textSecondary, marginLeft: 8 },
    actionContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: 8 },
    logicButtons: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  });
