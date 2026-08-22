'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchAttendanceAnalyticsBreakdown,
  fetchAttendanceAnalyticsInsights,
  fetchAttendanceAnalyticsSummary,
  fetchAttendanceAnalyticsTrend,
  type AttendanceAnalyticsBreakdown,
  type AttendanceAnalyticsInsights,
  type AttendanceAnalyticsRangeParams,
  type AttendanceAnalyticsSummary,
  type AttendanceAnalyticsTrend,
} from '../api';

export type AnalyticsSectionKey = 'summary' | 'trend' | 'breakdown' | 'insights';

export type SectionState<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
};

function emptySection<T>(): SectionState<T> {
  return { data: null, error: null, loading: true };
}

function errMessage(err: unknown) {
  return err instanceof Error ? err.message : 'Failed to load';
}

async function runSection<T>(
  fetcher: () => Promise<T>,
  setState: React.Dispatch<React.SetStateAction<SectionState<T>>>,
) {
  setState((prev) => ({ ...prev, loading: true, error: null }));
  try {
    const data = await fetcher();
    setState({ data, error: null, loading: false });
  } catch (err) {
    setState((prev) => ({ data: prev.data, error: errMessage(err), loading: false }));
  }
}

export function useAttendanceAnalytics(
  range: AttendanceAnalyticsRangeParams,
  insightsQuery: Pick<
    AttendanceAnalyticsRangeParams,
    'sort_by' | 'sort_dir' | 'issue_filter'
  > = {},
) {
  const [summary, setSummary] = useState<SectionState<AttendanceAnalyticsSummary>>(emptySection);
  const [trend, setTrend] = useState<SectionState<AttendanceAnalyticsTrend>>(emptySection);
  const [breakdown, setBreakdown] =
    useState<SectionState<AttendanceAnalyticsBreakdown>>(emptySection);
  const [insights, setInsights] =
    useState<SectionState<AttendanceAnalyticsInsights>>(emptySection);

  const rangeKey = `${range.month ?? ''}|${range.from ?? ''}|${range.to ?? ''}`;
  const insightsKey = `${insightsQuery.sort_by ?? ''}|${insightsQuery.sort_dir ?? ''}|${insightsQuery.issue_filter ?? ''}`;
  const rangeRef = useRef(range);
  rangeRef.current = range;
  const insightsRef = useRef(insightsQuery);
  insightsRef.current = insightsQuery;
  const requestIdRef = useRef(0);

  const combinedParams = useCallback(
    (): AttendanceAnalyticsRangeParams => ({
      ...rangeRef.current,
      ...insightsRef.current,
    }),
    [],
  );

  const loadSummary = useCallback(
    () => runSection(() => fetchAttendanceAnalyticsSummary(rangeRef.current), setSummary),
    [],
  );
  const loadTrend = useCallback(
    () => runSection(() => fetchAttendanceAnalyticsTrend(rangeRef.current), setTrend),
    [],
  );
  const loadBreakdown = useCallback(
    () => runSection(() => fetchAttendanceAnalyticsBreakdown(rangeRef.current), setBreakdown),
    [],
  );
  const loadInsights = useCallback(
    () => runSection(() => fetchAttendanceAnalyticsInsights(combinedParams()), setInsights),
    [combinedParams],
  );

  const loadAll = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const params = combinedParams();

    setSummary((s) => ({ ...s, loading: true, error: null }));
    setTrend((s) => ({ ...s, loading: true, error: null }));
    setBreakdown((s) => ({ ...s, loading: true, error: null }));
    setInsights((s) => ({ ...s, loading: true, error: null }));

    const settled = await Promise.allSettled([
      fetchAttendanceAnalyticsSummary(params),
      fetchAttendanceAnalyticsTrend(params),
      fetchAttendanceAnalyticsBreakdown(params),
      fetchAttendanceAnalyticsInsights(params),
    ]);

    if (requestId !== requestIdRef.current) return;

    const apply = <T,>(
      result: PromiseSettledResult<T>,
      setState: React.Dispatch<React.SetStateAction<SectionState<T>>>,
    ) => {
      if (result.status === 'fulfilled') {
        setState({ data: result.value, error: null, loading: false });
      } else {
        setState((prev) => ({
          data: prev.data,
          error: errMessage(result.reason),
          loading: false,
        }));
      }
    };

    apply(settled[0], setSummary);
    apply(settled[1], setTrend);
    apply(settled[2], setBreakdown);
    apply(settled[3], setInsights);
  }, [combinedParams]);

  const refreshSection = useCallback(
    (key: AnalyticsSectionKey) => {
      if (key === 'summary') return loadSummary();
      if (key === 'trend') return loadTrend();
      if (key === 'breakdown') return loadBreakdown();
      return loadInsights();
    },
    [loadSummary, loadTrend, loadBreakdown, loadInsights],
  );

  useEffect(() => {
    void loadAll();
  }, [rangeKey, loadAll]);

  const insightsReady = useRef(false);
  useEffect(() => {
    if (!insightsReady.current) {
      insightsReady.current = true;
      return;
    }
    void loadInsights();
  }, [insightsKey, loadInsights]);

  return {
    summary,
    trend,
    breakdown,
    insights,
    loadAll,
    refreshSection,
  };
}

export function currentUtcMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}
