import {
  adminCompanyIdSchema,
  adminLoginSchema,
  inviteHrSchema,
  employerInviteHrSchema,
  listAdminCompaniesSchema,
  listHrInvitesSchema,
  onboardCompanyFounderSchema,
  patchCompanyStatusSchema,
  revokeHrInviteSchema,
  upsertCompanyProfileSchema,
} from '@repo/validator/shared';
import { z } from 'zod';

export type AdminLoginRequest = z.infer<typeof adminLoginSchema>;
export type InviteHrRequest = z.infer<typeof inviteHrSchema>;
export type EmployerInviteHrRequest = z.infer<typeof employerInviteHrSchema>;
export type OnboardCompanyFounderRequest = z.infer<typeof onboardCompanyFounderSchema>;
export type ListHrInvitesRequest = z.infer<typeof listHrInvitesSchema>;
export type ListAdminCompaniesRequest = z.infer<typeof listAdminCompaniesSchema>;
export type AdminCompanyIdRequest = z.infer<typeof adminCompanyIdSchema>;
export type PatchCompanyStatusRequest = z.infer<typeof patchCompanyStatusSchema>;
export type RevokeHrInviteRequest = z.infer<typeof revokeHrInviteSchema>;
export type UpsertCompanyProfileRequest = z.infer<typeof upsertCompanyProfileSchema>;
export type UpsertCompanyProfilePayload = z.infer<typeof upsertCompanyProfileSchema>['body'];

export type AdminSession = {
  id: string;
  name: string;
  email: string;
  phone_no: string;
  role: string;
};

export type AdminLoginResponse = {
  admin: AdminSession;
  accessToken: string;
  refreshToken: string;
};

export type HrInviteView = {
  id: string;
  full_name: string;
  email: string;
  phone_no: string;
  status: string;
  expires_at: string;
  accepted_at: string | null;
  company_id: string | null;
  company_name: string | null;
  created_at: string;
};

export type AdminCompanyListItem = {
  id: string;
  company_name: string;
  status: string;
  is_verified: boolean;
  gst_number: string | null;
  state: string | null;
  founder_name: string | null;
  founder_email: string | null;
  hr_name: string | null;
  hr_email: string | null;
  hr_phone: string | null;
  employee_count: number;
  created_at: string;
};

export type CompanyHrProfileView = {
  employment_id: string | null;
  full_name: string;
  email: string | null;
  phone_no: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  role_code: string;
};

export type CompanyProfileView = {
  id: string;
  company_name: string;
  company_address: string | null;
  state: string | null;
  gst_number: string | null;
  pan: string | null;
  epf_registration_no: string | null;
  esic_code: string | null;
  status: string;
  is_verified: boolean;
  setup_pending: boolean;
  hr_profile: CompanyHrProfileView | null;
};

export type EmployeeImportResult = {
  total: number;
  created: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
};
