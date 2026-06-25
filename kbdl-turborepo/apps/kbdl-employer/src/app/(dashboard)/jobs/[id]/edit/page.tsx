'use client';

import { useParams } from 'next/navigation';
import { CreateJobScreen } from '@/features/jobs/screens/create-job-screen';

export default function EditJobPage() {
  const params = useParams<{ id: string }>();

  return <CreateJobScreen jobId={params.id} />;
}
