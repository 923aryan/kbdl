import { ProtectedScreen } from '@/features/auth/screens/protected-screen';
import JobListScreen from '@/features/jobs/screens/job-list-screen';
import { useLocalSearchParams } from 'expo-router';

export default function JobListRoute() {
  const { type } = useLocalSearchParams<{ type?: 'recommended' | 'latest' }>();
  return <ProtectedScreen><JobListScreen type={type === 'recommended' ? 'recommended' : 'latest'} /></ProtectedScreen>;
}
