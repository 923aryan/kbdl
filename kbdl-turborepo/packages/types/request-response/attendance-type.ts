import {
  bulkMarkHolidaySchema,
  bulkMarkPresentSchema,
  getAttendanceAnalyticsRangeSchema,
  getDailyAttendanceSchema,
  updateAttendanceSchema,
  upsertAttendanceSchema,
} from '@repo/validator/shared';
import { z } from 'zod';

export type AttendanceShiftRef = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
};

export type AttendanceRecordDto = {
  id: string;
  /** Stable key for list rows (id or pending placeholder) */
  row_key: string;
  company_member_id: string;
  employment_id: string | null;
  employee_name: string;
  employee_no: string | null;
  supervisor_name: string | null;
  date: string;
  assigned_shift: AttendanceShiftRef | null;
  work_shift: AttendanceShiftRef | null;
  check_in: string | null;
  check_out: string | null;
  lunch_break_minutes: number;
  tea_break_minutes: number;
  worked_minutes: number;
  worked_hours_label: string;
  ot_minutes: number;
  overtime_label: string;
  is_ot: boolean;
  ot_reason: string | null;
  shift_mismatch: boolean;
  status: string;
  status_label: string;
  source: string;
  notes: string | null;
  time_log: string;
};

export type DailyAttendanceSummary = {
  present: number;
  absent: number;
  half_day: number;
  leave: number;
  week_off: number;
  holiday: number;
  pending: number;
  ot_count: number;
  shift_mismatch_count: number;
};

/** Facet maps — same exclusion pattern as employee list (counts ignore own dimension filter). */
export type DailyAttendanceFacets = {
  status: Record<string, number>;
  shift: Record<string, number>;
};

export type CompanyHolidayRef = {
  date: string;
  name: string;
  is_optional: boolean;
};

export type DailyAttendanceResponse = {
  date: string;
  items: AttendanceRecordDto[];
  summary: DailyAttendanceSummary;
  company_holiday: CompanyHolidayRef | null;
};

export type BulkMarkPresentResult = {
  created: number;
  skipped: number;
  items: AttendanceRecordDto[];
};

export type BulkMarkHolidayResult = {
  holiday: CompanyHolidayRef;
  created: number;
  overridden: number;
  skipped: number;
  items: AttendanceRecordDto[];
};

export type GetDailyAttendanceRequest = z.infer<typeof getDailyAttendanceSchema>;
export type GetDailyAttendanceQuery = GetDailyAttendanceRequest['query'];

export type BulkMarkPresentRequest = z.infer<typeof bulkMarkPresentSchema>;
export type BulkMarkPresentBody = BulkMarkPresentRequest['body'];

export type BulkMarkHolidayRequest = z.infer<typeof bulkMarkHolidaySchema>;
export type BulkMarkHolidayBody = BulkMarkHolidayRequest['body'];

export type UpdateAttendanceRequest = z.infer<typeof updateAttendanceSchema>;
export type UpdateAttendanceBody = UpdateAttendanceRequest['body'];

export type UpsertAttendanceRequest = z.infer<typeof upsertAttendanceSchema>;
export type UpsertAttendanceBody = UpsertAttendanceRequest['body'] & {
  company_member_id?: string;
  employment_id?: string;
};

export type GetAttendanceAnalyticsRequest = z.infer<typeof getAttendanceAnalyticsRangeSchema>;
export type GetAttendanceAnalyticsQuery = GetAttendanceAnalyticsRequest['query'];

export type AttendanceAnalyticsSummary = {
  from: string;
  to: string;
  attendance_rate: number;
  attendance_rate_delta: number | null;
  working_days: number;
  active_headcount: number;
  ot_hours: number;
  ot_minutes: number;
  ot_marked_count: number;
  present_days: number;
  half_days: number;
  absent_days: number;
  leave_days: number;
  pending_days: number;
  eligible_days: number;
  prev_from: string | null;
  prev_to: string | null;
};

export type AttendanceAnalyticsTrendPoint = {
  date: string;
  day: string;
  present: number;
  absent: number;
  leave: number;
  half_day: number;
  late: number;
  pending: number;
  roster: number;
  present_pct: number;
  absent_pct: number;
  late_pct: number;
};

export type AttendanceAnalyticsTrend = {
  from: string;
  to: string;
  points: AttendanceAnalyticsTrendPoint[];
  punch_summary: Array<{ day: string; date: string; present: number; absent: number }>;
};

export type AttendanceAnalyticsBreakdownItem = {
  status: string;
  name: string;
  value: number;
  color: string;
};

export type AttendanceAnalyticsBreakdown = {
  from: string;
  to: string;
  items: AttendanceAnalyticsBreakdownItem[];
  total: number;
};

export type AttendanceAnalyticsInsights = {
  from: string;
  to: string;
  departments: Array<{
    department: string;
    rate: number;
    eligible: number;
    present: number;
  }>;
  top_absentees: Array<{
    company_member_id: string;
    employee: string;
    team: string;
    absences: number;
    late: number;
    absences_label: string;
    late_label: string;
  }>;
};
