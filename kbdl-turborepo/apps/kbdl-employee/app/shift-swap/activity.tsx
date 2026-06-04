import { ProtectedScreen } from '@/features/auth/screens/protected-screen';
import MyActivityScreen from '@/features/shift-swap/screens/my-activity-screen';

export default function ActivityRoute() {
  return (
    <ProtectedScreen>
      <MyActivityScreen />
    </ProtectedScreen>
  );
}
