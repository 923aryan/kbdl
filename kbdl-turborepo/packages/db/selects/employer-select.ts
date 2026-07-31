import { Prisma } from '../generated/prisma';

/**
 * Company fields used to build the legacy Employer API DTO.
 *
 * Email, phone_no, and refresh_token live on the OWNER CompanyMember's User
 * (platform_type EMPLOYER). subscription_tier is read from company.preferences.subscription_tier
 * via toEmployerDto in apps/kbdl-backend/src/compat/employer-compat.ts.
 */
export const safeEmployerSelect = Prisma.validator<Prisma.CompanySelect>()({
  id: true,
  company_name: true,
  company_address: true,
  gst_number: true,
  is_verified: true,
  preferences: true,
});

/** @deprecated Alias — prefer safeEmployerSelect (Company-backed). */
export const safeCompanySelect = safeEmployerSelect;

/**
 * Manual Employer DTO shape for API compatibility after Employer → Company refactor.
 * Prisma.Employer* types no longer exist.
 */
export type EmployerDto = {
  id: string;
  company_name: string;
  phone_no?: string | null;
  email?: string | null;
  company_address: string | null;
  gst_number?: string | null;
  is_verified: boolean;
  subscription_tier?: string | null;
  preferences: unknown;
  role?: string;
};

/** Compat alias so existing `import { Employer }` sites can migrate gradually. */
export type Employer = EmployerDto;
