import { ProtectedScreen } from '@/features/auth/screens/protected-screen';
import ShiftSwapOptionsScreen from '@/features/shift-swap/screens/shift-swap-options-screen';

export default function OptionsRoute() {
  return (
    <ProtectedScreen>
      <ShiftSwapOptionsScreen />
    </ProtectedScreen>
  );
}
