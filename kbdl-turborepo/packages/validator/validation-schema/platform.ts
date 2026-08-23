import { z } from 'zod';

const phoneValidation = z
  .string()
  .transform((val) => {
    const trimmed = val.trim();
    return /^\d{10}$/.test(trimmed) ? `+91${trimmed}` : trimmed;
  })
  .refine((val) => /^\+91\d{10}$/.test(val), {
    message: 'Phone number must strictly have +91 in front followed by a 10-digit number',
  });

export const COMPANY_STATUSES = [
  'onboarding',
  'pending_review',
  'active',
  'suspended',
  'rejected',
] as const;

export const adminLoginSchema = z.object({
  body: z.object({
    email: z.string().trim().min(3, 'Email or phone is required').max(255),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  }),
});

export const inviteHrSchema = z.object({
  body: z.object({
    full_name: z.string().trim().min(2, 'Name is required').max(120),
    email: z.string().trim().email('Invalid email').max(255),
    phone_no: phoneValidation,
    company_id: z.string().uuid('Select a company for this HR'),
  }),
});

export const employerInviteHrSchema = z.object({
  body: z.object({
    full_name: z.string().trim().min(2, 'Name is required').max(120),
    email: z.string().trim().email('Invalid email').max(255),
    phone_no: phoneValidation,
  }),
});

export const onboardCompanyFounderSchema = z.object({
  body: z.object({
    company_name: z.string().trim().min(2, 'Company name is required').max(255),
    company_address: z.string().trim().max(500).optional().or(z.literal('')),
    state: z.string().trim().max(80).optional().or(z.literal('')),
    founder_name: z.string().trim().min(2, 'Founder name is required').max(120),
    founder_email: z.string().trim().email('Invalid email').max(255),
    founder_phone: phoneValidation,
  }),
});

export const listHrInvitesSchema = z.object({
  query: z.object({
    status: z.enum(['pending', 'accepted', 'expired', 'revoked']).optional(),
    search: z.string().trim().max(120).optional(),
    page: z
      .string()
      .regex(/^\d+$/)
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z
      .string()
      .regex(/^\d+$/)
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 20)),
  }),
});

export const listAdminCompaniesSchema = z.object({
  query: z.object({
    status: z.enum(COMPANY_STATUSES).optional(),
    search: z.string().trim().max(120).optional(),
    page: z
      .string()
      .regex(/^\d+$/)
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z
      .string()
      .regex(/^\d+$/)
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 20)),
  }),
});

export const adminCompanyIdSchema = z.object({
  params: z.object({
    companyId: z.string().uuid('Invalid company id'),
  }),
});

export const patchCompanyStatusSchema = z.object({
  params: z.object({
    companyId: z.string().uuid('Invalid company id'),
  }),
  body: z.object({
    status: z.enum(COMPANY_STATUSES),
  }),
});

export const revokeHrInviteSchema = z.object({
  params: z.object({
    inviteId: z.string().uuid('Invalid invite id'),
  }),
});

const optionalGst = z
  .string()
  .trim()
  .toUpperCase()
  .length(15, 'GST number must be exactly 15 characters')
  .regex(/^[A-Z0-9]+$/, 'GST number must be alphanumeric')
  .optional()
  .or(z.literal(''));

export const upsertCompanyProfileSchema = z.object({
  body: z.object({
    company_name: z.string().trim().min(1, 'Company name is required').max(255),
    company_address: z.string().trim().min(1, 'Company address is required').max(500),
    state: z.string().trim().min(1, 'State is required').max(80),
    gst_number: optionalGst,
    pan: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'PAN must be like ABCDE1234F')
      .optional()
      .or(z.literal('')),
    epf_registration_no: z.string().trim().max(50).optional().or(z.literal('')),
    esic_code: z.string().trim().max(50).optional().or(z.literal('')),
    submit_for_review: z.boolean().optional().default(true),
    hr_full_name: z.string().trim().min(2).max(120).optional(),
    hr_date_of_birth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD')
      .optional()
      .or(z.literal('')),
    hr_gender: z.string().trim().max(40).optional().or(z.literal('')),
    hr_address: z.string().trim().max(500).optional().or(z.literal('')),
    company_location: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
      .optional(),
  }),
});
