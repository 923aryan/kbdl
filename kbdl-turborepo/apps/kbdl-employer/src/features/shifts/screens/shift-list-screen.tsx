'use client';

import { useShiftStore } from '../stores/use-shift-store';
import { Calendar, Clock, MapPin, User, Briefcase } from 'lucide-react';

// Mock data - replace with actual API call
const mockShifts = [
  {
    id: '1',
    role: 'WELDER',
    workerName: 'Rahul Sharma',
    location: 'Warehouse A, Andheri East',
    pay: '800',
    date: '2026-05-05',
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    status: 'open',
    applicants: 3,
  },
  {
    id: '2',
    role: 'FITTER',
    workerName: 'Amit Kumar',
    location: 'Factory Unit 2, Bhiwandi',
    pay: '900',
    date: '2026-05-10',
    startTime: '10:00 AM',
    endTime: '06:00 PM',
    status: 'filled',
    applicants: 5,
  },
  {
    id: '3',
    role: 'ELECTRICIAN',
    workerName: 'Priya Singh',
    location: 'Construction Site, Powai',
    pay: '850',
    date: '2026-04-02',
    startTime: '08:00 AM',
    endTime: '04:00 PM',
    status: 'completed',
    applicants: 2,
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'open':
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
          Open
        </span>
      );
    case 'filled':
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
          Filled
        </span>
      );
    case 'completed':
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
          Completed
        </span>
      );
    case 'cancelled':
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
          Cancelled
        </span>
      );
    default:
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
          {status}
        </span>
      );
  }
};

interface ShiftListScreenProps {
  onSelectShift: (id: string) => void;
}

export const ShiftListScreen = ({ onSelectShift }: ShiftListScreenProps) => {
  const { filters } = useShiftStore();

  const filteredShifts = mockShifts.filter((shift) => {
    if (filters.status !== 'all' && shift.status !== filters.status) return false;
    if (
      filters.search &&
      !shift.role.toLowerCase().includes(filters.search.toLowerCase()) &&
      !shift.workerName.toLowerCase().includes(filters.search.toLowerCase())
    )
      return false;
    return true;
  });

  if (filteredShifts.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No shifts found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredShifts.map((shift) => (
        <div
          key={shift.id}
          onClick={() => onSelectShift(shift.id)}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-900 uppercase">{shift.role}</span>
              </div>
              <p className="text-lg font-bold text-gray-900 mt-1">₹{shift.pay} / Shift</p>
            </div>
            {getStatusBadge(shift.status)}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4 text-gray-400" />
              <span>{shift.workerName}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>
                {new Date(shift.date).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>
                {shift.startTime} – {shift.endTime}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="truncate">{shift.location}</span>
            </div>
          </div>

          {shift.status === 'open' && shift.applicants > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-blue-600">
                {shift.applicants} applicant{shift.applicants !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
