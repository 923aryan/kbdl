import {
  bulkMarkHolidaySchema,
  bulkMarkPresentSchema,
  employeePunchAttendanceSchema,
  getAttendanceAnalyticsRangeSchema,
  getDailyAttendanceSchema,
  getEmployeeAttendanceContextSchema,
  getEmployeeAttendanceMonthSchema,
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

export type GetEmployeeAttendanceMonthRequest = z.infer<typeof getEmployeeAttendanceMonthSchema>;

export type EmployeeAttendanceDay = {
  date: string;
  status: string;
  status_label: string;
  code: string;
  holiday_name: string | null;
  is_working_day: boolean;
  shift_count: number;
  ot_minutes: number;
  worked_minutes: number;
};

export type EmployeeAttendanceEntry = {
  id: string;
  date: string;
  shift_name: string;
  check_in: string | null;
  check_out: string | null;
  time_log: string;
  worked_hours_label: string;
  lunch_break_minutes: number;
  tea_break_minutes: number;
  ot_minutes: number;
  overtime_label: string;
  is_ot: boolean;
  ot_reason: string | null;
  status: string;
  status_label: string;
  source: string;
  notes: string | null;
  shift_mismatch: boolean;
};

export type EmployeeAttendanceMonth = {
  employee: {
    employment_id: string;
    company_member_id: string;
    employee_no: string | null;
    name: string;
    designation: string | null;
    department: string | null;
    assigned_shift: { id: string; name: string; start_time: string; end_time: string } | null;
  };
  from: string;
  to: string;
  attendance_rate: number;
  summary: {
    present: number;
    absent: number;
    half_day: number;
    leave: number;
    holiday: number;
    week_off: number;
    pending: number;
    ot_minutes: number;
    ot_hours: number;
    worked_minutes: number;
    worked_hours: number;
  };
  days: EmployeeAttendanceDay[];
  entries: EmployeeAttendanceEntry[];
};

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
  headcount: number;
};

export type EmployeePunchCompany = {
  employment_id: string;
  company_member_id: string;
  company_id: string;
  company_name: string;
  branch_name: string | null;
  branch_has_location: boolean;
};

export type EmployeePunchShift = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  label: string;
};

export type EmployeePunchContext = {
  companies: EmployeePunchCompany[];
  selected: EmployeePunchCompany | null;
  date: string;
  date_label: string;
  shift: EmployeePunchShift | null;
  attendance: {
    id: string | null;
    status: string | null;
    status_label: string | null;
    source: string | null;
    check_in: string | null;
    check_out: string | null;
  };
  mode: 'select_company' | 'punch_in' | 'punch_out' | 'completed' | 'blocked';
  punch_blocked_reason: string | null;
  radius_meters: number;
};

export type EmployeePunchResult = EmployeePunchContext & {
  distance_meters: number;
};

export type GetEmployeeAttendanceContextRequest = z.infer<typeof getEmployeeAttendanceContextSchema>;
export type EmployeePunchAttendanceRequest = z.infer<typeof employeePunchAttendanceSchema>;
export type EmployeePunchAttendanceBody = EmployeePunchAttendanceRequest['body'];

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
    early_leaves: number;
    absences_label: string;
    late_label: string;
    early_leaves_label: string;
  }>;
};
