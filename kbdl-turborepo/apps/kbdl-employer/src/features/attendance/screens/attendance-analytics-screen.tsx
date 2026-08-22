'use client';

import {
  ArrowUpDown,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Info,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  currentUtcMonth,
  useAttendanceAnalytics,
  type AnalyticsSectionKey,
  type SectionState,
} from '../hooks/use-attendance-analytics';

function parseDate(date: string) {
  return new Date(`${date}T00:00:00`);
}

function formatDateRange(from: Date, to: Date) {
  const start = from.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const end = to.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return `${start} - ${end}`;
}

function formatYmd(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatMonthValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(month: string) {
  const { from } = getMonthBounds(month);

  return from.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
}

function getMonthOptions(count = 24) {
  const current = new Date();

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(
      current.getFullYear(),
      current.getMonth() - index,
      1,
    );

    return formatMonthValue(date);
  });
}

function getMonthBounds(month: string) {
  const [rawYear, rawMonth] = month.split('-').map(Number);

  const today = new Date();

  const year = Number.isFinite(rawYear)
    ? rawYear
    : today.getFullYear();

  const monthNumber = Number.isFinite(rawMonth)
    ? rawMonth
    : today.getMonth() + 1;

  return {
    from: new Date(year, monthNumber - 1, 1),
    to: new Date(year, monthNumber, 0),
  };
}

function getAnalyticsBounds(month: string) {
  const bounds = getMonthBounds(month);
  const today = new Date();
  const currentMonth = formatMonthValue(today);

  return {
    from: bounds.from,
    to:
      month === currentMonth && today < bounds.to
        ? today
        : bounds.to,
  };
}

