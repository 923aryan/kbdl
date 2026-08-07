'use client';

import {
  Bar,
  BarChart,
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
  Calendar,
  Download,
  FileText,
  Search,
  TrendingUp,
  UserRoundCheck,
  UserRoundPen,
} from 'lucide-react';
import {
  attendanceBreakdown,
  departmentRates,
  punchSummary,
  topAbsentees,
  weeklyTrend,
} from '../data';

export function AttendanceAnalyticsScreen() {
  return (
    <div className="min-h-screen bg-[#F6F7F9] text-[#111827]">
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#D3D3D3] bg-white px-4 sm:px-6 lg:px-8">
        <div className="relative hidden w-full max-w-[310px] sm:block">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />
          <input placeholder="Search anything..." className="h-12 w-full rounded-lg bg-[#FAFAFA] pl-12 pr-4 text-sm outline-none" />
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm font-semibold">Abhinav Barwal</p>
          <p className="text-xs text-[#676767]">Operations Head</p>
        </div>
      </header>

      <main className="space-y-6 p-5 lg:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[28px] font-bold tracking-normal">Reports & Analytics</h1>
            <p className="mt-1 text-sm text-[#8B95AA]">Attendance trends, department breakdowns and employee insights</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" className="inline-flex h-11 items-center justify-center gap-3 rounded-lg border border-[#E5E7EB] bg-white px-4 font-semibold text-[#4B5563] shadow-sm">
              <Calendar className="h-4 w-4" />
              June, 2026
            </button>
            <button type="button" className="inline-flex h-11 items-center justify-center gap-3 rounded-lg border border-[#C7D2FE] bg-white px-4 font-semibold text-[#4B5563] shadow-sm">
              <Download className="h-4 w-4" />
              Export Report
            </button>
            <button type="button" className="inline-flex h-11 items-center justify-center gap-3 rounded-lg bg-[#315BFF] px-4 font-semibold text-white shadow-sm">
              <FileText className="h-4 w-4" />
              Generate PDF
            </button>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <MetricCard title="Avg Attendance Rate" value="84%" note="+2.1% vs last month" icon={TrendingUp} tone="blue" />
          <MetricCard title="Total Working Days" value="26 Days" note="June 2026" icon={Calendar} tone="green" />
          <MetricCard title="Total Overtime Hours" value="312 hrs" note="+18 hrs vs May" icon={UserRoundCheck} tone="amber" />
          <MetricCard title="Regularizations Filed" value="38" note="14 pending review" icon={UserRoundPen} tone="violet" />
        </section>

        <section className="grid gap-5 xl:grid-cols-[2fr_0.86fr]">
          <ChartPanel title="Weekly Attendance Trend" subtitle="Present vs Late vs Absent (%)">
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={weeklyTrend} margin={{ top: 10, right: 16, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#E8ECF4" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9AA3B5', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9AA3B5', fontSize: 12 }} />
                <Tooltip />
                <Legend align="right" verticalAlign="top" iconType="circle" />
                <Line type="monotone" dataKey="present" stroke="#2563EB" strokeWidth={3} dot={{ r: 3 }} name="Present" />
                <Line type="monotone" dataKey="late" stroke="#FFA000" strokeWidth={3} dot={{ r: 3 }} name="Late" />
                <Line type="monotone" dataKey="absent" stroke="#F54A4A" strokeWidth={3} dot={{ r: 3 }} name="Absent" />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Attendance Breakdown" subtitle="Distribution for June 2026">
            <div className="grid items-center gap-4 sm:grid-cols-[170px_1fr] xl:grid-cols-1 2xl:grid-cols-[170px_1fr]">
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={attendanceBreakdown} innerRadius={56} outerRadius={82} paddingAngle={1} dataKey="value">
                    {attendanceBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 text-sm">
                {attendanceBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-[#4B5563]">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
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
          <ChartPanel title="Department Attendance Rate" subtitle="Average presence per department">
            <div className="mt-2 space-y-4">
              {departmentRates.map((item) => (
                <div key={item.department} className="grid grid-cols-[96px_1fr_42px] items-center gap-4 text-sm">
                  <span className="font-medium">{item.department}</span>
                  <span className="h-2 rounded-full bg-[#EEF2F7]">
                    <span className="block h-2 rounded-full bg-[#2563EB]" style={{ width: `${item.rate}%` }} />
                  </span>
                  <span className="text-right font-semibold text-[#4B5563]">{item.rate}%</span>
                </div>
              ))}
            </div>
          </ChartPanel>

          <ChartPanel title="Top Absentees" subtitle="Employees with most absences this month">
            <div className="mt-2 overflow-hidden">
              <div className="grid grid-cols-[1fr_80px_76px] gap-3 border-b border-[#E5E7EB] pb-3 text-xs font-semibold text-[#8B95AA]">
                <span>Employee</span>
                <span>Absences</span>
                <span>Late</span>
              </div>
              {topAbsentees.map((item) => (
                <div key={item.employee} className="grid grid-cols-[1fr_80px_76px] gap-3 border-b border-[#E5E7EB] py-3 text-sm last:border-b-0">
                  <span>
                    <span className="block font-semibold">{item.employee}</span>
                    <span className="text-xs text-[#8B95AA]">{item.team}</span>
                  </span>
                  <span className="self-center justify-self-start rounded bg-[#FEE9E5] px-2 py-1 text-xs font-semibold text-[#F54A4A]">{item.absences}</span>
                  <span className="self-center justify-self-start rounded bg-[#FFF4E3] px-2 py-1 text-xs font-semibold text-[#D97706]">{item.late}</span>
                </div>
              ))}
            </div>
          </ChartPanel>

          <ChartPanel title="Daily Punch Summary" subtitle="This week - present vs absent">
            <ResponsiveContainer width="100%" height={245}>
              <BarChart data={punchSummary} margin={{ top: 18, right: 10, left: -24, bottom: 0 }}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#8B95AA', fontSize: 12 }} />
                <YAxis hide />
                <Tooltip />
                <Legend iconType="circle" />
                <Bar dataKey="present" fill="#2563EB" radius={[4, 4, 0, 0]} name="Present" />
                <Bar dataKey="absent" fill="#FEE9E5" radius={[4, 4, 0, 0]} name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        </section>
      </main>
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

function ChartPanel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-bold text-[#1F2937]">{title}</h2>
        <p className="text-sm font-semibold text-[#9AA3B5]">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}
