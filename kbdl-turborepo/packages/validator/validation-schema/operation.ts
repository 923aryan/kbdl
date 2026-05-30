import { z } from 'zod';

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
      phone_no: z.string().min(10, 'Phone number must be at least 10 characters').optional(),
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