function getWeeksForRange(from: Date, to: Date) {
  const weeks: Array<{
    label: string;
    from: Date;
    to: Date;
  }> = [];

  let cursor = new Date(from);
  let index = 1;

  while (cursor <= to) {
    const weekStart = new Date(cursor);

    const weekEnd = new Date(cursor);
    weekEnd.setDate(weekStart.getDate() + 6);

    if (weekEnd > to) {
      weekEnd.setTime(to.getTime());
    }

    weeks.push({
      label: `Week ${index}`,
      from: weekStart,
      to: weekEnd,
    });

    cursor = new Date(weekEnd);
    cursor.setDate(cursor.getDate() + 1);

    index += 1;
  }

  return weeks;
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

type TrendChartPoint = {
  date: string;
  day: string;
  dayName: string;
  dateLabel: string;
  present: number;
  late: number;
  absent: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  roster: number;
};

type DistributionItem = {
  status: string;
  name: string;
  value: number;
  color: string;
  percent: number;
};

type IssueRow = {
  id: string;
  employee: string;
  department: string;
  absent: number;
  late: number;
  earlyLeaves: number;
  absencesLabel: string;
  lateLabel: string;
  earlyLeavesLabel: string;
  issueType: 'Absent' | 'Late' | 'Early Leave' | 'Absent + Late';
  issueLevel: 'High' | 'Medium' | 'Low';
};

type IssueFilter =
  | 'all'
  | 'absent'
  | 'late'
  | 'early_leave';

type IssueSortBy =
  | 'employee'
  | 'department'
  | 'absences'
  | 'late'
  | 'early_leaves'
  | 'priority';

type TrendPeriod = 'weekly' | 'monthly';

export function AttendanceAnalyticsScreen() {
  const [month, setMonth] = useState(currentUtcMonth);

  const [selectedWeek, setSelectedWeek] = useState(0);

  const [monthDropdownOpen, setMonthDropdownOpen] =
    useState(false);

  const [weekDropdownOpen, setWeekDropdownOpen] =
    useState(false);

  const [issueFilter, setIssueFilter] =
    useState<IssueFilter>('all');

  const [issueSortBy, setIssueSortBy] =
    useState<IssueSortBy>('absences');

  const [issueSortDir, setIssueSortDir] =
    useState<'asc' | 'desc'>('desc');

  const [trendPeriod, setTrendPeriod] =
    useState<TrendPeriod>('weekly');

  const [issueDropdownOpen, setIssueDropdownOpen] =
    useState(false);

  const [periodDropdownOpen, setPeriodDropdownOpen] =
    useState(false);

  const analyticsBounds = useMemo(
    () => getAnalyticsBounds(month),
    [month],
  );

  const range = useMemo(
    () => ({
      from: formatYmd(analyticsBounds.from),
      to: formatYmd(analyticsBounds.to),
    }),
    [analyticsBounds],
  );

  const insightsQuery = useMemo(
    () => ({
      sort_by: issueSortBy,
      sort_dir: issueSortDir,
      issue_filter: issueFilter,
    }),
    [issueSortBy, issueSortDir, issueFilter],
  );

  const {
    trend,
    breakdown,
    insights,
    refreshSection,
  } = useAttendanceAnalytics(range, insightsQuery);

  const weeks = useMemo(
    () =>
      getWeeksForRange(
        analyticsBounds.from,
        analyticsBounds.to,
      ),
    [analyticsBounds],
  );

  const activeWeek =
    weeks[Math.min(selectedWeek, weeks.length - 1)] ??
    weeks[0];

  const maxMonth = useMemo(
    () => formatMonthValue(new Date()),
    [],
  );

  const monthOptions = useMemo(
    () => getMonthOptions(),
    [],
  );

  const trendChart = useMemo(
    () =>
      (trend.data?.points ?? []).map((p) => {
        const date = parseDate(p.date);

        return {
          date: p.date,
          day: p.day.slice(0, 3),
          dayName: p.day,
          dateLabel: date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
          }),
          present: p.present_pct,
          late: p.late_pct,
          absent: p.absent_pct,
          presentCount: p.present,
          lateCount: p.late,
          absentCount: p.absent,
          roster: p.roster,
        };
      }),
    [trend.data],
  );

  const weeklyTrend = useMemo(() => {
    if (trendPeriod === 'monthly' || !activeWeek) return trendChart;

    return trendChart.filter((point) => {
      const date = parseDate(point.date);

      return (
        date >= activeWeek.from &&
        date <= activeWeek.to
      );
    });
  }, [activeWeek, trendChart, trendPeriod]);

  const distribution = useMemo<DistributionItem[]>(() => {
    const valueByStatus = new Map(
      (breakdown.data?.items ?? []).map((item) => [
        item.status,
        item,
      ]),
    );

    const headcount =
      breakdown.data?.headcount ??
      breakdown.data?.total ??
      0;

    const present =
      valueByStatus.get('present')?.value ?? 0;
    const late =
      valueByStatus.get('late')?.value ?? 0;
    const earlyLeave =
      valueByStatus.get('early_leave')?.value ?? 0;
    const absent =
      valueByStatus.get('absent')?.value ?? 0;
    const leave =
      valueByStatus.get('leave')?.value ?? 0;

    const rows = [
      {
        status: 'present',
        name: 'Present',
        value: present,
        color: '#22C55E',
        pie: true,
      },
      {
        status: 'absent',
        name: 'Absent',
        value: absent,
        color: '#F59E0B',
        pie: true,
      },
      {
        status: 'late',
        name: 'Late',
        value: late,
        color: '#8B5CF6',
        pie: false,
      },
      {
        status: 'early_leave',
        name: 'Early Leave',
        value: earlyLeave,
        color: '#F43F5E',
        pie: false,
      },
      {
        status: 'leave',
        name: 'Leave',
        value: leave,
        color: '#06B6D4',
        pie: true,
      },
    ];

    const denominator = headcount || present;

    return rows.map((item) => ({
      status: item.status,
      name: item.name,
      value: item.value,
      color: item.color,
      percent:
        denominator > 0
          ? (item.value / denominator) * 100
          : 0,
    }));
  }, [breakdown.data]);

  const pieDistribution = useMemo(
    () =>
      distribution.filter((item) =>
        ['present', 'absent', 'leave'].includes(item.status),
      ),
    [distribution],
  );

  const presentRate =
    distribution.find(
      (item) => item.status === 'present',
    )?.percent ?? 0;

  const issueRows = useMemo<IssueRow[]>(
    () =>
      (insights.data?.top_absentees ?? []).map((item) => {
        const absent = Number(item.absences) || 0;
        const late = Number(item.late) || 0;

        const earlyLeaves = Number(item.early_leaves) || 0;

        const score = absent * 2 + late;

        return {
          id: item.company_member_id,
          employee: item.employee,
          department: item.team || 'General',
          absent,
          late,
          earlyLeaves,
          absencesLabel: item.absences_label,
          lateLabel: item.late_label,
          earlyLeavesLabel:
            item.early_leaves_label ??
            `${earlyLeaves} time${
              earlyLeaves === 1 ? '' : 's'
            }`,
          issueType:
            absent > 0 && late > 0
              ? 'Absent + Late'
              : absent > 0
                ? 'Absent'
                : late > 0
                  ? 'Late'
                  : 'Early Leave',
          issueLevel:
            score >= 6
              ? 'High'
              : score >= 3
                ? 'Medium'
                : 'Low',
        };
      }),
    [insights.data],
  );

  const filteredIssueRows = useMemo(() => {
    const rows = issueRows.filter((row) => {
      if (issueFilter === 'absent') return row.absent > 0;
      if (issueFilter === 'late') return row.late > 0;
      if (issueFilter === 'early_leave') return row.earlyLeaves > 0;
      return true;
    });

    const dir = issueSortDir === 'asc' ? 1 : -1;
    const compareText = (a: string, b: string) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' }) * dir;
    const compareNum = (a: number, b: number) => (a - b) * dir;

    return [...rows].sort((a, b) => {
      if (issueSortBy === 'employee') return compareText(a.employee, b.employee);
      if (issueSortBy === 'department') return compareText(a.department, b.department);
      if (issueSortBy === 'absences') return compareNum(a.absent, b.absent);
      if (issueSortBy === 'late') return compareNum(a.late, b.late);
      if (issueSortBy === 'early_leaves') return compareNum(a.earlyLeaves, b.earlyLeaves);

      const score = (row: IssueRow) => row.absent * 2 + row.late + row.earlyLeaves;
      return compareNum(score(a), score(b));
    });
  }, [issueFilter, issueRows, issueSortBy, issueSortDir]);

  const toggleIssueSort = (column: IssueSortBy) => {
    if (issueSortBy === column) {
      setIssueSortDir((dir) =>
        dir === 'asc' ? 'desc' : 'asc',
      );
      return;
    }

    setIssueSortBy(column);
    setIssueSortDir(
      column === 'employee' || column === 'department'
        ? 'asc'
        : 'desc',
    );
  };

  const handleMonthChange = (value: string) => {
    setMonth(
      value > maxMonth
        ? maxMonth
        : value,
    );

    setSelectedWeek(0);
    setMonthDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FB] px-3 py-4 text-[#111827] sm:px-5 lg:px-7">
      {/* =========================================================
          PAGE HEADER
      ========================================================= */}

      <header className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold leading-7 tracking-normal text-[#101828]">
            Attendance Analytics
          </h1>

          <p className="mt-1 text-sm font-medium text-[#667085]">
            Deep insights into attendance patterns and trends.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <MonthSelect
            month={month}
            months={monthOptions}
            activeRange={formatDateRange(
              analyticsBounds.from,
              analyticsBounds.to,
            )}
            open={monthDropdownOpen}
            onOpenChange={setMonthDropdownOpen}
            onChange={handleMonthChange}
          />

          <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0B5FFF] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#084FD4] sm:w-auto">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </header>

      <main className="grid gap-5">
        {/* =========================================================
            TREND + DISTRIBUTION
        ========================================================= */}

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.95fr)_minmax(320px,1fr)]">
          {/* =====================================================
              WEEKLY ATTENDANCE TREND
          ===================================================== */}

          <Panel
            title={
              trendPeriod === 'monthly'
                ? 'Monthly Attendance Trend'
                : 'Weekly Attendance Trend'
            }
            subtitle="Present vs Late vs Absent (%)"
            sectionKey="trend"
            state={trend}
            onRetry={refreshSection}
            headerAction={
              <div className="flex shrink-0 items-center gap-2">
                <TrendPeriodSelect
                  value={trendPeriod}
                  open={periodDropdownOpen}
                  onOpenChange={setPeriodDropdownOpen}
                  onChange={setTrendPeriod}
                />

                {trendPeriod === 'weekly' ? (
                  <WeekSelect
                    weeks={weeks}
                    selectedWeek={selectedWeek}
                    open={weekDropdownOpen}
                    onOpenChange={setWeekDropdownOpen}
                    onChange={setSelectedWeek}
                  />
                ) : null}

                <button
                  type="button"
                  disabled={trend.loading}
                  onClick={() =>
                    refreshSection('trend')
                  }
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#667085] transition hover:bg-[#F8FAFC] disabled:opacity-50"
                  title="Refresh attendance trend"
                >
                  {trend.loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </button>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <div className="h-[235px]">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <LineChart
                    data={weeklyTrend}
                    margin={{
                      top: 6,
                      right: 14,
                      left: -8,
                      bottom: 6,
                    }}
                  >
                    <CartesianGrid
                      stroke="#E7ECF3"
                      strokeDasharray="3 5"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      interval={
                        trendPeriod === 'monthly'
                          ? 2
                          : 0
                      }
                      minTickGap={8}
                      height={50}
                      tick={<TrendAxisTick />}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: '#98A2B3',
                        fontSize: 12,
                      }}
                      tickFormatter={formatPercent}
                      domain={[0, 100]}
                      ticks={[
                        0,
                        25,
                        50,
                        75,
                        100,
                      ]}
                      width={42}
                    />

                    <Tooltip
                      content={<TrendTooltip />}
                      cursor={{
                        stroke: '#CBD5E1',
                        strokeDasharray: '4 4',
                      }}
                    />

                    <Legend
                      align="right"
                      verticalAlign="top"
                      iconType="circle"
                      wrapperStyle={{
                        paddingBottom: 4,
                        fontSize: 12,
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="present"
                      stroke="#0B5FFF"
                      strokeWidth={3.5}
                      dot={{
                        r: 3.5,
                        strokeWidth: 2,
                        fill: '#FFFFFF',
                        stroke: '#0B5FFF',
                      }}
                      activeDot={{
                        r: 6,
                        strokeWidth: 0,
                        fill: '#0B5FFF',
                      }}
                      connectNulls
                      name="Present"
                    />

                    <Line
                      type="monotone"
                      dataKey="late"
                      stroke="#FF9F1C"
                      strokeWidth={3}
                      dot={{
                        r: 3.5,
                        strokeWidth: 2,
                        fill: '#FFFFFF',
                        stroke: '#FF9F1C',
                      }}
                      activeDot={{
                        r: 5,
                        strokeWidth: 0,
                        fill: '#FF9F1C',
                      }}
                      connectNulls
                      name="Late"
                    />

                    <Line
                      type="monotone"
                      dataKey="absent"
                      stroke="#EF4444"
                      strokeWidth={3}
                      dot={{
                        r: 3.5,
                        strokeWidth: 2,
                        fill: '#FFFFFF',
                        stroke: '#EF4444',
                      }}
                      activeDot={{
                        r: 5,
                        strokeWidth: 0,
                        fill: '#EF4444',
                      }}
                      connectNulls
                      name="Absent"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Panel>

          {/* =====================================================
              ATTENDANCE DISTRIBUTION
          ===================================================== */}

          <Panel
            title="Attendance Distribution"
            subtitle="Unique employees. Late is included in Present."
            sectionKey="breakdown"
            state={breakdown}
            onRetry={refreshSection}
            showInfo
          >
            <div className="grid items-center gap-4 md:grid-cols-[minmax(190px,230px)_minmax(0,1fr)] xl:grid-cols-1 2xl:grid-cols-[minmax(150px,170px)_minmax(0,1fr)]">
              <div className="h-[205px] min-w-0">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>
                    <Pie
                      data={pieDistribution}
                      innerRadius="62%"
                      outerRadius="88%"
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      stroke="none"
                    >
                      {pieDistribution.map(
                        (entry) => (
                          <Cell
                            key={entry.status}
                            fill={entry.color}
                          />
                        ),
                      )}
                    </Pie>

                    <text
                      x="50%"
                      y="48%"
                      textAnchor="middle"
                      className="fill-[#101828] text-2xl font-bold"
                    >
                      {presentRate.toFixed(2)}%
                    </text>

                    <text
                      x="50%"
                      y="60%"
                      textAnchor="middle"
                      className="fill-[#667085] text-xs font-bold"
                    >
                      Present
                    </text>

                    <Tooltip
                      content={
                        <DistributionTooltip />
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="min-w-0 space-y-3">
                {distribution.map(
                  (item) => (
                    <div
                      key={item.status}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2 font-semibold text-[#344054]">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              item.color,
                          }}
                        />

                        <span className="truncate">
                          {item.name}
                        </span>
                      </span>

                      <span className="whitespace-nowrap font-bold text-[#344054]">
                        {item.value} (
                        {item.percent.toFixed(2)}
                        %)
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </Panel>
        </section>

        {/* =========================================================
            EMPLOYEE ATTENDANCE ISSUES
        ========================================================= */}

        <section className="grid gap-5">
          <Panel
            title="Employee Attendance Issues"
            subtitle="Employees requiring attention based on attendance patterns"
            sectionKey="insights"
            state={insights}
            onRetry={refreshSection}
            headerAction={
              <div className="flex shrink-0 items-center gap-2">
                <IssueFilterSelect
                  value={issueFilter}
                  open={issueDropdownOpen}
                  onOpenChange={
                    setIssueDropdownOpen
                  }
                  onChange={setIssueFilter}
                />

                <button
                  type="button"
                  disabled={insights.loading}
                  onClick={() =>
                    refreshSection('insights')
                  }
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#667085] transition hover:bg-[#F8FAFC] disabled:opacity-50"
                  title="Refresh employee issues"
                >
                  {insights.loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </button>
              </div>
            }
          >
            {/* =====================================================
                DESKTOP TABLE
            ===================================================== */}

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F9FAFB] text-xs font-bold text-[#667085]">
                  <tr>
                    <SortableTh
                      label="Employee"
                      column="employee"
                      active={issueSortBy}
                      direction={issueSortDir}
                      onSort={toggleIssueSort}
                      className="rounded-l-lg"
                    />
                    <SortableTh
                      label="Department"
                      column="department"
                      active={issueSortBy}
                      direction={issueSortDir}
                      onSort={toggleIssueSort}
                    />
                    <SortableTh
                      label="Absences"
                      column="absences"
                      active={issueSortBy}
                      direction={issueSortDir}
                      onSort={toggleIssueSort}
                    />
                    <SortableTh
                      label="Late Marks"
                      column="late"
                      active={issueSortBy}
                      direction={issueSortDir}
                      onSort={toggleIssueSort}
                    />
                    <SortableTh
                      label="Early Leaves"
                      column="early_leaves"
                      active={issueSortBy}
                      direction={issueSortDir}
                      onSort={toggleIssueSort}
                    />
                    <th className="px-4 py-3">
                      Primary Issue
                    </th>
                    <SortableTh
                      label="Priority"
                      column="priority"
                      active={issueSortBy}
                      direction={issueSortDir}
                      onSort={toggleIssueSort}
                      className="rounded-r-lg"
                    />
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#EAECF0]">
                  {filteredIssueRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-sm font-semibold text-[#98A2B3]"
                      >
                        No attendance issues
                        found in this range.
                      </td>
                    </tr>
                  ) : (
                    filteredIssueRows.map(
                      (row) => (
                        <tr
                          key={row.id}
                          className="text-[#344054] transition hover:bg-[#FAFBFC]"
                        >
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-3">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E0F2FE] text-xs font-bold text-[#0369A1]">
                                {row.employee
                                  .split(' ')
                                  .map(
                                    (part) =>
                                      part[0],
                                  )
                                  .join('')
                                  .slice(
                                    0,
                                    2,
                                  )}
                              </span>

                              <span className="font-bold text-[#344054]">
                                {row.employee}
                              </span>
                            </span>
                          </td>

                          <td className="px-4 py-3 font-semibold">
                            {row.department}
                          </td>

                          <td className="px-4 py-3 font-bold text-[#EF4444]">
                            {row.absencesLabel}
                          </td>

                          <td className="px-4 py-3 font-bold text-[#F79009]">
                            {row.lateLabel}
                          </td>

                          <td className="px-4 py-3 font-bold text-[#F43F5E]">
                            {row.earlyLeavesLabel}
                          </td>

                          <td className="px-4 py-3">
                            <IssueTypeBadge
                              type={
                                row.issueType
                              }
                            />
                          </td>

                          <td className="px-4 py-3">
                            <IssueBadge
                              level={
                                row.issueLevel
                              }
                            />
                          </td>
                        </tr>
                      ),
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* =====================================================
                MOBILE ISSUE CARDS
            ===================================================== */}

            <div className="grid gap-3 md:hidden">
              {filteredIssueRows.length === 0 ? (
                <div className="rounded-xl bg-[#F9FAFB] px-4 py-8 text-center text-sm font-semibold text-[#98A2B3]">
                  No attendance issues
                  found in this range.
                </div>
              ) : (
                filteredIssueRows.map(
                  (row) => (
                    <IssueCard
                      key={row.id}
                      row={row}
                    />
                  ),
                )
              )}
            </div>

            <p className="mt-4 text-xs font-semibold text-[#667085]">
              Showing {filteredIssueRows.length}{' '}
              of {issueRows.length} employees
            </p>
          </Panel>
        </section>
      </main>
    </div>
  );
}

/* ===============================================================
   MONTH SELECT
================================================================ */

function MonthSelect({
  month,
  months,
  activeRange,
  open,
  onOpenChange,
  onChange,
}: {
  month: string;
  months: string[];
  activeRange: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (month: string) => void;
}) {
  return (
    <div className="relative w-full sm:w-auto">
      <button
        type="button"
        onClick={() =>
          onOpenChange(!open)
        }
        className={`flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border bg-white px-4 text-sm font-semibold shadow-sm cursor-pointer sm:min-w-[260px] ${
          open
            ? 'border-[#0658C2] text-blue-950'
            : 'border-[#D3D3D3] text-[#061A3D]'
        }`}
      >
        <Calendar className="h-4 w-4 shrink-0 text-[#344054]" />

        <span className="min-w-0 flex-1 truncate text-left">
          {activeRange}
        </span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#667085] ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-2 w-full rounded-xl border border-[#DBEAFF] bg-white p-3 shadow-xl sm:left-auto sm:right-0 sm:w-[300px]">
          <p className="px-1 py-2 text-xs font-semibold uppercase text-[#676767]">
            Select Month
          </p>

          <div className="max-h-[260px] space-y-1 overflow-y-auto">
            {months.map((option) => {
              const selected =
                option === month;

              const bounds =
                getAnalyticsBounds(
                  option,
                );

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    onChange(option)
                  }
                  className={`flex w-full items-center justify-between gap-3 rounded-md px-4 py-2 text-left text-sm ${
                    selected
                      ? 'bg-[#DBEAFF] text-[#0658C2]'
                      : 'border border-[#D3D3D3] hover:border-transparent hover:bg-[#DBEAFF] hover:text-[#0658C2]'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">
                      {formatMonthLabel(
                        option,
                      )}
                    </span>

                    <span className="mt-0.5 block truncate text-xs text-[#676767]">
                      {formatDateRange(
                        bounds.from,
                        bounds.to,
                      )}
                    </span>
                  </span>

                  {selected && (
                    <CheckIcon />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ===============================================================
   TREND PERIOD SELECT
================================================================ */

function TrendPeriodSelect({
  value,
  open,
  onOpenChange,
  onChange,
}: {
  value: TrendPeriod;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: TrendPeriod) => void;
}) {
  const options: Array<{ label: string; value: TrendPeriod }> = [
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
  ];

  return (
    <div className="relative w-full sm:w-auto">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className={`flex h-11 w-full min-w-[130px] items-center justify-between gap-3 rounded-xl border bg-white px-4 text-sm font-semibold transition cursor-pointer sm:w-auto ${
          open
            ? 'border-[#0658C2] text-[#061A3D]'
            : 'border-[#D3D3D3] text-[#061A3D] hover:border-[#98A2B3]'
        }`}
      >
        <span>{value === 'monthly' ? 'Monthly' : 'Weekly'}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[180px] rounded-xl border border-[#DBEAFF] bg-white p-3 shadow-xl">
          <p className="px-1 py-2 text-xs font-semibold uppercase text-[#676767]">
            Trend
          </p>
          <div className="space-y-1">
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    onOpenChange(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-md px-4 py-2 text-left text-sm ${
                    selected
                      ? 'bg-[#DBEAFF] text-[#0658C2]'
                      : 'border border-[#D3D3D3] hover:border-transparent hover:bg-[#DBEAFF] hover:text-[#0658C2]'
                  }`}
                >
                  <span className="font-semibold">{option.label}</span>
                  {selected && <CheckIcon />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SortableTh({
  label,
  column,
  active,
  direction,
  onSort,
  className = '',
}: {
  label: string;
  column: IssueSortBy;
  active: IssueSortBy;
  direction: 'asc' | 'desc';
  onSort: (column: IssueSortBy) => void;
  className?: string;
}) {
  const isActive = active === column;

  return (
    <th className={`px-4 py-3 ${className}`}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className="inline-flex items-center gap-1 font-bold text-[#667085] hover:text-[#101828]"
      >
        {label}
        {isActive ? (
          direction === 'asc' ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        )}
      </button>
    </th>
  );
}

/* ===============================================================
   WEEK SELECT
================================================================ */

function WeekSelect({
  weeks,
  selectedWeek,
  open,
  onOpenChange,
  onChange,
}: {
  weeks: Array<{
    label: string;
    from: Date;
    to: Date;
  }>;
  selectedWeek: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (week: number) => void;
}) {
  const activeWeek = weeks[selectedWeek];

  const selectedText = activeWeek
    ? `${activeWeek.label} · ${formatShortDateRange(
        activeWeek.from,
        activeWeek.to,
      )}`
    : 'Select Week';

  const selectWeek = (week: number) => {
    onChange(week);
    onOpenChange(false);
  };

  return (
    <div className="relative w-full sm:w-auto">
      <button
        type="button"
        onClick={() =>
          onOpenChange(!open)
        }
        className={`flex h-11 w-full min-w-[190px] items-center justify-between gap-3 rounded-xl border bg-white px-4 text-sm font-semibold transition cursor-pointer sm:w-auto ${
          open
            ? 'border-[#0658C2] text-[#061A3D]'
            : 'border-[#D3D3D3] text-[#061A3D] hover:border-[#98A2B3]'
        }`}
      >
        <span className="truncate">
          {selectedText}
        </span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[280px] rounded-xl border border-[#DBEAFF] bg-white p-3 shadow-xl">
          <p className="px-1 py-2 text-xs font-semibold uppercase text-[#676767]">
            Select Week
          </p>

          <div className="max-h-[240px] space-y-1 overflow-y-auto">
            {weeks.map(
              (week, index) => {
                const selected =
                  selectedWeek === index;

                return (
                  <button
                    key={week.label}
                    type="button"
                    onClick={() =>
                      selectWeek(index)
                    }
                    className={`flex w-full items-center justify-between rounded-md px-4 py-2 text-left text-sm ${
                      selected
                        ? 'bg-[#DBEAFF] text-[#0658C2]'
                        : 'border border-[#D3D3D3] hover:border-transparent hover:bg-[#DBEAFF] hover:text-[#0658C2]'
                    }`}
                  >
                    <span>
                      <span className="block font-semibold">
                        {week.label}
                      </span>

                      <span className="mt-0.5 block text-xs text-[#676767]">
                        {formatDateRange(
                          week.from,
                          week.to,
                        )}
                      </span>
                    </span>

                    {selected && (
                      <CheckIcon />
                    )}
                  </button>
                );
              },
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatShortDateRange(
  from: Date,
  to: Date,
) {
  const start = from.toLocaleDateString(
    'en-GB',
    {
      day: '2-digit',
      month: 'short',
    },
  );

  const end = to.toLocaleDateString(
    'en-GB',
    {
      day: '2-digit',
      month: 'short',
    },
  );

  return `${start} - ${end}`;
}

function CheckIcon() {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0658C2] text-white">
      <Check className="h-3.5 w-3.5" />
    </span>
  );
}

/* ===============================================================
   ISSUE FILTER SELECT
================================================================ */

function IssueFilterSelect({
  value,
  open,
  onOpenChange,
  onChange,
}: {
  value: IssueFilter;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: IssueFilter) => void;
}) {
  const options: Array<{
    label: string;
    value: IssueFilter;
  }> = [
    {
      label: 'All Issues',
      value: 'all',
    },
    {
      label: 'Most Absent',
      value: 'absent',
    },
    {
      label: 'Most Late',
      value: 'late',
    },
    {
      label: 'Early Leaves',
      value: 'early_leave',
    },
  ];

  const selectedLabel =
    options.find(
      (option) =>
        option.value === value,
    )?.label ?? 'All Issues';

  const selectOption = (
    option: IssueFilter,
  ) => {
    onChange(option);
    onOpenChange(false);
  };

  return (
    <div className="relative w-full sm:w-auto">
      <button
        type="button"
        onClick={() =>
          onOpenChange(!open)
        }
        className={`flex h-11 min-w-[180px] items-center justify-between gap-4 rounded-xl border bg-white px-5 text-sm font-semibold transition cursor-pointer ${
          open
            ? 'border-[#0658C2] text-[#061A3D]'
            : 'border-[#D3D3D3] text-[#061A3D] hover:border-[#98A2B3]'
        }`}
      >
        <span>{selectedLabel}</span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[240px] rounded-xl border border-[#DBEAFF] bg-white p-3 shadow-xl">
          <p className="px-1 py-2 text-xs font-semibold uppercase text-[#676767]">
            Filter Issues
          </p>

          <div className="space-y-1">
            {options.map(
              (option) => {
                const selected =
                  option.value ===
                  value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      selectOption(
                        option.value,
                      )
                    }
                    className={`flex w-full items-center justify-between rounded-md px-4 py-2 text-left text-sm ${
                      selected
                        ? 'bg-[#DBEAFF] text-[#0658C2]'
                        : 'border border-[#D3D3D3] hover:border-transparent hover:bg-[#DBEAFF] hover:text-[#0658C2]'
                    }`}
                  >
                    <span className="font-semibold">
                      {option.label}
                    </span>

                    {selected && (
                      <CheckIcon />
                    )}
                  </button>
                );
              },
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ===============================================================
   ISSUE BADGES
================================================================ */

function IssueTypeBadge({
  type,
}: {
  type: IssueRow['issueType'];
}) {
  const className =
    type === 'Absent + Late'
      ? 'bg-[#FEF3F2] text-[#D92D20]'
      : type === 'Absent'
        ? 'bg-[#FEE4E2] text-[#D92D20]'
        : type === 'Early Leave'
          ? 'bg-[#FFE4E6] text-[#E11D48]'
          : 'bg-[#FFFAEB] text-[#DC6803]';

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${className}`}
    >
      {type}
    </span>
  );
}

function IssueBadge({
  level,
}: {
  level: IssueRow['issueLevel'];
}) {
  const className =
    level === 'High'
      ? 'bg-[#FEE4E2] text-[#D92D20]'
      : level === 'Medium'
        ? 'bg-[#FEF0C7] text-[#DC6803]'
        : 'bg-[#D1FADF] text-[#039855]';

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${className}`}
    >
      {level}
    </span>
  );
}

/* ===============================================================
   MOBILE ISSUE CARD
================================================================ */

function IssueCard({
  row,
}: {
  row: IssueRow;
}) {
  return (
    <article className="rounded-xl border border-[#EAECF0] bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E0F2FE] text-xs font-bold text-[#0369A1]">
          {row.employee
            .split(' ')
            .map(
              (part) => part[0],
            )
            .join('')
            .slice(0, 2)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[#344054]">
            {row.employee}
          </p>

          <p className="mt-0.5 truncate text-xs font-semibold text-[#667085]">
            {row.department}
          </p>
        </div>

        <IssueBadge
          level={row.issueLevel}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <IssueMetric
          label="Absences"
          value={row.absencesLabel}
          tone="red"
        />

        <IssueMetric
          label="Late"
          value={row.lateLabel}
          tone="amber"
        />

        <IssueMetric
          label="Early Leaves"
          value={row.earlyLeavesLabel}
          tone="rose"
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-[#667085]">
          Primary Issue
        </span>

        <IssueTypeBadge
          type={row.issueType}
        />
      </div>
    </article>
  );
}

function IssueMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'red' | 'amber' | 'rose';
}) {
  const toneMap = {
    red: 'text-[#EF4444]',
    amber: 'text-[#F79009]',
    rose: 'text-[#F43F5E]',
  };

  return (
    <div className="rounded-lg bg-[#F9FAFB] px-2 py-3">
      <p
        className={`text-xs font-bold ${toneMap[tone]}`}
      >
        {value}
      </p>

      <p className="mt-1 text-[11px] font-semibold text-[#667085]">
        {label}
      </p>
    </div>
  );
}

/* ===============================================================
   TREND AXIS
================================================================ */

type TrendTooltipPayload = {
  dataKey?: string;
  color?: string;
  value?: number;
  payload?: TrendChartPoint;
};

type TrendAxisTickProps = {
  x?: number;
  y?: number;
  payload?: {
    value?: string;
  };
};

function TrendAxisTick({
  x = 0,
  y = 0,
  payload,
}: TrendAxisTickProps) {
  const dateValue =
    payload?.value;

  const date = dateValue
    ? parseDate(dateValue)
    : null;

  const dayLabel =
    date &&
    !Number.isNaN(
      date.getTime(),
    )
      ? date.toLocaleDateString(
          'en-GB',
          {
            weekday: 'short',
          },
        )
      : '-';

  const dateLabel =
    date &&
    !Number.isNaN(
      date.getTime(),
    )
      ? date.toLocaleDateString(
          'en-GB',
          {
            day: '2-digit',
            month: 'short',
          },
        )
      : '-';

  return (
    <g
      transform={`translate(${x},${y})`}
    >
      <text
        textAnchor="middle"
        className="fill-[#475467] text-[12px] font-bold"
      >
        <tspan
          x="0"
          dy="12"
        >
          {dayLabel}
        </tspan>

        <tspan
          x="0"
          dy="16"
          className="fill-[#98A2B3] text-[11px] font-semibold"
        >
          {dateLabel}
        </tspan>
      </text>
    </g>
  );
}

/* ===============================================================
   TREND TOOLTIP
================================================================ */

function TrendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TrendTooltipPayload[];
}) {
  if (
    !active ||
    !payload?.length
  ) {
    return null;
  }

  const point =
    payload[0]?.payload;

  if (!point) return null;

  const countByKey: Record<
    string,
    number
  > = {
    present:
      point.presentCount,
    late: point.lateCount,
    absent:
      point.absentCount,
  };

  return (
    <div className="min-w-[190px] rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 shadow-lg">
      <p className="text-sm font-bold text-[#1F2937]">
        {point.dayName},{' '}
        {parseDate(
          point.date,
        ).toLocaleDateString(
          'en-GB',
          {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          },
        )}
      </p>

      <p className="mt-0.5 text-xs font-semibold text-[#9AA3B5]">
        {point.roster} rostered
        employees
      </p>

      <div className="mt-2 space-y-1.5">
        {payload.map(
          (entry) => {
            const key =
              entry.dataKey ?? '';

            const count =
              countByKey[key] ??
              0;

            return (
              <div
                key={key}
                className="flex items-center justify-between gap-4 text-xs"
              >
                <span className="flex items-center gap-2 font-semibold text-[#4B5563]">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        entry.color,
                    }}
                  />

                  {titleCase(key)}
                </span>

                <span className="font-bold text-[#111827]">
                  {formatPercent(
                    Number(
                      entry.value ??
                        0,
                    ),
                  )}{' '}
                  / {count}
                </span>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}

/* ===============================================================
   DISTRIBUTION TOOLTIP
================================================================ */

type DistributionTooltipPayload = {
  payload?: DistributionItem;
};

function DistributionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: DistributionTooltipPayload[];
}) {
  const item =
    payload?.[0]?.payload;

  if (!active || !item) {
    return null;
  }

  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold shadow-lg">
      <p className="text-[#344054]">
        {item.name}
      </p>

      <p className="mt-1 text-[#667085]">
        {item.value} employees /{' '}
        {item.percent.toFixed(2)}%
      </p>
    </div>
  );
}

/* ===============================================================
   PANEL
================================================================ */

function Panel<T>({
  title,
  subtitle,
  children,
  sectionKey,
  state,
  onRetry,
  showInfo,
  headerAction,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  sectionKey: AnalyticsSectionKey;
  state: SectionState<T>;
  onRetry: (
    key: AnalyticsSectionKey,
  ) => void;
  showInfo?: boolean;
  headerAction?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-[0_8px_24px_rgba(16,24,40,0.05)]">
      {/* =======================================================
          UNIFIED SECTION HEADER

          LEFT:
          title
          subtitle

          RIGHT:
          custom dropdown + refresh
      ======================================================= */}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#101828]">
              {title}
            </h2>

            {showInfo && (
              <Info className="h-3.5 w-3.5 text-[#98A2B3]" />
            )}
          </div>

          {subtitle && (
            <p className="mt-1 text-xs font-semibold text-[#667085]">
              {subtitle}
            </p>
          )}
        </div>

        {headerAction ?? (
          <button
            type="button"
            disabled={state.loading}
            onClick={() =>
              onRetry(sectionKey)
            }
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#667085] transition hover:bg-[#F8FAFC] disabled:opacity-50"
            title="Refresh this section"
          >
            {state.loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* =======================================================
          LOADING
      ======================================================= */}

      {state.loading &&
      !state.data ? (
        <div className="flex h-[220px] items-center justify-center gap-2 text-sm font-semibold text-[#667085]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      ) : state.error &&
        !state.data ? (
        <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#B91C1C]">
          <p>
            {state.error}
          </p>

          <button
            type="button"
            onClick={() =>
              onRetry(sectionKey)
            }
            className="mt-2 inline-flex items-center gap-2 font-semibold text-[#0658C2]"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh this section
          </button>
        </div>
      ) : (
        <>
          {state.error && (
            <div className="mb-3 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-xs text-[#92400E]">
              Could not refresh:{' '}
              {state.error}
            </div>
          )}

          {children}
        </>
      )}
    </section>
  );
}