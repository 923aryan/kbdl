'use client';

import {
  Bar,
  BarChart,
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
  CartesianGrid,
} from 'recharts';
import {
  Calendar,
  Loader2,
  RefreshCw,
  Search,
  TrendingUp,
  UserRoundCheck,
  UserRoundPen,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  currentUtcMonth,
  useAttendanceAnalytics,
  type AnalyticsSectionKey,
  type SectionState,
} from '../hooks/use-attendance-analytics';

function monthLabel(month: string) {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function parseDate(date: string) {
  return new Date(`${date}T00:00:00`);
}

function formatAxisDate(date: string) {
  return parseDate(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });
}

function formatTooltipDate(date: string, day?: string) {
  const dateLabel = parseDate(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return day ? `${day}, ${dateLabel}` : dateLabel;
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function titleCase(value: string) {
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

type TrendChartPoint = {
  date: string;
  day: string;
  present: number;
  late: number;
  absent: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  roster: number;
};

export function AttendanceAnalyticsScreen() {
  const [month, setMonth] = useState(currentUtcMonth);
  const range = useMemo(() => ({ month }), [month]);
  const { summary, trend, breakdown, insights, refreshSection } = useAttendanceAnalytics(range);

  const trendChart = useMemo(
    () =>
      (trend.data?.points ?? []).map((p) => ({
        date: p.date,
        day: p.day,
        present: p.present_pct,
        late: p.late_pct,
        absent: p.absent_pct,
        presentCount: p.present,
        lateCount: p.late,
        absentCount: p.absent,
        roster: p.roster,
      })),
    [trend.data],
  );

  const punchChart = useMemo(
    () =>
      (trend.data?.punch_summary ?? []).map((p) => ({
        ...p,
        dateLabel: formatAxisDate(p.date),
      })),
    [trend.data],
  );

  return (
    <div className="min-h-screen bg-[#F6F7F9] text-[#111827]">
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#D3D3D3] bg-white px-4 sm:px-6 lg:px-8">
        <div className="relative hidden w-full max-w-[310px] sm:block">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />
          <input
            placeholder="Search anything..."
            className="h-12 w-full rounded-lg bg-[#FAFAFA] pl-12 pr-4 text-sm outline-none"
          />
        </div>
      </header>

      <main className="space-y-6 p-5 lg:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[28px] font-bold tracking-normal">Reports & Analytics</h1>
            <p className="mt-1 text-sm text-[#8B95AA]">
              Attendance trends, department breakdowns and employee insights
            </p>
          </div>
          <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-3 rounded-lg border border-[#E5E7EB] bg-white px-4 font-semibold text-[#4B5563] shadow-sm">
            <Calendar className="h-4 w-4" />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="cursor-pointer border-none bg-transparent outline-none"
            />
          </label>
        </div>

        <SectionShell
          sectionKey="summary"
          state={summary}
          onRetry={refreshSection}
          className="contents"
        >
          <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <MetricCard
              title="Avg Attendance Rate"
              value={`${summary.data?.attendance_rate ?? 0}%`}
              note={
                summary.data?.attendance_rate_delta == null
                  ? monthLabel(month)
                  : `${summary.data.attendance_rate_delta >= 0 ? '+' : ''}${summary.data.attendance_rate_delta}% vs prior period`
              }
              icon={TrendingUp}
              tone="blue"
            />
            <MetricCard
              title="Total Working Days"
              value={`${summary.data?.working_days ?? 0} Days`}
              note={`${summary.data?.active_headcount ?? 0} active employees`}
              icon={Calendar}
              tone="green"
            />
            <MetricCard
              title="Total Overtime Hours"
              value={`${summary.data?.ot_hours ?? 0} hrs`}
              note={`${summary.data?.ot_marked_count ?? 0} OT marks`}
              icon={UserRoundCheck}
              tone="amber"
            />
            <MetricCard
              title="Pending Marks"
              value={`${summary.data?.pending_days ?? 0}`}
              note={`${summary.data?.absent_days ?? 0} absences · ${summary.data?.leave_days ?? 0} leave`}
              icon={UserRoundPen}
              tone="violet"
            />
          </section>
        </SectionShell>

        <section className="grid gap-5 xl:grid-cols-[2fr_0.86fr]">
          <ChartPanel
            title="Daily Attendance Trend"
            subtitle={`Present vs Late vs Absent (%) — ${monthLabel(month)}`}
            sectionKey="trend"
            state={trend}
            onRetry={refreshSection}
          >
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendChart} margin={{ top: 12, right: 18, left: 0, bottom: 16 }}>
                <CartesianGrid stroke="#E8ECF4" strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }}
                  tickFormatter={formatAxisDate}
                  minTickGap={18}
                  interval="preserveStartEnd"
                  height={38}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9AA3B5', fontSize: 12 }}
                  tickFormatter={formatPercent}
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  width={44}
                />
                <Tooltip
                  content={<TrendTooltip />}
                  cursor={{ stroke: '#CBD5E1', strokeDasharray: '4 4' }}
                />
                <Legend
                  align="right"
                  verticalAlign="top"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="present"
                  stroke="#2563EB"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2 }}
                  name="Present"
                />
                <Line
                  type="monotone"
                  dataKey="late"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2 }}
                  name="Late"
                />
                <Line
                  type="monotone"
                  dataKey="absent"
                  stroke="#EF4444"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2 }}
                  name="Absent"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel
            title="Attendance Breakdown"
            subtitle={`Distribution for ${monthLabel(month)}`}
            sectionKey="breakdown"
            state={breakdown}
            onRetry={refreshSection}
          >
            <div className="grid items-center gap-4 sm:grid-cols-[170px_1fr] xl:grid-cols-1 2xl:grid-cols-[170px_1fr]">
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={breakdown.data?.items ?? []}
                    innerRadius={56}
                    outerRadius={82}
                    paddingAngle={1}
                    dataKey="value"
                    nameKey="name"
                  >
                    {(breakdown.data?.items ?? []).map((entry) => (
                      <Cell key={entry.status} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 text-sm">
                {(breakdown.data?.items ?? []).map((item) => (
                  <div key={item.status} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-[#4B5563]">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.name}
                    </span>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartPanel>
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          <ChartPanel
            title="Department Attendance Rate"
            subtitle="Average presence per department"
            sectionKey="insights"
            state={insights}
            onRetry={refreshSection}
          >
            <div className="mt-2 space-y-4">
              {(insights.data?.departments ?? []).length === 0 ? (
                <p className="text-sm text-[#8B95AA]">No department data in this range.</p>
              ) : (
                insights.data!.departments.map((item) => (
                  <div
                    key={item.department}
                    className="grid grid-cols-[96px_1fr_42px] items-center gap-4 text-sm"
                  >
                    <span className="truncate font-medium" title={item.department}>
                      {item.department}
                    </span>
                    <span className="h-2 rounded-full bg-[#EEF2F7]">
                      <span
                        className="block h-2 rounded-full bg-[#2563EB]"
                        style={{ width: `${Math.min(100, item.rate)}%` }}
                      />
                    </span>
                    <span className="text-right font-semibold text-[#4B5563]">{item.rate}%</span>
                  </div>
                ))
              )}
            </div>
          </ChartPanel>

          <ChartPanel
            title="Top Absentees"
            subtitle="Most absences / late marks in range"
            sectionKey="insights"
            state={insights}
            onRetry={refreshSection}
            hideHeaderRetry
          >
            <div className="mt-2 overflow-hidden">
              <div className="grid grid-cols-[1fr_80px_76px] gap-3 border-b border-[#E5E7EB] pb-3 text-xs font-semibold text-[#8B95AA]">
                <span>Employee</span>
                <span>Absences</span>
                <span>Late</span>
              </div>
              {(insights.data?.top_absentees ?? []).length === 0 ? (
                <p className="py-4 text-sm text-[#8B95AA]">No absentees in this range.</p>
              ) : (
                insights.data!.top_absentees.map((item) => (
                  <div
                    key={item.company_member_id}
                    className="grid grid-cols-[1fr_80px_76px] gap-3 border-b border-[#E5E7EB] py-3 text-sm last:border-b-0"
                  >
                    <span>
                      <span className="block font-semibold">{item.employee}</span>
                      <span className="text-xs text-[#8B95AA]">{item.team}</span>
                    </span>
                    <span className="self-center justify-self-start rounded bg-[#FEE9E5] px-2 py-1 text-xs font-semibold text-[#F54A4A]">
                      {item.absences_label}
                    </span>
                    <span className="self-center justify-self-start rounded bg-[#FFF4E3] px-2 py-1 text-xs font-semibold text-[#D97706]">
                      {item.late_label}
                    </span>
                  </div>
                ))
              )}
            </div>
          </ChartPanel>

          <ChartPanel
            title="Daily Punch Summary"
            subtitle="Present vs absent headcount"
            sectionKey="trend"
            state={trend}
            onRetry={refreshSection}
            hideHeaderRetry
          >
            <ResponsiveContainer width="100%" height={245}>
              <BarChart data={punchChart} margin={{ top: 18, right: 10, left: -24, bottom: 0 }}>
                <XAxis
                  dataKey="dateLabel"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#8B95AA', fontSize: 12 }}
                  minTickGap={12}
                  interval="preserveStartEnd"
                />
                <YAxis hide />
                <Tooltip />
                <Legend iconType="circle" />
                <Bar dataKey="present" fill="#2563EB" radius={[4, 4, 0, 0]} name="Present" />
                <Bar dataKey="absent" fill="#FECACA" radius={[4, 4, 0, 0]} name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        </section>
      </main>
    </div>
  );
}

function SectionShell<T>({
  sectionKey,
  state,
  onRetry,
  children,
  className,
}: {
  sectionKey: AnalyticsSectionKey;
  state: SectionState<T>;
  onRetry: (key: AnalyticsSectionKey) => void;
  children: React.ReactNode;
  className?: string;
}) {
  if (state.loading && !state.data) {
    return (
      <div
        className={`flex items-center justify-center gap-2 py-10 text-sm text-[#676767] ${className ?? ''}`}
      >
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (state.error && !state.data) {
    return (
      <div
        className={`rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#B91C1C] ${className ?? ''}`}
      >
        <p>{state.error}</p>
        <button
          type="button"
          onClick={() => onRetry(sectionKey)}
          className="mt-2 inline-flex items-center gap-2 font-semibold text-[#0658C2]"
        >
          <RefreshCw className="h-4 w-4" /> Refresh this section
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {state.error && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-xs text-[#92400E]">
          <span>Partial refresh failed: {state.error}</span>
          <button
            type="button"
            onClick={() => onRetry(sectionKey)}
            className="inline-flex items-center gap-1 font-semibold text-[#0658C2]"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}
      {children}
    </div>
  );
}

function MetricCard({
  title,
  value,
  note,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  note: string;
  icon: typeof TrendingUp;
  tone: 'blue' | 'green' | 'amber' | 'violet';
}) {
  const toneMap = {
    blue: 'bg-[#DBEAFF] text-[#2563EB]',
    green: 'bg-[#E5FFEB] text-[#10B981]',
    amber: 'bg-[#FFF4E3] text-[#EA580C]',
    violet: 'bg-[#EDE9FE] text-[#7C3AED]',
  };

  return (
    <div className="min-h-[120px] rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-semibold text-[#9AA3B5]">{title}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneMap[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-2xl font-bold text-[#1F2937]">{value}</p>
      <p className="mt-2 text-xs font-semibold text-[#9AA3B5]">{note}</p>
    </div>
  );
}

type TrendTooltipPayload = {
  dataKey?: string;
  color?: string;
  value?: number;
  payload?: TrendChartPoint;
};

function TrendTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: TrendTooltipPayload[];
}) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  const countByKey: Record<string, number> = {
    present: point.presentCount,
    late: point.lateCount,
    absent: point.absentCount,
  };

  return (
    <div className="min-w-[190px] rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 shadow-lg">
      <p className="text-sm font-bold text-[#1F2937]">
        {formatTooltipDate(label ?? point.date, point.day)}
      </p>
      <p className="mt-0.5 text-xs font-semibold text-[#9AA3B5]">
        {point.roster} rostered employees
      </p>
      <div className="mt-2 space-y-1.5">
        {payload.map((entry) => {
          const key = entry.dataKey ?? '';
          const count = countByKey[key] ?? 0;

          return (
            <div key={key} className="flex items-center justify-between gap-4 text-xs">
              <span className="flex items-center gap-2 font-semibold text-[#4B5563]">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {titleCase(key)}
              </span>
              <span className="font-bold text-[#111827]">
                {formatPercent(Number(entry.value ?? 0))} · {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChartPanel<T>({
  title,
  subtitle,
  children,
  sectionKey,
  state,
  onRetry,
  hideHeaderRetry,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  sectionKey: AnalyticsSectionKey;
  state: SectionState<T>;
  onRetry: (key: AnalyticsSectionKey) => void;
  hideHeaderRetry?: boolean;
}) {
  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#1F2937]">{title}</h2>
          <p className="text-sm font-semibold text-[#9AA3B5]">{subtitle}</p>
        </div>
        {!hideHeaderRetry && (
          <button
            type="button"
            disabled={state.loading}
            onClick={() => onRetry(sectionKey)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E5E7EB] px-2.5 text-xs font-semibold text-[#4B5563] hover:bg-[#F8FAFC] disabled:opacity-50"
            title="Refresh this section"
          >
            {state.loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Refresh
          </button>
        )}
      </div>

      {state.loading && !state.data ? (
        <div className="flex h-[200px] items-center justify-center gap-2 text-sm text-[#676767]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : state.error && !state.data ? (
        <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#B91C1C]">
          <p>{state.error}</p>
          <button
            type="button"
            onClick={() => onRetry(sectionKey)}
            className="mt-2 inline-flex items-center gap-2 font-semibold text-[#0658C2]"
          >
            <RefreshCw className="h-4 w-4" /> Refresh this section
          </button>
        </div>
      ) : (
        <>
          {state.error && (
            <div className="mb-3 flex items-center justify-between rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-xs text-[#92400E]">
              <span>Couldn’t refresh: {state.error}</span>
              <button
                type="button"
                onClick={() => onRetry(sectionKey)}
                className="font-semibold text-[#0658C2]"
              >
                Retry
              </button>
            </div>
          )}
          {children}
        </>
      )}
    </section>
  );
}
