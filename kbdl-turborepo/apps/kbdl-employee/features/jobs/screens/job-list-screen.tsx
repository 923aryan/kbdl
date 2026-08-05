import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import JobCard from '@/components/ui/job-card';
import Loader from '@/components/ui/loader';
import SearchBar from '@/components/ui/search-bar';
import { Typography } from '@/components/ui/typography';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useGetJobs } from '@/features/jobs/api';
import { useJobList } from '@/features/jobs/hooks/use-job-list';

export default function JobListScreen({ type }: { type: 'recommended' | 'latest' }) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [search, setSearch] = useState('');
  const source = useJobList(type, 50);
  const searched = useGetJobs(search.trim());
  const jobs = useMemo(() => search.trim() ? searched.data ?? [] : source.data ?? [], [search, searched.data, source.data]);
  const isLoading = search.trim() ? searched.isLoading : source.isLoading;

  return <View style={[styles.container, { backgroundColor: theme.background }]}>
    <SearchBar value={search} onChangeText={setSearch} placeholder="Search jobs" containerStyle={styles.search} />
    {isLoading ? <Loader fullScreen message="Loading jobs…" /> : <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Typography variant="button" style={[styles.title, { color: theme.text }]}>{search.trim() ? `Search results for “${search.trim()}”` : type === 'recommended' ? 'Best Match to Your Interest' : 'Latest Post'}</Typography>
      {jobs.length ? <View style={styles.list}>{jobs.map((job) => <JobCard key={job.id} job={job} />)}</View> : <View style={styles.empty}><Typography variant="body" style={{ color: theme.text }}>No jobs available right now.</Typography></View>}
    </ScrollView>}
  </View>;
}

const styles = StyleSheet.create({ container: { flex: 1 }, search: { marginHorizontal: 20, marginTop: 20 }, content: { paddingHorizontal: 20, paddingBottom: 100 }, title: { marginTop: 24, marginBottom: 16, fontSize: 18 }, list: { gap: 16 }, empty: { paddingTop: 70, alignItems: 'center' } });
