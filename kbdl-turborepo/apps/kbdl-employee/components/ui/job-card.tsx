import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Typography } from '@/components/ui/typography';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { GetLatestJobsResponse } from '@repo/types';

type Job = GetLatestJobsResponse[number];

type JobCardProps = {
  job: Job;
  applicationStatus?: string | null;
  compact?: boolean;
};

const titleCase = (value?: string | null) =>
  value
    ? value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
    : 'Not specified';

const salary = (job: Job) => {
  const min =
    job.salary_min === null || job.salary_min === undefined ? null : Number(job.salary_min);
  const max =
    job.salary_max === null || job.salary_max === undefined ? null : Number(job.salary_max);
  const amount =
    min !== null && max !== null
      ? `₹${min.toLocaleString()}–₹${max.toLocaleString()}`
      : min !== null
        ? `From ₹${min.toLocaleString()}`
        : max !== null
          ? `Up to ₹${max.toLocaleString()}`
          : 'Salary not disclosed';
  return `${amount}${job.salary_type ? ` / ${titleCase(job.salary_type)}` : ''}`;
};

const workingHours = (start?: string | Date | null, end?: string | Date | null) => {
  if (!start || !end) return null;
  const format = (value: string | Date) =>
    new Date(value).toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  return `${format(start)} – ${format(end)}`;
};

export default function JobCard({ job, applicationStatus, compact = false }: JobCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const employerName = job.employer?.company_name || 'Employer';
  const [saved, setSaved] = useState(false);
  const hours = workingHours(job.job_start_time, job.job_end_time);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.card, compact && styles.compactCard, { backgroundColor: theme.card }]}
      onPress={() =>
        router.push({ pathname: '/jobs/[id]' as never, params: { id: job.id } } as never)
      }
    >
      <TouchableOpacity
        hitSlop={8}
        onPress={(event) => {
          event.stopPropagation();
          setSaved((prev) => !prev);
        }}
        style={styles.bookmarkButton}
      >
        <Feather name="bookmark" size={16} color={saved ? theme.primary : '#9CA3AF'} />
      </TouchableOpacity>

      <View style={styles.topRow}>
        <View style={[styles.avatar, compact && styles.compactAvatar]}>
          <Typography allowFontScaling={false} variant="h3" style={styles.avatarText}>
            {employerName.charAt(0).toUpperCase()}
          </Typography>
        </View>
        <View style={styles.titleArea}>
          <Typography
            allowFontScaling={false}
            variant="body"
            style={[styles.title, { color: theme.text }]}
            numberOfLines={1}
          >
            {job.title}
          </Typography>
          <View style={styles.companyRow}>
            <Typography
              allowFontScaling={false}
              variant="caption"
              style={[styles.company, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {employerName}
            </Typography>
            <View style={styles.companyDot} />
          </View>
        </View>
        {applicationStatus ? (
          <View style={styles.statusBadge}>
            <Typography allowFontScaling={false} variant="caption" style={styles.statusText}>
              {titleCase(applicationStatus)}
            </Typography>
          </View>
        ) : null}
      </View>

      <View style={styles.tagRow}>
        <View style={styles.tag}>
          <Typography allowFontScaling={false} variant="caption" style={styles.tagText}>
            {titleCase(job.employment_type)}
          </Typography>
        </View>
        <View style={[styles.tag, styles.workTag]}>
          <Typography allowFontScaling={false} variant="caption" style={styles.workTagText}>
            {titleCase(job.work_type)}
          </Typography>
        </View>
      </View>

      <View style={[styles.dashedDivider, { borderColor: theme.border }]} />

      <View style={styles.detailsRow}>
        <View style={styles.metaRow}>
          <Feather name="map-pin" size={17} color={theme.icon} />
          <Typography
            allowFontScaling={false}
            variant="bodySmall"
            style={[styles.metaText, { color: theme.text }]}
            numberOfLines={1}
          >
            {job.address || 'Location to be confirmed'}
          </Typography>
        </View>
        {hours ? (
          <View style={styles.hoursRow}>
            <Feather name="clock" size={17} color={theme.icon} />
            <Typography
              allowFontScaling={false}
              variant="bodySmall"
              style={[styles.hoursText, { color: theme.text }]}
              numberOfLines={1}
            >
              {hours}
            </Typography>
          </View>
        ) : null}
      </View>

      <View style={styles.bottomRow}>
        <Typography
          allowFontScaling={false}
          variant="bodySmall"
          style={[styles.salary, { color: '#1A9B43' }]}
        >
          {salary(job)}
        </Typography>
        <View style={[styles.arrow, { backgroundColor: theme.primary }]}>
          <Feather name="arrow-up-right" size={15} color="#fff" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: '#0B1E42',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  compactCard: { padding: 16, gap: 8, borderRadius: 12 },
  bookmarkButton: { position: 'absolute', top: 12, right: 12, zIndex: 5 },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 20 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B1B3F',
  },
  compactAvatar: { width: 56, height: 56, borderRadius: 28 },
  avatarText: { color: '#FFFFFF', fontSize: 20, lineHeight: 24 },
  titleArea: { flex: 1, marginLeft: 12 },
  title: { fontFamily: 'Poppins_700regular', fontSize: 18, lineHeight: 23 },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  company: { fontSize: 13, lineHeight: 17 },
  companyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  salary: { fontFamily: 'Poppins_700regular', fontSize: 18, lineHeight: 23 },
  dashedDivider: { borderTopWidth: 1, borderStyle: 'dashed', marginVertical: 2 },
  detailsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  metaText: { marginLeft: 6, fontSize: 15, lineHeight: 20, fontWeight: '600' },
  hoursRow: { flexDirection: 'row', alignItems: 'center' },
  hoursText: { marginLeft: 6, fontSize: 15, lineHeight: 20, fontWeight: '600' },
  statusBadge: {
    backgroundColor: '#E6FFEA',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  statusText: { color: '#047857', fontWeight: '700', fontSize: 9, lineHeight: 12 },
  tagRow: { flexDirection: 'row', gap: 6 },
  tag: { backgroundColor: '#FEF3C7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { color: '#D97706', fontSize: 11, fontWeight: '600' },
  workTag: { backgroundColor: '#DCFCE7' },
  workTagText: { color: '#16A34A', fontSize: 11, fontWeight: '600' },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
