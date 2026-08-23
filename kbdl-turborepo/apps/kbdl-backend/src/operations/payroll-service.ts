import { Prisma, prisma, SYSTEM_ROLE_CODES } from '@repo/db/server';
import type {
  PayrollLineView,
  PayrollRunView,
  PayrollSettingsView,
  PayslipPreviewView,
  StatutoryHistoryRow,
  StatutoryMonthView,
  WorkerWagesPage,
} from '@repo/types';
import { AppError } from '../utils/api-error';
import {
  amountInWords,
  computeDeductions,
  computeWages,
  dailyRateFromSalary,
  dueDateForKind,
  formatDue,
  isoDay,
  num,
  otRateFromDaily,
  periodBounds,
  periodLabel,
  round2,
  summarizeAttendance,
} from './payroll-calc';

const HR_ROLE_CODES = [
  SYSTEM_ROLE_CODES.OWNER,
  SYSTEM_ROLE_CODES.ADMIN,
  SYSTEM_ROLE_CODES.HR,
] as const;

type Tx = Prisma.TransactionClient;

function money(value: unknown): Prisma.Decimal {
  return new Prisma.Decimal(round2(num(value)).toFixed(2));
}

function maskPan(pan?: string | null) {
  if (!pan || pan.length < 4) return pan || null;
  return `${pan.slice(0, 2)}******${pan.slice(-2)}`;
}

function bankLabel(details: Record<string, unknown>, method: string | null) {
  const bank = typeof details.bank_name === 'string' ? details.bank_name : '';
  const account = typeof details.account_number === 'string' ? details.account_number : '';
  const upi = typeof details.upi_id === 'string' ? details.upi_id : '';
  if ((method || '').toLowerCase().includes('upi') && upi) {
    const tail = upi.slice(-4);
    return `UPI ****${tail}`;
  }
  if (account.length >= 4) {
    const name = bank ? bank.slice(0, 12) : 'Bank';
    return `${name}****${account.slice(-4)}`;
  }
  return bank || '—';
}

function paymentModeLabel(method: string | null) {
  const m = (method || 'bank').toLowerCase();
  if (m.includes('upi')) return 'UPI';
  if (m.includes('cash')) return 'Cash';
  return 'NEFT Bank';
}

function contractLabel(type: string | null) {
  const t = (type || '').toLowerCase();
  if (t.includes('contract') || t.includes('temporary')) return 'Contract';
  return 'Full-time';
}

function payrollStatus(runStatus: string, flagged: boolean): PayrollLineView['payroll_status'] {
  if (runStatus === 'disbursed') return 'Paid';
  if (flagged) return 'On Hold';
  return 'Pending';
}

function payslipUi(status: string): PayrollLineView['payslip_status'] {
  if (status === 'sent') return 'sent';
  if (status === 'generated') return 'generated';
  return 'pending';
}

async function findHrActor(companyId: string) {
  return prisma.companyMember.findFirst({
    where: { company_id: companyId, is_active: true, role: { code: { in: [...HR_ROLE_CODES] } } },
    orderBy: { created_at: 'asc' },
    select: { id: true },
  });
}

async function ensurePayrollSettings(companyId: string) {
  const [pay, statutory, schedule, overtime, payment, company] = await Promise.all([
    prisma.payrollSettings.upsert({
      where: { company_id: companyId },
      update: {},
      create: { company_id: companyId },
    }),
    prisma.statutorySettings.upsert({
      where: { company_id: companyId },
      update: {},
      create: { company_id: companyId },
    }),
    prisma.companyWorkSchedule.upsert({
      where: { company_id: companyId },
      update: {},
      create: { company_id: companyId },
    }),
    prisma.overtimeSettings.upsert({
      where: { company_id: companyId },
      update: {},
      create: { company_id: companyId },
    }),
    prisma.paymentSettings.upsert({
      where: { company_id: companyId },
      update: {},
      create: { company_id: companyId },
    }),
    prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      select: {
        company_name: true,
        company_address: true,
        gst_number: true,
        state: true,
        epf_registration_no: true,
        esic_code: true,
      },
    }),
  ]);

  return { pay, statutory, schedule, overtime, payment, company };
}

function mapSettings(bundle: Awaited<ReturnType<typeof ensurePayrollSettings>>): PayrollSettingsView {
  const { pay, statutory, schedule, overtime, payment, company } = bundle;
  return {
    pay_cycle: {
      pay_frequency: pay.pay_frequency,
      pay_day: pay.pay_day,
      payroll_cutoff_day: pay.payroll_cutoff_day,
      financial_year_start: pay.financial_year_start,
      lock_after_processing: pay.lock_after_processing,
    },
    statutory: {
      employee_pf_rate: num(statutory.employee_pf_rate),
      employer_pf_rate: num(statutory.employer_pf_rate),
      employee_esic_rate: num(statutory.employee_esic_rate),
      employer_esic_rate: num(statutory.employer_esic_rate),
      professional_tax: num(statutory.professional_tax),
      labour_welfare_fund: num(statutory.labour_welfare_fund),
    },
    attendance: {
      overtime_multiplier: num(overtime.rate_multiplier),
      max_ot_hours_per_day: num(overtime.max_ot_hours_per_day),
      half_day_percentage: num(schedule.half_day_percentage),
      absent_deduction_type: schedule.absent_deduction_type,
      auto_calculate_ot: overtime.auto_calculate_ot,
    },
    payment: {
      default_disbursement_method: payment.default_disbursement_method,
      allow_bank_transfer: payment.allow_bank_transfer,
      allow_upi: payment.allow_upi,
      allow_cash: payment.allow_cash,
    },
    company_details: {
      company_name: company.company_name,
      epf_registration_no: company.epf_registration_no,
      esic_code: company.esic_code,
      gstin: company.gst_number,
      state: company.state,
    },
  };
}

