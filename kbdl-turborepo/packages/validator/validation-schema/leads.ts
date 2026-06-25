import { z } from 'zod';

// A. Create Lead
export const createLeadSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(255, 'Full name cannot exceed 255 characters')
      .regex(/^[^<>]*$/, 'HTML tags are not allowed'),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Invalid email address')
      .max(255, 'Email cannot exceed 255 characters'),

    mobileNumber: z
      .string()
      .trim()
      .min(8, 'Mobile number is too short')
      .max(20, 'Mobile number cannot exceed 20 characters')
      .regex(/^\+?[0-9\s\-()]+$/, 'Invalid mobile number format'),

    subject: z
      .string()
      .trim()
      .min(2, 'Subject must be at least 2 characters')
      .max(255, 'Subject cannot exceed 255 characters')
      .regex(/^[^<>]*$/, 'HTML tags are not allowed'),

    message: z
      .string()
      .trim()
      .min(10, 'Message must be at least 10 characters')
      .max(5000, 'Message cannot exceed 5000 characters')
      .regex(/^[^<>]*$/, 'HTML tags are not allowed'),
  }).strict(),
});

// B. Get Lead By ID
export const getLeadByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid lead ID format'),
  }).strict(),
});

// C. Resolve Lead
export const resolveLeadSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid lead ID format'),
  }).strict(),
});

// D. Delete Lead
export const deleteLeadSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid lead ID format'),
  }).strict(),
});
