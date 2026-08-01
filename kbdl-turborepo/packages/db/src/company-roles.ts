import { prisma } from './prisma';

/** Stable role codes used by backend lookups (never rename these in application code). */
export const SYSTEM_ROLE_CODES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  HR: 'HR',
  RECRUITER: 'RECRUITER',
  MANAGER: 'MANAGER',
  TEAM_LEAD: 'TEAM_LEAD',
  EMPLOYEE: 'EMPLOYEE',
  FINANCE: 'FINANCE',
} as const;

export type SystemRoleCode = (typeof SYSTEM_ROLE_CODES)[keyof typeof SYSTEM_ROLE_CODES];

export const DEFAULT_COMPANY_ROLES: Array<{
  code: SystemRoleCode;
  name: string;
  description: string;
  sort_order: number;
  is_system: boolean;
}> = [
  {
    code: SYSTEM_ROLE_CODES.OWNER,
    name: 'Owner',
    description: 'Full company ownership',
    sort_order: 10,
    is_system: true,
  },
  {
    code: SYSTEM_ROLE_CODES.ADMIN,
    name: 'Admin',
    description: 'Company administrator',
    sort_order: 20,
    is_system: true,
  },
  {
    code: SYSTEM_ROLE_CODES.HR,
    name: 'HR',
    description: 'Human resources',
    sort_order: 30,
    is_system: true,
  },
  {
    code: SYSTEM_ROLE_CODES.RECRUITER,
    name: 'Recruiter',
    description: 'Hiring and ATS',
    sort_order: 40,
    is_system: true,
  },
  {
    code: SYSTEM_ROLE_CODES.MANAGER,
    name: 'Manager',
    description: 'Department / people manager',
    sort_order: 50,
    is_system: true,
  },
  {
    code: SYSTEM_ROLE_CODES.TEAM_LEAD,
    name: 'Team Lead',
    description: 'Team leadership',
    sort_order: 60,
    is_system: true,
  },
  {
    code: SYSTEM_ROLE_CODES.EMPLOYEE,
    name: 'Employee',
    description: 'Standard employee',
    sort_order: 70,
    is_system: true,
  },
  {
    code: SYSTEM_ROLE_CODES.FINANCE,
    name: 'Finance',
    description: 'Billing and finance',
    sort_order: 80,
    is_system: true,
  },
];

type RoleClient = {
  companyRole: {
    findMany: (args: any) => Promise<Array<{ id: string; code: string }>>;
    create: (args: any) => Promise<{ id: string; code: string }>;
  };
};

/** Create default per-company roles. Returns map code → role id. */
export async function ensureDefaultCompanyRoles(
  companyId: string,
  client: RoleClient = prisma,
): Promise<Record<string, string>> {
  const existing = await client.companyRole.findMany({
    where: { company_id: companyId },
    select: { id: true, code: true },
  });

  const byCode: Record<string, string> = {};
  for (const row of existing) {
    byCode[row.code] = row.id;
  }

  for (const def of DEFAULT_COMPANY_ROLES) {
    if (byCode[def.code]) continue;

    const created = await client.companyRole.create({
      data: {
        company_id: companyId,
        code: def.code,
        name: def.name,
        description: def.description,
        is_system: def.is_system,
        is_active: true,
        sort_order: def.sort_order,
        permissions: {},
      },
    });
    byCode[def.code] = created.id;
  }

  return byCode;
}

export const ownerRoleFilter = {
  role: { code: SYSTEM_ROLE_CODES.OWNER },
  platform_type: 'EMPLOYER' as const,
};
