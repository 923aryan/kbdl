import { Feather } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import JobCard from '@/components/ui/job-card';
import Loader from '@/components/ui/loader';
import SearchBar from '@/components/ui/search-bar';
import { Typography } from '@/components/ui/typography';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  useGetJobs,
  useGetLatestJobs,
  useGetMyJobApplications,
  useGetRecommendedJobs,
} from '@/features/jobs/api';

export default function FindJobsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [search, setSearch] = useState('');
  const latest = useGetLatestJobs(10);
  const recommended = useGetRecommendedJobs(10);
  const applications = useGetMyJobApplications();
  const searched = useGetJobs(search.trim());
  const isSearching = Boolean(search.trim());
  const searchJobs = useMemo(() => searched.data ?? [], [searched.data]);
  const loading = isSearching ? searched.isLoading : latest.isLoading || recommended.isLoading;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: 'Jobs',
          headerStyle: { backgroundColor: '#0B173F' },
          headerTintColor: '#FFFFFF',
          headerTitleAlign: 'center',
          headerShadowVisible: false,
        }}
      />

      <View style={styles.extendedHeaderBackground} />
      <View style={styles.fixedTopSection}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search"
          containerStyle={styles.search}
        />

        {!isSearching ? (
          <View style={styles.actionRow}>
            <ActionCard count={0} label="Saved" />
            <ActionCard
              count={applications.data?.length ?? 0}
              label="Applied"
              onPress={() => router.push('/jobs/applications' as never)}
            />
          </View>
        ) : null}
      </View>

      {loading ? (
        <Loader fullScreen message="Finding jobs…" />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {isSearching ? (
            <JobSection
              title={`Results for “${search.trim()}”`}
              jobs={searchJobs}
              emptyMessage="Try another job title, company, or location."
            />
          ) : (
            <>
              {(recommended.data?.length ?? 0) > 0 ? (
                <JobSection
                  title="Best Match to Your Interest"
                  jobs={recommended.data ?? []}
                  horizontal
                  onSeeAll={() =>
                    router.push({
                      pathname: '/jobs/list' as never,
                      params: { type: 'recommended' },
                    } as never)
                  }
                  emptyMessage="Add skills in your profile to get personalized matches."
                />
              ) : null}
              <JobSection
                title="Latest Post"
                jobs={latest.data ?? []}
                compact
                onSeeAll={() =>
                  router.push({
                    pathname: '/jobs/list' as never,
                    params: { type: 'latest' },
                  } as never)
                }
                emptyMessage="New jobs posted by employers will appear here."
              />
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function ActionCard({
  count,
  label,
  onPress,
}: {
  count: number;
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      disabled={!onPress}
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.actionCard}
    >
      <View style={styles.actionCardContent}>
        <Typography allowFontScaling={false} variant="h3" style={styles.actionCount}>
          {count}
        </Typography>
        <Typography allowFontScaling={false} variant="caption" style={styles.actionLabel}>
          {label}
        </Typography>
      </View>
    </TouchableOpacity>
  );
}

function JobSection({
  title,
  jobs,
  horizontal = false,
  compact = false,
  onSeeAll,
  emptyMessage,
}: {
  title: string;
  jobs: any[];
  horizontal?: boolean;
  compact?: boolean;
  onSeeAll?: () => void;
  emptyMessage: string;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Typography variant="bodySmall" style={[styles.sectionTitle, { color: theme.text }]}>
          {title}
        </Typography>
        {onSeeAll ? (
          <TouchableOpacity onPress={onSeeAll}>
            <Typography variant="caption" style={styles.seeAll}>
              see all ›
            </Typography>
          </TouchableOpacity>
        ) : null}
      </View>
      {jobs.length ? (
        horizontal ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {jobs.map((job) => (
              <View key={job.id} style={styles.horizontalCard}>
                <JobCard job={job} compact />
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.list}>
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} compact={compact} />
            ))}
          </View>
        )
      ) : (
        <View style={[styles.empty, { borderColor: theme.border }]}>
          <Feather name="briefcase" size={20} color={theme.icon} />
          <Typography variant="caption" style={{ color: theme.textSecondary }}>
            {emptyMessage}
          </Typography>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  extendedHeaderBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    backgroundColor: '#0B173F',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    zIndex: 0,
  },
  fixedTopSection: { zIndex: 10, paddingBottom: 8 },
  search: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 32,
    marginBottom: 8,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  actionCard: {
    flex: 1,
    height: 80,
    borderRadius: 28,
    backgroundColor: '#2F49C7',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  actionCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  actionCount: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    lineHeight: 26,
  },
  actionLabel: { color: '#FFFFFF', fontWeight: '600', fontSize: 12, lineHeight: 16 },
  content: { paddingBottom: 100 },
  section: { marginBottom: 8 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: { fontFamily: 'Poppins_400Regular', fontSize: 16, lineHeight: 24 },
  seeAll: { color: '#2563EB', fontSize: 14 },
  horizontalList: { paddingHorizontal: 20, gap: 16 },
  horizontalCard: { width: 320 },
  list: { paddingHorizontal: 20, gap: 16 },
  empty: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    minHeight: 74,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
});