function mapLine(row: {
  id: string;
  employment_id: string;
  employee_no: string | null;
  full_name: string;
  designation: string;
  department: string;
  contract: string;
  bank_label: string;
  payment_mode: string;
  present_days: unknown;
  leave_days: unknown;
  absent_days: unknown;
  ot_hours: unknown;
  payable_days: unknown;
  flagged: boolean;
  rate_per_day: unknown;
  ot_rate: unknown;
  basic: unknown;
  ot_pay: unknown;
  allowance: unknown;
  gross: unknown;
  epf_covered: boolean;
  esic_covered: boolean;
  epf: unknown;
  esic: unknown;
  tds: unknown;
  lwf: unknown;
  advance: unknown;
  custom_deduction: unknown;
  total_deduction: unknown;
  net: unknown;
  payslip_status: string;
}, runStatus: string): PayrollLineView {
  return {
    id: row.id,
    employment_id: row.employment_id,
    employee_no: row.employee_no,
    full_name: row.full_name,
    designation: row.designation,
    department: row.department,
    contract: row.contract,
    bank_label: row.bank_label,
    payment_mode: row.payment_mode,
    present_days: num(row.present_days),
    leave_days: num(row.leave_days),
    absent_days: num(row.absent_days),
    ot_hours: num(row.ot_hours),
    payable_days: num(row.payable_days),
    flagged: row.flagged,
    rate_per_day: num(row.rate_per_day),
    ot_rate: num(row.ot_rate),
    basic: num(row.basic),
    ot_pay: num(row.ot_pay),
    allowance: num(row.allowance),
    gross: num(row.gross),
    epf_covered: row.epf_covered,
    esic_covered: row.esic_covered,
    epf: num(row.epf),
    esic: num(row.esic),
    tds: num(row.tds),
    lwf: num(row.lwf),
    advance: num(row.advance),
    custom_deduction: num(row.custom_deduction),
    total_deduction: num(row.total_deduction),
    net: num(row.net),
    payslip_status: payslipUi(row.payslip_status),
    payroll_status: payrollStatus(runStatus, row.flagged),
  };
}

function lineWageFields(input: ReturnType<typeof computeWages> & ReturnType<typeof computeDeductions>) {
  return {
    basic: money(input.basic),
    ot_pay: money(input.otPay),
    allowance: money(input.allowance),
    gross: money(input.gross),
    epf: money(input.epf),
    esic: money(input.esic),
    tds: money(input.tds),
    lwf: money(input.lwf),
    advance: money(input.advance),
    custom_deduction: money(input.custom),
    total_deduction: money(input.total),
    net: money(input.net),
    employer_epf: money(input.employerEpf),
    employer_esic: money(input.employerEsic),
  };
}

async function refreshRunTotals(tx: Tx, runId: string) {
  const lines = await tx.payrollRunEmployee.findMany({ where: { payroll_run_id: runId } });
  const worker_count = lines.length;
  const flagged_count = lines.filter((l) => l.flagged).length;
  const sum = (key: keyof (typeof lines)[number]) =>
    round2(lines.reduce((acc, row) => acc + num(row[key]), 0));
  await tx.payrollRun.update({
    where: { id: runId },
    data: {
      worker_count,
      flagged_count,
      total_gross: money(sum('gross')),
      total_basic: money(sum('basic')),
      total_ot_pay: money(sum('ot_pay')),
      total_allowance: money(sum('allowance')),
      total_deduction: money(sum('total_deduction')),
      total_net: money(sum('net')),
    },
  });
}

async function loadRunOrThrow(companyId: string, runId: string) {
  const run = await prisma.payrollRun.findFirst({
    where: { id: runId, company_id: companyId },
  });
  if (!run) throw new AppError(404, 'PAYROLL_RUN_NOT_FOUND', 'Payroll run not found');
  return run;
}

function assertEditable(run: { status: string }, stage: 'attendance' | 'wages' | 'deductions') {
  if (run.status === 'disbursed') {
    throw new AppError(409, 'PAYROLL_LOCKED', 'This payroll run is disbursed and locked');
  }
  if (stage === 'attendance' && run.status !== 'draft') {
    throw new AppError(409, 'STAGE_LOCKED', 'Attendance is locked after confirmation');
  }
  if (stage === 'wages' && run.status !== 'attendance_confirmed') {
    throw new AppError(409, 'STAGE_LOCKED', 'Wages can be edited only after attendance is confirmed');
  }
  if (stage === 'deductions' && run.status !== 'wages_confirmed') {
    throw new AppError(409, 'STAGE_LOCKED', 'Deductions can be edited only after wages are confirmed');
  }
}

function statutoryMeta(kind: 'epf' | 'esic' | 'lwf' | 'pt' | 'tds') {
  const map = {
    epf: { title: 'EPF Contribution', subtitle: 'Employees Provident Fund' },
    esic: { title: 'ESIC Contribution', subtitle: 'Employees State Insurance' },
    lwf: { title: 'Labour Welfare Fund', subtitle: 'Labour Welfare Fund' },
    pt: { title: 'Professional Tax', subtitle: 'Professional Tax' },
    tds: { title: 'TDS', subtitle: 'Tax Deducted at Source' },
  };
  return map[kind];
}

