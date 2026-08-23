/**
 * Attendance analytics SQL — CTEs + window functions.
 * Day grain: one status per (member, date) via ranked priority across multi-shift rows.
 */

export type AnalyticsRange = {
  companyId: string;
  from: string; // YYYY-MM-DD
  to: string;
};

/** Shared CTE: calendar days, active roster, ranked day-status, late flags. */
export function analyticsBaseCte() {
  return `
WITH bounds AS (
  SELECT
    $1::uuid AS company_id,
    $2::date AS d_from,
    $3::date AS d_to
),
calendar AS (
  SELECT gs::date AS day
  FROM bounds b
  CROSS JOIN LATERAL generate_series(b.d_from, b.d_to, interval '1 day') AS gs
),
working_days AS (
  SELECT c.day
  FROM calendar c
  CROSS JOIN bounds b
  LEFT JOIN company_work_schedules ws ON ws.company_id = b.company_id
  LEFT JOIN company_holidays h ON h.company_id = b.company_id AND h.date = c.day
  WHERE h.id IS NULL
    AND CASE EXTRACT(ISODOW FROM c.day)::int
      WHEN 1 THEN COALESCE(ws.monday_working, true)
      WHEN 2 THEN COALESCE(ws.tuesday_working, true)
      WHEN 3 THEN COALESCE(ws.wednesday_working, true)
      WHEN 4 THEN COALESCE(ws.thursday_working, true)
      WHEN 5 THEN COALESCE(ws.friday_working, true)
      WHEN 6 THEN COALESCE(ws.saturday_working, true)
      WHEN 7 THEN COALESCE(ws.sunday_working, false)
    END
),
active_members AS (
  SELECT
    cm.id AS company_member_id,
    cm.department_id,
    d.name AS department_name,
    COALESCE(hp.full_name, wp.phone_no, 'Unknown') AS employee_name,
    ee.employee_no
  FROM company_members cm
  CROSS JOIN bounds b
  INNER JOIN employee_employments ee
    ON ee.id = cm.employment_id AND ee.is_active = true
  INNER JOIN workforce_persons wp ON wp.id = ee.workforce_person_id
  LEFT JOIN employee_hr_profiles hp ON hp.employment_id = ee.id
  LEFT JOIN departments d ON d.id = cm.department_id
  WHERE cm.company_id = b.company_id
    AND cm.is_active = true
    AND cm.employment_id IS NOT NULL
),
raw_attendance AS (
  SELECT
    a.id,
    a.company_member_id,
    a.date,
    a.status::text AS status,
    a.ot_minutes,
    a.worked_minutes,
    a.check_in,
    a.check_out,
    a.is_ot,
    wsh.start_time AS shift_start,
    wsh.end_time AS shift_end,
    CASE
      WHEN a.status = 'present'
        AND a.check_in IS NOT NULL
        AND (a.check_in AT TIME ZONE 'UTC')::time
          > (wsh.start_time + interval '15 minutes')
      THEN 1 ELSE 0
    END AS is_late,
    CASE
      WHEN a.status = 'present'
        AND a.check_out IS NOT NULL
        AND (a.check_out AT TIME ZONE 'UTC')::time
          < wsh.end_time
      THEN 1 ELSE 0
    END AS is_early
  FROM attendances a
  CROSS JOIN bounds b
  INNER JOIN work_shifts wsh ON wsh.id = a.work_shift_id
  WHERE a.company_id = b.company_id
    AND a.date BETWEEN b.d_from AND b.d_to
),
ranked_day AS (
  SELECT
    ra.*,
    ROW_NUMBER() OVER (
      PARTITION BY ra.company_member_id, ra.date
      ORDER BY
        CASE ra.status
          WHEN 'absent' THEN 1
          WHEN 'leave' THEN 2
          WHEN 'half_day' THEN 3
          WHEN 'present' THEN 4
          WHEN 'on_duty' THEN 5
          WHEN 'holiday' THEN 6
          WHEN 'week_off' THEN 7
          ELSE 8
        END,
        ra.is_late DESC,
        ra.id
    ) AS rn
  FROM raw_attendance ra
),
day_status AS (
  SELECT
    company_member_id,
    date,
    status AS day_status,
    is_late,
    is_early,
    ot_minutes,
    worked_minutes,
    is_ot
  FROM ranked_day
  WHERE rn = 1
),
member_day AS (
  SELECT
    am.company_member_id,
    am.department_id,
    am.department_name,
    am.employee_name,
    am.employee_no,
    wd.day AS date,
    ds.day_status,
    COALESCE(ds.is_late, 0) AS is_late,
    COALESCE(ds.is_early, 0) AS is_early,
    COALESCE(ds.ot_minutes, 0) AS ot_minutes,
    COALESCE(ds.worked_minutes, 0) AS worked_minutes,
    COALESCE(ds.is_ot, false) AS is_ot,
    CASE
      WHEN ds.day_status IS NULL THEN 'pending'
      ELSE ds.day_status
    END AS effective_status
  FROM active_members am
  CROSS JOIN working_days wd
  LEFT JOIN day_status ds
    ON ds.company_member_id = am.company_member_id
   AND ds.date = wd.day
)`;
}

