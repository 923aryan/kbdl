import { z } from 'zod';

/** Accept 10 digits or +91XXXXXXXXXX → normalize to +91XXXXXXXXXX */
const phoneValidation = z
  .string()
  .trim()
  .min(1, 'Phone number is required')
  .transform((val) => {
    const digits = val.replace(/\D/g, '');
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
    return val.trim();
  })
  .refine((val) => /^\+91\d{10}$/.test(val), {
    message: 'Phone number must be a 10-digit Indian mobile (optionally prefixed with +91)',
  });

const optionalPhoneValidation = z.preprocess((val) => {
  if (val === undefined || val === null || val === '') return undefined;
  return val;
}, phoneValidation.optional());

const isoDateString = (fieldName: string) =>
  z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${fieldName} must be YYYY-MM-DD`)
    .refine((val) => {
      const d = new Date(`${val}T00:00:00.000Z`);
      return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === val;
    }, `${fieldName} must be a valid calendar date`);

const todayUtcDate = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

const parseIsoDate = (val: string) => new Date(`${val}T00:00:00.000Z`);

/** DOB: not in the future; not older than 100 years; must be at least 14 years old */
const dateOfBirthSchema = isoDateString('date_of_birth').superRefine((val, ctx) => {
  const dob = parseIsoDate(val);
  const today = todayUtcDate();
  if (dob > today) {
    ctx.addIssue({ code: 'custom', message: 'date_of_birth cannot be a future date' });
    return;
  }
  const minDob = new Date(today);
  minDob.setUTCFullYear(minDob.getUTCFullYear() - 100);
  if (dob < minDob) {
    ctx.addIssue({ code: 'custom', message: 'date_of_birth is unrealistically old' });
    return;
  }
  const maxDob = new Date(today);
  maxDob.setUTCFullYear(maxDob.getUTCFullYear() - 14);
  if (dob > maxDob) {
    ctx.addIssue({ code: 'custom', message: 'Employee must be at least 14 years old' });
  }
});

/** Joining date: past or future allowed (scheduled join); not more than 1 year in the future */
const joiningDateSchema = isoDateString('joining_date').superRefine((val, ctx) => {
  const join = parseIsoDate(val);
  const today = todayUtcDate();
  const maxFuture = new Date(today);
  maxFuture.setUTCFullYear(maxFuture.getUTCFullYear() + 1);
  if (join > maxFuture) {
    ctx.addIssue({
      code: 'custom',
      message: 'joining_date cannot be more than 1 year in the future',
    });
  }
});

const documentUrlSchema = z
  .string()
  .trim()
  .url('Must be a valid URL')
  .refine((val) => /^https?:\/\//i.test(val), {
    message: 'Document link must start with http:// or https://',
  })
  .max(2048, 'Document URL is too long');

const nonNegativeNumber = (fieldName: string, max = 99999999.99) =>
  z
    .number({ message: `${fieldName} must be a number` })
    .finite(`${fieldName} must be a finite number`)
    .nonnegative(`${fieldName} cannot be negative`)
    .max(max, `${fieldName} is too large`);

const positiveNumber = (fieldName: string, max = 99999999.99) =>
  z
    .number({ message: `${fieldName} must be a number` })
    .finite(`${fieldName} must be a finite number`)
    .positive(`${fieldName} must be greater than 0`)
    .max(max, `${fieldName} is too large`);

const yesNoBoolean = z.boolean({ message: 'Must be true or false' });

const genderValues = ['male', 'female', 'other'] as const;
const paymentMethodValues = ['cash', 'upi', 'bank'] as const;
const employeeTypeValues = ['full_time', 'contract', 'worker', 'trainee'] as const;
const salaryTypeValues = ['monthly', 'daily_wage', 'hourly'] as const;
const frequencyValues = ['daily', 'weekly', 'biweekly', 'monthly'] as const;
const bloodGroupValues = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

const emergencyContactSchema = z.object({
  name: z.string().trim().min(1, 'Emergency contact name is required').max(120),
  relation: z.string().trim().min(1, 'Emergency contact relation is required').max(60),
  phone_no: phoneValidation,
});

const personalSchema = z.object({
  full_name: z.string().trim().min(1, 'full_name is required').max(120),
  email: z
    .union([z.string().trim().email('Invalid email').max(255), z.literal('')])
    .optional()
    .transform((v) => (v ? v : undefined)),
  date_of_birth: dateOfBirthSchema,
  gender: z.enum(genderValues, { message: 'gender must be male, female, or other' }),
  address: z.string().trim().min(1, 'address is required').max(500),
  blood_group: z.enum(bloodGroupValues, { message: 'Invalid blood_group' }),
  emergency_contact: emergencyContactSchema,
});

const uuidField = (fieldName: string) =>
  z.string().uuid(`${fieldName} must be a valid UUID`);

const jobSchema = z.object({
  /** FK → company_designations.id (job title catalog, not RBAC) */
  designation_id: uuidField('designation_id'),
  /** FK → departments.id (company-scoped) */
  department_id: uuidField('department_id'),
  branch_location: z.string().trim().min(1, 'branch_location is required').max(120),
  /** FK → company_members.id (self-join manager) */
  reporting_supervisor_id: uuidField('reporting_supervisor_id'),
  employee_type: z.enum(employeeTypeValues, {
    message: 'employee_type must be full_time, contract, worker, or trainee',
  }),
  joining_date: joiningDateSchema,
  /** FK → work_shifts.id (HR template, not marketplace shifts) */
  work_shift_id: uuidField('work_shift_id'),
  work_location: z.string().trim().max(120).optional(),
  skill_trade: z.string().trim().min(1, 'skill_trade is required').max(120),
  experience_years: nonNegativeNumber('experience_years', 60),
  certification_licenses: z.string().trim().max(500).optional(),
  safety_training_completed: yesNoBoolean,
});

const metaSearchQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a number')
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => val >= 1 && val <= 100, { message: 'Limit must be between 1 and 100' }),
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a number')
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val >= 1, { message: 'Page must be at least 1' }),
});

export const getEmployerDepartmentsMetaSchema = z.object({
  query: metaSearchQuerySchema,
});

export const getEmployerSupervisorsMetaSchema = z.object({
  query: metaSearchQuerySchema,
});

export const getEmployerWorkShiftsMetaSchema = z.object({
  query: metaSearchQuerySchema,
});

export const getEmployerDesignationsMetaSchema = z.object({
  query: metaSearchQuerySchema,
});

const upiPaymentSchema = z.object({
  upi_id: z
    .string()
    .trim()
    .min(3, 'upi_id is required')
    .max(100)
    .regex(/^[\w.\-]{2,}@[\w.\-]{2,}$/i, 'Invalid UPI ID format'),
  name: z.string().trim().min(1, 'UPI name is required').max(120),
  wage_amount: positiveNumber('wage_amount'),
  frequency: z.enum(frequencyValues, { message: 'Invalid UPI payment frequency' }),
});

const bankPaymentSchema = z.object({
  account_holder_name: z.string().trim().min(1, 'account_holder_name is required').max(120),
  account_number: z
    .string()
    .trim()
    .regex(/^\d{9,18}$/, 'account_number must be 9–18 digits (no negative / letters)'),
  bank_name: z.string().trim().min(1, 'bank_name is required').max(120),
  ifsc_code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code'),
});

const paymentSchema = z
  .object({
    method: z.enum(paymentMethodValues, { message: 'method must be cash, upi, or bank' }),
    upi: upiPaymentSchema.optional(),
    bank: bankPaymentSchema.optional(),
    basic_salary: positiveNumber('basic_salary'),
    salary_type: z.enum(salaryTypeValues, { message: 'Invalid salary_type' }),
    payment_frequency: z.enum(frequencyValues, { message: 'Invalid payment_frequency' }),
    overtime_eligible: yesNoBoolean,
    pf_applicable: yesNoBoolean,
    esi_applicable: yesNoBoolean,
  })
  .superRefine((data, ctx) => {
    if (data.method === 'upi' && !data.upi) {
      ctx.addIssue({ code: 'custom', message: 'upi details are required when method is upi', path: ['upi'] });
    }
    if (data.method === 'bank' && !data.bank) {
      ctx.addIssue({ code: 'custom', message: 'bank details are required when method is bank', path: ['bank'] });
    }
    if (data.method === 'cash' && data.upi) {
      ctx.addIssue({ code: 'custom', message: 'upi must not be sent when method is cash', path: ['upi'] });
    }
    if (data.method === 'cash' && data.bank) {
      ctx.addIssue({ code: 'custom', message: 'bank must not be sent when method is cash', path: ['bank'] });
    }
  });

const identitySchema = z.object({
  aadhaar_number: z
    .string()
    .trim()
    .regex(/^\d{12}$/, 'aadhaar_number must be exactly 12 digits'),
  pan_number: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'pan_number must be a valid PAN (e.g. ABCDE1234F)'),
  driving_license_number: z.string().trim().max(40).optional(),
  /** Public https link to identity docs — not multipart */
  identity_document_url: documentUrlSchema,
  additional_document_url: documentUrlSchema.optional(),
});

/** Partial versions for draft saves */
const personalDraftSchema = personalSchema.partial().extend({
  emergency_contact: emergencyContactSchema.partial().optional(),
  date_of_birth: isoDateString('date_of_birth')
    .superRefine((val, ctx) => {
      const dob = parseIsoDate(val);
      if (dob > todayUtcDate()) {
        ctx.addIssue({ code: 'custom', message: 'date_of_birth cannot be a future date' });
      }
    })
    .optional(),
});

const jobDraftSchema = jobSchema.partial().extend({
  experience_years: nonNegativeNumber('experience_years', 60).optional(),
  joining_date: joiningDateSchema.optional(),
});

const paymentDraftSchema = z
  .object({
    method: z.enum(paymentMethodValues).optional(),
    upi: upiPaymentSchema.partial().optional(),
    bank: bankPaymentSchema.partial().optional(),
    basic_salary: positiveNumber('basic_salary').optional(),
    salary_type: z.enum(salaryTypeValues).optional(),
    payment_frequency: z.enum(frequencyValues).optional(),
    overtime_eligible: yesNoBoolean.optional(),
    pf_applicable: yesNoBoolean.optional(),
    esi_applicable: yesNoBoolean.optional(),
  })
  .optional();

const identityDraftSchema = z
  .object({
    aadhaar_number: z
      .string()
      .trim()
      .regex(/^\d{12}$/, 'aadhaar_number must be exactly 12 digits')
      .optional(),
    pan_number: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN')
      .optional(),
    driving_license_number: z.string().trim().max(40).optional(),
    identity_document_url: documentUrlSchema.optional(),
    additional_document_url: documentUrlSchema.optional(),
  })
  .optional();

const onboardBodyBase = z.object({
  action: z.enum(['draft', 'submit']).default('submit'),
  phone_no: optionalPhoneValidation,
  karigari_id: z.string().trim().min(1).max(50).optional(),
  employee_no: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const onboardEmployeeSchema = z.object({
  body: onboardBodyBase
    .and(
      z.object({
        personal: z.unknown().optional(),
        job: z.unknown().optional(),
        payment: z.unknown().optional(),
        identity: z.unknown().optional(),
      }),
    )
    .superRefine((data, ctx) => {
      if (!data.phone_no && !data.karigari_id) {
        ctx.addIssue({
          code: 'custom',
          message: 'Either phone_no (10 digits) or karigari_id is required',
          path: ['phone_no'],
        });
      }

      if (data.action === 'draft') {
        if (data.personal !== undefined) {
          const parsed = personalDraftSchema.safeParse(data.personal);
          if (!parsed.success) {
            for (const issue of parsed.error.issues) {
              ctx.addIssue({ ...issue, path: ['personal', ...issue.path] });
            }
          }
        }
        if (data.job !== undefined) {
          const parsed = jobDraftSchema.safeParse(data.job);
          if (!parsed.success) {
            for (const issue of parsed.error.issues) {
              ctx.addIssue({ ...issue, path: ['job', ...issue.path] });
            }
          }
        }
        if (data.payment !== undefined) {
          const parsed = paymentDraftSchema.safeParse(data.payment);
          if (!parsed.success) {
            for (const issue of parsed.error.issues) {
              ctx.addIssue({ ...issue, path: ['payment', ...issue.path] });
            }
          }
        }
        if (data.identity !== undefined) {
          const parsed = identityDraftSchema.safeParse(data.identity);
          if (!parsed.success) {
            for (const issue of parsed.error.issues) {
              ctx.addIssue({ ...issue, path: ['identity', ...issue.path] });
            }
          }
        }
        return;
      }

      // submit — full validation
      const personal = personalSchema.safeParse(data.personal);
      if (!personal.success) {
        for (const issue of personal.error.issues) {
          ctx.addIssue({ ...issue, path: ['personal', ...issue.path] });
        }
      }

      const job = jobSchema.safeParse(data.job);
      if (!job.success) {
        for (const issue of job.error.issues) {
          ctx.addIssue({ ...issue, path: ['job', ...issue.path] });
        }
      }

      const payment = paymentSchema.safeParse(data.payment);
      if (!payment.success) {
        for (const issue of payment.error.issues) {
          ctx.addIssue({ ...issue, path: ['payment', ...issue.path] });
        }
      }

      const identity = identitySchema.safeParse(data.identity);
      if (!identity.success) {
        for (const issue of identity.error.issues) {
          ctx.addIssue({ ...issue, path: ['identity', ...issue.path] });
        }
      }
    })
    .transform((data) => {
      if (data.action === 'draft') {
        return {
          ...data,
          personal: data.personal ? personalDraftSchema.parse(data.personal) : undefined,
          job: data.job ? jobDraftSchema.parse(data.job) : undefined,
          payment: data.payment ? paymentDraftSchema.parse(data.payment) : undefined,
          identity: data.identity ? identityDraftSchema.parse(data.identity) : undefined,
        };
      }
      return {
        ...data,
        personal: personalSchema.parse(data.personal),
        job: jobSchema.parse(data.job),
        payment: paymentSchema.parse(data.payment),
        identity: identitySchema.parse(data.identity),
      };
    }),
});

export const getEmployerRosterSchema = z.object({
  query: z.object({
    status: z.enum(['active', 'inactive', 'terminated', 'resigned']).optional(),
    search: z.string().optional(),
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a number')
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10)),
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a number')
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1)),
  }),
});

export const getEmployeeDetailsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid employee mapping ID format'),
  }),
});

export const updateEmploymentStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid employee mapping ID format'),
  }),
  body: z.object({
    status: z.enum(['active', 'inactive', 'terminated', 'resigned'], {
      error: 'Invalid employment status provided',
    }),
  }),
});

export const getAllEmployeeEmploymentSchema = z.object({
  query: z.object({
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a number')
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10)),
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a number')
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1)),
  }),
});

export const getEmployeePendingEmploymentsSchema = z.object({
  query: z.object({
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a number')
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10)),
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a number')
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1)),
  }),
});

export const getEmployeeEmploymentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid employee mapping ID format'),
  }),
});

export const searchAddressSchema = z.object({
  query: z.object({
    query: z.string().trim().min(2, 'Search query must be at least 2 characters long'),
  }),
});
