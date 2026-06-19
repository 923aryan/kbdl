'use client';

import {
  Briefcase,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  MoreVertical,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { EmployerJob, getEmployerJobs } from '../api';
import { JobApplicationsDrawer } from './job-applications-drawer';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const JOB_TYPES = [
  { label: 'All Job Type', value: '' },
  { label: 'Full-Time', value: 'full_time' },
  { label: 'Part-Time', value: 'part_time' },
  { label: 'Contract', value: 'contract' },
  { label: 'Internship', value: 'internship' },
];

const WORK_TYPES = [
  { label: 'All Locations', value: '' },
  { label: 'Remote', value: 'remote' },
  { label: 'On-site', value: 'onsite' },
  { label: 'Hybrid', value: 'hybrid' },
];

const STATUS_OPTIONS = [
  { label: 'All Status', value: '' },
  { label: 'Open', value: 'open' },
  { label: 'Paused', value: 'paused' },
  { label: 'Draft', value: 'draft' },
  { label: 'Closed', value: 'closed' },
  { label: 'Expired', value: 'expired' },
];

const STATS_CONFIG = [
  {
    key: 'totalJobs',
    label: 'Total Jobs',
    sub: 'All Time',
    icon: Briefcase,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
  },
  {
    key: 'activeJobs',
    label: 'Active Jobs',
    sub: 'Currently Live',
    icon: CheckCircle,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-500',
  },
  {
    key: 'draftJobs',
    label: 'Draft Jobs',
    sub: 'Not Published',
    icon: FileText,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-400',
  },
  {
    key: 'totalApplications',
    label: 'Total Applications',
    sub: 'All Jobs',
    icon: Users,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-400',
  },
  {
    key: 'hiresFromJobs',
    label: 'Hires From Jobs',
    sub: 'This Month',
    icon: Users,
    iconBg: 'bg-pink-50',
    iconColor: 'text-pink-400',
  },
];

const STATUS_BADGE: Record<string, { dot: string; pill: string; label: string }> = {
  open: {
    dot: 'bg-green-500',
    pill: 'bg-green-50 text-green-700 border-green-200',
    label: 'Active',
  },
  paused: {
    dot: 'bg-orange-400',
    pill: 'bg-orange-50 text-orange-600 border-orange-200',
    label: 'Paused',
  },
  draft: { dot: 'bg-gray-400', pill: 'bg-gray-100 text-gray-500 border-gray-200', label: 'Draft' },
  closed: { dot: 'bg-red-400', pill: 'bg-red-50 text-red-600 border-red-200', label: 'Closed' },
  expired: {
    dot: 'bg-gray-300',
    pill: 'bg-gray-50 text-gray-400 border-gray-200',
    label: 'Expired',
  },
};

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function StatCard({
  label,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
  value,
}: {
  label: string;
  sub: string;
  icon: typeof Briefcase;
  iconBg: string;
  iconColor: string;
  value: number | string | null;
}) {
  return (
    <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-4 shadow-sm">
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}
      >
        <Icon size={18} className={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">
          {value == null ? <span className="text-gray-300 text-xl">—</span> : value}
        </p>
        <p className="text-[11px] text-gray-400">{sub}</p>
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-700 cursor-pointer outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-medium"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_BADGE[status] ?? {
    dot: 'bg-gray-400',
    pill: 'bg-gray-100 text-gray-500 border-gray-200',
    label: status,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.pill}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function JobRow({
  job,
  onViewApplications,
  onUpdateStatus,
}: {
  job: EmployerJob;
  onViewApplications: (job: EmployerJob) => void;
  onUpdateStatus?: (jobId: string, status: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const postedDate = job.created_at
    ? new Date(job.created_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors group">
      {/* Job Title */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Briefcase size={14} className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 leading-tight">{job.title}</p>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">
              {job.employment_type?.replace('_', '-') ?? ''}
            </p>
          </div>
        </div>
      </td>
      {/* Location */}
      <td className="px-5 py-3.5 text-sm text-gray-600 capitalize">
        {job.work_type ?? job.location ?? '—'}
        <div className="truncate max-w-[150px]" title={(job as any).address || job.location || '—'}>
          {(job as any).address || job.location || '—'}
        </div>
      </td>
      {/* Applications */}
      <td className="px-5 py-3.5 text-sm text-gray-700">{job.application_count ?? 0}</td>
      {/* Hires */}
      <td className="px-5 py-3.5 text-sm text-gray-700">{job.hire_count ?? 0}</td>
      {/* Status */}
      <td className="px-5 py-3.5">
        <StatusBadge status={job.status} />
      </td>
      {/* Posted On */}
      <td className="px-5 py-3.5 text-sm text-gray-500">{postedDate}</td>
      {/* Action */}
      <td className="px-5 py-3.5 relative">
        <div className="relative inline-block text-left">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1 flex flex-col">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onViewApplications(job);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700 transition-colors"
                >
                  View Applications
                </button>
                <Link
                  href={`/jobs/${job.id}/edit`}
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700 transition-colors"
                >
                  Edit Job
                </Link>
                {job.status === 'draft' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onUpdateStatus?.(job.id, 'open');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 text-blue-600 transition-colors"
                  >
                    Publish Job
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    // Action placeholder for backend delete job
                    alert('Delete functionality is pending backend integration.');
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 text-red-600 transition-colors"
                >
                  Delete Job
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={7}>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <Briefcase size={26} className="text-blue-400" />
          </div>
          <p className="text-sm font-semibold text-gray-600 mb-1">No jobs posted yet</p>
          <p className="text-xs text-gray-400 mb-4">
            Create your first job posting to start receiving applications
          </p>
          <Link
            href="/jobs/create"
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors"
          >
            <Plus size={13} />
            Create Job
          </Link>
        </div>
      </td>
    </tr>
  );
}

function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Show at most 5 page buttons around current
  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
      <p className="text-xs text-gray-400">
        {total === 0 ? 'Showing 0 jobs' : `Showing ${from} to ${to} of ${total} jobs`}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={13} />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span
              key={`ellipsis-${i}`}
              className="w-7 h-7 flex items-center justify-center text-xs text-gray-400"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-medium transition-colors ${
                p === page
                  ? 'bg-blue-600 text-white border border-blue-600'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function JobsDashboardScreen() {
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState('');
  const [jobType, setJobType] = useState('');
  const [location, setLocation] = useState('');
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState<EmployerJob | null>(null);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const result = await getEmployerJobs({
        page,
        limit: pageSize,
        status: status || undefined,
        search: search || undefined,
        employment_type: jobType || undefined,
        work_type: location || undefined,
      });
      setJobs(result.jobs);
      setTotal(result.meta.total ?? result.jobs.length);
      setPage(result.meta.page ?? page);
      setPageSize(result.meta.pageSize ?? pageSize);
    } catch (error) {
      console.error('Unable to load jobs', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (jobId: string, newStatus: string) => {
    // TODO: Connect with backend when API is available.
    // e.g. await updateEmployerJob(jobId, { status: newStatus });
    // loadJobs();
    alert(`Change status to ${newStatus} is triggered. Implement API call here.`);
  };

  useEffect(() => {
    loadJobs();
  }, [page, status, jobType, location, search]);

  // Reset page when filters change (not page itself)
  const handleFilter = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  const stats = useMemo(() => {
    const activeJobs = jobs.filter((job) => job.status === 'open').length;
    const draftJobs = jobs.filter((job) => job.status === 'draft').length;
    return {
      totalJobs: total || null,
      activeJobs: activeJobs || null,
      draftJobs: draftJobs || null,
      totalApplications: null, // from dedicated API endpoint
      hiresFromJobs: null, // from dedicated API endpoint
    };
  }, [jobs, total]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {/* ── Page header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Jobs</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage all job posting and track applications
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search Employee..."
                className="bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm w-48 text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              />
            </div>
            {/* Create button */}
            <Link
              href="/jobs/create"
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={15} />+ Create Job
            </Link>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-5 gap-3">
          {STATS_CONFIG.map((card) => (
            <StatCard
              key={card.key}
              label={card.label}
              sub={card.sub}
              icon={card.icon}
              iconBg={card.iconBg}
              iconColor={card.iconColor}
              value={stats[card.key as keyof typeof stats]}
            />
          ))}
        </div>

        {/* ── Table card ── */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Filter row — right-aligned, inside the card above the table */}
          <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-b border-gray-100">
            <FilterSelect value={jobType} onChange={handleFilter(setJobType)} options={JOB_TYPES} />
            <FilterSelect
              value={location}
              onChange={handleFilter(setLocation)}
              options={WORK_TYPES}
            />
            <FilterSelect
              value={status}
              onChange={handleFilter(setStatus)}
              options={STATUS_OPTIONS}
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  {[
                    { label: 'Job Title', cls: 'w-[30%]' },
                    { label: 'Location', cls: 'w-[13%]' },
                    { label: 'Applications', cls: 'w-[13%]' },
                    { label: 'Hires', cls: 'w-[8%]' },
                    { label: 'Status', cls: 'w-[12%]' },
                    { label: 'Posted On', cls: 'w-[14%]' },
                    { label: 'Action', cls: 'w-[8%]' },
                  ].map(({ label, cls }) => (
                    <th
                      key={label}
                      className={`text-left text-xs font-semibold text-gray-400 px-5 py-3 ${cls}`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-20 text-sm text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                        Loading jobs…
                      </div>
                    </td>
                  </tr>
                ) : jobs.length === 0 ? (
                  <EmptyState />
                ) : (
                  jobs.map((job) => (
                    <JobRow
                      key={job.id}
                      job={job}
                      onViewApplications={setSelectedJob}
                      onUpdateStatus={handleUpdateStatus}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination page={page} total={total} pageSize={pageSize} onPageChange={setPage} />
        </div>
      </div>

      <JobApplicationsDrawer
        open={Boolean(selectedJob)}
        jobId={selectedJob?.id}
        jobTitle={selectedJob?.title}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
}
