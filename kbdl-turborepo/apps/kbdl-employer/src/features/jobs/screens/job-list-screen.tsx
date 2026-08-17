'use client';

import { Plus, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { EmployerJob } from '../api';

interface JobListScreenProps {
  jobs: EmployerJob[];
  loading: boolean;
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onCreate?: () => void;
  onViewApplications?: (job: EmployerJob) => void;
}

export function JobListScreen({
  jobs,
  loading,
  page,
  total,
  pageSize,
  onPageChange,
  onCreate,
  onViewApplications,
}: JobListScreenProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Job listings</h3>
          <p className="mt-1 text-sm text-slate-600">Browse the jobs created by your company.</p>
        </div>
        {onCreate ? (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={14} />
            <span className="ml-2">New job</span>
          </button>
        ) : (
          <Link
            href="/jobs/create"
            className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={14} />
            <span className="ml-2">New job</span>
          </Link>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 gap-px border-b border-slate-200 bg-slate-100 text-sm text-slate-500 md:grid-cols-[2.5fr_1.3fr_1fr_1fr_1fr]">
          <div className="p-4 font-medium">Job title</div>
          <div className="p-4 font-medium">Type</div>
          <div className="p-4 font-medium">Location</div>
          <div className="p-4 font-medium">Status</div>
          <div className="p-4 font-medium">Actions</div>
        </div>

        {loading ? (
          <div className="p-6 text-center text-sm text-slate-500">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No job listings available yet.
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className="grid grid-cols-1 gap-px border-b border-slate-200 bg-white text-sm text-slate-700 md:grid-cols-[2.5fr_1.3fr_1fr_1fr_1fr] hover:bg-slate-50"
            >
              <div className="p-4">
                <p className="font-medium text-slate-900">{job.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {job.employer?.name ?? 'Your company'}
                </p>
              </div>
              <div className="p-4 text-sm text-slate-600">
                {job.employment_type?.replace('_', ' ') ?? '—'}
              </div>
              <div className="p-4 text-sm text-slate-600">{job.work_type ?? '—'}</div>
              <div className="p-4">
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {job.status ?? 'draft'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 p-4">
                {onViewApplications && (
                  <button
                    type="button"
                    onClick={() => onViewApplications(job)}
                    className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    View applications
                  </button>
                )}
                <Link
                  href={`/jobs/${job.id}/edit`}
                  className="inline-flex items-center rounded-full bg-slate-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-900"
                >
                  Details
                  <ChevronRight size={14} className="ml-1" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between rounded-b-3xl border border-t-0 border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span>
          Showing {jobs.length} of {total} jobs
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition disabled:opacity-40 hover:bg-slate-100"
          >
            Prev
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition disabled:opacity-40 hover:bg-slate-100"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
