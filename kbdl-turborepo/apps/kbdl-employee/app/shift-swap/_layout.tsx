import { CustomHeader } from '@/components/ui/header';
import { Stack } from 'expo-router';

export default function ShiftSwapLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="create-shift-swap"
        options={{
          header: () => <CustomHeader title="Create Shifts" />,
        }}
      />
      <Stack.Screen
        name="extra-shifts"
        options={{
          header: () => <CustomHeader title="Extra Shifts" />,
        }}
      />
      <Stack.Screen
        name="scheduled-shifts"
        options={{
          header: () => <CustomHeader title="Scheduled Shifts" />,
        }}
      />
    </Stack>
  );
}
