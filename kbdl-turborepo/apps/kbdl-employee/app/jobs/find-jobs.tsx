import FindJobsScreen from '@/features/jobs/screens/find-jobs-screen';
import { ProtectedScreen } from '@/features/auth/screens/protected-screen';

export default function Page() {
  return (
    <ProtectedScreen>
      <FindJobsScreen />
    </ProtectedScreen>
  );
}
