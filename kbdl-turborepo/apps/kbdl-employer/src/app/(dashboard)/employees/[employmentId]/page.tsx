'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { EmployeeDetailScreen } from '@/features/employees';

function EmployeeDetailPageContent() {
  const params = useParams<{ employmentId: string }>();
  return <EmployeeDetailScreen employmentId={params.employmentId} />;
}

export default function EmployeeDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f7f7f8] p-[20px] text-center text-sm text-[#676767]">
          Loading employee profile…
        </div>
      }
    >
      <EmployeeDetailPageContent />
    </Suspense>
  );
}