async function upsertStatutory(tx: Tx, run: { id: string; company_id: string; period_year: number; period_month: number }, rates: { professional_tax: number }) {
  const lines = await tx.payrollRunEmployee.findMany({ where: { payroll_run_id: run.id } });
  const sum = (pick: (l: (typeof lines)[number]) => number) => round2(lines.reduce((a, l) => a + pick(l), 0));
  const ptWorkers = lines.filter((l) => num(l.gross) > 10000).length;
  const rows: Array<{
    kind: 'epf' | 'esic' | 'lwf' | 'pt' | 'tds';
    employer: number;
    employee: number;
  }> = [
    { kind: 'epf', employer: sum((l) => num(l.employer_epf)), employee: sum((l) => num(l.epf)) },
    { kind: 'esic', employer: sum((l) => num(l.employer_esic)), employee: sum((l) => num(l.esic)) },
    { kind: 'lwf', employer: sum((l) => num(l.lwf)), employee: sum((l) => num(l.lwf)) },
    { kind: 'pt', employer: 0, employee: round2(ptWorkers * rates.professional_tax) },
    { kind: 'tds', employer: 0, employee: sum((l) => num(l.tds)) },
  ];

  for (const row of rows) {
    const meta = statutoryMeta(row.kind);
    const existing = await tx.payrollStatutoryFiling.findUnique({
      where: { payroll_run_id_kind: { payroll_run_id: run.id, kind: row.kind } },
    });
    const data = {
      title: meta.title,
      subtitle: meta.subtitle,
      employer_share: money(row.employer),
      employee_share: money(row.employee),
      total: money(row.employer + row.employee),
      due_date: dueDateForKind(row.kind, run.period_year, run.period_month),
    };
    if (existing) {
      await tx.payrollStatutoryFiling.update({
        where: { id: existing.id },
        data: existing.status === 'filed' ? data : data,
      });
    } else {
      await tx.payrollStatutoryFiling.create({
        data: {
          payroll_run_id: run.id,
          company_id: run.company_id,
          kind: row.kind,
          ...data,
        },
      });
    }
  }
}

async function buildLineSnapshots(
  companyId: string,
  year: number,
  month: number,
) {
  const settings = mapSettings(await ensurePayrollSettings(companyId));
  const { start, end } = periodBounds(year, month);
  const employments = await prisma.employeeEmployment.findMany({
    where: { company_id: companyId, is_active: true },
    include: {
      hr_profile: {
        include: {
          designation: { select: { name: true } },
          department: { select: { name: true } },
        },
      },
      company_member: { select: { id: true } },
    },
  });

  const memberIds = employments.map((e) => e.company_member?.id).filter(Boolean) as string[];
  const attendance = memberIds.length
    ? await prisma.attendance.findMany({
        where: {
          company_id: companyId,
          company_member_id: { in: memberIds },
          date: { gte: start, lte: end },
        },
        select: { company_member_id: true, status: true, ot_minutes: true },
      })
    : [];
  const byMember = new Map<string, typeof attendance>();
  for (const row of attendance) {
    const list = byMember.get(row.company_member_id) ?? [];
    list.push(row);
    byMember.set(row.company_member_id, list);
  }

  const workingDays = Math.max(1, end.getUTCDate() - 4);

  return employments.map((employment) => {
    const hr = employment.hr_profile;
    const details = (hr?.payment_details as Record<string, unknown> | null) ?? {};
    const att = summarizeAttendance(
      byMember.get(employment.company_member?.id ?? '') ?? [],
      settings.attendance.half_day_percentage,
    );
    const daily = dailyRateFromSalary(num(hr?.basic_salary), hr?.salary_type ?? null, workingDays);
    const storedOt = num(details.ot_rate_per_hour);
    const otRate =
      storedOt > 0
        ? storedOt
        : otRateFromDaily(
            daily,
            8,
            settings.attendance.overtime_multiplier || 1.5,
          );
    const cappedOt = Math.min(att.otHours, settings.attendance.max_ot_hours_per_day * end.getUTCDate());
    const wages = computeWages({
      payableDays: att.payable,
      otHours: settings.attendance.auto_calculate_ot ? cappedOt : att.otHours,
      ratePerDay: daily,
      otRate,
      allowance: num(details.allowance),
    });
    const epfCovered = Boolean(hr?.pf_applicable);
    const esicCovered = Boolean(hr?.esi_applicable);
    const deductions = computeDeductions({
      basic: wages.basic,
      gross: wages.gross,
      epfCovered,
      esicCovered,
      rates: settings.statutory,
      tds: 0,
      advance: 0,
      customDeduction: 0,
    });
    const otHours = settings.attendance.auto_calculate_ot ? cappedOt : att.otHours;
    return {
      employment_id: employment.id,
      employee_no: employment.employee_no,
      full_name: hr?.full_name || 'Worker',
      designation: hr?.designation?.name || '—',
      department: hr?.department?.name || '—',
      contract: contractLabel(hr?.employee_type ?? null),
      bank_label: bankLabel(details, hr?.payment_method ?? null),
      payment_mode: paymentModeLabel(hr?.payment_method ?? null),
      pan_masked: maskPan(hr?.pan_number),
      ifsc: typeof details.ifsc_code === 'string' ? details.ifsc_code : null,
      present_days: money(att.present),
      leave_days: money(att.leave),
      absent_days: money(att.absent),
      ot_hours: money(otHours),
      payable_days: money(att.payable),
      flagged: att.absent > 0,
      rate_per_day: money(daily),
      ot_rate: money(otRate),
      epf_covered: epfCovered,
      esic_covered: esicCovered,
      ...lineWageFields({ ...wages, ...deductions }),
    };
  });
}

