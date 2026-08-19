import { CustomHeader } from '@/components/ui/header';
import { Stack } from 'expo-router';
import React from 'react';

export default function AttendanceLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          header: () => <CustomHeader title="Attendance" />,
        }}
      />
    </Stack>
  );
}
