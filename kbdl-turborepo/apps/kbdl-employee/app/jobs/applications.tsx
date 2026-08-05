import { ProtectedScreen } from '@/features/auth/screens/protected-screen';
import MyJobApplicationsScreen from '@/features/jobs/screens/my-job-applications-screen';

export default function JobApplicationsRoute() {
  return <ProtectedScreen><MyJobApplicationsScreen /></ProtectedScreen>;
}
