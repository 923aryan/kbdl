import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import CustomButton from '@/components/ui/button';
import Loader from '@/components/ui/loader';
import { Typography } from '@/components/ui/typography';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { jobQueryKeys, useApplyForJob, useGetJobDetails, useGetMyJobApplications } from '@/features/jobs/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const titleCase = (value?: string | null) =>
  value ? value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Not specified';

const displaySalary = (min: unknown, max: unknown) => {
  const lower = min == null ? null : Number(min);
  const upper = max == null ? null : Number(max);
  if (lower !== null && upper !== null) return `₹${lower.toLocaleString()}–₹${upper.toLocaleString()}`;
  if (lower !== null) return `From ₹${lower.toLocaleString()}`;
  if (upper !== null) return `Up to ₹${upper.toLocaleString()}`;
  return 'Not disclosed';
};

const displayHours = (start?: string | Date | null, end?: string | Date | null) => {
  if (!start || !end) return 'Flexible';
  const format = (value: string | Date) =>
    new Date(value).toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  return `${format(start)}–${format(end)}`;
};

export default function JobDetailsScreen({ jobId }: { jobId: string }) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: job, isLoading, error } = useGetJobDetails(jobId);
  const applications = useGetMyJobApplications();
  const apply = useApplyForJob();
  const [showSuccess, setShowSuccess] = useState(false);
  const [appliedNow, setAppliedNow] = useState(false);
  const [saved, setSaved] = useState(false);
  const existingApplication = useMemo(
    () => applications.data?.find((item) => item.job_id === jobId),
    [applications.data, jobId],
  );
  const isApplied = appliedNow || Boolean(existingApplication && existingApplication.status !== 'withdrawn');

  if (isLoading) return <Loader fullScreen message="Loading job…" />;
  if (!job) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Typography variant="body" style={{ color: theme.text }}>
          {error?.message || 'This job is no longer available.'}
        </Typography>
      </View>
    );
  }

  const employer = job.employer?.company_name || 'Employer';
  const requirements = [
    `Work mode: ${titleCase(job.work_type)}`,
    job.seats_available != null
      ? `${job.seats_available} opening${job.seats_available === 1 ? '' : 's'} available`
      : null,
  ].filter(Boolean) as string[];

  const submitApplication = () =>
    apply.mutate(
      { jobId, payload: {} },
      {
        onSuccess: async () => {
          setAppliedNow(true);
          setShowSuccess(true);
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: jobQueryKeys.applications }),
            queryClient.invalidateQueries({ queryKey: jobQueryKeys.latest }),
            queryClient.invalidateQueries({ queryKey: jobQueryKeys.recommended }),
          ]);
        },
        onError: (applyError: Error) =>
          Toast.show({ type: 'error', text1: 'Could not apply', text2: applyError.message }),
      },
    );

  const shareJob = () =>
    Share.share({
      message: `${job.title} at ${employer}${job.address ? ` — ${job.address}` : ''}`,
    });

  return (
    <View style={[styles.page, { backgroundColor: '#F8F9FA' }]}>
      <View style={[styles.header, { height: insets.top + 44, paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.headerButton}>
          <Feather name="chevron-left" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Typography allowFontScaling={false} variant="body" style={styles.headerTitle}>
          Jobs
        </Typography>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={shareJob} hitSlop={8} style={styles.headerIconButton}>
            <Feather name="share-2" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSaved((value) => !value)} hitSlop={8} style={styles.headerIconButton}>
            <Feather name="bookmark" size={18} color={saved ? '#8DB8FF' : '#FFFFFF'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 112 + Math.max(insets.bottom, 20) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.companyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.companyLogo, { backgroundColor: theme.primary }]}>
            <Typography allowFontScaling={false} variant="h2" style={styles.logoLetter}>
              {employer.charAt(0).toUpperCase()}
            </Typography>
          </View>
          <Typography allowFontScaling={false} variant="bodySmall" style={[styles.jobTitle, { color: theme.text }]}>
            {job.title}
          </Typography>
          <View style={styles.companyMeta}>
            <Feather name="briefcase" size={13} color={theme.icon} />
            <Typography allowFontScaling={false} variant="caption" style={[styles.metaText, { color: theme.textSecondary }]}>
              {employer}
            </Typography>
            {job.address ? (
              <>
                <Feather name="map-pin" size={13} color={theme.icon} style={styles.locationIcon} />
                <Typography allowFontScaling={false} variant="caption" style={[styles.metaText, { color: theme.textSecondary }]} numberOfLines={1}>
                  {job.address}
                </Typography>
              </>
            ) : null}
          </View>
        </View>

        <View style={styles.statGrid}>
          <StatCard icon="dollar-sign" label="Salary" value={displaySalary(job.salary_min, job.salary_max)} color="#FFF4D8" theme={theme} />
          <StatCard icon="briefcase" label="Job Type" value={titleCase(job.employment_type)} color="#FFE2E6" theme={theme} />
          <StatCard icon="clock" label="Work Hours" value={displayHours(job.job_start_time, job.job_end_time)} color="#E5E8FF" theme={theme} />
        </View>

        <InfoCard title="Job Description" theme={theme}>
          <Typography allowFontScaling={false} variant="caption" style={[styles.description, { color: theme.textSecondary }]}>
            {job.description || 'No job description provided.'}
          </Typography>
        </InfoCard>

        <InfoCard title="Requirements" theme={theme}>
          {requirements.map((requirement) => (
            <View key={requirement} style={styles.requirement}>
              <Typography allowFontScaling={false} variant="caption" style={{ color: theme.textSecondary }}>•</Typography>
              <Typography allowFontScaling={false} variant="caption" style={[styles.requirementText, { color: theme.textSecondary }]}>
                {requirement}
              </Typography>
            </View>
          ))}
        </InfoCard>
      </ScrollView>

      <View style={[styles.actionArea, { backgroundColor: '#F8F9FA', bottom: Math.max(insets.bottom, 20) }]}>
        <CustomButton
          title={isApplied ? 'Applied' : 'Apply Now'}
          disabled={isApplied}
          loading={apply.isPending}
          onPress={submitApplication}
          containerStyle={isApplied ? styles.appliedButton : undefined}
        />
      </View>
      <ApplicationSuccessModal visible={showSuccess} onClose={() => setShowSuccess(false)} />
    </View>
  );
}

