import { api } from '@/lib/api-client';
import type {
  AttendanceAnalyticsBreakdown,
  AttendanceAnalyticsInsights,
  AttendanceAnalyticsSummary,
  AttendanceAnalyticsTrend,
  AttendanceRecordDto,
  BulkMarkHolidayResult,
  BulkMarkPresentResult,
  CompanyHolidayRef,
  DailyAttendanceFacets,
  DailyAttendanceResponse,
  DailyAttendanceSummary,
  EmployeeAttendanceMonth,
} from '@repo/types';

export type {
  AttendanceAnalyticsBreakdown,
  AttendanceAnalyticsInsights,
  AttendanceAnalyticsSummary,
  AttendanceAnalyticsTrend,
  AttendanceRecordDto,
  BulkMarkHolidayResult,
  DailyAttendanceResponse,
  BulkMarkPresentResult,
  DailyAttendanceFacets,
  CompanyHolidayRef,
  EmployeeAttendanceMonth,
  DailyAttendanceSummary,
};

export type DailyAttendanceParams = {
  date: string;
  search?: string;
  status?: string[];
  shift?: string[];
  page?: number;
  limit?: number;
  pending_only?: boolean;
};

export type DailyAttendanceMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets: DailyAttendanceFacets;
};

const appendCsv = (query: URLSearchParams, key: string, values?: string[]) => {
  if (values?.length) query.set(key, values.join(','));
};

export async function fetchDailyAttendance(params: DailyAttendanceParams) {
  const query = new URLSearchParams();
  query.set('date', params.date);
  if (params.search?.trim()) query.set('search', params.search.trim());
  appendCsv(query, 'status', params.status);
  appendCsv(query, 'shift', params.shift);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.pending_only) query.set('pending_only', 'true');

  const response = await api.get<DailyAttendanceResponse>(
    `/operations/employer/attendance?${query.toString()}`,
  );

  const meta = response.meta as Partial<DailyAttendanceMeta> | undefined;

  return {
    data: {
      ...response.data,
      company_holiday: response.data.company_holiday ?? null,
    },
    meta: {
      total: Number(meta?.total ?? 0),
      page: Number(meta?.page ?? params.page ?? 1),
      limit: Number(meta?.limit ?? params.limit ?? 50),
      totalPages: Number(meta?.totalPages ?? 1),
      facets: meta?.facets ?? { status: {}, shift: {} },
    } satisfies DailyAttendanceMeta,
  };
}

export async function bulkMarkPresent(date: string, companyMemberIds?: string[]) {
  const response = await api.post<BulkMarkPresentResult>(
    '/operations/employer/attendance/bulk-mark-present',
    { date, company_member_ids: companyMemberIds },
  );
  return response.data;
}

export async function bulkMarkHoliday(input: {
  date: string;
  name: string;
  override_existing?: boolean;
  is_optional?: boolean;
}) {
  const response = await api.post<BulkMarkHolidayResult>(
    '/operations/employer/attendance/bulk-mark-holiday',
    {
      date: input.date,
      name: input.name,
      override_existing: input.override_existing ?? true,
      is_optional: input.is_optional ?? false,
    },
  );
  return response.data;
}

export type AttendanceAnalyticsRangeParams = {
  from?: string;
  to?: string;
  month?: string;
  grain?: 'day' | 'week' | 'month';
  sort_by?: 'employee' | 'department' | 'absences' | 'late' | 'early_leaves' | 'priority';
  sort_dir?: 'asc' | 'desc';
  issue_filter?: 'all' | 'absent' | 'late' | 'early_leave';
};

function analyticsQuery(params: AttendanceAnalyticsRangeParams) {
  const query = new URLSearchParams();
  if (params.month) query.set('month', params.month);
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  if (params.grain) query.set('grain', params.grain);
  if (params.sort_by) query.set('sort_by', params.sort_by);
  if (params.sort_dir) query.set('sort_dir', params.sort_dir);
  if (params.issue_filter) query.set('issue_filter', params.issue_filter);
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchAttendanceAnalyticsSummary(params: AttendanceAnalyticsRangeParams = {}) {
  const response = await api.get<AttendanceAnalyticsSummary>(
    `/operations/employer/attendance/analytics/summary${analyticsQuery(params)}`,
  );
  return response.data;
}

export async function fetchAttendanceAnalyticsTrend(params: AttendanceAnalyticsRangeParams = {}) {
  const response = await api.get<AttendanceAnalyticsTrend>(
    `/operations/employer/attendance/analytics/trend${analyticsQuery(params)}`,
  );
  return response.data;
}

export async function fetchAttendanceAnalyticsBreakdown(
  params: AttendanceAnalyticsRangeParams = {},
) {
  const response = await api.get<AttendanceAnalyticsBreakdown>(
    `/operations/employer/attendance/analytics/breakdown${analyticsQuery(params)}`,
  );
  return response.data;
}

export async function fetchAttendanceAnalyticsInsights(
  params: AttendanceAnalyticsRangeParams = {},
) {
  const response = await api.get<AttendanceAnalyticsInsights>(
    `/operations/employer/attendance/analytics/insights${analyticsQuery(params)}`,
  );
  return response.data;
}

export async function fetchEmployeeAttendanceMonth(employmentId: string, month?: string) {
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  const response = await api.get<EmployeeAttendanceMonth>(
    `/operations/employer/attendance/employee/${employmentId}${query}`,
  );
  return response.data;
}

export type UpdateAttendanceInput = {
  work_shift_id?: string | null;
  check_in?: string;
  check_out?: string;
  lunch_break_minutes?: number;
  tea_break_minutes?: number;
  status?: string;
  is_ot?: boolean;
  ot_minutes?: number;
  ot_reason?: string | null;
  notes?: string | null;
};

export async function updateAttendance(attendanceId: string, payload: UpdateAttendanceInput) {
  const response = await api.patch<AttendanceRecordDto>(
    `/operations/employer/attendance/${attendanceId}`,
    payload,
  );
  return response.data;
}

export type UpsertAttendanceInput = {
  date: string;
  company_member_id?: string;
  employment_id?: string;
  work_shift_id?: string;
  check_in?: string;
  check_out?: string;
  lunch_break_minutes?: number;
  tea_break_minutes?: number;
  status?: string;
  is_ot?: boolean;
  ot_minutes?: number;
  ot_reason?: string | null;
  notes?: string | null;
};

export async function upsertAttendance(payload: UpsertAttendanceInput) {
  const response = await api.post<AttendanceRecordDto>('/operations/employer/attendance', payload);
  return response.data;
}

/** Extract HH:MM from ISO timestamp for form inputs. */
export function isoToTimeInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function todayIsoDate(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

export function formatUiDate(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
