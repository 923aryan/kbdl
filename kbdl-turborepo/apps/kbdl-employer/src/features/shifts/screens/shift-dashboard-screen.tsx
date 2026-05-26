'use client';

import { useState } from 'react';
import { ShiftListScreen } from './shift-list-screen';
import { CreateShiftModal } from './create-shift-modal';
import { ShiftDetailsModal } from './shift-details-modal';
import { useShiftStore } from '../stores/use-shift-store';
import { Plus, Calendar, Clock, Users } from 'lucide-react';

export const ShiftDashboardScreen = () => {
  const { toggleCreateModal, filters, setFilters } = useShiftStore();
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  // Mock stats - replace with actual API data
  const stats = [
    { title: 'Open Shifts', value: '8', change: '+3 today', icon: Calendar, color: 'bg-green-500' },
    {
      title: 'Pending Approvals',
      value: '6',
      change: 'Requires action',
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      title: 'Total Workers',
      value: '24',
      change: '+2 this month',
      icon: Users,
      color: 'bg-blue-500',
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shift Management</h1>
          <p className="text-gray-600 text-sm mt-1">Manage shift replacements and approvals</p>
        </div>
        <button
          onClick={toggleCreateModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Create New Shift
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  {stat.change && <p className="text-xs text-green-600 mt-1">{stat.change}</p>}
                </div>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search shifts..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'open', 'filled', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilters({ status: status as any })}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                  filters.status === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Shift List */}
      <ShiftListScreen onSelectShift={setSelectedShiftId} />

      {/* Modals */}
      <CreateShiftModal />
      <ShiftDetailsModal shiftId={selectedShiftId} onClose={() => setSelectedShiftId(null)} />
    </div>
  );
};
