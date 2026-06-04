import { CustomHeader } from '@/components/ui/header';
import { Stack } from 'expo-router';
import React from 'react';

export default function JobsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="find-jobs"
        options={{
          header: () => <CustomHeader title="Find Jobs" showBackButton={false} />,
        }}
      />
    </Stack>
  );
}
