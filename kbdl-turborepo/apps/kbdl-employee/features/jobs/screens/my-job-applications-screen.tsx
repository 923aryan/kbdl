import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

import CustomButton from '@/components/ui/button';
import JobCard from '@/components/ui/job-card';
import Loader from '@/components/ui/loader';
import { Typography } from '@/components/ui/typography';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  jobQueryKeys,
  useGetMyJobApplications,
  useWithdrawJobApplication,
} from '@/features/jobs/api';

const canWithdraw = (status: string) =>
  ['applied', 'under_review', 'shortlisted', 'interview_scheduled'].includes(status);

export default function MyJobApplicationsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetMyJobApplications();
  const withdraw = useWithdrawJobApplication();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  if (isLoading) return <Loader fullScreen message="Loading applications…" />;

  const handleOpenWithdraw = (applicationId: string) => {
    setSelectedAppId(applicationId);
    setModalVisible(true);
  };

  const handleConfirmWithdraw = () => {
    if (!selectedAppId) return;
    withdraw.mutate(selectedAppId, {
      onSuccess: async () => {
        setModalVisible(false);
        setSelectedAppId(null);
        Toast.show({ type: 'success', text1: 'Application withdrawn' });
        await queryClient.invalidateQueries({ queryKey: jobQueryKeys.applications });
      },
      onError: (error: Error) => {
        setModalVisible(false);
        setSelectedAppId(null);
        Toast.show({ type: 'error', text1: 'Could not withdraw', text2: error.message });
      },
    });
  };

  return (
    <>
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.content}
      >
        {data?.length ? (
          data.map((application) => (
            <View key={application.id} style={styles.item}>
              <JobCard job={application.job} applicationStatus={application.status} />
              {canWithdraw(application.status) ? (
                <CustomButton
                  title="Withdraw application"
                  variant="outline"
                  size="small"
                  loading={withdraw.isPending && selectedAppId === application.id}
                  onPress={() => handleOpenWithdraw(application.id)}
                />
              ) : null}
            </View>
          ))
        ) : (
          <View style={styles.empty}>
            <Feather name="file-text" size={40} color={theme.icon} />
            <Typography variant="h3" style={{ color: theme.text }}>
              No applications yet
            </Typography>
            <Typography
              variant="caption"
              style={{ color: theme.textSecondary, textAlign: 'center' }}
            >
              When you apply to a job, its status will appear here.
            </Typography>
          </View>
        )}
      </ScrollView>

      <ConfirmationModal
        visible={modalVisible}
        title="Withdraw application?"
        message="You can apply again only if the employer allows it."
        onConfirm={handleConfirmWithdraw}
        onCancel={() => {
          setModalVisible(false);
          setSelectedAppId(null);
        }}
        confirmText="Withdraw"
        confirmVariant="destructive"
        loading={withdraw.isPending}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 100, gap: 16 },
  item: { gap: 8 },
  empty: { paddingTop: 80, alignItems: 'center', gap: 12, paddingHorizontal: 36 },
});
