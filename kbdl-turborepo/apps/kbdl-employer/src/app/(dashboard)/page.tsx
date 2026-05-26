'use client';

import Link from 'next/link';
import {
  Briefcase,
  Clock,
  Users,
  UserPlus,
  AlertCircle,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';

// Stats Card Component
const StatsCard = ({ title, value, change, icon: Icon, color }: any) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        {change && (
          <div className="flex items-center mt-2">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">{change}</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

// Quick Action Card Component
const QuickActionCard = ({ title, description, icon: Icon, href, color }: any) => (
  <Link href={href}>
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all hover:border-blue-200 cursor-pointer group">
      <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
      <div className="mt-4 flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        Create Now <ChevronRight className="w-4 h-4 ml-1" />
      </div>
    </div>
  </Link>
);

export default function DashboardPage() {
  const stats = [
    {
      title: 'Active Jobs',
      value: '12',
      change: '+2 this week',
      icon: Briefcase,
      color: 'bg-blue-500',
    },
    { title: 'Open Shifts', value: '8', change: '+3 today', icon: Clock, color: 'bg-green-500' },
    { title: 'Applications', value: '24', change: '+7 today', icon: Users, color: 'bg-purple-500' },
    {
      title: 'Hires This Month',
      value: '15',
      change: '+5 vs last month',
      icon: UserPlus,
      color: 'bg-orange-500',
    },
    {
      title: 'Pending Approvals',
      value: '6',
      change: 'Requires action',
      icon: AlertCircle,
      color: 'bg-red-500',
    },
  ];

  const recentJobs = [
    { title: 'Warehouse Assistant', applications: 8, status: 'Active', postedAt: '2 days ago' },
    { title: 'Machine Operator', applications: 12, status: 'Active', postedAt: '3 days ago' },
    { title: 'Delivery Associate', applications: 15, status: 'Active', postedAt: '5 days ago' },
    { title: 'Production Line Worker', applications: 6, status: 'Draft', postedAt: '1 week ago' },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, John!</h1>
        <p className="text-gray-600 mt-1">Here's what's happening with your workforce today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <StatsCard key={idx} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Create New</h2>
        <p className="text-sm text-gray-600 mb-4">
          Post a new job or create a shift for replacement
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <QuickActionCard
            title="Create Job"
            description="Create a new job opening for blue collar positions"
            icon={Briefcase}
            href="/dashboard/jobs/create"
            color="bg-blue-500"
          />
          <QuickActionCard
            title="Create Shift"
            description="Set shift timing, find replacement, HR review & approve"
            icon={Clock}
            href="/dashboard/shifts/create"
            color="bg-green-500"
          />
        </div>
      </div>

      {/* Recent Jobs Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Recent Jobs</h2>
            <p className="text-sm text-gray-600 mt-1">Your latest job postings</p>
          </div>
          <Link
            href="/dashboard/jobs"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
          >
            View All Jobs <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applications
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posted On
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentJobs.map((job, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{job.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{job.applications}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        job.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{job.postedAt}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
