import { z } from 'zod';

const userPreferencesSchema = z.object({
  language: z.string().min(2).max(10).default('en-IN'),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
});

const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const updateUserProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is too short').max(255, 'Name is too long').optional(),
    default_address: z.string().max(500, 'Address is too long').optional(),
    experience: z.number().int().positive('Experience must be a positive number').optional(),
    city: z.string().max(100).optional(),
    area: z.string().max(100).optional(),
  }),
});

export const updateUserSkillsSchema = z.object({
  body: z.object({
    skills: z.array(z.string().min(1, 'Skill cannot be empty')),
  }),
});

export const updateUserPreferencesSchema = z.object({
  body: userPreferencesSchema,
});

export const updateUserLocationSchema = z.object({
  body: locationSchema,
});

export const updateUserAvailabilitySchema = z.object({
  body: z.object({
    extra_shift: z.boolean(),
  }),
});

export const getPublicUserProfileSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
});

export const removePushTokenSchema = z.object({
  body: z
    .object({
      token: z.string().min(1, 'Token is required').optional(),
      deviceId: z.string().min(1, 'Device ID is required').optional(),
    })
    .refine((data) => data.token || data.deviceId, {
      message: 'Either token or deviceId must be provided',
      path: ['body'],
    }),
});

export const updateEmployerProfileSchema = z.object({
  body: z.object({
    company_name: z.string().min(1, 'Company name is required').max(255).optional(),
    phone_no: z
      .string()
      .min(10)
      .max(15)
      .regex(/^\+?[0-9]+$/)
      .optional(),
    company_address: z.string().max(500).optional(),
    gst_number: z
      .string()
      .length(15)
      .regex(/^[A-Z0-9]+$/)
      .optional()
      .or(z.literal('')),
  }),
});

export const updateEmployerPreferencesSchema = z.object({
  body: z.any(),
});

export const updateEmployerLocationSchema = z.object({
  body: locationSchema,
});

export const uploadEmployerDocumentsSchema = z.object({});

export const getPublicEmployerProfileSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid employer ID format'),
  }),
});