export function summarySql() {
  return `
${analyticsBaseCte()},
period_stats AS (
  SELECT
    COUNT(*) FILTER (WHERE effective_status IN ('present', 'on_duty'))::int AS present_days,
    COUNT(*) FILTER (WHERE effective_status = 'half_day')::int AS half_days,
    COUNT(*) FILTER (WHERE effective_status = 'absent')::int AS absent_days,
    COUNT(*) FILTER (WHERE effective_status = 'leave')::int AS leave_days,
    COUNT(*) FILTER (WHERE effective_status = 'pending')::int AS pending_days,
    COUNT(*) FILTER (
      WHERE effective_status IN ('present', 'on_duty', 'half_day', 'absent', 'leave')
    )::int AS eligible_days,
    COALESCE(SUM(ot_minutes), 0)::int AS ot_minutes_total,
    COUNT(*) FILTER (WHERE is_ot)::int AS ot_marked_count,
    COUNT(DISTINCT date)::int AS working_days,
    COUNT(DISTINCT company_member_id)::int AS active_headcount
  FROM member_day
),
prev_bounds AS (
  SELECT
    (b.d_from - (b.d_to - b.d_from + 1))::date AS prev_from,
    (b.d_from - 1)::date AS prev_to
  FROM bounds b
),
prev_day_status AS (
  SELECT
    a.company_member_id,
    a.date,
    (ARRAY_AGG(a.status::text ORDER BY
      CASE a.status::text
        WHEN 'absent' THEN 1 WHEN 'leave' THEN 2 WHEN 'half_day' THEN 3
        WHEN 'present' THEN 4 WHEN 'on_duty' THEN 5 ELSE 6
      END
    ))[1] AS day_status
  FROM attendances a
  CROSS JOIN bounds b
  CROSS JOIN prev_bounds pb
  WHERE a.company_id = b.company_id
    AND a.date BETWEEN pb.prev_from AND pb.prev_to
  GROUP BY a.company_member_id, a.date
),
prev_stats AS (
  SELECT
    COUNT(*) FILTER (WHERE day_status IN ('present', 'on_duty'))::float AS present_days,
    COUNT(*) FILTER (
      WHERE day_status IN ('present', 'on_duty', 'half_day', 'absent', 'leave')
    )::float AS eligible_days
  FROM prev_day_status
)
SELECT
  ps.present_days,
  ps.half_days,
  ps.absent_days,
  ps.leave_days,
  ps.pending_days,
  ps.eligible_days,
  ps.ot_minutes_total,
  ps.ot_marked_count,
  ps.working_days,
  ps.active_headcount,
  CASE
    WHEN ps.eligible_days = 0 THEN 0
    ELSE ROUND(
      (100.0 * (ps.present_days + ps.half_days * 0.5) / ps.eligible_days)::numeric,
      1
    )
  END AS attendance_rate,
  CASE
    WHEN prev.eligible_days = 0 OR prev.eligible_days IS NULL THEN NULL
    ELSE ROUND(
      (
        (100.0 * (ps.present_days + ps.half_days * 0.5) / NULLIF(ps.eligible_days, 0))
        -
        (100.0 * prev.present_days / prev.eligible_days)
      )::numeric,
      1
    )
  END AS attendance_rate_delta,
  pb.prev_from::text AS prev_from,
  pb.prev_to::text AS prev_to
FROM period_stats ps
CROSS JOIN prev_bounds pb
CROSS JOIN prev_stats prev
`;
}

