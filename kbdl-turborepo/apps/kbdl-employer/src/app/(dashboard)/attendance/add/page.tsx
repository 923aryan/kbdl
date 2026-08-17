import { Suspense } from 'react';
import { AddAttendanceScreen } from '@/features/attendance';

export default function AddAttendancePage() {
  return (
    <Suspense fallback={null}>
      <AddAttendanceScreen />
    </Suspense>
  );
}
