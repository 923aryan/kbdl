import { ProtectedScreen } from '@/features/auth/screens/protected-screen';
import Profile from '@/features/home/screens/profile';
export default function ProfileRoute() {
  return (
    <ProtectedScreen>
      <Profile />
    </ProtectedScreen>
  );
}
