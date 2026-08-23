export type AttendanceBucket = {
  present: number;
  leave: number;
  absent: number;
  halfDay: number;
  otMinutes: number;
};

export type StatutoryRates = {
  employee_pf_rate: number;
  employer_pf_rate: number;
  employee_esic_rate: number;
  employer_esic_rate: number;
  labour_welfare_fund: number;
  professional_tax: number;
};

export type WageInputs = {
  payableDays: number;
  otHours: number;
  ratePerDay: number;
  otRate: number;
  allowance: number;
};

export type DeductionInputs = {
  basic: number;
  gross: number;
  epfCovered: boolean;
  esicCovered: boolean;
  rates: StatutoryRates;
  tds: number;
  advance: number;
  customDeduction: number;
};

export function round2(value: number): number {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function periodBounds(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  return { start, end };
}

export function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function periodLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-IN', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function monthName(month: number): string {
  return new Date(Date.UTC(2026, month - 1, 1)).toLocaleString('en-IN', {
    month: 'long',
    timeZone: 'UTC',
  });
}

export function summarizeAttendance(
  rows: Array<{ status: string; ot_minutes: number }>,
  halfDayPct: number,
): { present: number; leave: number; absent: number; otHours: number; payable: number } {
  let present = 0;
  let leave = 0;
  let absent = 0;
  let otMinutes = 0;
  const half = halfDayPct / 100;
  for (const row of rows) {
    otMinutes += row.ot_minutes || 0;
    if (row.status === 'present' || row.status === 'on_duty') present += 1;
    else if (row.status === 'half_day') present += half;
    else if (row.status === 'leave') leave += 1;
    else if (row.status === 'absent') absent += 1;
  }
  const payable = round2(present + leave);
  return {
    present: round2(present),
    leave: round2(leave),
    absent: round2(absent),
    otHours: round2(otMinutes / 60),
    payable,
  };
}

export function dailyRateFromSalary(basicSalary: number, salaryType: string | null, workingDays: number): number {
  if (!basicSalary || basicSalary <= 0) return 0;
  const type = (salaryType || 'monthly').toLowerCase();
  if (type === 'daily' || type === 'day') return round2(basicSalary);
  if (type === 'hourly') return round2(basicSalary * 8);
  if (type === 'weekly') return round2(basicSalary / 6);
  const days = workingDays > 0 ? workingDays : 26;
  return round2(basicSalary / days);
}

export function otRateFromDaily(ratePerDay: number, dailyHours: number, multiplier: number): number {
  const hours = dailyHours > 0 ? dailyHours : 8;
  return round2((ratePerDay / hours) * multiplier);
}

export function computeWages(input: WageInputs) {
  const basic = round2(input.payableDays * input.ratePerDay);
  const otPay = round2(input.otHours * input.otRate);
  const allowance = round2(input.allowance);
  const gross = round2(basic + otPay + allowance);
  return { basic, otPay, allowance, gross };
}

export function computeDeductions(input: DeductionInputs) {
  const epf = input.epfCovered ? round2((input.basic * input.rates.employee_pf_rate) / 100) : 0;
  const employerEpf = input.epfCovered ? round2((input.basic * input.rates.employer_pf_rate) / 100) : 0;
  const esicEligible = input.esicCovered && input.gross > 0 && input.gross <= 21000;
  const esic = esicEligible ? round2((input.gross * input.rates.employee_esic_rate) / 100) : 0;
  const employerEsic = esicEligible ? round2((input.gross * input.rates.employer_esic_rate) / 100) : 0;
  const lwf = input.epfCovered || input.esicCovered ? round2(input.rates.labour_welfare_fund) : 0;
  const tds = round2(input.tds);
  const advance = round2(input.advance);
  const custom = round2(input.customDeduction);
  const total = round2(epf + esic + tds + lwf + advance + custom);
  const net = round2(Math.max(0, input.gross - total));
  return { epf, esic, tds, lwf, advance, custom, total, net, employerEpf, employerEsic };
}

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n] ?? '';
  const t = Math.floor(n / 10);
  const o = n % 10;
  return `${TENS[t]}${o ? ` ${ONES[o]}` : ''}`.trim();
}

export function amountInWords(amount: number): string {
  const rupees = Math.floor(Math.abs(amount));
  if (rupees === 0) return 'Zero Rupees Only';
  const crore = Math.floor(rupees / 1_00_00_000);
  const lakh = Math.floor((rupees % 1_00_00_000) / 1_00_000);
  const thousand = Math.floor((rupees % 1_00_000) / 1000);
  const hundred = Math.floor((rupees % 1000) / 100);
  const rest = rupees % 100;
  const parts: string[] = [];
  if (crore) parts.push(`${twoDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundred) parts.push(`${ONES[hundred]} Hundred`);
  if (rest) parts.push(twoDigits(rest));
  return `${parts.join(' ')} Rupees Only`;
}

export function lastDayOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 0));
}

export function addMonths(year: number, month: number, add: number) {
  const d = new Date(Date.UTC(year, month - 1 + add, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

export function dueDateForKind(kind: string, year: number, month: number): Date {
  if (kind === 'pt') return lastDayOfMonth(year, month);
  if (kind === 'lwf') {
    const qEndMonth = Math.ceil(month / 3) * 3;
    return lastDayOfMonth(year, qEndMonth);
  }
  const next = addMonths(year, month, 1);
  if (kind === 'tds') return new Date(Date.UTC(next.year, next.month - 1, 7));
  return new Date(Date.UTC(next.year, next.month - 1, 15));
}

export function formatDue(d: Date): string {
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
