'use client';

import {
  Users,
  Clock,
  Briefcase,
  UserPlus,
  AlertCircle,
  ChevronRight,
  Bell,
  Calendar,
  ChevronDown,
  RefreshCw,
  Wallet,
  FileText,
} from 'lucide-react';

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatsCard = ({ title, value, subtext, subtextColor, icon: Icon, iconBg, iconColor }: any) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
    <div
      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
    >
      <Icon className={`w-6 h-6 ${iconColor}`} />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-400 truncate">{title}</p>
      <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
      <p className={`text-xs mt-0.5 font-medium ${subtextColor}`}>{subtext}</p>
    </div>
  </div>
);

// ─── Shift summary pill ───────────────────────────────────────────────────────
const ShiftPill = ({ label, value, valueColor, bg }: any) => (
  <div className={`rounded-xl px-4 py-3 flex flex-col items-center ${bg}`}>
    <p className="text-xs font-semibold text-gray-500">{label}</p>
    <p className={`text-3xl font-extrabold mt-0.5 ${valueColor}`}>{value}</p>
  </div>
);

// ─── Pending action row ───────────────────────────────────────────────────────
const PendingRow = ({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  sub,
  badge,
  badgeBg,
  badgeColor,
}: any) => (
  <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}
    >
      <Icon className={`w-4 h-4 ${iconColor}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-800 truncate">{label}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
    <span
      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${badgeBg} ${badgeColor}`}
    >
      {badge}
    </span>
  </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const stats = [
    {
      title: 'Active Workers',
      value: '148',
      subtext: '↑ 12 today',
      subtextColor: 'text-green-500',
      icon: Users,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
    },
    {
      title: 'Open Shifts',
      value: '6',
      subtext: '↑ 2 today',
      subtextColor: 'text-green-500',
      icon: Clock,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-500',
    },
    {
      title: 'Active Jobs',
      value: '12',
      subtext: '↑ 3 this week',
      subtextColor: 'text-green-500',
      icon: Briefcase,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-500',
    },
    {
      title: 'Pending Applications',
      value: '24',
      subtext: '↑ 7 today',
      subtextColor: 'text-green-500',
      icon: UserPlus,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
    },
    {
      title: 'Attendance Rate',
      value: '91%',
      subtext: '↓ 3% yesterday',
      subtextColor: 'text-red-500',
      icon: AlertCircle,
      iconBg: 'bg-pink-50',
      iconColor: 'text-pink-500',
    },
    {
      title: 'Payroll This Month',
      value: '₹3.2L',
      subtext: 'Pending: ₹45,200',
      subtextColor: 'text-yellow-600',
      icon: Wallet,
      iconBg: 'bg-yellow-50',
      iconColor: 'text-yellow-500',
    },
  ];

  const todayShifts = [
    {
      shift: 'Warehouse - Morning',
      worker: 'Ravi Kumar',
      time: '8:00 AM - 4:00 PM',
      status: 'Active',
      statusClass: 'bg-green-50 text-green-600',
    },
    {
      shift: 'Loader Shift',
      worker: '—',
      time: '10:00 AM - 6:00 PM',
      status: 'Unfilled',
      statusClass: 'bg-red-50 text-red-500',
    },
    {
      shift: 'Electrician',
      worker: 'Amit Singh',
      time: '9:00 AM - 5:00 PM',
      status: 'Late',
      statusClass: 'bg-orange-50 text-orange-500',
    },
    {
      shift: 'Packaging - Evening',
      worker: 'Suresh Yadav',
      time: '2:00 PM - 10:00 PM',
      status: 'Active',
      statusClass: 'bg-green-50 text-green-600',
    },
    {
      shift: 'Security - Night',
      worker: 'Deepak Verma',
      time: '10:00 PM - 6:00 AM',
      status: 'Active',
      statusClass: 'bg-green-50 text-green-600',
    },
    {
      shift: 'Forklift Operator',
      worker: '—',
      time: '6:00 AM - 2:00 PM',
      status: 'Unfilled',
      statusClass: 'bg-red-50 text-red-500',
    },
  ];

  const pendingActions = [
    {
      icon: UserPlus,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
      label: 'Approve Applications',
      sub: '8 pending',
      badge: 8,
      badgeBg: 'bg-blue-100',
      badgeColor: 'text-blue-700',
    },
    {
      icon: RefreshCw,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
      label: 'Shift Swap Requests',
      sub: '3 pending',
      badge: 3,
      badgeBg: 'bg-orange-100',
      badgeColor: 'text-orange-700',
    },
    {
      icon: Users,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
      label: 'Attendance Issues',
      sub: '5 workers absent',
      badge: 5,
      badgeBg: 'bg-red-100',
      badgeColor: 'text-red-600',
    },
    {
      icon: Wallet,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-500',
      label: 'Payroll Approvals',
      sub: '1 pending',
      badge: 1,
      badgeBg: 'bg-purple-100',
      badgeColor: 'text-purple-700',
    },
    {
      icon: FileText,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-500',
      label: 'Documents Verification',
      sub: '4 pending',
      badge: 4,
      badgeBg: 'bg-gray-200',
      badgeColor: 'text-gray-700',
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <div className="px-6 lg:px-8 py-6 space-y-6">
        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {stats.map((s, i) => (
            <StatsCard key={i} {...s} />
          ))}
        </div>

        {/* ── Main Row: Shift Overview (wider) + Pending Actions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Today's Shift Overview — 8 cols */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
              <h2 className="text-base font-bold text-gray-900">Today's Shift Overview</h2>
              <button className="text-blue-500 hover:text-blue-600 text-sm font-semibold flex items-center gap-1">
                View All Shifts <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Shift summary pills */}
            <div className="grid grid-cols-4 gap-3 px-5 py-4 bg-gray-50 border-b border-gray-100">
              <ShiftPill
                label="Total Shifts"
                value="18"
                valueColor="text-green-600"
                bg="bg-green-50"
              />
              <ShiftPill
                label="Filled Shifts"
                value="12"
                valueColor="text-blue-600"
                bg="bg-blue-50"
              />
              <ShiftPill
                label="Unfilled Shifts"
                value="4"
                valueColor="text-orange-500"
                bg="bg-orange-50"
              />
              <ShiftPill label="Late Workers" value="2" valueColor="text-red-500" bg="bg-red-50" />
            </div>

            {/* Shift table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Shift', 'Worker', 'Time', 'Status'].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {todayShifts.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-sm font-semibold text-gray-800">{row.shift}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          {row.worker !== '—' && (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex-shrink-0" />
                          )}
                          {row.worker === '—' ? (
                            <span className="text-gray-300">— —</span>
                          ) : (
                            row.worker
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-400">{row.time}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${row.statusClass}`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Actions — 4 cols */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
              <div>
                <h2 className="text-base font-bold text-gray-900">Pending Actions</h2>
                <p className="text-xs text-gray-400 mt-0.5">Items requiring your attention</p>
              </div>
              <button className="text-blue-500 text-sm font-semibold hover:text-blue-600">
                View All
              </button>
            </div>
            <div className="px-5 py-1">
              {pendingActions.map((a, i) => (
                <PendingRow key={i} {...a} />
              ))}
            </div>
            {/* Summary footer */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                <span className="font-bold text-gray-800">21</span> total items need attention
              </p>
              <button className="text-xs text-blue-500 font-semibold hover:text-blue-600 flex items-center gap-0.5">
                Resolve all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Premium Banner ── */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-sm">
          <div className="px-6 py-5 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Upgrade to Premium</h3>
              <p className="text-purple-200 text-sm mt-0.5">
                Unlock more features and grow your team
              </p>
            </div>
            <button className="bg-white text-purple-600 px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-purple-50 transition-colors shadow-sm">
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
