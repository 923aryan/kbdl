export type PayrollStage = 'attendance' | 'wages' | 'deductions' | 'disburse';
export type PayslipStatus = 'Generated' | 'Sent' | 'Pending';
export type PayrollStatus = 'Paid' | 'Pending' | 'On Hold';

export type PayrollWorker = {
  id: string;
  name: string;
  designation: string;
  department: string;
  contract: 'Contract' | 'Full-time';
  days: number;
  leave: number;
  absent: string;
  otHours: number;
  ratePerDay: number;
  otRate: number;
  basic: number;
  allowance: number;
  gross: number;
  epf: number;
  esic: number;
  tds: number;
  lwf: number;
  advance: number;
  net: number;
  bank: string;
  paymentMode: string;
  epfCovered: boolean;
  esicCovered: boolean;
  payrollStatus: PayrollStatus;
  payslipStatus: PayslipStatus;
};

const names = [
  'Abhinav Barwal',
  'Jagjeet Singh',
  'Aman Barwal',
  'Bhavesh Kumar',
  'Chirag Sharma',
  'Deepak Rana',
  'Gaurav Thakur',
  'Harish Negi',
  'Ishan Mehta',
  'Karan Saini',
];

const designations = ['Electrician', 'Senior Operator', 'Machine Operator', 'Helper', 'Supervisor'];
const departments = ['Maintenance', 'Operations Team', 'Production', 'Assembly'];

export const payrollWorkers: PayrollWorker[] = Array.from({ length: 48 }, (_, index) => {
  const days = index % 3 === 1 ? 25 : 26;
  const ratePerDay = index % 4 === 0 ? 850 : 750;
  const basic = days * ratePerDay;
  const otHours = index % 5 === 0 ? 4 : 3;
  const allowance = index % 4 === 0 ? 500 : 150;
  const gross = basic + allowance;
  const epf = index % 2 === 0 ? 1800 : 0;
  const esic = index % 3 === 0 ? 189 : 0;
  const tds = index % 6 === 0 ? 400 : 0;
  const lwf = 24;
  const advance = index === 2 ? 500 : 0;
  const net = gross - epf - esic - tds - lwf - advance;
  const payrollStatus: PayrollStatus = index % 9 === 0 ? 'On Hold' : index % 4 === 0 ? 'Pending' : 'Paid';

  return {
    id: `EMP-${1082 + index}`,
    name: names[index % names.length]!,
    designation: designations[index % designations.length]!,
    department: departments[index % departments.length]!,
    contract: index % 2 === 0 ? 'Contract' : 'Full-time',
    days,
    leave: 6,
    absent: index % 9 === 0 ? '1' : '-',
    otHours,
    ratePerDay,
    otRate: 128,
    basic,
    allowance,
    gross,
    epf,
    esic,
    tds,
    lwf,
    advance,
    net,
    bank: index % 2 === 0 ? 'SBI****4568' : 'SBI****8823',
    paymentMode: index % 3 === 0 ? 'UPI' : 'NEFT Bank',
    epfCovered: index % 2 === 1,
    esicCovered: index % 2 === 0,
    payrollStatus,
    payslipStatus: index % 3 === 0 ? 'Generated' : index % 3 === 1 ? 'Sent' : 'Pending',
  };
});

export const payrollDesignations = ['Electrician', 'Senior Operator', 'Machine Operator', 'Helper', 'Supervisor'];
export const payrollStatuses = ['Paid', 'Pending', 'On Hold'];
export const payrollTypes = ['Contract', 'Full-time'];
export const payrollCoverageOptions = ['EPF Covered', 'ESIC Covered', 'EPF Not Covered', 'ESIC Not Covered'];
export const payrollMonths = ['October 2026', 'September 2026', 'August 2026', 'July 2026', 'June 2026'];
