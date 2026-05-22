import { ProtectedScreen } from '@/features/auth/screens/protected-screen';
import ExtraShiftScreen from '@/features/shift-swap/screens/extra-shifts-screen';
export default function ExtraShiftRoute() {
  return (
    <ProtectedScreen>
      <ExtraShiftScreen />
    </ProtectedScreen>
  );
}
