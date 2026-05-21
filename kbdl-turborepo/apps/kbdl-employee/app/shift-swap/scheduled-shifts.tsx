import { ProtectedScreen } from '@/features/auth/screens/protected-screen';
import ScheduledShiftScreen from '@/features/shift-swap/screens/scheduled-shifts-screen';
export default function ScheduledShiftRoute() {
  return (
    <ProtectedScreen>
      <ScheduledShiftScreen />
    </ProtectedScreen>
  );
}
