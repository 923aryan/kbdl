import {
  createPayrollRunSchema,
  disbursePayrollRunSchema,
  getPayrollRunSchema,
  getWorkerWagesSchema,
  patchPayrollRunEmployeeSchema,
  patchWorkerWageSchema,
  payrollFilingIdSchema,
  payrollHistoryQuerySchema,
  payrollPayslipIdSchema,
  payrollPeriodQuerySchema,
  payrollRunIdSchema,
  putPayrollSettingsSchema,
} from '@repo/validator/shared';
import { z } from 'zod';

export type CreatePayrollRunRequest = z.infer<typeof createPayrollRunSchema>;
export type GetPayrollPeriodRequest = z.infer<typeof payrollPeriodQuerySchema>;
export type GetPayrollRunRequest = z.infer<typeof getPayrollRunSchema>;
export type PayrollRunIdRequest = z.infer<typeof payrollRunIdSchema>;
export type PatchPayrollRunEmployeeRequest = z.infer<typeof patchPayrollRunEmployeeSchema>;
export type DisbursePayrollRunRequest = z.infer<typeof disbursePayrollRunSchema>;
export type GetWorkerWagesRequest = z.infer<typeof getWorkerWagesSchema>;
export type PatchWorkerWageRequest = z.infer<typeof patchWorkerWageSchema>;
export type PayrollPayslipIdRequest = z.infer<typeof payrollPayslipIdSchema>;
export type PayrollFilingIdRequest = z.infer<typeof payrollFilingIdSchema>;
export type PutPayrollSettingsRequest = z.infer<typeof putPayrollSettingsSchema>;
export type PayrollHistoryQueryRequest = z.infer<typeof payrollHistoryQuerySchema>;

export type PayrollRunStatusView =
  | 'draft'
  | 'attendance_confirmed'
  | 'wages_confirmed'
  | 'deductions_confirmed'
  | 'disbursed';

export type PayrollLineView = {
  id: string;
  employment_id: string;
  employee_no: string | null;
  full_name: string;
  designation: string;
  department: string;
  contract: string;
  bank_label: string;
  payment_mode: string;
  present_days: number;
  leave_days: number;
  absent_days: number;
  ot_hours: number;
  payable_days: number;
  flagged: boolean;
  rate_per_day: number;
  ot_rate: number;
  basic: number;
  ot_pay: number;
  allowance: number;
  gross: number;
  epf_covered: boolean;
  esic_covered: boolean;
  epf: number;
  esic: number;
  tds: number;
  lwf: number;
  advance: number;
  custom_deduction: number;
  total_deduction: number;
  net: number;
  payslip_status: 'pending' | 'generated' | 'sent';
  payroll_status: 'Paid' | 'Pending' | 'On Hold';
};

export type PayrollRunSummary = {
  id: string;
  year: number;
  month: number;
  period_label: string;
  period_start: string;
  period_end: string;
  status: PayrollRunStatusView;
  disbursement_method: string;
  worker_count: number;
  flagged_count: number;
  attendance_verified: number;
  payroll_ready_pct: number;
  total_gross: number;
  total_basic: number;
  total_ot_pay: number;
  total_allowance: number;
  total_ot_hours: number;
  total_deduction: number;
  total_net: number;
};

export type PayrollRunView = {
  run: PayrollRunSummary;
  employees: PayrollLineView[];
  meta: { page: number; limit: number; total: number; totalPages: number };
  statutory_rules: {
    employee_pf_rate: number;
    employer_pf_rate: number;
    employee_esic_rate: number;
    employer_esic_rate: number;
    labour_welfare_fund: number;
  };
};

export type WorkerWageView = {
  employment_id: string;
  employee_no: string | null;
  full_name: string;
  designation: string;
  department: string;
  contract: string;
  daily_rate: number;
  ot_rate: number;
  payment_mode: string;
  payment_label: string;
  epf_covered: boolean;
  esic_covered: boolean;
  bank_verified: boolean;
};

export type WorkerWagesPage = {
  items: WorkerWageView[];
  stats: {
    total_workers: number;
    epf_covered: number;
    esic_covered: number;
    bank_verified: number;
  };
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type PayslipPreviewView = {
  line: PayrollLineView;
  company_name: string;
  company_address: string | null;
  period_label: string;
  pan: string | null;
  ifsc: string | null;
  paid_days: number;
  earnings: Array<{ label: string; amount: number }>;
  deductions: Array<{ label: string; amount: number }>;
  net: number;
  net_in_words: string;
};

export type PayrollSettingsView = {
  pay_cycle: {
    pay_frequency: string;
    pay_day: string;
    payroll_cutoff_day: number;
    financial_year_start: string;
    lock_after_processing: boolean;
  };
  statutory: {
    employee_pf_rate: number;
    employer_pf_rate: number;
    employee_esic_rate: number;
    employer_esic_rate: number;
    professional_tax: number;
    labour_welfare_fund: number;
  };
  attendance: {
    overtime_multiplier: number;
    max_ot_hours_per_day: number;
    half_day_percentage: number;
    absent_deduction_type: string;
    auto_calculate_ot: boolean;
  };
  payment: {
    default_disbursement_method: string;
    allow_bank_transfer: boolean;
    allow_upi: boolean;
    allow_cash: boolean;
  };
  company_details: {
    company_name: string;
    epf_registration_no: string | null;
    esic_code: string | null;
    gstin: string | null;
    state: string | null;
  };
};

export type StatutoryFilingView = {
  id: string;
  kind: string;
  title: string;
  subtitle: string;
  employer_share: number | null;
  employee_share: number | null;
  total: number;
  due_date: string;
  status: 'Pending' | 'Filed';
};

export type StatutoryMonthView = {
  year: number;
  month: number;
  period_label: string;
  run_id: string | null;
  run_status: PayrollRunStatusView | null;
  compliance_score: number;
  total_due: number;
  filed_total: number;
  pending_total: number;
  deadline_label: string | null;
  obligations: StatutoryFilingView[];
};

export type StatutoryHistoryRow = {
  year: number;
  month: number;
  period_label: string;
  epf: number;
  esic: number;
  professional_tax: number;
  tds: number;
  filed_on: string | null;
  status: 'Pending' | 'Filed';
};
