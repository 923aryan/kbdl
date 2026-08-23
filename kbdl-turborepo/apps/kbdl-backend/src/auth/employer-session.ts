import { Company, CompanyStatus, prisma, User } from '@repo/db/server';
import { EmployerDto, toEmployerDto } from '../compat/employer-compat';
import { AppError } from '../utils/api-error';
import { ROLES } from '../utils/constants';
import { JwtPayload } from '../utils/jwt-payload';
import { generateAccessToken, generateRefreshToken } from './jwt-tokens';

export async function resolveEmployerStaff(emp: {
  id?: string;
  email?: string;
  user_id?: string;
  role_code?: string;
  setup_pending?: boolean;
}): Promise<{
  id: string;
  userId: string;
  roleCode: string;
}> {
  if (!emp.id || emp.setup_pending) {
    throw new AppError(403, 'COMPANY_SETUP_REQUIRED', 'Save company details before inviting HR');
  }

  const member = await prisma.companyMember.findFirst({
    where: {
      company_id: emp.id,
      platform_type: 'EMPLOYER',
      is_active: true,
      ...(emp.user_id
        ? { user_id: emp.user_id }
        : emp.email
          ? { user: { email: emp.email } }
          : {}),
    },
    include: { role: true, user: { select: { id: true } } },
  });

  if (!member) {
    throw new AppError(403, 'FORBIDDEN', 'You are not an active member of this company');
  }

  return {
    id: emp.id,
    userId: member.user_id,
    roleCode: member.role.code,
  };
}

export function isCompanyOperational(status: string | undefined): boolean {
  return status === 'active';
}

export function setupPendingDto(user: Pick<User, 'email' | 'phone_no' | 'name'>): EmployerDto {
  return {
    id: '',
    company_name: '',
    email: user.email,
    phone_no: user.phone_no,
    company_address: null,
    gst_number: null,
    pan: null,
    state: null,
    epf_registration_no: null,
    esic_code: null,
    is_verified: false,
    status: 'onboarding',
    setup_pending: true,
    role_code: 'HR',
    preferences: {},
    role: 'employer',
    subscription_tier: null,
  };
}

export function buildEmployerJwt(args: {
  company: Pick<Company, 'id' | 'is_verified' | 'status'> | null;
  email: string;
  userId: string;
  roleCode: string;
  setupPending: boolean;
}): JwtPayload {
  return {
    role: ROLES.EMPLOYER,
    payload: {
      employer: {
        id: args.company?.id ?? '',
        email: args.email,
        is_verified: args.company?.is_verified ?? false,
        user_id: args.userId,
        role_code: args.roleCode,
        setup_pending: args.setupPending,
        status: args.company?.status ?? 'onboarding',
      },
    },
  };
}

export async function persistEmployerSession(args: {
  user: User;
  company: Company | null;
  roleCode: string;
  setupPending: boolean;
}): Promise<{ accessToken: string; refreshToken: string; employer: EmployerDto }> {
  const payload = buildEmployerJwt({
    company: args.company,
    email: args.user.email ?? '',
    userId: args.user.id,
    roleCode: args.roleCode,
    setupPending: args.setupPending,
  });
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  const updated = await prisma.user.update({
    where: { id: args.user.id },
    data: { refresh_token: refreshToken },
  });
  const employer = args.company
    ? toEmployerDto(args.company, updated, {
        setup_pending: args.setupPending,
        role_code: args.roleCode,
      })
    : setupPendingDto(updated);
  return { accessToken, refreshToken, employer };
}

export function statusToVerified(status: CompanyStatus | string): boolean {
  return status === 'active';
}
