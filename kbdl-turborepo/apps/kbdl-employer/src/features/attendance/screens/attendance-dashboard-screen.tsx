'use client';

import { DataPagination } from '@/components/ui/pagination';
import {
  AlertTriangle,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  UserRoundCheck,
  UserRoundX,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
  bulkMarkHoliday,
  bulkMarkPresent,
  fetchDailyAttendance,
  formatUiDate,
  isoToTimeInput,
  todayIsoDate,
  updateAttendance,
  upsertAttendance,
  type AttendanceRecordDto,
  type CompanyHolidayRef,
  type DailyAttendanceFacets,
  type DailyAttendanceSummary,
} from '../api';
import { fetchWorkShiftsMeta, type MetaWorkShift } from '@/features/employees/api';
import { SelectField } from '../components/async-single-select';
import { employeeAttendancePath } from '@/features/employees/lib/employee-routes';

const ROWS_PER_PAGE = 10;

const DEFAULT_STATUS_OPTIONS = [
  'Present',
  'Pending',
  'Absent',
  'Half Day',
  'Leave',
  'Week Off',
  'Holiday',
  'On Duty',
];

const statusStyles: Record<string, string> = {
  Present: 'border-[#4CAF50] bg-[#E5FFEB] text-[#4CAF50]',
  Pending: 'border-[#94A3B8] bg-[#F1F5F9] text-[#64748B]',
  Absent: 'border-[#F54A4A] bg-[#FEE9E5] text-[#F54A4A]',
  'Half Day': 'border-[#525252] bg-[#E5E5E5] text-[#525252]',
  Leave: 'border-[#6366F1] bg-[#EEF2FF] text-[#4F46E5]',
  'Week Off': 'border-[#676767] bg-[#F4F4F4] text-[#676767]',
  Holiday: 'border-[#0658C2] bg-[#DBEAFF] text-[#0658C2]',
  'On Duty': 'border-[#FFA000] bg-[#FFF4E3] text-[#FFA000]',
};

