import { Suspense } from 'react';
import { AttendanceDashboardScreen } from '@/features/attendance';

export default function AttendancePage() {
  return (
    <Suspense fallback={null}>
      <AttendanceDashboardScreen />
    </Suspense>
  );
}
