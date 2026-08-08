export type AttendanceStatus = 'On Time' | 'Absent' | 'Late' | 'Half Day' | 'Leave';

export type PunchLog = {
  time: string;
  type: 'Check In' | 'Check Out';
};

export type AttendanceRecord = {
  id: string;
  employee: string;
  employeeId: string;
  supervisor: string;
  date: string;
  timeLog: string;
  workedHours: string;
  overtime: string;
  status: AttendanceStatus;
  punchLogs: PunchLog[];
};

export const attendanceRecords: AttendanceRecord[] = [
  {
    id: 'att-1',
    employee: 'Jagjeet Singh',
    employeeId: 'EMP-1082',
    supervisor: 'Abhinav Barwal',
    date: '11 June, 2026',
    timeLog: '10:00AM - 07:00PM',
    workedHours: '9h 0m',
    overtime: '-',
    status: 'On Time',
    punchLogs: [
      { time: '06:06:43 am', type: 'Check In' },
      { time: '12:02:23 pm', type: 'Check Out' },
      { time: '02:25:50 pm', type: 'Check In' },
      { time: '05:45:34 pm', type: 'Check Out' },
    ],
  },
  {
    id: 'att-2',
    employee: 'Pooja Nair',
    employeeId: 'EMP-1091',
    supervisor: 'Abhinav Barwal',
    date: '11 June, 2026',
    timeLog: '-',
    workedHours: '-',
    overtime: '-',
    status: 'Absent',
    punchLogs: [],
  },
  {
    id: 'att-3',
    employee: 'Rahul Verma',
    employeeId: 'EMP-1114',
    supervisor: 'Abhinav Barwal',
    date: '11 June, 2026',
    timeLog: '10:20AM - 09:30PM',
    workedHours: '8h 12m',
    overtime: '2h 10m',
    status: 'Late',
    punchLogs: [
      { time: '10:20:11 am', type: 'Check In' },
      { time: '02:15:03 pm', type: 'Check Out' },
      { time: '03:02:44 pm', type: 'Check In' },
      { time: '09:30:00 pm', type: 'Check Out' },
    ],
  },
  {
    id: 'att-4',
    employee: 'Deepak Rana',
    employeeId: 'EMP-1128',
    supervisor: 'Nisha Mehta',
    date: '11 June, 2026',
    timeLog: '-',
    workedHours: '-',
    overtime: '-',
    status: 'Absent',
    punchLogs: [],
  },
  {
    id: 'att-5',
    employee: 'Ankit Mehta',
    employeeId: 'EMP-1140',
    supervisor: 'Nisha Mehta',
    date: '11 June, 2026',
    timeLog: '10:00AM - 02:00PM',
    workedHours: '4h 0m',
    overtime: '-',
    status: 'Half Day',
    punchLogs: [
      { time: '10:00:00 am', type: 'Check In' },
      { time: '02:00:00 pm', type: 'Check Out' },
    ],
  },
  {
    id: 'att-6',
    employee: 'Sneha Gupta',
    employeeId: 'EMP-1157',
    supervisor: 'Karan Malhotra',
    date: '11 June, 2026',
    timeLog: '-',
    workedHours: '-',
    overtime: '-',
    status: 'Leave',
    punchLogs: [],
  },
  {
    id: 'att-7',
    employee: 'Meera Joshi',
    employeeId: 'EMP-1188',
    supervisor: 'Karan Malhotra',
    date: '11 June, 2026',
    timeLog: '10:00AM - 07:00PM',
    workedHours: '9h 0m',
    overtime: '-',
    status: 'On Time',
    punchLogs: [
      { time: '10:00:00 am', type: 'Check In' },
      { time: '07:00:00 pm', type: 'Check Out' },
    ],
  },
];

export const weeklyTrend = [
  { day: 'Mon', present: 88, late: 18, absent: 12 },
  { day: 'Tue', present: 91, late: 14, absent: 8 },
  { day: 'Wed', present: 85, late: 19, absent: 13 },
  { day: 'Thu', present: 93, late: 10, absent: 6 },
  { day: 'Fri', present: 78, late: 24, absent: 22 },
  { day: 'Sat', present: 60, late: 9, absent: 40 },
];

export const attendanceBreakdown = [
  { name: 'Present', value: 265, color: '#2563EB' },
  { name: 'Absent', value: 42, color: '#F54A4A' },
  { name: 'Late', value: 62, color: '#FFA000' },
  { name: 'On Leave', value: 18, color: '#8B5CF6' },
  { name: 'Half Day', value: 9, color: '#6478FF' },
];

export const departmentRates = [
  { department: 'Operations', rate: 92 },
  { department: 'Sales', rate: 74 },
  { department: 'HR', rate: 88 },
  { department: 'Finance', rate: 81 },
  { department: 'Design', rate: 70 },
  { department: 'Marketing', rate: 85 },
];

export const topAbsentees = [
  { employee: 'Pooja Nair', team: 'Design', absences: '8 days', late: '3 times' },
  { employee: 'Rahul Verma', team: 'Sales', absences: '6 days', late: '5 times' },
  { employee: 'Deepak Rana', team: 'Ops', absences: '5 days', late: '7 times' },
  { employee: 'Ankit Mehta', team: 'Finance', absences: '4 days', late: '2 times' },
  { employee: 'Sneha Gupta', team: 'Marketing', absences: '3 days', late: '9 times' },
];

export const punchSummary = [
  { day: 'Mon', present: 86, absent: 12 },
  { day: 'Tue', present: 89, absent: 10 },
  { day: 'Wed', present: 82, absent: 15 },
  { day: 'Thu', present: 91, absent: 9 },
  { day: 'Fri', present: 75, absent: 22 },
  { day: 'Sat', present: 58, absent: 36 },
];
