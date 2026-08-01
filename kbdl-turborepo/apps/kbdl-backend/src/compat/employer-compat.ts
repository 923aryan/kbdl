import { PlatformType, prisma, User, Company, CompanyMember } from '@repo/db/server';
import { SYSTEM_ROLE_CODES } from '@repo/db/server';
import { AppError } from '../utils/api-error';
import { ROLES } from '../utils/constants';

/** API-facing Employer shape (pre-Company refactor). */
export type EmployerDto = {
  id: string;
  company_name: string;
  email: string | null;
  phone_no: string | null;
  company_address: string | null;
  gst_number: string | null;
  is_verified: boolean;
  subscription_tier: string | null;
  preferences: unknown;
  role: 'employer';
  refresh_token?: string | null;
  created_at?: Date;
  updated_at?: Date;
};

export type CompanyForEmployerDto = Pick<
  Company,
  | 'id'
  | 'company_name'
  | 'company_address'
  | 'gst_number'
  | 'is_verified'
  | 'preferences'
  | 'created_at'
  | 'updated_at'
>;

export type OwnerUserForEmployerDto = Pick<User, 'email' | 'phone_no' | 'refresh_token'>;

type PreferencesWithTier = {
  subscription_tier?: string | null;
} & Record<string, unknown>;

/** Filter: company owner membership via CompanyRole.code */
export const ownerMemberWhere = {
  platform_type: PlatformType.EMPLOYER,
  role: { code: SYSTEM_ROLE_CODES.OWNER },
} as const;

export const toApiCreatedBy = (
  platform: PlatformType | string,
): typeof ROLES.EMPLOYER | typeof ROLES.USER => {
  if (platform === PlatformType.EMPLOYER || platform === 'EMPLOYER' || platform === ROLES.EMPLOYER) {
    return ROLES.EMPLOYER;
  }
  return ROLES.USER;
};

export const toPlatformType = (
  apiRole: typeof ROLES.EMPLOYER | typeof ROLES.USER | string,
): PlatformType => {
  if (apiRole === ROLES.EMPLOYER || apiRole === 'EMPLOYER') {
    return PlatformType.EMPLOYER;
  }
  return PlatformType.EMPLOYEE;
};

export const getSubscriptionTier = (preferences: unknown): string | null => {
  if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) {
    return null;
  }
  const tier = (preferences as PreferencesWithTier).subscription_tier;
  return typeof tier === 'string' ? tier : null;
};

export const toEmployerDto = (
  company: CompanyForEmployerDto,
  ownerUser?: OwnerUserForEmployerDto | null,
): EmployerDto => ({
  id: company.id,
  company_name: company.company_name,
  email: ownerUser?.email ?? null,
  phone_no: ownerUser?.phone_no ?? null,
  company_address: company.company_address,
  gst_number: company.gst_number,
  is_verified: company.is_verified,
  subscription_tier: getSubscriptionTier(company.preferences),
  preferences: company.preferences,
  role: 'employer',
  refresh_token: ownerUser?.refresh_token ?? null,
  created_at: company.created_at,
  updated_at: company.updated_at,
});

const ownerMemberInclude = {
  where: ownerMemberWhere,
  take: 1,
  include: {
    user: true,
    role: true,
  },
} as const;

export const getOwnerMember = async (
  companyId: string,
): Promise<(CompanyMember & { user: User }) | null> => {
  return prisma.companyMember.findFirst({
    where: {
      company_id: companyId,
      ...ownerMemberWhere,
    },
    include: { user: true, role: true },
  });
};

export const findEmployerById = async (companyId: string): Promise<EmployerDto | null> => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      members: ownerMemberInclude,
    },
  });

  if (!company) return null;

  const owner = company.members[0]?.user ?? null;
  return toEmployerDto(company, owner);
};

export const findEmployerByEmail = async (email: string): Promise<EmployerDto | null> => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      companyMemberships: {
        where: {
          platform_type: PlatformType.EMPLOYER,
        },
        include: { company: true },
        take: 1,
      },
    },
  });

  const membership = user?.companyMemberships[0];
  if (!user || !membership) return null;

  return toEmployerDto(membership.company, user);
};

export const findEmployerByPhone = async (phone: string): Promise<EmployerDto | null> => {
  const user = await prisma.user.findUnique({
    where: { phone_no: phone },
    include: {
      companyMemberships: {
        where: {
          platform_type: PlatformType.EMPLOYER,
        },
        include: { company: true },
        take: 1,
      },
    },
  });

  const membership = user?.companyMemberships[0];
  if (!user || !membership) return null;

  return toEmployerDto(membership.company, user);
};

/** Resolve company + owner user from JWT company id (API employer.id). */
export const ensureEmployerContext = async (
  companyId: string,
): Promise<{ company: Company; ownerUser: User; employer: EmployerDto }> => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      members: ownerMemberInclude,
    },
  });

  if (!company) {
    throw new AppError(404, 'EMPLOYER_NOT_FOUND', 'Employer not found');
  }

  const ownerUser = company.members[0]?.user;
  if (!ownerUser) {
    throw new AppError(404, 'EMPLOYER_NOT_FOUND', 'Employer owner not found');
  }

  return {
    company,
    ownerUser,
    employer: toEmployerDto(company, ownerUser),
  };
};

/** Map DB shift/job row fields to API employer_id + created_by strings. */
export const withApiEmployerFields = <
  T extends { company_id: string; created_by?: PlatformType | string },
>(
  row: T,
): T & { employer_id: string; created_by?: string } => {
  const { company_id, created_by, ...rest } = row as T & {
    company_id: string;
    created_by?: PlatformType | string;
  };
  return {
    ...(rest as T),
    company_id,
    employer_id: company_id,
    ...(created_by !== undefined ? { created_by: toApiCreatedBy(created_by) } : {}),
  };
};

export const mapEmploymentToApi = <
  T extends {
    company_id: string;
    company?: CompanyForEmployerDto & { members?: Array<{ user: OwnerUserForEmployerDto }> };
  },
>(
  employment: T,
): Omit<T, 'company'> & {
  employer_id: string;
  employer?: EmployerDto;
} => {
  const { company, company_id, ...rest } = employment;
  const owner = company?.members?.[0]?.user;
  return {
    ...(rest as Omit<T, 'company'>),
    company_id,
    employer_id: company_id,
    ...(company ? { employer: toEmployerDto(company, owner) } : {}),
  };
};

/** Prisma include snippet: company with owner member+user for Employer DTO mapping. */
export const companyAsEmployerInclude = {
  select: {
    id: true,
    company_name: true,
    company_address: true,
    gst_number: true,
    is_verified: true,
    preferences: true,
    created_at: true,
    updated_at: true,
    members: {
      where: ownerMemberWhere,
      take: 1,
      select: {
        user: {
          select: {
            email: true,
            phone_no: true,
            refresh_token: true,
          },
        },
      },
    },
  },
} as const;

export const toEmployerDtoFromIncludedCompany = (
  company:
    | {
        id: string;
        company_name: string;
        company_address: string | null;
        gst_number: string | null;
        is_verified: boolean;
        preferences: unknown;
        created_at?: Date;
        updated_at?: Date;
        members?: Array<{ user: OwnerUserForEmployerDto }>;
      }
    | null
    | undefined,
): EmployerDto | null => {
  if (!company) return null;
  return toEmployerDto(company as CompanyForEmployerDto, company.members?.[0]?.user);
};
