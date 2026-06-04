import { ProtectedScreen } from '@/features/auth/screens/protected-screen';
import ShiftDetailsScreen from '@/features/shift-swap/screens/shift-details-screen';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function ShiftDetailsRoute() {
  const { shiftData, distance, buttonTitle } = useLocalSearchParams();

  let parsedShift = null;
  try {
    if (shiftData && typeof shiftData === 'string') {
      parsedShift = JSON.parse(shiftData);
    }
  } catch (error) {
    console.error('Failed to parse shift parameters', error);
  }

  return (
    <ProtectedScreen>
      <ShiftDetailsScreen
        shift={parsedShift}
        distance={distance as string}
        buttonTitle={buttonTitle as string}
      />
    </ProtectedScreen>
  );
}
