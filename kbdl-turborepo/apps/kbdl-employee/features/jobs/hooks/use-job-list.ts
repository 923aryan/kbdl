import { useGetLatestJobs, useGetRecommendedJobs } from '@/features/jobs/api';
import type { JobFeedType } from '@/features/jobs/types/job-types';

export function useJobList(type: JobFeedType, limit = 10) {
  const latest = useGetLatestJobs(limit);
  const recommended = useGetRecommendedJobs(limit);
  return type === 'recommended' ? recommended : latest;
}
