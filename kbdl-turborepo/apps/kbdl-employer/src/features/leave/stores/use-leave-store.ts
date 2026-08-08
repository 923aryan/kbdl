import { create } from 'zustand';

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export type LeaveType = 'Casual Leave' | 'Sick Leave' | 'Earned Leave';

export type LeaveSession = 'Session 1' | 'Session 2';

export type LeaveRequest = {
  id: string;
  employee: {
    name: string;
    role: string;
    employeeId: string;
    uid: string;
    phone: string;
    email: string;
    status: 'Active' | 'Inactive';
  };
  supervisor: {
    name: string;
    email: string;
  };
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  sessionFrom: LeaveSession;
  sessionTo: LeaveSession;
  appliedOn: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  attachment: {
    name: string;
    size: string;
  };
};

export type LeaveBalance = {
  type: LeaveType;
  used: number;
  total: number;
  accent: 'blue' | 'green' | 'amber';
};

type LeaveFormData = {
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  sessionFrom: LeaveSession;
  sessionTo: LeaveSession;
  reason: string;
};

type LeaveState = {
  requests: LeaveRequest[];
  filters: {
    search: string;
    status: LeaveStatus | 'all';
    dateRange: string;
  };
  notification: string;
  setFilters: (filters: Partial<LeaveState['filters']>) => void;
  submitLeave: (data: LeaveFormData) => void;
  approveLeave: (id: string) => void;
  rejectLeave: (id: string) => void;
  changeLeave: (id: string, data: LeaveFormData) => void;
  clearNotification: () => void;
};

export const employeeProfile = {
  name: 'ABHINAV BARWAL',
  role: 'Electrician',
  employeeId: 'EMP92002',
  uid: 'A9B42003',
  phone: '+91 8894853644',
  email: 'abhibarwal7321@gmail.com',
  status: 'Active' as const,
};

export const supervisorProfile = {
  name: 'Jagjeet Singh',
  email: 'jagjeet.singh@texo.example',
};

export const leaveBalances: LeaveBalance[] = [
  { type: 'Casual Leave', used: 5, total: 12, accent: 'blue' },
  { type: 'Sick Leave', used: 3, total: 8, accent: 'green' },
  { type: 'Earned Leave', used: 7, total: 15, accent: 'amber' },
];

const initialRequests: LeaveRequest[] = [
  {
    id: 'leave-1001',
    employee: employeeProfile,
    supervisor: supervisorProfile,
    leaveType: 'Casual Leave',
    fromDate: '2026-05-03',
    toDate: '2026-05-05',
    sessionFrom: 'Session 1',
    sessionTo: 'Session 2',
    appliedOn: '2026-05-01',
    totalDays: 3,
    reason: 'Personal Work at Home',
    status: 'approved',
    attachment: { name: 'Leave_Request_Ramesh.pdf', size: '245 KB' },
  },
  {
    id: 'leave-1002',
    employee: { ...employeeProfile, employeeId: 'EMP-1082' },
    supervisor: supervisorProfile,
    leaveType: 'Casual Leave',
    fromDate: '2026-05-03',
    toDate: '2026-05-05',
    sessionFrom: 'Session 1',
    sessionTo: 'Session 2',
    appliedOn: '2026-05-01',
    totalDays: 3,
    reason: 'Personal work for hometown',
    status: 'rejected',
    attachment: { name: 'Leave_Request_Ramesh.pdf', size: '245 KB' },
  },
  {
    id: 'leave-1003',
    employee: employeeProfile,
    supervisor: supervisorProfile,
    leaveType: 'Casual Leave',
    fromDate: '2026-06-15',
    toDate: '2026-06-17',
    sessionFrom: 'Session 1',
    sessionTo: 'Session 2',
    appliedOn: '2026-06-03',
    totalDays: 3,
    reason: 'Personal Work at Home',
    status: 'pending',
    attachment: { name: 'Leave_Request_Ramesh.pdf', size: '245 KB' },
  },
  ...Array.from({ length: 8 }, (_, index) => ({
    id: `leave-100${index + 4}`,
    employee: { ...employeeProfile, employeeId: 'EMP-1082' },
    supervisor: supervisorProfile,
    leaveType: index % 3 === 0 ? 'Sick Leave' : ('Casual Leave' as LeaveType),
    fromDate: '2026-05-03',
    toDate: '2026-05-05',
    sessionFrom: 'Session 1' as LeaveSession,
    sessionTo: 'Session 2' as LeaveSession,
    appliedOn: '2026-05-01',
    totalDays: 3,
    reason: 'Personal work for hometown',
    status: index === 2 ? 'pending' : ('approved' as LeaveStatus),
    attachment: { name: 'Leave_Request_Ramesh.pdf', size: '245 KB' },
  })),
];

const getTotalDays = (fromDate: string, toDate: string) => {
  const start = new Date(`${fromDate}T00:00:00`);
  const end = new Date(`${toDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 1;
  }

  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
};

const notifySupervisor = (action: string, request: LeaveRequest) =>
  `${action}. Mail queued for ${request.supervisor.name}.`;

export const useLeaveStore = create<LeaveState>((set) => ({
  requests: initialRequests,
  filters: {
    search: '',
    status: 'all',
    dateRange: '01 May 2026 - 30 May 2026',
  },
  notification: '',
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
  submitLeave: (data) =>
    set((state) => {
      const request: LeaveRequest = {
        id: `leave-${Date.now()}`,
        employee: employeeProfile,
        supervisor: supervisorProfile,
        ...data,
        appliedOn: '2026-07-27',
        totalDays: getTotalDays(data.fromDate, data.toDate),
        status: 'pending',
        attachment: { name: 'Leave_Request_Ramesh.pdf', size: '245 KB' },
      };

      return {
        requests: [request, ...state.requests],
        notification: `Leave request submitted. HR can review it from Leaves Request.`,
      };
    }),
  approveLeave: (id) =>
    set((state) => {
      const request = state.requests.find((item) => item.id === id);

      return {
        requests: state.requests.map((item) =>
          item.id === id ? { ...item, status: 'approved' } : item,
        ),
        notification: request ? notifySupervisor('Leave approved', request) : '',
      };
    }),
  rejectLeave: (id) =>
    set((state) => {
      const request = state.requests.find((item) => item.id === id);

      return {
        requests: state.requests.map((item) =>
          item.id === id ? { ...item, status: 'rejected' } : item,
        ),
        notification: request ? notifySupervisor('Leave rejected', request) : '',
      };
    }),
  changeLeave: (id, data) =>
    set((state) => {
      const request = state.requests.find((item) => item.id === id);

      return {
        requests: state.requests.map((item) =>
          item.id === id
            ? {
                ...item,
                ...data,
                totalDays: getTotalDays(data.fromDate, data.toDate),
                status: 'pending',
              }
            : item,
        ),
        notification: request ? notifySupervisor('Leave changes submitted', request) : '',
      };
    }),
  clearNotification: () => set({ notification: '' }),
}));
