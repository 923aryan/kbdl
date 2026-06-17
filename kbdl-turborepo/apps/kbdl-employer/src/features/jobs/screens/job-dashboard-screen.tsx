'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Briefcase,
  CheckCircle,
  FileText,
  Users,
  Target,
  MoreVertical,
} from 'lucide-react';

// ─── API LAYER ────────────────────────────────────────────────────────────────
// When connecting to your backend, only change these functions.
// All component logic stays the same.

async function fetchJobStats() {
  // TODO: replace with real API call
  // const res = await fetch("/api/jobs/stats");
  // return res.json();
  return {
    totalJobs: null,
    activeJobs: null,
    draftJobs: null,
    totalApplications: null,
    hiresFromJobs: null,
  };
}

async function fetchJobs({ jobType, location, status, page, search }) {
  // TODO: replace with real API call
  // const params = new URLSearchParams({ jobType, location, status, page, search });
  // const res = await fetch(`/api/jobs?${params}`);
  // return res.json();  // expected: { jobs: [...], total: number, page: number, pageSize: number }
  return { jobs: [], total: 0, page: 1, pageSize: 10 };
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STATS_CONFIG = [
  {
    key: 'totalJobs',
    label: 'Total Jobs',
    sub: 'All Time',
    icon: Briefcase,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    key: 'activeJobs',
    label: 'Active Jobs',
    sub: 'Currently Live',
    icon: CheckCircle,
    color: 'bg-green-50 text-green-600',
  },
  {
    key: 'draftJobs',
    label: 'Draft Jobs',
    sub: 'Not Published',
    icon: FileText,
    color: 'bg-orange-50 text-orange-600',
  },
  {
    key: 'totalApplications',
    label: 'Total Applications',
    sub: 'All Jobs',
    icon: Users,
    color: 'bg-purple-50 text-purple-600',
  },
  {
    key: 'hiresFromJobs',
    label: 'Hires from Jobs',
    sub: 'This Month',
    icon: Target,
    color: 'bg-pink-50 text-pink-600',
  },
];

const STATUS_STYLES = {
  Active: 'bg-green-50 text-green-700 border border-green-200',
  Paused: 'bg-orange-50 text-orange-700 border border-orange-200',
  Draft: 'bg-gray-100 text-gray-600 border border-gray-200',
};

const STATUS_DOT = {
  Active: 'bg-green-500',
  Paused: 'bg-orange-500',
  Draft: 'bg-gray-400',
};

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function StatCard({ label, sub, icon: Icon, color, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-800">{label}</p>
        <p className="text-xl font-bold text-gray-900 leading-tight">
          {value == null ? <span className="text-gray-300">—</span> : value}
        </p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] ?? 'bg-gray-400'}`} />
      {status}
    </span>
  );
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={7}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Briefcase size={28} className="text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-500 mb-1">No jobs posted yet</p>
          <p className="text-xs text-gray-400">
            Create your first job posting to start receiving applications
          </p>
        </div>
      </td>
    </tr>
  );
}

function Pagination({ page, total, pageSize, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <p className="text-xs text-gray-400">
        {total === 0 ? 'Showing 0 of 0 jobs' : `Showing ${from}–${to} of ${total} jobs`}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-xs text-gray-500 disabled:opacity-40 hover:bg-gray-50"
        >
          ‹
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-7 h-7 rounded-md border text-xs font-medium ${
              p === page
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-xs text-gray-500 disabled:opacity-40 hover:bg-gray-50"
        >
          ›
        </button>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export function JobsDashboardScreen() {
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState('');
  const [jobType, setJobType] = useState('All Job Type');
  const [location, setLocation] = useState('All Locations');
  const [status, setStatus] = useState('All Status');
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 10;

  // Load stats once on mount
  useEffect(() => {
    fetchJobStats().then(setStats);
  }, []);

  // Reload table whenever filters or page changes
  useEffect(() => {
    setLoading(true);
    fetchJobs({ jobType, location, status, page, search })
      .then(({ jobs, total }) => {
        setJobs(jobs);
        setTotal(total);
      })
      .finally(() => setLoading(false));
  }, [jobType, location, status, page, search]);

  // Reset to page 1 when filters change
  function handleFilter(setter) {
    return (e) => {
      setter(e.target.value);
      setPage(1);
    };
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Jobs</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage all job posting and track applications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={handleFilter(setSearch)}
              placeholder="Search Employee..."
              className="bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-xs w-48 text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
            />
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg px-4 py-2 flex items-center gap-1.5 transition-colors">
            <Plus size={14} />
            Create Job
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {STATS_CONFIG.map(({ key, label, sub, icon, color }) => (
          <StatCard
            key={key}
            label={label}
            sub={sub}
            icon={icon}
            color={color}
            value={stats?.[key]}
          />
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center justify-end gap-2 mb-3">
        {[
          {
            value: jobType,
            setter: setJobType,
            options: ['All Job Type', 'Full-Time', 'Part-Time', 'Contract', 'Internship'],
          },
          {
            value: location,
            setter: setLocation,
            options: ['All Locations', 'Remote', 'On-site', 'Hybrid'],
          },
          {
            value: status,
            setter: setStatus,
            options: ['All Status', 'Active', 'Paused', 'Draft'],
          },
        ].map(({ value, setter, options }) => (
          <select
            key={value}
            value={value}
            onChange={handleFilter(setter)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 appearance-none cursor-pointer outline-none focus:border-blue-500"
          >
            {options.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[
                'Job Title',
                'Location',
                'Applications',
                'Hires',
                'Status',
                'Posted On',
                'Action',
              ].map((h) => (
                <th
                  key={h}
                  className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-xs text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <EmptyState />
            ) : (
              jobs.map((job) => (
                <tr
                  key={job.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-blue-50 rounded-md flex items-center justify-center flex-shrink-0">
                        <Briefcase size={15} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{job.title}</p>
                        <p className="text-xs text-gray-400">{job.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{job.location}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{job.applicationCount}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{job.hireCount}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{job.postedOn}</td>
                  <td className="px-4 py-3">
                    <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <Pagination page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>
    </div>
  );
}
