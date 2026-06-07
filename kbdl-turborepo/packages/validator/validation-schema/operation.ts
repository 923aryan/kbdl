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

export const getEmployerRosterSchema = z.object({
  query: z.object({
    status: z.enum(['active', 'inactive', 'terminated', 'resigned']).optional(),
    search: z.string().optional(),
  }),
});

export const getEmployeeDetailsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid employee mapping ID format'),
  }),
});

export const onboardEmployeeSchema = z.object({
  body: z
    .object({
      phone_no: phoneValidation.optional(),
      karigari_id: z.string().min(1, 'Karigari ID cannot be empty').optional(),
      employee_no: z.string().max(50, 'Employee number is too long').optional(),
    })
    .refine((data) => data.phone_no || data.karigari_id, {
      message: 'Either phone_no or karigari_id must be provided to onboard an employee',
      path: ['body'],
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

export const getAllEmployeeEmploymentSchema = z.object({});

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
