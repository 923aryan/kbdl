import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import CustomButton from '@/components/ui/button';
import JobCard from '@/components/ui/job-card';
import Loader from '@/components/ui/loader';
import { Typography } from '@/components/ui/typography';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { jobQueryKeys, useGetMyJobApplications, useWithdrawJobApplication } from '@/features/jobs/api';

const canWithdraw = (status: string) => ['applied', 'under_review', 'shortlisted', 'interview_scheduled'].includes(status);

export default function MyJobApplicationsScreen() {
  const colorScheme = useColorScheme() ?? 'light'; const theme = Colors[colorScheme]; const queryClient = useQueryClient();
  const { data, isLoading } = useGetMyJobApplications(); const withdraw = useWithdrawJobApplication();
  if (isLoading) return <Loader fullScreen message="Loading applications…" />;
  return <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content}>
    {data?.length ? data.map((application) => <View key={application.id} style={styles.item}><JobCard job={application.job} applicationStatus={application.status} />{canWithdraw(application.status) ? <CustomButton title="Withdraw application" variant="outline" size="small" loading={withdraw.isPending} onPress={() => Alert.alert('Withdraw application?', 'You can apply again only if the employer allows it.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Withdraw', style: 'destructive', onPress: () => withdraw.mutate(application.id, { onSuccess: async () => { Toast.show({ type: 'success', text1: 'Application withdrawn' }); await queryClient.invalidateQueries({ queryKey: jobQueryKeys.applications }); }, onError: (error: Error) => Toast.show({ type: 'error', text1: 'Could not withdraw', text2: error.message }) }) }])} /> : null}</View>) : <View style={styles.empty}><Feather name="file-text" size={40} color={theme.icon} /><Typography variant="h3" style={{ color: theme.text }}>No applications yet</Typography><Typography variant="caption" style={{ color: theme.textSecondary, textAlign: 'center' }}>When you apply to a job, its status will appear here.</Typography></View>}
  </ScrollView>;
}

const styles = StyleSheet.create({ content: { padding: 20, paddingBottom: 100, gap: 16 }, item: { gap: 8 }, empty: { paddingTop: 80, alignItems: 'center', gap: 12, paddingHorizontal: 36 } });
