'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Check,
  CheckCircle2,
  ClipboardList,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  UserCheck,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { EmployerJob, EmployerJobStats, getEmployerJobs } from '../api';
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

const EMPTY_JOB_STATS: EmployerJobStats = {
  totalJobs: 0,
  activeJobs: 0,
  draftJobs: 0,
  totalApplications: 0,
  hiresFromJobs: 0,
};

function buildFallbackJobStats(jobs: EmployerJob[], totalJobs: number): EmployerJobStats {
  return {
    totalJobs,
    activeJobs: jobs.filter((job) => job.status === 'open').length,
    draftJobs: jobs.filter((job) => job.status === 'draft').length,
    totalApplications: jobs.reduce((sum, job) => sum + (job.application_count ?? 0), 0),
    hiresFromJobs: jobs.reduce((sum, job) => sum + (job.hire_count ?? 0), 0),
  };
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function FilterSelect({
  value,
  onChange,
  options,
  isOpen,
  onOpenChange,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const selected = options.find((option) => option.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        className="flex h-12 min-w-[210px] cursor-pointer items-center justify-between rounded-xl border border-gray-300 bg-white px-6 text-base font-semibold text-gray-900"
      >
        <span>{selected?.label || options[0]?.label}</span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-14 z-20 w-64 rounded-xl border border-blue-100 bg-white p-3 shadow-xl">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                onOpenChange(false);
              }}
              className={`mb-1 flex w-full items-center justify-between rounded-md px-4 py-3 text-left text-sm font-medium ${
                value === option.value
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-900 hover:bg-gray-50'
              }`}
            >
              {option.label}
              {value === option.value && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
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
      className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium ${cfg.pill}`}
    >
      <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClassName,
  iconBgClassName,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: LucideIcon;
  iconClassName: string;
  iconBgClassName: string;
}) {
  return (
    <div className="flex min-h-[86px] items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBgClassName}`}
      >
        <Icon className={`h-5 w-5 ${iconClassName}`} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-gray-600">{title}</p>
        <p className="mt-0.5 text-2xl font-bold leading-none text-gray-900">
          {value.toLocaleString('en-IN')}
        </p>
        <p className="mt-1 text-xs font-medium text-gray-400">{subtitle}</p>
      </div>
    </div>
  );
}

function formatJobLabel(value?: string | null) {
  return value ? value.replace(/_/g, ' ') : '—';
}

function formatJobDate(value?: string | null) {
  return value
    ? new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';
}

function formatSalary(job: EmployerJob) {
  if (job.salary_min == null && job.salary_max == null) return '—';

  const min = job.salary_min == null ? '0' : job.salary_min.toLocaleString('en-IN');
  const max = job.salary_max == null ? 'Open' : job.salary_max.toLocaleString('en-IN');
  return `Rs ${min} - ${max} / ${formatJobLabel(job.salary_type)}`;
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase text-gray-400">{label}</p>
      <div className="mt-1 text-sm font-medium text-gray-900 capitalize">{value}</div>
    </div>
  );
}