export function trendSql() {
  return `
${analyticsBaseCte()},
daily AS (
  SELECT
    date,
    TO_CHAR(date, 'Dy') AS day_label,
    COUNT(*) FILTER (WHERE effective_status IN ('present', 'on_duty'))::int AS present,
    COUNT(*) FILTER (WHERE effective_status = 'absent')::int AS absent,
    COUNT(*) FILTER (WHERE effective_status = 'leave')::int AS leave_count,
    COUNT(*) FILTER (WHERE effective_status = 'half_day')::int AS half_day,
    COUNT(*) FILTER (WHERE is_late = 1)::int AS late,
    COUNT(*) FILTER (WHERE effective_status = 'pending')::int AS pending,
    COUNT(*)::int AS roster
  FROM member_day
  GROUP BY date
)
SELECT
  date::text AS date,
  day_label AS day,
  present,
  absent,
  leave_count AS leave,
  half_day,
  late,
  pending,
  roster,
  CASE WHEN roster = 0 THEN 0
    ELSE ROUND((100.0 * present / roster)::numeric, 1)
  END AS present_pct,
  CASE WHEN roster = 0 THEN 0
    ELSE ROUND((100.0 * absent / roster)::numeric, 1)
  END AS absent_pct,
  CASE WHEN roster = 0 THEN 0
    ELSE ROUND((100.0 * late / roster)::numeric, 1)
  END AS late_pct
FROM daily
ORDER BY date
`;
}

export function breakdownSql() {
  return `
${analyticsBaseCte()},
employee_flags AS (
  SELECT
    company_member_id,
    MAX(CASE WHEN effective_status IN ('present', 'on_duty') THEN 1 ELSE 0 END) AS was_present,
    MAX(CASE WHEN is_late = 1 THEN 1 ELSE 0 END) AS was_late,
    MAX(CASE WHEN is_early = 1 THEN 1 ELSE 0 END) AS was_early,
    MAX(CASE WHEN effective_status = 'absent' THEN 1 ELSE 0 END) AS was_absent,
    MAX(CASE WHEN effective_status = 'leave' THEN 1 ELSE 0 END) AS was_leave
  FROM member_day
  GROUP BY company_member_id
)
SELECT status, count, (SELECT COUNT(*)::int FROM employee_flags) AS headcount
FROM (
  SELECT 'present'::text AS status,
    COUNT(*) FILTER (WHERE was_present = 1)::int AS count
  FROM employee_flags
  UNION ALL
  SELECT 'late',
    COUNT(*) FILTER (WHERE was_late = 1)::int
  FROM employee_flags
  UNION ALL
  SELECT 'early_leave',
    COUNT(*) FILTER (WHERE was_early = 1)::int
  FROM employee_flags
  UNION ALL
  SELECT 'absent',
    COUNT(*) FILTER (WHERE was_absent = 1)::int
  FROM employee_flags
  UNION ALL
  SELECT 'leave',
    COUNT(*) FILTER (WHERE was_leave = 1)::int
  FROM employee_flags
) s
ORDER BY count DESC
`;
}