function StatCard({ icon, label, value, color, theme }: { icon: React.ComponentProps<typeof Feather>['name']; label: string; value: string; color: string; theme: typeof Colors.light }) {
  return <View style={styles.statCard}><View style={[styles.statIcon, { backgroundColor: color }]}><Feather name={icon} size={15} color={theme.text} /></View><Typography allowFontScaling={false} variant="caption" style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Typography><Typography allowFontScaling={false} variant="caption" style={[styles.statValue, { color: theme.text }]} numberOfLines={1}>{value}</Typography></View>;
}

function InfoCard({ title, theme, children }: { title: string; theme: typeof Colors.light; children: React.ReactNode }) {
  return <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}><Typography allowFontScaling={false} variant="caption" style={[styles.infoTitle, { color: theme.text }]}>{title}</Typography>{children}</View>;
}

function ApplicationSuccessModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.modalOverlay}><View style={[styles.successSheet, { backgroundColor: theme.card }]}><View style={styles.successIcon}><Feather name="check" size={46} color="#65B84A" /></View><Typography allowFontScaling={false} variant="body" style={[styles.successTitle, { color: theme.text }]}>Applied Successfully</Typography><Typography allowFontScaling={false} variant="caption" style={[styles.successText, { color: theme.textSecondary }]}>Your job application has been sent.</Typography><CustomButton title="Confirm" onPress={onClose} containerStyle={styles.confirmButton} /></View></View></Modal>;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: { height: 44, backgroundColor: '#031A40', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 },
  headerButton: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold', fontSize: 17 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerIconButton: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1 },
  content: { flexGrow: 1, padding: 16, paddingTop: 42, gap: 14 },
  companyCard: { minHeight: 96, borderWidth: 1, borderRadius: 8, alignItems: 'center', padding: 32, paddingTop: 34, position: 'relative' },
  companyLogo: { position: 'absolute', top: -27, width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#F8F9FA' },
  logoLetter: { color: '#FFFFFF', fontSize: 22, lineHeight: 27 },
  jobTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, lineHeight: 21 },
  companyMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 9, maxWidth: '100%' },
  metaText: { marginLeft: 5, fontSize: 12, lineHeight: 16, flexShrink: 1 },
  locationIcon: { marginLeft: 10 },
  statGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 7 },
  statCard: { alignItems: 'center', width: '31%', gap: 2 },
  statIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  statLabel: { fontSize: 12, lineHeight: 16 },
  statValue: { fontFamily: 'Poppins_700Bold', fontSize: 13, lineHeight: 18, textAlign: 'center' },
  infoCard: { borderWidth: 1, borderRadius: 8, padding: 12 },
  infoTitle: { fontFamily: 'Poppins_700Bold', fontSize: 14, lineHeight: 18, marginBottom: 6 },
  description: { fontSize: 12, lineHeight: 17 },
  requirement: { flexDirection: 'row', gap: 7, marginBottom: 3 },
  requirementText: { flex: 1, fontSize: 12, lineHeight: 17 },
  actionArea: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingVertical: 12 },
  appliedButton: { backgroundColor: '#80ACE2' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  successSheet: { borderTopLeftRadius: 18, borderTopRightRadius: 18, alignItems: 'center', padding: 28, paddingBottom: 30 },
  successIcon: { width: 64, height: 64, borderRadius: 32, borderWidth: 4, borderColor: '#9CDC88', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  successTitle: { fontFamily: 'Poppins_700Bold' },
  successText: { textAlign: 'center', marginTop: 4, marginBottom: 22 },
  confirmButton: { width: '100%' },
});