function JobDetailsModal({ job, onClose }: { job: EmployerJob | null; onClose: () => void }) {
  if (!job) return null;

  const status = job.status ?? 'draft';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={status} />
              <span className="text-xs font-medium text-gray-400 capitalize">
                {formatJobLabel(job.employment_type)}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{job.title}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {job.address || formatJobLabel(job.work_type)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close job details"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <DetailItem label="Openings" value={job.seats_available ?? '—'} />
            <DetailItem label="Applications" value={job.application_count ?? 0} />
            <DetailItem label="Hires" value={job.hire_count ?? 0} />
            <DetailItem label="Work Type" value={formatJobLabel(job.work_type)} />
            <DetailItem label="Employment" value={formatJobLabel(job.employment_type)} />
            <DetailItem label="Salary" value={formatSalary(job)} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">Description</h3>
            <p className="mt-2 whitespace-pre-wrap rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-700">
              {job.description || 'No description provided.'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <DetailItem label="Start Time" value={formatJobDate(job.job_start_time)} />
            <DetailItem label="End Time" value={formatJobDate(job.job_end_time)} />
            <DetailItem label="Expires At" value={formatJobDate(job.expires_at)} />
            <DetailItem label="Posted On" value={formatJobDate(job.created_at)} />
            <DetailItem label="Negotiable" value={job.is_negotiable ? 'Yes' : 'No'} />
            <DetailItem label="Company" value={job.employer?.name || 'Your company'} />
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <Link
              href={`/jobs/${job.id}/edit`}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Edit Job
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function JobRow({
  job,
  onViewApplications,
  onViewDetails,
  onUpdateStatus,
}: {
  job: EmployerJob;
  onViewApplications: (job: EmployerJob) => void;
  onViewDetails: (job: EmployerJob) => void;
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
  const status = job.status ?? 'draft';
  const locationLabel = job.address || job.work_type || '—';

  return (
    <tr
      onClick={() => onViewDetails(job)}
      className="bg-white transition hover:bg-gray-50/80 cursor-pointer"
    >
      {/* Job Title */}
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
            <Briefcase size={16} />
          </div>
          <div>
            <p className="font-medium text-gray-900 leading-tight">{job.title}</p>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">
              {job.employment_type?.replace('_', '-') ?? ''}
            </p>
          </div>
        </div>
      </td>
      {/* Location */}
      <td className="px-5 py-3 text-gray-600 capitalize">
        <p className="font-medium text-gray-900">{formatJobLabel(job.work_type)}</p>
        <div className="truncate max-w-[150px]" title={locationLabel}>
          {locationLabel}
        </div>
      </td>
      {/* Applications */}
      <td className="px-5 py-3 font-medium text-gray-900">{job.application_count ?? 0}</td>
      {/* Hires */}
      <td className="px-5 py-3 font-medium text-gray-900">{job.hire_count ?? 0}</td>
      {/* Status */}
      <td className="px-5 py-3">
        <StatusBadge status={status} />
      </td>
      {/* Posted On */}
      <td className="px-5 py-3 font-medium text-gray-900">{postedDate}</td>
      {/* Action */}
      <td className="px-5 py-3 relative" onClick={(event) => event.stopPropagation()}>
        <div className="relative flex justify-center text-left">
          <button
            onClick={(event) => {
              event.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full text-blue-600 transition hover:bg-blue-50"
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
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700 transition-colors"
                >
                  Edit Job
                </Link>
                {status === 'draft' && (
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
    <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
      <p>
        Showing <span className="font-medium text-gray-900">{from}</span>-
        <span className="font-medium text-gray-900">{to}</span> of{' '}
        <span className="font-medium text-gray-900">{total}</span>
      </p>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span
              key={`ellipsis-${i}`}
              className="flex h-9 w-9 items-center justify-center text-sm text-gray-400"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p as number)}
              className={`h-9 min-w-9 rounded-md border px-3 text-sm font-medium transition ${
                p === page
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-200 text-gray-700 hover:border-blue-200 hover:bg-blue-50'
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
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
  const [stats, setStats] = useState<EmployerJobStats>(EMPTY_JOB_STATS);
  const [status, setStatus] = useState('');
  const [jobType, setJobType] = useState('');
  const [location, setLocation] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'jobType' | 'location' | 'status' | null>(null);
  const [selectedJob, setSelectedJob] = useState<EmployerJob | null>(null);
  const [selectedDetailsJob, setSelectedDetailsJob] = useState<EmployerJob | null>(null);

  const loadJobs = useCallback(async () => {
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
      const nextTotal = result.meta.total ?? result.jobs.length;
      setJobs(result.jobs);
      setTotal(nextTotal);
      setPage(result.meta.page ?? page);
      setPageSize(result.meta.pageSize ?? result.meta.limit ?? pageSize);
      setStats(result.meta.stats ?? buildFallbackJobStats(result.jobs, nextTotal));
    } catch (error) {
      console.error('Unable to load jobs', error);
    } finally {
      setLoading(false);
    }
  }, [jobType, location, page, pageSize, search, status]);

  const handleUpdateStatus = async (jobId: string, newStatus: string) => {
    // TODO: Connect with backend when API is available.
    // e.g. await updateEmployerJob(jobId, { status: newStatus });
    // loadJobs();
    alert(`Change status to ${newStatus} is triggered. Implement API call here.`);
  };

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Reset page when filters change (not page itself)
  const handleFilter = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  const statCards = [
    {
      title: 'Total Jobs',
      value: stats.totalJobs,
      subtitle: 'All Time',
      icon: Briefcase,
      iconBgClassName: 'bg-blue-50',
      iconClassName: 'text-blue-600',
    },
    {
      title: 'Active Jobs',
      value: stats.activeJobs,
      subtitle: 'Currently Live',
      icon: CheckCircle2,
      iconBgClassName: 'bg-green-50',
      iconClassName: 'text-green-600',
    },
    {
      title: 'Draft Jobs',
      value: stats.draftJobs,
      subtitle: 'Not Published',
      icon: ClipboardList,
      iconBgClassName: 'bg-orange-50',
      iconClassName: 'text-orange-500',
    },
    {
      title: 'Total Applications',
      value: stats.totalApplications,
      subtitle: 'All Jobs',
      icon: Users,
      iconBgClassName: 'bg-purple-50',
      iconClassName: 'text-purple-600',
    },
    {
      title: 'Hires From Jobs',
      value: stats.hiresFromJobs,
      subtitle: 'This Month',
      icon: UserCheck,
      iconBgClassName: 'bg-pink-50',
      iconClassName: 'text-pink-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-5 lg:p-6">
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* ── Page header ── */}
        <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wide text-gray-900">Jobs</h1>
            <p className="mt-1 text-xs text-gray-500">Manage Jobs</p>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Link
              href="/jobs/create"
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus size={16} />
              Create New Job
            </Link>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row xl:items-center xl:justify-between">
          <div className="relative max-w-full flex-1 lg:max-w-[500px]">
            <Search
              className="absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-black"
              aria-hidden="true"
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search keywords..."
              className="h-11 w-full rounded-lg border border-gray-300 px-6 pr-14 text-sm outline-none focus:border-[#0658C2]"
            />
          </div>

          <div className="flex flex-row flex-wrap gap-4 sm:flex-row">
            <FilterSelect
              value={jobType}
              onChange={handleFilter(setJobType)}
              options={JOB_TYPES}
              isOpen={activeFilter === 'jobType'}
              onOpenChange={(isOpen) => setActiveFilter(isOpen ? 'jobType' : null)}
            />
            <FilterSelect
              value={location}
              onChange={handleFilter(setLocation)}
              options={WORK_TYPES}
              isOpen={activeFilter === 'location'}
              onOpenChange={(isOpen) => setActiveFilter(isOpen ? 'location' : null)}
            />
            <FilterSelect
              value={status}
              onChange={handleFilter(setStatus)}
              options={STATUS_OPTIONS}
              isOpen={activeFilter === 'status'}
              onOpenChange={(isOpen) => setActiveFilter(isOpen ? 'status' : null)}
            />
          </div>
        </div>

        {/* ── Table card ── */}
        <div className="grid grid-cols-1 gap-4 px-5 pb-4 sm:grid-cols-2 xl:grid-cols-5">
          {statCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>

        <div className="overflow-hidden rounded-b-xl border border-t-0 border-gray-200 bg-white">
          {/* Filter row — right-aligned, inside the card above the table */}
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-gray-50 text-xs font-medium text-gray-500">
                <tr>
                  <th className="px-5 py-3">Job Title</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Applications</th>
                  <th className="px-5 py-3">Hires</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Posted On</th>
                  <th className="px-5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
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
                      onViewDetails={setSelectedDetailsJob}
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
      <JobDetailsModal job={selectedDetailsJob} onClose={() => setSelectedDetailsJob(null)} />
    </div>
  );
}
