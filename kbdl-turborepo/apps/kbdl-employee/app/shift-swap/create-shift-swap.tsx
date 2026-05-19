import { ProtectedScreen } from '@/features/auth/screens/protected-screen';
import CreateShiftScreen from '@/features/shift-swap/screens/create-shift-swap-screen';

export default function CreateShiftRoute() {
  return (
    <ProtectedScreen>
      <CreateShiftScreen />
    </ProtectedScreen>
  );
}
