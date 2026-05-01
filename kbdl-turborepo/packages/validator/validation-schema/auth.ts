import { z } from "zod";
export const userRegisterSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(255, "Name is too long"),

    phone_no: z
      .string()
      .min(10, "Phone number must be at least 10 characters")
      .max(15, "Phone number is too long")
      .regex(/^\+?[0-9]+$/, "Phone number can only contain numbers and an optional leading '+'"),

    karigari_id: z.string().max(255).optional(),

    default_address: z.string().max(500).optional(),

    skills: z.array(z.string()).optional().default([]),

    experience: z
      .number()
      .int("Experience must be an integer")
      .nonnegative("Experience cannot be negative")
      .optional(),

    city: z.string().max(255).optional(),

    area: z.string().max(255).optional(),

    extra_shift: z.boolean().optional().default(false),

  }),
});

export const employerRegisterSchema = z.object({
  body: z.object({
    company_name: z
      .string()
      .min(1, "Company name is required")
      .max(255, "Company name is too long"),

    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email format")
      .max(255, "Email is too long"),

    phone_no: z
      .string()
      .min(10, "Phone number must be at least 10 characters")
      .max(15, "Phone number is too long")
      .regex(/^\+?[0-9]+$/, "Phone number can only contain numbers and an optional leading '+'"),

    company_address: z.string().max(500).optional(),

    gst_number: z
      .string()
      .length(15, "GST number must be exactly 15 characters")
      .regex(/^[A-Z0-9]+$/, "GST number must be alphanumeric")
      .optional(),

    subscription_tier: z.string().max(255).optional(),
  }),
});

export const employerloginSchema = z.object({
  body: z.object({
    email: employerRegisterSchema.shape.body.shape.email,
  }),
});

export const userloginSchema = z.object({
  body: z.object({
    email: userRegisterSchema.shape.body.shape.phone_no,
  }),
});

export const employerSendOtpSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format").min(1, "Email is required")
  })
});

export const employerVerifyOtpSchema = z.object({
  body: z.object({
    email: employerSendOtpSchema.shape.body.shape.email,
    otp: z.string().length(6, "OTP must be exactly 6 digits").regex(/^[0-9]+$/, "OTP must be numeric")
  })
});


export const userSendOtpSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Invalid phone number")
  })
});

export const userVerifyOtpSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Invalid phone number"),
    otp: z
      .string()
      .length(6, "OTP must be exactly 6 digits")
      .regex(/^\d+$/, "OTP must be numeric")
  })
});