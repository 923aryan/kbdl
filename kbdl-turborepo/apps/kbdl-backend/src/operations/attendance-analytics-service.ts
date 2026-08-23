import { prisma } from '@repo/db/server';
import type {
  AttendanceAnalyticsBreakdown,
  AttendanceAnalyticsInsights,
  AttendanceAnalyticsSummary,
  AttendanceAnalyticsTrend,
  GetAttendanceAnalyticsQuery,
} from '@repo/types';
import {
  breakdownSql,
  insightsSql,
  summarySql,
  trendSql,
} from './attendance-analytics-sql';

function rangeParams(companyId: string, query: GetAttendanceAnalyticsQuery) {
  return [companyId, query.from, query.to] as const;
}

type SummaryRow = {
  present_days: number;
  half_days: number;
  absent_days: number;
  leave_days: number;
  pending_days: number;
  eligible_days: number;
  ot_minutes_total: number;
  ot_marked_count: number;
  working_days: number;
  active_headcount: number;
  attendance_rate: string | number;
  attendance_rate_delta: string | number | null;
  prev_from: string;
  prev_to: string;
};

type TrendRow = {
  date: string;
  day: string;
  present: number;
  absent: number;
  leave: number;
  half_day: number;
  late: number;
  pending: number;
  roster: number;
  present_pct: string | number;
  absent_pct: string | number;
  late_pct: string | number;
};

type BreakdownRow = { status: string; count: number; headcount: number };

type InsightsRow = {
  departments: unknown;
  top_absentees: unknown;
};

function num(v: string | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === 'number' ? v : Number(v);
}

export async function getAttendanceAnalyticsSummaryService(
  companyId: string,
  query: GetAttendanceAnalyticsQuery,
): Promise<AttendanceAnalyticsSummary> {
  const [row] = await prisma.$queryRawUnsafe<SummaryRow[]>(
    summarySql(),
    ...rangeParams(companyId, query),
  );

  const otMinutes = row?.ot_minutes_total ?? 0;
  const rate = num(row?.attendance_rate);
  const delta = row?.attendance_rate_delta == null ? null : num(row.attendance_rate_delta);

  return {
    from: query.from,
    to: query.to,
    attendance_rate: rate,
    attendance_rate_delta: delta,
    working_days: row?.working_days ?? 0,
    active_headcount: row?.active_headcount ?? 0,
    ot_hours: Math.round((otMinutes / 60) * 10) / 10,
    ot_minutes: otMinutes,
    ot_marked_count: row?.ot_marked_count ?? 0,
    present_days: row?.present_days ?? 0,
    half_days: row?.half_days ?? 0,
    absent_days: row?.absent_days ?? 0,
    leave_days: row?.leave_days ?? 0,
    pending_days: row?.pending_days ?? 0,
    eligible_days: row?.eligible_days ?? 0,
    prev_from: row?.prev_from ?? null,
    prev_to: row?.prev_to ?? null,
  };
}

export async function getAttendanceAnalyticsTrendService(
  companyId: string,
  query: GetAttendanceAnalyticsQuery,
): Promise<AttendanceAnalyticsTrend> {
  const rows = await prisma.$queryRawUnsafe<TrendRow[]>(
    trendSql(),
    ...rangeParams(companyId, query),
  );

  const points = rows.map((r) => ({
    date: r.date.slice(0, 10),
    day: r.day.trim(),
    present: r.present,
    absent: r.absent,
    leave: r.leave,
    half_day: r.half_day,
    late: r.late,
    pending: r.pending,
    roster: r.roster,
    present_pct: num(r.present_pct),
    absent_pct: num(r.absent_pct),
    late_pct: num(r.late_pct),
  }));

  return {
    from: query.from,
    to: query.to,
    points,
    punch_summary: points.map((p) => ({
      day: p.day,
      date: p.date,
      present: p.present,
      absent: p.absent,
    })),
  };
}

const BREAKDOWN_COLORS: Record<string, string> = {
  present: '#22C55E',
  late: '#8B5CF6',
  early_leave: '#F43F5E',
  on_duty: '#0658C2',
  absent: '#F59E0B',
  leave: '#06B6D4',
  half_day: '#6478FF',
  holiday: '#0EA5E9',
  week_off: '#94A3B8',
  pending: '#F59E0B',
};

const BREAKDOWN_LABELS: Record<string, string> = {
  present: 'Present',
  late: 'Late',
  early_leave: 'Early Leave',
  on_duty: 'On Duty',
  absent: 'Absent',
  leave: 'Leave',
  half_day: 'Half Day',
  holiday: 'Holiday',
  week_off: 'Week Off',
  pending: 'Pending',
};

export async function getAttendanceAnalyticsBreakdownService(
  companyId: string,
  query: GetAttendanceAnalyticsQuery,
): Promise<AttendanceAnalyticsBreakdown> {
  const rows = await prisma.$queryRawUnsafe<BreakdownRow[]>(
    breakdownSql(),
    ...rangeParams(companyId, query),
  );

  const items = rows.map((r) => ({
    status: r.status,
    name: BREAKDOWN_LABELS[r.status] ?? r.status,
    value: r.count,
    color: BREAKDOWN_COLORS[r.status] ?? '#94A3B8',
  }));
  const headcount = rows[0]?.headcount ?? 0;

  return {
    from: query.from,
    to: query.to,
    items,
    total: headcount,
    headcount,
  };
}

export async function getAttendanceAnalyticsInsightsService(
  companyId: string,
  query: GetAttendanceAnalyticsQuery,
): Promise<AttendanceAnalyticsInsights> {
  const [row] = await prisma.$queryRawUnsafe<InsightsRow[]>(
    insightsSql({
      sortBy: query.sort_by,
      sortDir: query.sort_dir,
      issueFilter: query.issue_filter,
    }),
    ...rangeParams(companyId, query),
  );

  const departmentsRaw = row?.departments;
  const absenteesRaw = row?.top_absentees;

  const departments = (
    typeof departmentsRaw === 'string' ? JSON.parse(departmentsRaw) : departmentsRaw
  ) as AttendanceAnalyticsInsights['departments'] | null;

  const topAbsentees = (
    typeof absenteesRaw === 'string' ? JSON.parse(absenteesRaw) : absenteesRaw
  ) as Array<{
    company_member_id: string;
    employee: string;
    team: string;
    absences: number;
    late: number;
    early_leaves: number;
  }> | null;

  return {
    from: query.from,
    to: query.to,
    departments: Array.isArray(departments) ? departments : [],
    top_absentees: (Array.isArray(topAbsentees) ? topAbsentees : []).map((a) => {
      const absences = Number(a.absences) || 0;
      const late = Number(a.late) || 0;
      const earlyLeaves = Number(a.early_leaves) || 0;
      return {
        company_member_id: a.company_member_id,
        employee: a.employee,
        team: a.team,
        absences,
        late,
        early_leaves: earlyLeaves,
        absences_label: `${absences} day${absences === 1 ? '' : 's'}`,
        late_label: `${late} time${late === 1 ? '' : 's'}`,
        early_leaves_label: `${earlyLeaves} time${earlyLeaves === 1 ? '' : 's'}`,
      };
    }),
  };
}
