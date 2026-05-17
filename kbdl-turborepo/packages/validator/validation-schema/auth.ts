import { z } from 'zod';
export const userRegisterSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Name is too short')
      .max(255, 'Name is too long')
      .optional()
      .or(z.literal('')),
    preferences: z
      .object({
        language: z.string().min(2).max(10).default('en-IN').optional(),
        theme: z.enum(['light', 'dark', 'system']).default('system').optional(),
      })
      .default({
        language: 'en-IN',
        theme: 'system',
      })
      .optional(),
    phone_no: z
      .string()
      .min(10, 'Phone number must be at least 10 characters')
      .max(15, 'Phone number is too long')
      .regex(/^\+?[0-9]+$/, "Phone number can only contain numbers and an optional leading '+'"),
  }),
});

export const userVerifyRegisterSchema = z.object({
  body: z.object({
    phone_no: z
      .string()
      .min(10, 'Phone number must be at least 10 characters')
      .max(15, 'Phone number is too long')
      .regex(/^\+?[0-9]+$/, "Phone number can only contain numbers and an optional leading '+'"),
    otp: z
      .string()
      .length(6, 'OTP must be exactly 6 digits')
      .regex(/^[0-9]+$/, 'OTP must be numeric'),
  }),
});

export const employerRegisterSchema = z.object({
  body: z.object({
    company_name: z
      .string()
      .min(1, 'Company name is required')
      .max(255, 'Company name is too long'),

    company_location: z
      .object({
        latitude: z
          .number()
          .min(-90, 'Latitude must be between -90 and 90')
          .max(90, 'Latitude must be between -90 and 90'),

        longitude: z
          .number()
          .min(-180, 'Longitude must be between -180 and 180')
          .max(180, 'Longitude must be between -180 and 180'),
      })
      .optional(),

    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email format')
      .max(255, 'Email is too long'),

    phone_no: z
      .string()
      .min(10, 'Phone number must be at least 10 characters')
      .max(15, 'Phone number is too long')
      .regex(/^\+?[0-9]+$/, "Phone number can only contain numbers and an optional leading '+'"),

    company_address: z.string().max(500).optional(),

    gst_number: z
      .string()
      .length(15, 'GST number must be exactly 15 characters')
      .regex(/^[A-Z0-9]+$/, 'GST number must be alphanumeric')
      .optional()
      .or(z.literal('')),

    subscription_tier: z.string().max(255).optional(),
  }),
});

export const employerloginSchema = z.object({
  body: z.object({
    email: employerRegisterSchema.shape.body.shape.email,
  }),
});

export const employerSendOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').min(1, 'Email is required'),
  }),
});

export const employerVerifyOtpSchema = z.object({
  body: z.object({
    email: employerSendOtpSchema.shape.body.shape.email,
    otp: z
      .string()
      .length(6, 'OTP must be exactly 6 digits')
      .regex(/^[0-9]+$/, 'OTP must be numeric'),
  }),
});

export const userSendOtpSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .regex(/^\+?[0-9]+$/, "Phone number can only contain numbers and an optional leading '+'"),
  }),
});

export const userVerifyOtpSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .max(15, 'Phone number is too long')
      .regex(/^\+?[0-9]+$/, "Phone number can only contain numbers and an optional leading '+'"),
    otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d+$/, 'OTP must be numeric'),
  }),
});
