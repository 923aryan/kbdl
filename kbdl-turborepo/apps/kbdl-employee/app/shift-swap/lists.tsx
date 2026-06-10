import { ProtectedScreen } from '@/features/auth/screens/protected-screen';
import ShiftSwapListsScreen from '@/features/shift-swap/screens/shift-swap-lists-screen';
import React from 'react';

export default function ListsRoute() {
  return (
    <ProtectedScreen>
      <ShiftSwapListsScreen />
    </ProtectedScreen>
  );
}
