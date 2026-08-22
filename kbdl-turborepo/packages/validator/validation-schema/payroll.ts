import { z } from 'zod';

const isoDateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');

const money = z.coerce.number().min(0).max(10_000_000);
const days = z.coerce.number().min(0).max(31);
const hours = z.coerce.number().min(0).max(200);

export const payrollPeriodQuerySchema = z.object({
  query: z.object({
    year: z.coerce.number().int().min(2020).max(2100),
    month: z.coerce.number().int().min(1).max(12),
    search: z.string().trim().max(120).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  }),
});

export const createPayrollRunSchema = z.object({
  body: z.object({
    year: z.coerce.number().int().min(2020).max(2100),
    month: z.coerce.number().int().min(1).max(12),
  }),
});

export const payrollRunIdSchema = z.object({
  params: z.object({
    runId: z.string().uuid(),
  }),
});

export const getPayrollRunSchema = z.object({
  params: z.object({
    runId: z.string().uuid(),
  }),
  query: z.object({
    search: z.string().trim().max(120).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  }),
});

export const patchPayrollRunEmployeeSchema = z.object({
  params: z.object({
    runId: z.string().uuid(),
    lineId: z.string().uuid(),
  }),
  body: z
    .object({
      present_days: days.optional(),
      leave_days: days.optional(),
      absent_days: days.optional(),
      ot_hours: hours.optional(),
      rate_per_day: money.optional(),
      ot_rate: money.optional(),
      allowance: money.optional(),
      epf: money.optional(),
      esic: money.optional(),
      tds: money.optional(),
      lwf: money.optional(),
      advance: money.optional(),
      custom_deduction: money.optional(),
    })
    .refine((body) => Object.keys(body).length > 0, 'at least one field is required'),
});

export const disbursePayrollRunSchema = z.object({
  params: z.object({
    runId: z.string().uuid(),
  }),
  body: z.object({
    method: z.enum(['NEFT', 'UPI', 'CASH']).optional(),
    confirm: z.boolean().optional().default(false),
  }),
});

export const getWorkerWagesSchema = z.object({
  query: z.object({
    search: z.string().trim().max(120).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  }),
});

export const patchWorkerWageSchema = z.object({
  params: z.object({
    employmentId: z.string().uuid(),
  }),
  body: z.object({
    daily_rate: money.optional(),
    ot_rate: money.optional(),
    payment_method: z.enum(['bank', 'upi', 'cash', 'NEFT', 'UPI', 'CASH']).optional(),
    pf_applicable: z.boolean().optional(),
    esi_applicable: z.boolean().optional(),
  }),
});

export const payrollPayslipIdSchema = z.object({
  params: z.object({
    lineId: z.string().uuid(),
  }),
});

export const payrollFilingIdSchema = z.object({
  params: z.object({
    filingId: z.string().uuid(),
  }),
});

export const getPayrollSettingsSchema = z.object({});

export const putPayrollSettingsSchema = z.object({
  body: z.object({
    pay_cycle: z
      .object({
        pay_frequency: z.string().trim().min(1).max(40).optional(),
        pay_day: z.string().trim().min(1).max(40).optional(),
        payroll_cutoff_day: z.coerce.number().int().min(1).max(31).optional(),
        financial_year_start: z.string().trim().min(1).max(20).optional(),
        lock_after_processing: z.boolean().optional(),
      })
      .optional(),
    statutory: z
      .object({
        employee_pf_rate: z.coerce.number().min(0).max(100).optional(),
        employer_pf_rate: z.coerce.number().min(0).max(100).optional(),
        employee_esic_rate: z.coerce.number().min(0).max(100).optional(),
        employer_esic_rate: z.coerce.number().min(0).max(100).optional(),
        professional_tax: money.optional(),
        labour_welfare_fund: money.optional(),
      })
      .optional(),
    attendance: z
      .object({
        overtime_multiplier: z.coerce.number().min(0).max(10).optional(),
        max_ot_hours_per_day: z.coerce.number().min(0).max(24).optional(),
        half_day_percentage: z.coerce.number().min(0).max(100).optional(),
        absent_deduction_type: z.string().trim().min(1).max(40).optional(),
        auto_calculate_ot: z.boolean().optional(),
      })
      .optional(),
    payment: z
      .object({
        default_disbursement_method: z.enum(['NEFT', 'UPI', 'CASH']).optional(),
        allow_bank_transfer: z.boolean().optional(),
        allow_upi: z.boolean().optional(),
        allow_cash: z.boolean().optional(),
      })
      .optional(),
    company_details: z
      .object({
        company_name: z.string().trim().min(1).max(120).optional(),
        epf_registration_no: z.string().trim().max(80).nullable().optional(),
        esic_code: z.string().trim().max(80).nullable().optional(),
        gstin: z.string().trim().max(20).nullable().optional(),
        state: z.string().trim().max(80).nullable().optional(),
      })
      .optional(),
  }),
});

export const payrollHistoryQuerySchema = z.object({
  query: z.object({
    year: z.coerce.number().int().min(2020).max(2100).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
  }),
});

export { isoDateString };
