'use client';

import { DataPagination } from '@/components/ui/pagination';
import {
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Edit3,
  Search,
  ShieldCheck,
  UserRoundCheck,
  UserRoundX,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { Fragment, useMemo, useState } from 'react';
import { attendanceRecords, type AttendanceRecord, type AttendanceStatus } from '../data';

const ROWS_PER_PAGE = 7;

const statusStyles: Record<AttendanceStatus, string> = {
  'On Time': 'border-[#4CAF50] bg-[#E5FFEB] text-[#4CAF50]',
  Absent: 'border-[#F54A4A] bg-[#FEE9E5] text-[#F54A4A]',
  Late: 'border-[#FFA000] bg-[#FFF4E3] text-[#FFA000]',
  'Half Day': 'border-[#525252] bg-[#E5E5E5] text-[#525252]',
  Leave: 'border-[#6366F1] bg-[#EEF2FF] text-[#4F46E5]',
};

export function AttendanceDashboardScreen() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(attendanceRecords[0]?.id ?? '');
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  const filteredRecords = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return attendanceRecords;

    return attendanceRecords.filter((record) =>
      [record.employee, record.employeeId, record.supervisor, record.status, record.date]
        .join(' ')
        .toLowerCase()
        .includes(search),
    );
  }, [query]);

  const pageRecords = filteredRecords.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  return (
    <div className="min-h-screen bg-[#F6F7F9] text-[#111827]">
      <AttendanceTopBar />
      <main className="space-y-7 p-5 lg:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[28px] font-bold tracking-normal">Attendance</h1>
            <p className="mt-1 text-sm text-[#676767]">
              Summary of daily Clock-Ins, overtimes and presence status for October 2026
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="inline-flex h-12 items-center justify-center gap-3 rounded-xl border border-[#D3D3D3] bg-white px-5 text-base font-semibold text-[#061A3D] shadow-sm"
            >
              June, 2026
              <Calendar className="h-5 w-5" />
            </button>
            <Link
              href="/attendance/add"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-[#0658C2] px-7 text-base font-semibold text-white shadow-sm transition hover:bg-[#054A9F]"
            >
              + Add Attendance
            </Link>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <MetricCard title="Present Today" value="265 Employees" note="+12 percent vs yesterday" icon={BriefcaseBusiness} color="blue" />
          <MetricCard title="Late Arrivals" value="62 Employees" note="23%" icon={Clock3} color="green" />
          <MetricCard title="Total Absent" value="42 Employees" note="16%" icon={CheckCircle2} color="amber" />
          <MetricCard title="On Leave" value="18 Employees" note="Approved leave requests" icon={ShieldCheck} color="violet" />
        </section>

        <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search keywords..."
                className="h-12 w-full rounded-lg border border-[#D3D3D3] bg-white px-5 pr-12 text-sm outline-none focus:border-[#0658C2]"
              />
            </div>

            <button
              type="button"
              className="inline-flex h-12 items-center justify-center gap-4 rounded-lg border border-[#D3D3D3] bg-white px-5 font-semibold text-[#061A3D]"
            >
              11 June, 2026
              <Calendar className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead>
                <tr className="bg-[#FAFAFA] text-[15px] text-[#676767]">
                  <th className="rounded-l-lg px-5 py-3 font-semibold">Employee</th>
                  <th className="px-5 py-3 font-semibold">Supervisor</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Time Log</th>
                  <th className="px-5 py-3 font-semibold">Worked Hours</th>
                  <th className="px-5 py-3 font-semibold">Overtime</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="rounded-r-lg px-5 py-3 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageRecords.map((record) => {
                  const expanded = expandedId === record.id && record.punchLogs.length > 0;
                  return (
                    <Fragment key={record.id}>
                      <tr className="border-b border-[#D3D3D3]">
                        <td className="px-5 py-3">
                          <p className="font-semibold text-[#111827]">{record.employee}</p>
                          <p className="text-xs text-[#676767]">ID: {record.employeeId}</p>
                        </td>
                        <td className="px-5 py-3 font-medium">{record.supervisor}</td>
                        <td className="px-5 py-3">{record.date}</td>
                        <td className="px-5 py-3">
                          {record.status === 'Late' ? (
                            <>
                              <span className="text-[#FFA000]">10:20AM</span> - 09:30PM
                            </>
                          ) : (
                            record.timeLog
                          )}
                        </td>
                        <td className="px-5 py-3">{record.workedHours}</td>
                        <td className="px-5 py-3">{record.overtime}</td>
                        <td className="px-5 py-3">
                          <StatusBadge status={record.status} />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-center gap-4 text-[#0658C2]">
                            <button
                              type="button"
                              onClick={() => setEditingRecord(record)}
                              className="rounded-md p-1 transition hover:bg-[#DBEAFF]"
                              aria-label={`Edit attendance for ${record.employee}`}
                            >
                              <Edit3 className="h-5 w-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpandedId(expanded ? '' : record.id)}
                              className="rounded-md p-1 transition hover:bg-[#DBEAFF]"
                              aria-label={`Toggle punch logs for ${record.employee}`}
                            >
                              {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expanded && (
                        <tr>
                          <td colSpan={8} className="border-b border-[#D3D3D3] bg-[#FAFAFA] px-5 py-0">
                            <div className="overflow-hidden rounded-lg">
                              <div className="grid grid-cols-2 border-b border-[#D3D3D3] bg-white px-5 py-3 font-semibold">
                                <span>Time</span>
                                <span className="text-right">Type</span>
                              </div>
                              {record.punchLogs.map((log) => (
                                <div
                                  key={`${record.id}-${log.time}`}
                                  className="grid grid-cols-2 border-b border-[#D3D3D3] px-5 py-3 text-[#676767] last:border-b-0"
                                >
                                  <span>{log.time}</span>
                                  <span className="text-right">{log.type}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredRecords.length === 0 && (
            <div className="py-14 text-center text-sm text-[#676767]">No attendance records found.</div>
          )}

          <DataPagination
            currentPage={page}
            pageSize={ROWS_PER_PAGE}
            totalItems={filteredRecords.length}
            onPageChange={setPage}
            showSummary={false}
            className="border-t-0 px-0 pb-0"
          />
        </section>
      </main>

      {editingRecord && <UpdateAttendanceModal record={editingRecord} onClose={() => setEditingRecord(null)} />}
    </div>
  );
}

function AttendanceTopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#D3D3D3] bg-white px-4 sm:px-6 lg:px-8">
      <div className="relative hidden w-full max-w-[310px] sm:block">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />
        <input
          placeholder="Search anything..."
          className="h-12 w-full rounded-lg bg-[#FAFAFA] pl-12 pr-4 text-sm outline-none"
        />
      </div>
      <div className="ml-auto flex items-center gap-5">
        <UserRoundCheck className="h-5 w-5 text-[#676767]" />
        <UserRoundX className="h-5 w-5 text-[#676767]" />
        <div className="hidden h-8 w-px bg-[#E5E7EB] sm:block" />
        <div className="text-right">
          <p className="text-sm font-semibold">Abhinav Barwal</p>
          <p className="text-xs text-[#676767]">Operations Head</p>
        </div>
      </div>
    </header>
  );
}

function MetricCard({
  title,
  value,
  note,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  note: string;
  icon: typeof BriefcaseBusiness;
  color: 'blue' | 'green' | 'amber' | 'violet';
}) {
  const colorMap = {
    blue: 'bg-[#DBEAFF] text-[#0658C2]',
    green: 'bg-[#E5FFEB] text-[#4CAF50]',
    amber: 'bg-[#FFF4E3] text-[#FFA000]',
    violet: 'bg-[#EDE9FE] text-[#8B5CF6]',
  };

  return (
    <div className="min-h-[125px] rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-[#676767]">{title}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorMap[color]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-6 text-xl font-bold">{value}</p>
      <p className="mt-2 text-xs text-[#676767]">{note}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: AttendanceStatus }) {
  return (
    <span className={`inline-flex min-w-[76px] items-center justify-center rounded-md border px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
      {status}
    </span>
  );
}

function UpdateAttendanceModal({ record, onClose }: { record: AttendanceRecord; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-[530px] rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Update Attendance</h2>
          <button type="button" onClick={onClose} aria-label="Close update attendance">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="rounded-lg border border-[#D3D3D3] p-5">
          <div className="grid gap-4">
            <AttendanceField label="Check-in Time" required placeholder="EXP : 9 AM" defaultValue={record.timeLog.split(' - ')[0] === '-' ? '' : record.timeLog.split(' - ')[0]} />
            <AttendanceField label="Check-out Time" required placeholder="EXP: 7PM" defaultValue={record.timeLog.split(' - ')[1] ?? ''} />
            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                Reason <span className="text-[#F54A4A]">*</span>
              </span>
              <textarea
                placeholder="Reason for manual attendance"
                className="h-[102px] w-full resize-none rounded-lg border border-[#E5E7EB] px-4 py-4 text-sm outline-none focus:border-[#0658C2]"
              />
            </label>
          </div>
          <div className="mt-5 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="h-12 rounded-xl border border-[#0658C2] px-10 font-semibold text-[#061A3D]">
              Cancel
            </button>
            <button type="button" onClick={onClose} className="h-12 rounded-xl bg-[#0658C2] px-11 font-semibold text-white">
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AttendanceField({
  label,
  placeholder,
  required,
  defaultValue,
}: {
  label: string;
  placeholder: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">
        {label} {required && <span className="text-[#F54A4A]">*</span>}
      </span>
      <input
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#0658C2]"
      />
    </label>
  );
}
