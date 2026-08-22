export type PayrollStage = 'attendance' | 'wages' | 'deductions' | 'disburse';
export type PayslipStatus = 'Generated' | 'Sent' | 'Pending';
export type PayrollStatus = 'Paid' | 'Pending' | 'On Hold';

export const payrollStatuses = ['Paid', 'Pending', 'On Hold'];
export const payrollTypes = ['Contract', 'Full-time'];
export const payrollCoverageOptions = ['EPF Covered', 'ESIC Covered', 'EPF Not Covered', 'ESIC Not Covered'];

export type PayrollPeriod = { year: number; month: number; label: string };

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function periodFromParts(year: number, month: number): PayrollPeriod {
  return { year, month, label: `${MONTH_NAMES[month - 1]} ${year}` };
}

export function currentPayrollPeriod(now = new Date()): PayrollPeriod {
  return periodFromParts(now.getFullYear(), now.getMonth() + 1);
}

export function payrollMonthOptions(now = new Date()): PayrollPeriod[] {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    return periodFromParts(date.getFullYear(), date.getMonth() + 1);
  });
}

export const payrollMonths = payrollMonthOptions().map((item) => item.label);