const INSIGHT_SORT_COLUMNS = {
  employee: 'employee_name',
  department: 'team',
  absences: 'absences',
  late: 'late_count',
  early_leaves: 'early_count',
  priority: 'priority_score',
} as const;

export type InsightSortBy = keyof typeof INSIGHT_SORT_COLUMNS;
export type InsightSortDir = 'asc' | 'desc';
export type InsightIssueFilter = 'all' | 'absent' | 'late' | 'early_leave';

export function insightsSql(opts?: {
  sortBy?: InsightSortBy;
  sortDir?: InsightSortDir;
  issueFilter?: InsightIssueFilter;
}) {
  const sortCol = INSIGHT_SORT_COLUMNS[opts?.sortBy ?? 'absences'] ?? 'absences';
  const sortDir = opts?.sortDir === 'asc' ? 'ASC' : 'DESC';
  const issueFilter = opts?.issueFilter ?? 'all';

  const havingClause =
    issueFilter === 'absent'
      ? 'HAVING COUNT(*) FILTER (WHERE effective_status = \'absent\') > 0'
      : issueFilter === 'late'
        ? 'HAVING COUNT(*) FILTER (WHERE is_late = 1) > 0'
        : issueFilter === 'early_leave'
          ? 'HAVING COUNT(*) FILTER (WHERE is_early = 1) > 0'
          : `HAVING COUNT(*) FILTER (WHERE effective_status = 'absent') > 0
     OR COUNT(*) FILTER (WHERE is_late = 1) > 0
     OR COUNT(*) FILTER (WHERE is_early = 1) > 0`;

  return `
${analyticsBaseCte()},
dept AS (
  SELECT
    COALESCE(department_name, 'Unassigned') AS department,
    COUNT(*) FILTER (
      WHERE effective_status IN ('present', 'on_duty', 'half_day', 'absent', 'leave')
    )::int AS eligible,
    COUNT(*) FILTER (WHERE effective_status IN ('present', 'on_duty'))::int AS present,
    COUNT(*) FILTER (WHERE effective_status = 'half_day')::int AS half_day
  FROM member_day
  GROUP BY COALESCE(department_name, 'Unassigned')
),
dept_rates AS (
  SELECT
    department,
    CASE WHEN eligible = 0 THEN 0
      ELSE ROUND((100.0 * (present + half_day * 0.5) / eligible)::numeric, 0)
    END AS rate,
    eligible,
    present
  FROM dept
  WHERE eligible > 0
  ORDER BY rate DESC
  LIMIT 12
),
issues AS (
  SELECT
    company_member_id,
    employee_name,
    COALESCE(department_name, 'Unassigned') AS team,
    COUNT(*) FILTER (WHERE effective_status = 'absent')::int AS absences,
    COUNT(*) FILTER (WHERE is_late = 1)::int AS late_count,
    COUNT(*) FILTER (WHERE is_early = 1)::int AS early_count,
    (
      COUNT(*) FILTER (WHERE effective_status = 'absent') * 2
      + COUNT(*) FILTER (WHERE is_late = 1)
      + COUNT(*) FILTER (WHERE is_early = 1)
    )::int AS priority_score
  FROM member_day
  GROUP BY company_member_id, employee_name, department_name
  ${havingClause}
),
issues_sorted AS (
  SELECT *
  FROM issues
  ORDER BY ${sortCol} ${sortDir} NULLS LAST, employee_name ASC
)
SELECT
  (SELECT COALESCE(json_agg(json_build_object(
      'department', department,
      'rate', rate,
      'eligible', eligible,
      'present', present
    ) ORDER BY rate DESC), '[]'::json) FROM dept_rates) AS departments,
  (SELECT COALESCE(json_agg(json_build_object(
      'company_member_id', company_member_id,
      'employee', employee_name,
      'team', team,
      'absences', absences,
      'late', late_count,
      'early_leaves', early_count
    ) ORDER BY ${sortCol} ${sortDir} NULLS LAST, employee_name ASC), '[]'::json)
   FROM issues_sorted) AS top_absentees
`;
}
