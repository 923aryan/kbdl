import {
  AdminCompanyIdRequest,
  AdminLoginRequest,
  InviteHrRequest,
  ListAdminCompaniesRequest,
  ListHrInvitesRequest,
  OnboardCompanyFounderRequest,
  PatchCompanyStatusRequest,
  RevokeHrInviteRequest,
} from '@repo/types';
import {
  adminCompanyIdSchema,
  adminLoginSchema,
  inviteHrSchema,
  listAdminCompaniesSchema,
  listHrInvitesSchema,
  onboardCompanyFounderSchema,
  patchCompanyStatusSchema,
  revokeHrInviteSchema,
} from '@repo/validator/shared';
import { Request, Response } from 'express';
import { setAuthCookies } from '../auth/auth-controller';
import { AppError } from '../utils/api-error';
import { sendSuccess } from '../utils/send-success';
import { validate } from '../utils/validate';
import { adminLoginService, getAdminMeService } from './admin-auth-service';
import {
  getAdminCompanyService,
  inviteHrService,
  listAdminCompaniesService,
  listHrInvitesService,
  onboardCompanyFounderService,
  patchCompanyStatusService,
  revokeHrInviteService,
} from './admin-company-service';

export const adminLogin = async (req: Request, res: Response) => {
  const input = validate<AdminLoginRequest>(adminLoginSchema, req);
  const result = await adminLoginService(input.body);
  setAuthCookies(res, result.accessToken, result.refreshToken, 'admin');
  sendSuccess(res, 'Admin login successful', result, 200);
};

export const getAdminMe = async (req: Request, res: Response) => {
  if (req.role !== 'admin' || !req.payload || !('admin' in req.payload)) {
    throw new AppError(401, 'UNAUTHORIZED', 'Admin session required');
  }
  const admin = await getAdminMeService(req.payload.admin.id);
  sendSuccess(res, 'Admin profile', admin);
};

export const inviteHr = async (req: Request, res: Response) => {
  if (req.role !== 'admin' || !req.payload || !('admin' in req.payload)) {
    throw new AppError(401, 'UNAUTHORIZED', 'Admin session required');
  }
  const input: InviteHrRequest = validate(inviteHrSchema, req);
  const invite = await inviteHrService({
    invitedByAdminId: req.payload.admin.id,
    ...input.body,
  });
  sendSuccess(res, 'HR invite created. They can log in on the employer portal with this email.', invite, 201);
};

export const onboardCompanyFounder = async (req: Request, res: Response) => {
  if (req.role !== 'admin' || !req.payload || !('admin' in req.payload)) {
    throw new AppError(401, 'UNAUTHORIZED', 'Admin session required');
  }
  const input: OnboardCompanyFounderRequest = validate(onboardCompanyFounderSchema, req);
  const company = await onboardCompanyFounderService(input.body);
  sendSuccess(
    res,
    'Company and founder created. Founder can log in on the employer portal with this email.',
    company,
    201,
  );
};

export const listHrInvites = async (req: Request, res: Response) => {
  const input: ListHrInvitesRequest = validate(listHrInvitesSchema, req);
  const result = await listHrInvitesService(input.query);
  sendSuccess(res, 'HR invites', result.items, 200, result.meta);
};

export const revokeHrInvite = async (req: Request, res: Response) => {
  const input: RevokeHrInviteRequest = validate(revokeHrInviteSchema, req);
  const invite = await revokeHrInviteService(input.params.inviteId);
  sendSuccess(res, 'Invite revoked', invite);
};

export const listAdminCompanies = async (req: Request, res: Response) => {
  const input: ListAdminCompaniesRequest = validate(listAdminCompaniesSchema, req);
  const result = await listAdminCompaniesService(input.query);
  sendSuccess(res, 'Companies', result.items, 200, result.meta);
};

export const getAdminCompany = async (req: Request, res: Response) => {
  const input: AdminCompanyIdRequest = validate(adminCompanyIdSchema, req);
  const company = await getAdminCompanyService(input.params.companyId);
  sendSuccess(res, 'Company', company);
};

export const patchCompanyStatus = async (req: Request, res: Response) => {
  const input: PatchCompanyStatusRequest = validate(patchCompanyStatusSchema, req);
  const company = await patchCompanyStatusService(input.params.companyId, input.body.status);
  sendSuccess(res, 'Company status updated', company);
};
