import { z } from "zod";

// A. Create Lead
export const createLeadSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(255, "Full name cannot exceed 255 characters"),

    email: z
      .string()
      .email("Invalid email address")
      .max(255, "Email cannot exceed 255 characters"),

    mobileNumber: z
      .string()
      .min(8, "Mobile number is too short")
      .max(20, "Mobile number cannot exceed 20 characters"),

    subject: z
      .string()
      .min(2, "Subject must be at least 2 characters")
      .max(255, "Subject cannot exceed 255 characters"),

    message: z
      .string()
      .min(10, "Message must be at least 10 characters")
      .max(5000, "Message cannot exceed 5000 characters"),
  }),
});

// B. Get Lead By ID
export const getLeadByIdSchema = z.object({
  params: z.object({
    id: z
      .string()
      .uuid("Invalid lead ID format"),
  }),
});

// C. Resolve Lead
export const resolveLeadSchema = z.object({
  params: z.object({
    id: z
      .string()
      .uuid("Invalid lead ID format"),
  }),
});

// D. Delete Lead
export const deleteLeadSchema = z.object({
  params: z.object({
    id: z
      .string()
      .uuid("Invalid lead ID format"),
  }),
});