async function toRunView(
  companyId: string,
  runId: string,
  query: { search?: string; page: number; limit: number },
): Promise<PayrollRunView> {
  const run = await loadRunOrThrow(companyId, runId);
  const settings = mapSettings(await ensurePayrollSettings(companyId));
  const search = query.search?.trim();
  const where: Prisma.PayrollRunEmployeeWhereInput = {
    payroll_run_id: runId,
    ...(search
      ? {
          OR: [
            { full_name: { contains: search, mode: 'insensitive' } },
            { employee_no: { contains: search, mode: 'insensitive' } },
            { designation: { contains: search, mode: 'insensitive' } },
            { department: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const total = await prisma.payrollRunEmployee.count({ where });
  const page = query.page;
  const limit = query.limit;
  const rows = await prisma.payrollRunEmployee.findMany({
    where,
    orderBy: { full_name: 'asc' },
    skip: (page - 1) * limit,
    take: limit,
  });
  const otHours = await prisma.payrollRunEmployee.aggregate({
    where: { payroll_run_id: runId },
    _sum: { ot_hours: true },
  });
  const verified = await prisma.payrollRunEmployee.count({
    where: { payroll_run_id: runId, flagged: false },
  });
  return {
    run: {
      id: run.id,
      year: run.period_year,
      month: run.period_month,
      period_label: periodLabel(run.period_year, run.period_month),
      period_start: isoDay(run.period_start),
      period_end: isoDay(run.period_end),
      status: run.status,
      disbursement_method: run.disbursement_method,
      worker_count: run.worker_count,
      flagged_count: run.flagged_count,
      attendance_verified: verified,
      payroll_ready_pct:
        run.worker_count === 0 ? 0 : round2((verified / run.worker_count) * 100),
      total_gross: num(run.total_gross),
      total_basic: num(run.total_basic),
      total_ot_pay: num(run.total_ot_pay),
      total_allowance: num(run.total_allowance),
      total_ot_hours: num(otHours._sum.ot_hours),
      total_deduction: num(run.total_deduction),
      total_net: num(run.total_net),
    },
    employees: rows.map((row) => mapLine(row, run.status)),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    statutory_rules: {
      employee_pf_rate: settings.statutory.employee_pf_rate,
      employer_pf_rate: settings.statutory.employer_pf_rate,
      employee_esic_rate: settings.statutory.employee_esic_rate,
      employer_esic_rate: settings.statutory.employer_esic_rate,
      labour_welfare_fund: settings.statutory.labour_welfare_fund,
    },
  };
}

export async function getOrCreatePayrollRunService(
  companyId: string,
  year: number,
  month: number,
  query: { search?: string; page: number; limit: number },
): Promise<PayrollRunView> {
  const existing = await prisma.payrollRun.findUnique({
    where: { company_id_period_year_period_month: { company_id: companyId, period_year: year, period_month: month } },
  });
  if (existing) return toRunView(companyId, existing.id, query);

  const actor = await findHrActor(companyId);
  const settings = mapSettings(await ensurePayrollSettings(companyId));
  const { start, end } = periodBounds(year, month);
  const snapshots = await buildLineSnapshots(companyId, year, month);

  const created = await prisma.$transaction(async (tx) => {
    const run = await tx.payrollRun.create({
      data: {
        company_id: companyId,
        period_year: year,
        period_month: month,
        period_start: start,
        period_end: end,
        disbursement_method: settings.payment.default_disbursement_method || 'NEFT',
        created_by_company_member_id: actor?.id ?? null,
      },
    });
    if (snapshots.length) {
      await tx.payrollRunEmployee.createMany({
        data: snapshots.map((row) => ({ ...row, payroll_run_id: run.id })),
      });
    }
    await refreshRunTotals(tx, run.id);
    return run;
  });

  return toRunView(companyId, created.id, query);
}

export async function getPayrollRunService(
  companyId: string,
  runId: string,
  query: { search?: string; page: number; limit: number },
) {
  return toRunView(companyId, runId, query);
}

export async function patchPayrollRunEmployeeService(
  companyId: string,
  runId: string,
  lineId: string,
  body: {
    present_days?: number;
    leave_days?: number;
    absent_days?: number;
    ot_hours?: number;
    rate_per_day?: number;
    ot_rate?: number;
    allowance?: number;
    epf?: number;
    esic?: number;
    tds?: number;
    lwf?: number;
    advance?: number;
    custom_deduction?: number;
  },
) {
  const run = await loadRunOrThrow(companyId, runId);
  const line = await prisma.payrollRunEmployee.findFirst({
    where: { id: lineId, payroll_run_id: runId },
  });
  if (!line) throw new AppError(404, 'PAYROLL_LINE_NOT_FOUND', 'Worker line not found on this run');

  const attendancePatch =
    body.present_days != null || body.leave_days != null || body.absent_days != null || body.ot_hours != null;
  const wagePatch = body.rate_per_day != null || body.ot_rate != null || body.allowance != null;
  const deductionPatch =
    body.epf != null ||
    body.esic != null ||
    body.tds != null ||
    body.lwf != null ||
    body.advance != null ||
    body.custom_deduction != null;

  if (attendancePatch) assertEditable(run, 'attendance');
  if (wagePatch) assertEditable(run, run.status === 'draft' ? 'attendance' : 'wages');
  if (deductionPatch) assertEditable(run, run.status === 'draft' || run.status === 'attendance_confirmed' ? 'wages' : 'deductions');

  const settings = mapSettings(await ensurePayrollSettings(companyId));
  const present = body.present_days ?? num(line.present_days);
  const leave = body.leave_days ?? num(line.leave_days);
  const absent = body.absent_days ?? num(line.absent_days);
  const otHours = body.ot_hours ?? num(line.ot_hours);
  const payable = round2(present + leave);
  const wages = computeWages({
    payableDays: payable,
    otHours,
    ratePerDay: body.rate_per_day ?? num(line.rate_per_day),
    otRate: body.ot_rate ?? num(line.ot_rate),
    allowance: body.allowance ?? num(line.allowance),
  });
  const autoDeductions = computeDeductions({
    basic: wages.basic,
    gross: wages.gross,
    epfCovered: line.epf_covered,
    esicCovered: line.esic_covered,
    rates: settings.statutory,
    tds: body.tds ?? num(line.tds),
    advance: body.advance ?? num(line.advance),
    customDeduction: body.custom_deduction ?? num(line.custom_deduction),
  });
  const deductions = {
    ...autoDeductions,
    epf: body.epf ?? autoDeductions.epf,
    esic: body.esic ?? autoDeductions.esic,
    lwf: body.lwf ?? autoDeductions.lwf,
  };
  deductions.total = round2(
    deductions.epf + deductions.esic + deductions.tds + deductions.lwf + deductions.advance + deductions.custom,
  );
  deductions.net = round2(Math.max(0, wages.gross - deductions.total));

  await prisma.$transaction(async (tx) => {
    await tx.payrollRunEmployee.update({
      where: { id: line.id },
      data: {
        present_days: money(present),
        leave_days: money(leave),
        absent_days: money(absent),
        ot_hours: money(otHours),
        payable_days: money(payable),
        flagged: absent > 0,
        rate_per_day: money(body.rate_per_day ?? num(line.rate_per_day)),
        ot_rate: money(body.ot_rate ?? num(line.ot_rate)),
        ...lineWageFields({ ...wages, ...deductions }),
      },
    });
    await refreshRunTotals(tx, runId);
  });

  return toRunView(companyId, runId, { page: 1, limit: 50 });
}

async function confirmStage(
  companyId: string,
  runId: string,
  from: string,
  to: Prisma.PayrollRunUpdateInput['status'],
  stamp: Prisma.PayrollRunUncheckedUpdateInput,
) {
  const run = await loadRunOrThrow(companyId, runId);
  if (run.status === 'disbursed') {
    throw new AppError(409, 'PAYROLL_LOCKED', 'This payroll run is disbursed and locked');
  }
  if (run.status !== from) {
    throw new AppError(409, 'INVALID_STAGE', `Run must be in ${from} to confirm this stage`);
  }
  const settings = mapSettings(await ensurePayrollSettings(companyId));
  await prisma.$transaction(async (tx) => {
    if (to === 'wages_confirmed' || to === 'attendance_confirmed') {
      const lines = await tx.payrollRunEmployee.findMany({ where: { payroll_run_id: runId } });
      for (const line of lines) {
        const wages = computeWages({
          payableDays: num(line.payable_days),
          otHours: num(line.ot_hours),
          ratePerDay: num(line.rate_per_day),
          otRate: num(line.ot_rate),
          allowance: num(line.allowance),
        });
        const deductions = computeDeductions({
          basic: wages.basic,
          gross: wages.gross,
          epfCovered: line.epf_covered,
          esicCovered: line.esic_covered,
          rates: settings.statutory,
          tds: num(line.tds),
          advance: num(line.advance),
          customDeduction: num(line.custom_deduction),
        });
        await tx.payrollRunEmployee.update({
          where: { id: line.id },
          data: lineWageFields({ ...wages, ...deductions }),
        });
      }
      await refreshRunTotals(tx, runId);
    }
    if (to === 'deductions_confirmed') {
      await upsertStatutory(tx, run, settings.statutory);
    }
    await tx.payrollRun.update({
      where: { id: runId },
      data: {
        status: to,
        ...stamp,
      } as Prisma.PayrollRunUncheckedUpdateInput,
    });
  });
  return toRunView(companyId, runId, { page: 1, limit: 50 });
}

export async function confirmAttendanceService(companyId: string, runId: string) {
  const actor = await findHrActor(companyId);
  return confirmStage(companyId, runId, 'draft', 'attendance_confirmed', {
    attendance_confirmed_at: new Date(),
    attendance_confirmed_by_company_member_id: actor?.id ?? null,
  });
}

export async function confirmWagesService(companyId: string, runId: string) {
  const actor = await findHrActor(companyId);
  return confirmStage(companyId, runId, 'attendance_confirmed', 'wages_confirmed', {
    wages_confirmed_at: new Date(),
    wages_confirmed_by_company_member_id: actor?.id ?? null,
  });
}

export async function confirmDeductionsService(companyId: string, runId: string) {
  const actor = await findHrActor(companyId);
  return confirmStage(companyId, runId, 'wages_confirmed', 'deductions_confirmed', {
    deductions_confirmed_at: new Date(),
    deductions_confirmed_by_company_member_id: actor?.id ?? null,
  });
}

export async function disbursePayrollRunService(
  companyId: string,
  runId: string,
  body: { method?: 'NEFT' | 'UPI' | 'CASH'; confirm: boolean },
) {
  const run = await loadRunOrThrow(companyId, runId);
  if (run.status === 'disbursed') {
    throw new AppError(409, 'PAYROLL_ALREADY_DISBURSED', 'This run is already disbursed');
  }
  if (run.status !== 'deductions_confirmed') {
    throw new AppError(409, 'INVALID_STAGE', 'Confirm deductions before disbursing');
  }
  const actor = await findHrActor(companyId);
  const method = body.method ?? run.disbursement_method;
  await prisma.$transaction(async (tx) => {
    await tx.payrollRun.update({
      where: { id: runId },
      data: {
        disbursement_method: method,
        ...(body.confirm
          ? {
              status: 'disbursed',
              disbursed_at: new Date(),
              disbursed_by_company_member_id: actor?.id ?? null,
            }
          : {}),
      } as Prisma.PayrollRunUncheckedUpdateInput,
    });
    if (body.confirm) {
      await tx.payrollRunEmployee.updateMany({
        where: { payroll_run_id: runId, payslip_status: 'pending' },
        data: { payslip_status: 'generated' },
      });
      const settings = mapSettings(await ensurePayrollSettings(companyId));
      await upsertStatutory(tx, run, settings.statutory);
    }
  });
  return toRunView(companyId, runId, { page: 1, limit: 50 });
}

export async function getWorkerWagesService(
  companyId: string,
  query: { search?: string; page: number; limit: number },
): Promise<WorkerWagesPage> {
  const search = query.search?.trim();
  const where: Prisma.EmployeeEmploymentWhereInput = {
    company_id: companyId,
    is_active: true,
    ...(search
      ? {
          OR: [
            { employee_no: { contains: search, mode: 'insensitive' } },
            { hr_profile: { full_name: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };
  const total = await prisma.employeeEmployment.count({ where });
  const rows = await prisma.employeeEmployment.findMany({
    where,
    include: {
      hr_profile: {
        include: {
          designation: { select: { name: true } },
          department: { select: { name: true } },
        },
      },
    },
    orderBy: { created_at: 'desc' },
    skip: (query.page - 1) * query.limit,
    take: query.limit,
  });
  const all = await prisma.employeeEmployment.findMany({
    where: { company_id: companyId, is_active: true },
    include: { hr_profile: true },
  });
  const settings = mapSettings(await ensurePayrollSettings(companyId));
  const items = rows.map((row) => {
    const hr = row.hr_profile;
    const details = (hr?.payment_details as Record<string, unknown> | null) ?? {};
    const daily = dailyRateFromSalary(num(hr?.basic_salary), hr?.salary_type ?? 'daily', 26);
    const ot = num(details.ot_rate_per_hour) || otRateFromDaily(daily, 8, settings.attendance.overtime_multiplier || 1.5);
    const account = typeof details.account_number === 'string' ? details.account_number : '';
    const upi = typeof details.upi_id === 'string' ? details.upi_id : '';
    return {
      employment_id: row.id,
      employee_no: row.employee_no,
      full_name: hr?.full_name || 'Worker',
      designation: hr?.designation?.name || '—',
      department: hr?.department?.name || '—',
      contract: contractLabel(hr?.employee_type ?? null),
      daily_rate: daily,
      ot_rate: ot,
      payment_mode: paymentModeLabel(hr?.payment_method ?? null),
      payment_label: bankLabel(details, hr?.payment_method ?? null),
      epf_covered: Boolean(hr?.pf_applicable),
      esic_covered: Boolean(hr?.esi_applicable),
      bank_verified: Boolean(account || upi),
    };
  });
  return {
    items,
    stats: {
      total_workers: all.length,
      epf_covered: all.filter((r) => r.hr_profile?.pf_applicable).length,
      esic_covered: all.filter((r) => r.hr_profile?.esi_applicable).length,
      bank_verified: all.filter((r) => {
        const details = (r.hr_profile?.payment_details as Record<string, unknown> | null) ?? {};
        return Boolean(details.account_number || details.upi_id);
      }).length,
    },
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
}

export async function patchWorkerWageService(
  companyId: string,
  employmentId: string,
  body: {
    daily_rate?: number;
    ot_rate?: number;
    payment_method?: string;
    pf_applicable?: boolean;
    esi_applicable?: boolean;
  },
) {
  const employment = await prisma.employeeEmployment.findFirst({
    where: { id: employmentId, company_id: companyId, is_active: true },
    include: { hr_profile: true },
  });
  if (!employment?.hr_profile) {
    throw new AppError(404, 'EMPLOYEE_NOT_FOUND', 'Active employee not found');
  }
  const details = {
    ...((employment.hr_profile.payment_details as Record<string, unknown> | null) ?? {}),
  };
  if (body.ot_rate != null) details.ot_rate_per_hour = body.ot_rate;
  const method = body.payment_method
    ? body.payment_method.toLowerCase().includes('upi')
      ? 'upi'
      : body.payment_method.toLowerCase().includes('cash')
        ? 'cash'
        : 'bank'
    : undefined;
  await prisma.employeeHrProfile.update({
    where: { id: employment.hr_profile.id },
    data: {
      ...(body.daily_rate != null ? { basic_salary: money(body.daily_rate), salary_type: 'daily' } : {}),
      ...(method ? { payment_method: method } : {}),
      ...(body.pf_applicable != null ? { pf_applicable: body.pf_applicable } : {}),
      ...(body.esi_applicable != null ? { esi_applicable: body.esi_applicable } : {}),
      payment_details: details as Prisma.InputJsonValue,
    },
  });
  return getWorkerWagesService(companyId, { page: 1, limit: 50 });
}

export async function getPayslipsService(
  companyId: string,
  year: number,
  month: number,
  query: { search?: string; page: number; limit: number },
) {
  const view = await getOrCreatePayrollRunService(companyId, year, month, query);
  return view;
}

export async function getPayslipPreviewService(companyId: string, lineId: string): Promise<PayslipPreviewView> {
  const line = await prisma.payrollRunEmployee.findFirst({
    where: { id: lineId, run: { company_id: companyId } },
    include: { run: true },
  });
  if (!line) throw new AppError(404, 'PAYSLIP_NOT_FOUND', 'Payslip line not found');
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
    select: { company_name: true, company_address: true },
  });
  const mapped = mapLine(line, line.run.status);
  return {
    line: mapped,
    company_name: company.company_name,
    company_address: company.company_address,
    period_label: periodLabel(line.run.period_year, line.run.period_month),
    pan: line.pan_masked,
    ifsc: line.ifsc,
    paid_days: mapped.payable_days,
    earnings: [
      { label: 'Basic Salary', amount: mapped.basic },
      { label: 'Overtime Pay', amount: mapped.ot_pay },
      { label: 'Allowances', amount: mapped.allowance },
    ],
    deductions: [
      { label: 'Provident Fund (EPF)', amount: mapped.epf },
      { label: 'Employee State Insurance (ESI)', amount: mapped.esic },
      { label: 'TDS / Income Tax', amount: mapped.tds },
      { label: 'Labour Welfare Fund', amount: mapped.lwf },
      { label: 'Advance', amount: mapped.advance },
      { label: 'Other Deductions', amount: mapped.custom_deduction },
    ].filter((row) => row.amount > 0),
    net: mapped.net,
    net_in_words: amountInWords(mapped.net),
  };
}

export async function sendPayslipService(companyId: string, lineId: string) {
  const line = await prisma.payrollRunEmployee.findFirst({
    where: { id: lineId, run: { company_id: companyId } },
    include: { run: true },
  });
  if (!line) throw new AppError(404, 'PAYSLIP_NOT_FOUND', 'Payslip line not found');
  if (line.run.status !== 'disbursed') {
    throw new AppError(409, 'PAYSLIP_NOT_READY', 'Payslips can be sent after disbursement');
  }
  await prisma.payrollRunEmployee.update({
    where: { id: lineId },
    data: { payslip_status: 'sent' },
  });
  return getPayslipPreviewService(companyId, lineId);
}

export async function getPayrollSettingsService(companyId: string) {
  return mapSettings(await ensurePayrollSettings(companyId));
}

export async function putPayrollSettingsService(
  companyId: string,
  body: {
    pay_cycle?: Partial<PayrollSettingsView['pay_cycle']>;
    statutory?: Partial<PayrollSettingsView['statutory']>;
    attendance?: Partial<PayrollSettingsView['attendance']>;
    payment?: Partial<PayrollSettingsView['payment']>;
    company_details?: Partial<PayrollSettingsView['company_details']>;
  },
) {
  await ensurePayrollSettings(companyId);
  await prisma.$transaction(async (tx) => {
    if (body.pay_cycle) {
      await tx.payrollSettings.update({
        where: { company_id: companyId },
        data: {
          ...(body.pay_cycle.pay_frequency ? { pay_frequency: body.pay_cycle.pay_frequency } : {}),
          ...(body.pay_cycle.pay_day ? { pay_day: body.pay_cycle.pay_day } : {}),
          ...(body.pay_cycle.payroll_cutoff_day != null
            ? { payroll_cutoff_day: body.pay_cycle.payroll_cutoff_day }
            : {}),
          ...(body.pay_cycle.financial_year_start
            ? { financial_year_start: body.pay_cycle.financial_year_start }
            : {}),
          ...(body.pay_cycle.lock_after_processing != null
            ? { lock_after_processing: body.pay_cycle.lock_after_processing }
            : {}),
        },
      });
    }
    if (body.statutory) {
      await tx.statutorySettings.update({
        where: { company_id: companyId },
        data: {
          ...(body.statutory.employee_pf_rate != null ? { employee_pf_rate: body.statutory.employee_pf_rate } : {}),
          ...(body.statutory.employer_pf_rate != null ? { employer_pf_rate: body.statutory.employer_pf_rate } : {}),
          ...(body.statutory.employee_esic_rate != null ? { employee_esic_rate: body.statutory.employee_esic_rate } : {}),
          ...(body.statutory.employer_esic_rate != null ? { employer_esic_rate: body.statutory.employer_esic_rate } : {}),
          ...(body.statutory.professional_tax != null ? { professional_tax: body.statutory.professional_tax } : {}),
          ...(body.statutory.labour_welfare_fund != null
            ? { labour_welfare_fund: body.statutory.labour_welfare_fund }
            : {}),
        },
      });
    }
    if (body.attendance) {
      if (
        body.attendance.overtime_multiplier != null ||
        body.attendance.max_ot_hours_per_day != null ||
        body.attendance.auto_calculate_ot != null
      ) {
        await tx.overtimeSettings.update({
          where: { company_id: companyId },
          data: {
            ...(body.attendance.overtime_multiplier != null
              ? { rate_multiplier: body.attendance.overtime_multiplier }
              : {}),
            ...(body.attendance.max_ot_hours_per_day != null
              ? { max_ot_hours_per_day: body.attendance.max_ot_hours_per_day }
              : {}),
            ...(body.attendance.auto_calculate_ot != null
              ? { auto_calculate_ot: body.attendance.auto_calculate_ot }
              : {}),
          },
        });
      }
      if (body.attendance.half_day_percentage != null || body.attendance.absent_deduction_type) {
        await tx.companyWorkSchedule.update({
          where: { company_id: companyId },
          data: {
            ...(body.attendance.half_day_percentage != null
              ? { half_day_percentage: body.attendance.half_day_percentage }
              : {}),
            ...(body.attendance.absent_deduction_type
              ? { absent_deduction_type: body.attendance.absent_deduction_type }
              : {}),
          },
        });
      }
    }
    if (body.payment) {
      await tx.paymentSettings.update({
        where: { company_id: companyId },
        data: {
          ...(body.payment.default_disbursement_method
            ? { default_disbursement_method: body.payment.default_disbursement_method }
            : {}),
          ...(body.payment.allow_bank_transfer != null
            ? { allow_bank_transfer: body.payment.allow_bank_transfer }
            : {}),
          ...(body.payment.allow_upi != null ? { allow_upi: body.payment.allow_upi } : {}),
          ...(body.payment.allow_cash != null ? { allow_cash: body.payment.allow_cash } : {}),
        },
      });
    }
    if (body.company_details) {
      await tx.company.update({
        where: { id: companyId },
        data: {
          ...(body.company_details.company_name ? { company_name: body.company_details.company_name } : {}),
          ...(body.company_details.epf_registration_no !== undefined
            ? { epf_registration_no: body.company_details.epf_registration_no }
            : {}),
          ...(body.company_details.esic_code !== undefined ? { esic_code: body.company_details.esic_code } : {}),
          ...(body.company_details.gstin !== undefined ? { gst_number: body.company_details.gstin } : {}),
          ...(body.company_details.state !== undefined ? { state: body.company_details.state } : {}),
        },
      });
    }
  });
  return getPayrollSettingsService(companyId);
}

function filingUi(status: string): 'Pending' | 'Filed' {
  return status === 'filed' ? 'Filed' : 'Pending';
}

export async function getStatutoryMonthService(
  companyId: string,
  year: number,
  month: number,
): Promise<StatutoryMonthView> {
  const view = await getOrCreatePayrollRunService(companyId, year, month, { page: 1, limit: 1 });
  const settings = mapSettings(await ensurePayrollSettings(companyId));
  const run = await prisma.payrollRun.findUniqueOrThrow({ where: { id: view.run.id } });
  await prisma.$transaction(async (tx) => {
    await upsertStatutory(tx, run, settings.statutory);
  });
  const obligations = await prisma.payrollStatutoryFiling.findMany({
    where: { payroll_run_id: run.id },
    orderBy: { kind: 'asc' },
  });
  const mapped = obligations.map((row) => ({
    id: row.id,
    kind: row.kind.toUpperCase(),
    title: row.title,
    subtitle: row.subtitle,
    employer_share: num(row.employer_share) || null,
    employee_share: num(row.employee_share) || null,
    total: num(row.total),
    due_date: formatDue(row.due_date),
    status: filingUi(row.status),
  }));
  const filed = mapped.filter((o) => o.status === 'Filed');
  const pending = mapped.filter((o) => o.status === 'Pending');
  const epfDue = obligations.find((o) => o.kind === 'epf');
  return {
    year,
    month,
    period_label: periodLabel(year, month),
    run_id: run.id,
    run_status: run.status,
    compliance_score: mapped.length ? Math.round((filed.length / mapped.length) * 100) : 0,
    total_due: round2(mapped.reduce((a, o) => a + o.total, 0)),
    filed_total: round2(filed.reduce((a, o) => a + o.total, 0)),
    pending_total: round2(pending.reduce((a, o) => a + o.total, 0)),
    deadline_label: epfDue ? formatDue(epfDue.due_date) : null,
    obligations: mapped,
  };
}

export async function fileStatutoryService(companyId: string, filingId: string) {
  const row = await prisma.payrollStatutoryFiling.findFirst({
    where: { id: filingId, company_id: companyId },
    include: { run: { select: { period_year: true, period_month: true } } },
  });
  if (!row) throw new AppError(404, 'FILING_NOT_FOUND', 'Statutory filing not found');
  await prisma.payrollStatutoryFiling.update({
    where: { id: filingId },
    data: { status: 'filed', filed_at: new Date() },
  });
  return getStatutoryMonthService(companyId, row.run.period_year, row.run.period_month);
}

export async function fileAllStatutoryService(companyId: string, year: number, month: number) {
  const monthView = await getStatutoryMonthService(companyId, year, month);
  if (!monthView.run_id) return monthView;
  await prisma.payrollStatutoryFiling.updateMany({
    where: { payroll_run_id: monthView.run_id, status: 'pending' },
    data: { status: 'filed', filed_at: new Date() },
  });
  return getStatutoryMonthService(companyId, year, month);
}

export async function getStatutoryHistoryService(companyId: string): Promise<StatutoryHistoryRow[]> {
  const runs = await prisma.payrollRun.findMany({
    where: { company_id: companyId },
    include: { filings: true },
    orderBy: [{ period_year: 'desc' }, { period_month: 'desc' }],
    take: 12,
  });
  return runs.map((run) => {
    const amount = (kind: string) => num(run.filings.find((f) => f.kind === kind)?.total);
    const filed = run.filings.filter((f) => f.status === 'filed');
    const last = filed.sort((a, b) => (a.filed_at && b.filed_at && a.filed_at > b.filed_at ? -1 : 1))[0];
    return {
      year: run.period_year,
      month: run.period_month,
      period_label: periodLabel(run.period_year, run.period_month),
      epf: amount('epf'),
      esic: amount('esic'),
      professional_tax: amount('pt'),
      tds: amount('tds'),
      filed_on: last?.filed_at ? formatDue(last.filed_at) : null,
      status: filed.length === run.filings.length && run.filings.length > 0 ? 'Filed' : 'Pending',
    };
  });
}