export function AttendanceDashboardScreen() {
  const searchParams = useSearchParams();
  const initialDate = searchParams.get('date') ?? todayIsoDate();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [records, setRecords] = useState<AttendanceRecordDto[]>([]);
  const [summary, setSummary] = useState<DailyAttendanceSummary>({
    present: 0,
    absent: 0,
    half_day: 0,
    leave: 0,
    week_off: 0,
    holiday: 0,
    pending: 0,
    ot_count: 0,
    shift_mismatch_count: 0,
  });
  const [totalItems, setTotalItems] = useState(0);
  const [facets, setFacets] = useState<DailyAttendanceFacets>({ status: {}, shift: {} });
  const [companyHoliday, setCompanyHoliday] = useState<CompanyHolidayRef | null>(null);
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [selectedPending, setSelectedPending] = useState<Set<string>>(new Set());
  const [editingRecord, setEditingRecord] = useState<AttendanceRecordDto | null>(null);
  const [workShifts, setWorkShifts] = useState<MetaWorkShift[]>([]);
  const [attendanceReady, setAttendanceReady] = useState(false);
  const [shiftsLoading, setShiftsLoading] = useState(true);
  const [shiftsError, setShiftsError] = useState<string | null>(null);

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDailyAttendance({
        date: selectedDate,
        search: debouncedQuery || undefined,
        status: selectedStatuses.length ? selectedStatuses : undefined,
        shift: selectedShifts.length ? selectedShifts : undefined,
        page,
        limit: ROWS_PER_PAGE,
      });
      setRecords(result.data.items);
      setSummary(result.data.summary);
      setTotalItems(result.meta.total);
      setFacets(result.meta.facets);
      setCompanyHoliday(result.data.company_holiday ?? null);
      setAttendanceReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, debouncedQuery, selectedStatuses, selectedShifts, page]);

  const loadShifts = useCallback(async () => {
    setShiftsLoading(true);
    setShiftsError(null);
    try {
      const res = await fetchWorkShiftsMeta({ limit: 50 });
      setWorkShifts(res.data);
    } catch (err) {
      setShiftsError(err instanceof Error ? err.message : 'Failed to load shifts');
    } finally {
      setShiftsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, selectedStatuses, selectedShifts, selectedDate]);

  useEffect(() => {
    void loadShifts();
  }, [loadShifts]);

  const statusOptions = useMemo(() => {
    const fromFacets = Object.keys(facets.status);
    return [...new Set([...fromFacets, ...DEFAULT_STATUS_OPTIONS, ...selectedStatuses])].sort((a, b) =>
      a.localeCompare(b),
    );
  }, [facets.status, selectedStatuses]);

  const shiftOptions = useMemo(() => {
    const fromFacets = Object.keys(facets.shift);
    return [...new Set([...fromFacets, ...selectedShifts])].sort((a, b) => a.localeCompare(b));
  }, [facets.shift, selectedShifts]);

  const pendingOnPage = useMemo(
    () => records.filter((r) => r.status === 'pending'),
    [records],
  );

  const allPendingSelected =
    pendingOnPage.length > 0 && pendingOnPage.every((r) => selectedPending.has(r.row_key));

  const toggleSelectAllPending = () => {
    if (allPendingSelected) {
      setSelectedPending(new Set());
      return;
    }
    setSelectedPending(new Set(pendingOnPage.map((r) => r.row_key)));
  };

  const togglePending = (rowKey: string) => {
    setSelectedPending((current) => {
      const next = new Set(current);
      if (next.has(rowKey)) next.delete(rowKey);
      else next.add(rowKey);
      return next;
    });
  };

  const selectedMemberIds = useMemo(
    () =>
      records
        .filter((r) => selectedPending.has(r.row_key) && r.status === 'pending')
        .map((r) => r.company_member_id),
    [records, selectedPending],
  );

  const handleMarkPresent = async (record: AttendanceRecordDto) => {
    setActionLoading(true);
    setNotice(null);
    setError(null);
    try {
      const workShiftId = record.work_shift?.id ?? record.assigned_shift?.id;
      if (!workShiftId) {
        setError('No shift assigned. Assign a work shift before marking present.');
        return;
      }
      await upsertAttendance({
        date: selectedDate,
        company_member_id: record.company_member_id,
        work_shift_id: workShiftId,
        status: 'present',
      });
      setNotice(`Marked ${record.employee_name} present.`);
      await loadAttendance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mark present failed');
    } finally {
      setActionLoading(false);
    }
  };

  const overrideCandidates =
    summary.present + summary.absent + summary.half_day + summary.leave + summary.week_off;

  const handleBulkMarkPresent = async (memberIds?: string[]) => {
    setActionLoading(true);
    setNotice(null);
    setError(null);
    try {
      const result = await bulkMarkPresent(selectedDate, memberIds);
      setNotice(
        `Marked ${result.created} employee(s) present.${result.skipped ? ` ${result.skipped} skipped (already marked or no shift).` : ''}`,
      );
      setSelectedPending(new Set());
      await loadAttendance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk mark failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkHoliday = async (name: string, overrideExisting: boolean) => {
    setActionLoading(true);
    setNotice(null);
    setError(null);
    try {
      const result = await bulkMarkHoliday({
        date: selectedDate,
        name,
        override_existing: overrideExisting,
      });
      setHolidayModalOpen(false);
      setNotice(
        `Holiday “${result.holiday.name}” on ${formatUiDate(selectedDate)}: ${result.created} created, ${result.overridden} overridden${result.skipped ? `, ${result.skipped} skipped` : ''}.`,
      );
      await loadAttendance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mark holiday failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async (payload: Parameters<typeof updateAttendance>[1]) => {
    if (!editingRecord?.id) return;
    setActionLoading(true);
    setError(null);
    try {
      await updateAttendance(editingRecord.id, payload);
      setEditingRecord(null);
      setNotice('Attendance updated.');
      await loadAttendance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7F9] text-[#111827]">
      <AttendanceTopBar />
      <main className="space-y-7 p-5 lg:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[28px] font-bold tracking-normal">Attendance</h1>
            <p className="mt-1 text-sm text-[#676767]">
              One row per shift — day + night on the same date are separate records
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="inline-flex h-12 cursor-pointer items-center justify-center gap-3 rounded-xl border border-[#D3D3D3] bg-white px-5 text-base font-semibold text-[#061A3D] shadow-sm">
              <Calendar className="h-5 w-5" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedPending(new Set());
                }}
                className="cursor-pointer border-none bg-transparent text-base font-semibold outline-none"
              />
            </label>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => setHolidayModalOpen(true)}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-[#0658C2] bg-white px-6 text-base font-semibold text-[#0658C2] shadow-sm transition hover:bg-[#EFF6FF] disabled:opacity-60"
            >
              Mark Day Holiday
            </button>
            <Link
              href="/attendance/add"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-[#0658C2] px-7 text-base font-semibold text-white shadow-sm transition hover:bg-[#054A9F]"
            >
              + Add Attendance
            </Link>
          </div>
        </div>

        {(error || notice) && (
          <div
            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${error ? 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]' : 'border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]'}`}
          >
            <span>{error ?? notice}</span>
            {error && (
              <button
                type="button"
                onClick={() => void loadAttendance()}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1 font-semibold text-[#0658C2]"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Reload
              </button>
            )}
          </div>
        )}

        {shiftsError && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-sm text-[#92400E]">
            <span>{workShifts.length > 0 ? `Could not refresh shifts: ${shiftsError}` : `Could not load shifts: ${shiftsError}`}</span>
            <button
              type="button"
              onClick={() => void loadShifts()}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 font-semibold text-[#0658C2]"
            >
              {shiftsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Reload
            </button>
          </div>
        )}

        {companyHoliday && (
          <section className="rounded-2xl border border-[#DBEAFF] bg-[#EFF6FF] px-4 py-3 text-sm text-[#0658C2]">
            <span className="font-semibold">Company holiday:</span> {companyHoliday.name}
            {companyHoliday.is_optional ? ' (optional)' : ''} — {formatUiDate(companyHoliday.date)}
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <MetricCard title="Present" value={`${summary.present}`} note="Marked present today" icon={BriefcaseBusiness} color="blue" />
          <MetricCard title="Pending" value={`${summary.pending}`} note="Not marked yet" icon={Clock3} color="amber" />
          <MetricCard title="Holiday" value={`${summary.holiday}`} note="Company / declared holiday" icon={Calendar} color="violet" />
          <MetricCard title="Absent / Leave" value={`${summary.absent + summary.leave}`} note={`${summary.half_day} half day(s) · ${summary.ot_count} OT`} icon={CheckCircle2} color="green" />
        </section>

        {summary.pending > 0 && (
          <section className="flex flex-col gap-3 rounded-2xl border border-[#DBEAFF] bg-[#EFF6FF] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-[#0658C2]">{summary.pending} employee(s) without attendance</p>
              <p className="text-sm text-[#676767]">
                Select employees and mark present with default shift timings (no OT by default).
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() =>
                  void handleBulkMarkPresent(
                    Array.from(
                      new Set(
                        records.filter((r) => r.status === 'pending').map((r) => r.company_member_id),
                      ),
                    ),
                  )
                }
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0658C2] px-5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Mark All Pending (${summary.pending})`}
              </button>
              {selectedPending.size > 0 && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => void handleBulkMarkPresent(selectedMemberIds)}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-[#0658C2] bg-white px-5 text-sm font-semibold text-[#0658C2] disabled:opacity-60"
                >
                  Mark Selected ({selectedPending.size})
                </button>
              )}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search employee..."
                className="h-12 w-full rounded-lg border border-[#D3D3D3] bg-white px-5 pr-12 text-sm outline-none focus:border-[#0658C2]"
              />
            </div>
            <div className="flex flex-row flex-wrap items-center gap-3">
              <FilterMultiSelect
                label="All Status"
                selectedLabel="Status"
                options={statusOptions}
                selected={selectedStatuses}
                facetCounts={facets.status}
                open={openFilter === 'status'}
                onOpenChange={(next) => setOpenFilter(next ? 'status' : null)}
                onChange={setSelectedStatuses}
              />
              <FilterMultiSelect
                label="All Shifts"
                selectedLabel="Shift"
                options={shiftOptions}
                selected={selectedShifts}
                facetCounts={facets.shift}
                open={openFilter === 'shift'}
                onOpenChange={(next) => setOpenFilter(next ? 'shift' : null)}
                onChange={setSelectedShifts}
              />
              <p className="text-sm text-[#676767]">{formatUiDate(selectedDate)}</p>
            </div>
          </div>

          {loading && !attendanceReady ? (
            <div className="flex items-center justify-center gap-2 py-16 text-[#676767]">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading attendance...
            </div>
          ) : error && !attendanceReady ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-[#B91C1C]">
              <p>Attendance could not be loaded.</p>
              <button
                type="button"
                onClick={() => void loadAttendance()}
                className="inline-flex cursor-pointer items-center gap-2 font-semibold text-[#0658C2]"
              >
                <RefreshCw className="h-4 w-4" /> Reload
              </button>
            </div>
          ) : (
            <>
              {loading && (
                <div className="mb-3 inline-flex items-center gap-2 text-sm text-[#676767]">
                  <Loader2 className="h-4 w-4 animate-spin" /> Updating…
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead>
                    <tr className="bg-[#FAFAFA] text-[15px] text-[#676767]">
                      <th className="rounded-l-lg px-3 py-3 font-semibold">
                        {pendingOnPage.length > 0 && (
                          <input
                            type="checkbox"
                            checked={allPendingSelected}
                            onChange={toggleSelectAllPending}
                            aria-label="Select all pending"
                          />
                        )}
                      </th>
                      <th className="px-5 py-3 font-semibold">Employee</th>
                      <th className="px-5 py-3 font-semibold">Shift</th>
                      <th className="px-5 py-3 font-semibold">Time Log</th>
                      <th className="px-5 py-3 font-semibold">Worked</th>
                      <th className="px-5 py-3 font-semibold">OT</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="rounded-r-lg px-5 py-3 text-center font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.row_key} className="border-b border-[#D3D3D3]">
                        <td className="px-3 py-3">
                          {record.status === 'pending' && (
                            <input
                              type="checkbox"
                              checked={selectedPending.has(record.row_key)}
                              onChange={() => togglePending(record.row_key)}
                              aria-label={`Select ${record.employee_name}`}
                            />
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {record.employment_id ? (
                            <Link
                              href={employeeAttendancePath(record.employment_id, selectedDate.slice(0, 7))}
                              className="font-semibold text-[#0658C2] hover:underline"
                            >
                              {record.employee_name}
                            </Link>
                          ) : (
                            <p className="font-semibold text-[#111827]">{record.employee_name}</p>
                          )}
                          <p className="text-xs text-[#676767]">
                            {record.employee_no ? `ID: ${record.employee_no}` : record.company_member_id.slice(0, 8)}
                          </p>
                          {record.shift_mismatch && (
                            <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#FFA000]">
                              <AlertTriangle className="h-3 w-3" /> Alternate shift
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium">{record.work_shift?.name ?? record.assigned_shift?.name ?? '-'}</p>
                          {record.assigned_shift && record.work_shift && record.assigned_shift.id !== record.work_shift.id && (
                            <p className="text-xs text-[#676767]">Assigned: {record.assigned_shift.name}</p>
                          )}
                        </td>
                        <td className="px-5 py-3">{record.time_log}</td>
                        <td className="px-5 py-3">{record.worked_hours_label}</td>
                        <td className="px-5 py-3">{record.overtime_label}</td>
                        <td className="px-5 py-3">
                          <StatusBadge label={record.status_label} />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-center gap-2">
                            {record.status === 'pending' ? (
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => void handleMarkPresent(record)}
                                className="text-xs font-semibold text-[#0658C2] hover:underline disabled:opacity-50"
                              >
                                Mark Present
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setEditingRecord(record)}
                                  className="rounded-md p-1 text-[#0658C2] transition hover:bg-[#DBEAFF]"
                                  aria-label={`Edit attendance for ${record.employee_name}`}
                                >
                                  <Edit3 className="h-5 w-5" />
                                </button>
                                {record.employment_id && (
                                  <Link
                                    href={`/attendance/add?employment_id=${record.employment_id}&date=${selectedDate}`}
                                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[#0658C2] hover:bg-[#DBEAFF]"
                                    title="Add another shift (e.g. night)"
                                  >
                                    <Plus className="h-4 w-4" />
                                    Shift
                                  </Link>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {records.length === 0 && (
                <div className="py-14 text-center text-sm text-[#676767]">No employees found.</div>
              )}

              <DataPagination
                currentPage={page}
                pageSize={ROWS_PER_PAGE}
                totalItems={totalItems}
                onPageChange={setPage}
                showSummary={false}
                className="border-t-0 px-0 pb-0"
              />
            </>
          )}
        </section>
      </main>

      {editingRecord && (
        <UpdateAttendanceModal
          record={editingRecord}
          workShifts={workShifts}
          saving={actionLoading}
          onClose={() => setEditingRecord(null)}
          onSave={handleSaveEdit}
        />
      )}

      {holidayModalOpen && (
        <MarkHolidayModal
          date={selectedDate}
          existingName={companyHoliday?.name ?? ''}
          overrideCandidates={overrideCandidates}
          pendingCount={summary.pending}
          saving={actionLoading}
          onClose={() => setHolidayModalOpen(false)}
          onConfirm={handleMarkHoliday}
        />
      )}
    </div>
  );
}

function AttendanceTopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#D3D3D3] bg-white px-4 sm:px-6 lg:px-8">
      <div className="relative hidden w-full max-w-[310px] sm:block">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />
        <input placeholder="Search anything..." className="h-12 w-full rounded-lg bg-[#FAFAFA] pl-12 pr-4 text-sm outline-none" />
      </div>
      <div className="ml-auto flex items-center gap-5">
        <UserRoundCheck className="h-5 w-5 text-[#676767]" />
        <UserRoundX className="h-5 w-5 text-[#676767]" />
      </div>
    </header>
  );
}

function FilterMultiSelect({
  label,
  selectedLabel,
  options,
  selected,
  facetCounts,
  open,
  onOpenChange,
  onChange,
}: {
  label: string;
  selectedLabel: string;
  options: string[];
  selected: string[];
  facetCounts?: Record<string, number>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (items: string[]) => void;
}) {
  const selectedText = selected.length ? `${selectedLabel} (${selected.length})` : label;
  const [search, setSearch] = useState('');

  const toggle = (option: string) => {
    onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]);
  };

  const filteredOptions = options.filter(
    (option) => !selected.includes(option) && option.toLowerCase().includes(search.toLowerCase()),
  );

  const formatOption = (option: string) => {
    const count = facetCounts?.[option];
    return count != null ? `${option} (${count})` : option;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className={`flex h-12 min-w-[180px] items-center justify-between rounded-xl border px-5 text-base font-semibold cursor-pointer ${
          open ? 'border-[#0658C2] text-blue-950' : 'border-gray-300 text-gray-900'
        }`}
      >
        {selectedText}
        {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-2 w-[280px] rounded-xl border border-[#DBEAFF] bg-white p-3 shadow-xl sm:left-auto sm:right-0">
          <div className="relative mb-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${selectedLabel}...`}
              className="w-full rounded-md border border-transparent bg-[#F8F8F8] px-4 py-2 text-sm outline-none focus:border-[#0658C2]"
            />
          </div>

          <button
            type="button"
            onClick={() => onChange(options)}
            className="mb-2 flex w-full items-center justify-between rounded-md bg-[#DBEAFF] px-4 py-2 text-left text-sm text-[#0658C2]"
          >
            {label}
          </button>

          {selected.length > 0 && (
            <>
              <div className="flex items-center justify-between px-1 py-2 text-xs font-semibold uppercase text-[#676767]">
                <span>Selected ({selected.length})</span>
                <button type="button" onClick={() => onChange([])} className="normal-case text-[#0658C2]">
                  Clear All
                </button>
              </div>
              <div className="mb-2 max-h-[180px] space-y-1 overflow-y-auto border-b border-[#D3D3D3] pb-2">
                {selected.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggle(option)}
                    className="flex w-full items-center justify-between rounded-md bg-[#DBEAFF] px-4 py-2 text-left text-sm text-[#0658C2]"
                  >
                    {formatOption(option)}
                  </button>
                ))}
              </div>
            </>
          )}

          <p className="px-1 py-2 text-xs font-semibold uppercase text-[#676767]">Available</p>
          <div className="max-h-[180px] space-y-1 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggle(option)}
                  className="flex w-full items-center justify-between rounded-md border border-[#D3D3D3] px-4 py-2 text-left text-sm hover:border-transparent hover:bg-[#DBEAFF] hover:text-[#0658C2]"
                >
                  {formatOption(option)}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-[#676767]">No results found</p>
            )}
          </div>
        </div>
      )}
    </div>
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

function StatusBadge({ label }: { label: string }) {
  const style = statusStyles[label] ?? statusStyles.Pending;
  return (
    <span className={`inline-flex min-w-[76px] items-center justify-center rounded-md border px-3 py-1 text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
}

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'leave', label: 'Leave' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'week_off', label: 'Week Off' },
  { value: 'on_duty', label: 'On Duty' },
];

function MarkHolidayModal({
  date,
  existingName,
  overrideCandidates,
  pendingCount,
  saving,
  onClose,
  onConfirm,
}: {
  date: string;
  existingName: string;
  overrideCandidates: number;
  pendingCount: number;
  saving: boolean;
  onClose: () => void;
  onConfirm: (name: string, overrideExisting: boolean) => Promise<void>;
}) {
  const [name, setName] = useState(existingName || 'Company Holiday');
  const [overrideExisting, setOverrideExisting] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-[520px] rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Mark day as holiday</h2>
            <p className="text-sm text-[#676767]">{formatUiDate(date)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="h-6 w-6" />
          </button>
        </div>

        <p className="mb-4 text-sm text-[#676767]">
          Saves this date to the company holiday calendar and marks all active employees as{' '}
          <strong>Holiday</strong> for that day.
        </p>

        <label className="mb-4 block">
          <span className="mb-2 block text-sm font-medium">Holiday name / reason</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Condolence leave, Festival"
            className="h-11 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm outline-none focus:border-[#0658C2]"
          />
        </label>

        {(overrideCandidates > 0 || pendingCount > 0) && (
          <div className="mb-4 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-3 text-sm text-[#92400E]">
            {pendingCount > 0 && <p>{pendingCount} pending employee(s) will be marked holiday.</p>}
            {overrideCandidates > 0 && (
              <p className="mt-1">
                {overrideCandidates} already-marked row(s) (present / absent / leave / etc.) exist on
                this date.
              </p>
            )}
          </div>
        )}

        <label className="mb-5 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={overrideExisting}
            onChange={(e) => setOverrideExisting(e.target.checked)}
          />
          <span>
            Override existing attendance (recommended if holiday was decided after marking present —
            clears check-in/out and OT, sets status to Holiday).
          </span>
        </label>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-xl border border-[#0658C2] px-8 font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || name.trim().length < 2}
            onClick={() => void onConfirm(name.trim(), overrideExisting)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0658C2] px-8 font-semibold text-white disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm holiday
          </button>
        </div>
      </div>
    </div>
  );
}

function UpdateAttendanceModal({
  record,
  workShifts,
  saving,
  onClose,
  onSave,
}: {
  record: AttendanceRecordDto;
  workShifts: MetaWorkShift[];
  saving: boolean;
  onClose: () => void;
  onSave: (payload: Parameters<typeof updateAttendance>[1]) => Promise<void>;
}) {
  const [workShiftId, setWorkShiftId] = useState(record.work_shift?.id ?? '');
  const [checkIn, setCheckIn] = useState(isoToTimeInput(record.check_in));
  const [checkOut, setCheckOut] = useState(isoToTimeInput(record.check_out));
  const [lunchBreak, setLunchBreak] = useState(String(record.lunch_break_minutes));
  const [teaBreak, setTeaBreak] = useState(String(record.tea_break_minutes));
  const [status, setStatus] = useState(record.status === 'pending' ? 'present' : record.status);
  const [isOt, setIsOt] = useState(record.is_ot);
  const [otMinutes, setOtMinutes] = useState(String(record.ot_minutes || ''));
  const [otReason, setOtReason] = useState(record.ot_reason ?? '');
  const [notes, setNotes] = useState(record.notes ?? '');

  const shiftMismatch =
    record.assigned_shift && workShiftId && record.assigned_shift.id !== workShiftId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]">
      <div className="max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Update Attendance</h2>
            <p className="text-sm text-[#676767]">{record.employee_name}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="h-6 w-6" />
          </button>
        </div>

        {shiftMismatch && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-3 text-sm text-[#92400E]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Assigned shift is <strong>{record.assigned_shift?.name}</strong> but actual shift differs.
              HR can mark OT if this was an alternate shift (e.g. night).
            </span>
          </div>
        )}

        <div className="grid gap-4">
          <SelectField label="Actual Shift" placeholder="— Select shift —" options={workShifts.map((s) => ({ value: s.id, label: `${s.name} (${s.start_time.slice(0, 5)} – ${s.end_time.slice(0, 5)})` }))} value={workShiftId} onChange={(value) => setWorkShiftId(value)} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Check-in">
              <input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="h-11 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm outline-none focus:border-[#0658C2]" />
            </Field>
            <Field label="Check-out">
              <input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="h-11 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm outline-none focus:border-[#0658C2]" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Lunch break (min)">
              <input type="number" min={0} value={lunchBreak} onChange={(e) => setLunchBreak(e.target.value)} className="h-11 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm outline-none focus:border-[#0658C2]" />
            </Field>
            <Field label="Tea break (min)">
              <input type="number" min={0} value={teaBreak} onChange={(e) => setTeaBreak(e.target.value)} className="h-11 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm outline-none focus:border-[#0658C2]" />
            </Field>
          </div>

          <SelectField label="Status" placeholder="Select Status" options={STATUS_OPTIONS} value={status} onChange={(value) => setStatus(value)} />

          <div className="rounded-lg border border-[#E5E7EB] p-4">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={isOt} onChange={(e) => setIsOt(e.target.checked)} />
              Mark as overtime (HR decision)
            </label>
            {isOt && (
              <div className="mt-3 grid gap-3">
                <Field label="OT minutes">
                  <input type="number" min={0} value={otMinutes} onChange={(e) => setOtMinutes(e.target.value)} className="h-11 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm outline-none focus:border-[#0658C2]" />
                </Field>
                <Field label="OT reason">
                  <input
                    placeholder="e.g. alternate shift, holiday work"
                    value={otReason}
                    onChange={(e) => setOtReason(e.target.value)}
                    className="h-11 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm outline-none focus:border-[#0658C2]"
                  />
                </Field>
              </div>
            )}
          </div>

          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-20 w-full resize-none rounded-lg border border-[#E5E7EB] px-4 py-3 text-sm outline-none focus:border-[#0658C2]"
            />
          </Field>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="h-12 rounded-xl border border-[#0658C2] px-8 font-semibold">
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void onSave({
                work_shift_id: workShiftId || null,
                check_in: checkIn || undefined,
                check_out: checkOut || undefined,
                lunch_break_minutes: Number(lunchBreak) || 0,
                tea_break_minutes: Number(teaBreak) || 0,
                status,
                is_ot: isOt,
                ot_minutes: isOt ? Number(otMinutes) || 0 : 0,
                ot_reason: isOt ? otReason || null : null,
                notes: notes || null,
              })
            }
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0658C2] px-8 font-semibold text-white disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
