import { ProtectedScreen } from '@/features/auth/screens/protected-screen';
import JobDetailsScreen from '@/features/jobs/screens/job-details-screen';
import { useLocalSearchParams } from 'expo-router';

export default function JobDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProtectedScreen><JobDetailsScreen jobId={id} /></ProtectedScreen>;
}
