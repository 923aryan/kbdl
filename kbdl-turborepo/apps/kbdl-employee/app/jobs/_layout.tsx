import { CustomHeader } from '@/components/ui/header';
import { Stack } from 'expo-router';
import React from 'react';

export default function JobsLayout() {
  return (
    <Stack>
      <Stack.Screen name="find-jobs" />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen name="applications" options={{ header: () => <CustomHeader title="My Applications" /> }} />
      <Stack.Screen name="list" options={{ header: () => <CustomHeader title="Jobs" /> }} />
    </Stack>
  );
}
