import { prisma, SYSTEM_ROLE_CODES } from '@repo/db/server';
import type {
  CompanyLeaveCatalog,
  CompanyLeaveRequestView,
  CompanyLeaveTypeView,
  EmployeeLeaveOverview,
  LeavePolicyView,
} from '@repo/types';
import { AppError } from '../utils/api-error';

const DEFAULT_POLICY_LINES = [
  'Earn 1 leave every month',
  'Leave balance updates monthly',
  'Max 12 leaves carry forward from previous year',
  'Carry forward applies only at year-end',
  'Excess leaves may be encashed as per policy',
  'Employees cannot apply for leave. Reporting manager applies (HR approves). HR/employer can apply and auto-approve.',
];

const DEFAULT_TYPES = [
  { name: 'Casual Leave', days: 12, sort: 10 },
  { name: 'Sick Leave', days: 6, sort: 20 },
  { name: 'Earned Leave', days: 12, sort: 30 },
];

const HR_ROLE_CODES = [
  SYSTEM_ROLE_CODES.OWNER,
  SYSTEM_ROLE_CODES.ADMIN,
  SYSTEM_ROLE_CODES.HR,
] as const;

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;
}

function inclusiveDays(from: string, to: string): number {
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

function yearBounds(year: number) {
  return {
    fromDate: new Date(Date.UTC(year, 0, 1)),
    toDate: new Date(Date.UTC(year, 11, 31)),
  };
}

function statusLabel(status: string) {
  if (status === 'pending') return 'Pending HR';
  if (status === 'approved') return 'Approved';
  return 'Rejected';
}

function formatApplied(d: Date) {
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function memberName(member: {
  user?: { name: string | null } | null;
  employment?: { hr_profile?: { full_name: string | null } | null } | null;
}) {
  return member.employment?.hr_profile?.full_name || member.user?.name || 'Staff';
}

function mapPolicy(policy: {
  accrue_per_month: unknown;
  annual_quota: unknown;
  max_carry_forward: number;
  carry_forward_at_year_end: boolean;
  encash_excess: boolean;
  policy_lines: unknown;
}): LeavePolicyView {
  const lines = Array.isArray(policy.policy_lines)
    ? (policy.policy_lines as string[])
    : DEFAULT_POLICY_LINES;
  return {
    accrue_per_month: num(policy.accrue_per_month),
    annual_quota: num(policy.annual_quota),
    max_carry_forward: policy.max_carry_forward,
    carry_forward_at_year_end: policy.carry_forward_at_year_end,
    encash_excess: policy.encash_excess,
    lines,
  };
}

function mapLeaveType(type: {
  id: string;
  name: string;
  days_per_year: unknown;
  is_paid: boolean;
  is_active: boolean;
  sort_order: number;
}): CompanyLeaveTypeView {
  return {
    id: type.id,
    name: type.name,
    days_per_year: num(type.days_per_year),
    is_paid: type.is_paid,
    is_active: type.is_active,
    sort_order: type.sort_order,
  };
}

function appliedByLabel(
  kind: 'hr' | 'manager',
  appliedBy: Parameters<typeof memberName>[0] | null,
) {
  const who = appliedBy ? ` (${memberName(appliedBy)})` : '';
  return kind === 'hr' ? `HR / Employer${who}` : `Reporting manager${who}`;
}

async function ensureLeaveSetup(companyId: string) {
  const policy = await prisma.companyLeavePolicy.upsert({
    where: { company_id: companyId },
    update: {},
    create: {
      company_id: companyId,
      accrue_per_month: 1,
      annual_quota: 12,
      max_carry_forward: 12,
      carry_forward_at_year_end: true,
      encash_excess: true,
      policy_lines: DEFAULT_POLICY_LINES,
    },
  });

  const existing = await prisma.companyLeaveType.findMany({
    where: { company_id: companyId },
    select: { id: true, name: true },
  });
  if (existing.length === 0) {
    await prisma.companyLeaveType.createMany({
      data: DEFAULT_TYPES.map((t) => ({
        company_id: companyId,
        name: t.name,
        days_per_year: t.days,
        sort_order: t.sort,
      })),
    });
  }

  const types = await prisma.companyLeaveType.findMany({
    where: { company_id: companyId },
    orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
  });

  return { policy, types };
}

function activeTypes<T extends { is_active: boolean }>(types: T[]) {
  return types.filter((t) => t.is_active);
}

export async function getCompanyLeaveCatalogService(
  companyId: string,
  includeInactive = false,
): Promise<CompanyLeaveCatalog> {
  const { policy, types } = await ensureLeaveSetup(companyId);
  const visible = includeInactive ? types : activeTypes(types);
  return {
    policy: mapPolicy(policy),
    types: visible.map(mapLeaveType),
  };
}

export async function createCompanyLeaveTypeService(
  companyId: string,
  body: { name: string; days_per_year: number; is_paid?: boolean; sort_order?: number },
): Promise<CompanyLeaveCatalog> {
  await ensureLeaveSetup(companyId);
  const name = body.name.trim();
  const duplicate = await prisma.companyLeaveType.findFirst({
    where: { company_id: companyId, name: { equals: name, mode: 'insensitive' } },
    select: { id: true },
  });
  if (duplicate) {
    throw new AppError(409, 'LEAVE_TYPE_EXISTS', 'This leave type already exists for the company');
  }

  const maxSort = await prisma.companyLeaveType.aggregate({
    where: { company_id: companyId },
    _max: { sort_order: true },
  });

  await prisma.companyLeaveType.create({
    data: {
      company_id: companyId,
      name,
      days_per_year: body.days_per_year,
      is_paid: body.is_paid ?? true,
      sort_order: body.sort_order ?? (maxSort._max.sort_order ?? 0) + 10,
    },
  });

  return getCompanyLeaveCatalogService(companyId, true);
}

export async function updateCompanyLeaveTypeService(
  companyId: string,
  typeId: string,
  body: {
    name?: string;
    days_per_year?: number;
    is_paid?: boolean;
    is_active?: boolean;
    sort_order?: number;
  },
): Promise<CompanyLeaveCatalog> {
  const existing = await prisma.companyLeaveType.findFirst({
    where: { id: typeId, company_id: companyId },
    select: { id: true },
  });
  if (!existing) {
    throw new AppError(404, 'LEAVE_TYPE_NOT_FOUND', 'Leave type not found for this company');
  }

  if (body.name) {
    const duplicate = await prisma.companyLeaveType.findFirst({
      where: {
        company_id: companyId,
        id: { not: typeId },
        name: { equals: body.name.trim(), mode: 'insensitive' },
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new AppError(409, 'LEAVE_TYPE_EXISTS', 'This leave type already exists for the company');
    }
  }

  await prisma.companyLeaveType.update({
    where: { id: typeId },
    data: {
      ...(body.name ? { name: body.name.trim() } : {}),
      ...(body.days_per_year !== undefined ? { days_per_year: body.days_per_year } : {}),
      ...(body.is_paid !== undefined ? { is_paid: body.is_paid } : {}),
      ...(body.is_active !== undefined ? { is_active: body.is_active } : {}),
      ...(body.sort_order !== undefined ? { sort_order: body.sort_order } : {}),
    },
  });

  return getCompanyLeaveCatalogService(companyId, true);
}

export async function updateCompanyLeavePolicyService(
  companyId: string,
  body: {
    accrue_per_month?: number;
    annual_quota?: number;
    max_carry_forward?: number;
    carry_forward_at_year_end?: boolean;
    encash_excess?: boolean;
    lines?: string[];
  },
): Promise<CompanyLeaveCatalog> {
  await ensureLeaveSetup(companyId);
  await prisma.companyLeavePolicy.update({
    where: { company_id: companyId },
    data: {
      ...(body.accrue_per_month !== undefined ? { accrue_per_month: body.accrue_per_month } : {}),
      ...(body.annual_quota !== undefined ? { annual_quota: body.annual_quota } : {}),
      ...(body.max_carry_forward !== undefined ? { max_carry_forward: body.max_carry_forward } : {}),
      ...(body.carry_forward_at_year_end !== undefined
        ? { carry_forward_at_year_end: body.carry_forward_at_year_end }
        : {}),
      ...(body.encash_excess !== undefined ? { encash_excess: body.encash_excess } : {}),
      ...(body.lines ? { policy_lines: body.lines } : {}),
    },
  });
  return getCompanyLeaveCatalogService(companyId, true);
}

export async function getCompanyLeaveRequestsService(
  companyId: string,
  query: {
    search?: string;
    status?: 'all' | 'pending' | 'approved' | 'rejected';
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  },
): Promise<{ items: CompanyLeaveRequestView[]; meta: Record<string, number> }> {
  await ensureLeaveSetup(companyId);
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const skip = (page - 1) * limit;
  const status = query.status && query.status !== 'all' ? query.status : undefined;
  const search = query.search?.trim();

  const where = {
    company_id: companyId,
    ...(status ? { status } : {}),
    ...(query.from && query.to
      ? {
          from_date: { lte: new Date(`${query.to}T00:00:00.000Z`) },
          to_date: { gte: new Date(`${query.from}T00:00:00.000Z`) },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { reason: { contains: search, mode: 'insensitive' as const } },
            { leave_type: { name: { contains: search, mode: 'insensitive' as const } } },
            { employment: { employee_no: { contains: search, mode: 'insensitive' as const } } },
            {
              employment: {
                hr_profile: { full_name: { contains: search, mode: 'insensitive' as const } },
              },
            },
            {
              employment: {
                workforce_person: { phone_no: { contains: search } },
              },
            },
            {
              employment: {
                workforce_person: {
                  linked_user: { name: { contains: search, mode: 'insensitive' as const } },
                },
              },
            },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      include: {
        leave_type: { select: { name: true } },
        employment: {
          select: {
            id: true,
            employee_no: true,
            hr_profile: { select: { full_name: true } },
            workforce_person: {
              select: { linked_user: { select: { name: true } } },
            },
          },
        },
        applied_by: {
          select: {
            user: { select: { name: true } },
            employment: { select: { hr_profile: { select: { full_name: true } } } },
          },
        },
      },
      orderBy: { applied_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.leaveRequest.count({ where }),
  ]);

  const employmentIds = [...new Set(rows.map((r) => r.employment_id))];
  const members = employmentIds.length
    ? await prisma.companyMember.findMany({
        where: { company_id: companyId, employment_id: { in: employmentIds } },
        select: {
          employment_id: true,
          manager: {
            select: {
              user: { select: { name: true } },
              employment: { select: { hr_profile: { select: { full_name: true } } } },
            },
          },
        },
      })
    : [];
  const supervisorByEmployment = new Map(
    members
      .filter((m): m is typeof m & { employment_id: string } => Boolean(m.employment_id))
      .map((m) => [m.employment_id, m.manager ? memberName(m.manager) : null]),
  );

  return {
    items: rows.map((row) => ({
      id: row.id,
      employment_id: row.employment_id,
      employee_name:
        row.employment.hr_profile?.full_name ||
        row.employment.workforce_person.linked_user?.name ||
        'Employee',
      employee_no: row.employment.employee_no,
      supervisor_name: supervisorByEmployment.get(row.employment_id) ?? null,
      leave_type: row.leave_type.name,
      from: isoDay(row.from_date),
      to: isoDay(row.to_date),
      days: num(row.days),
      reason: row.reason,
      status: row.status,
      status_label: statusLabel(row.status),
      applied_on: formatApplied(row.applied_at),
      applied_by_kind: row.applied_by_kind,
      applied_by_label: appliedByLabel(row.applied_by_kind, row.applied_by),
    })),
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
  };
}

async function findHrActor(companyId: string) {
  return prisma.companyMember.findFirst({
    where: {
      company_id: companyId,
      is_active: true,
      role: { code: { in: [...HR_ROLE_CODES] } },
    },
    orderBy: { created_at: 'asc' },
    select: {
      id: true,
      user: { select: { name: true } },
    },
  });
}

async function loadEmployeeMember(companyId: string, employmentId: string) {
  return prisma.companyMember.findFirst({
    where: { company_id: companyId, employment_id: employmentId },
    select: {
      id: true,
      manager_company_member_id: true,
      manager: {
        select: {
          id: true,
          user: { select: { name: true } },
          employment: { select: { hr_profile: { select: { full_name: true } } } },
        },
      },
    },
  });
}

export async function getEmployeeLeaveService(
  companyId: string,
  employmentId: string,
  range?: { from?: string; to?: string },
): Promise<EmployeeLeaveOverview> {
  const employment = await prisma.employeeEmployment.findFirst({
    where: { id: employmentId, company_id: companyId },
    select: { id: true },
  });
  if (!employment) {
    throw new AppError(404, 'EMPLOYEE_NOT_FOUND', 'Employee not found for this company');
  }

  const { policy, types } = await ensureLeaveSetup(companyId);
  const catalogTypes = activeTypes(types);
  const employeeMember = await loadEmployeeMember(companyId, employmentId);
  const year = new Date().getUTCFullYear();
  const bounds = yearBounds(year);

  const requests = await prisma.leaveRequest.findMany({
    where: {
      company_id: companyId,
      employment_id: employmentId,
      ...(range?.from && range?.to
        ? {
            from_date: { lte: new Date(`${range.to}T00:00:00.000Z`) },
            to_date: { gte: new Date(`${range.from}T00:00:00.000Z`) },
          }
        : {}),
    },
    include: {
      leave_type: { select: { name: true } },
      applied_by: {
        select: {
          user: { select: { name: true } },
          employment: { select: { hr_profile: { select: { full_name: true } } } },
        },
      },
    },
    orderBy: { applied_at: 'desc' },
  });

  const yearRequests = await prisma.leaveRequest.findMany({
    where: {
      company_id: companyId,
      employment_id: employmentId,
      from_date: { lte: bounds.toDate },
      to_date: { gte: bounds.fromDate },
    },
    include: { leave_type: { select: { id: true, name: true } } },
  });

  const used = yearRequests
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + num(r.days), 0);
  const pending = yearRequests
    .filter((r) => r.status === 'pending')
    .reduce((sum, r) => sum + num(r.days), 0);

  const quota = num(policy.annual_quota);
  const carry = Math.min(num(policy.max_carry_forward), 0);
  const unused = Math.max(quota - used, 0);
  const available = Math.max(quota + carry - used, 0);

  const type_balances = catalogTypes.map((type) => {
    const rows = yearRequests.filter((r) => r.leave_type_id === type.id);
    const typeUsed = rows.filter((r) => r.status === 'approved').reduce((s, r) => s + num(r.days), 0);
    const typePending = rows.filter((r) => r.status === 'pending').reduce((s, r) => s + num(r.days), 0);
    const earned = num(type.days_per_year);
    const current = Math.max(earned - typeUsed, 0);
    return {
      leave_type: type.name,
      earned,
      used: typeUsed,
      pending: typePending,
      current_year_balance: current,
      carry_forward: 0,
      total_balance: current,
    };
  });

  const mappedPolicy = mapPolicy(policy);

  const manager = employeeMember?.manager
    ? { id: employeeMember.manager.id, name: memberName(employeeMember.manager) }
    : null;

  return {
    employment_id: employmentId,
    policy: mappedPolicy,
    balance: {
      available,
      unused_this_year: unused,
      pending,
      used,
      carry_forward: carry,
      as_on: isoDay(new Date()),
      year_label: `01 Jan ${year} - 31 Dec ${year}`,
    },
    type_balances,
    requests: requests.map((row) => ({
      id: row.id,
      leave_type: row.leave_type.name,
      from: isoDay(row.from_date),
      to: isoDay(row.to_date),
      days: num(row.days),
      reason: row.reason,
      status: row.status,
      status_label: statusLabel(row.status),
      applied_on: formatApplied(row.applied_at),
      applied_by_kind: row.applied_by_kind,
      applied_by_label: appliedByLabel(row.applied_by_kind, row.applied_by),
    })),
    leave_types: catalogTypes.map((t) => ({ id: t.id, name: t.name })),
    reporting_manager: manager,
    permissions: {
      can_apply_as_hr: true,
      can_apply_as_manager: Boolean(manager),
      can_approve: true,
    },
  };
}

export async function createEmployeeLeaveService(
  companyId: string,
  employmentId: string,
  body: {
    leave_type_id?: string;
    leave_type?: string;
    from: string;
    to: string;
    reason: string;
    apply_as?: 'hr' | 'manager';
  },
) {
  const employment = await prisma.employeeEmployment.findFirst({
    where: { id: employmentId, company_id: companyId, is_active: true },
    select: { id: true },
  });
  if (!employment) {
    throw new AppError(404, 'EMPLOYEE_NOT_FOUND', 'Active employee not found for this company');
  }

  const { types } = await ensureLeaveSetup(companyId);
  const catalogTypes = activeTypes(types);
  const leaveType = body.leave_type_id
    ? catalogTypes.find((t) => t.id === body.leave_type_id)
    : catalogTypes.find((t) => t.name.toLowerCase() === body.leave_type?.toLowerCase());

  if (!leaveType) {
    throw new AppError(400, 'INVALID_LEAVE_TYPE', 'Leave type is not valid for this company');
  }

  const days = inclusiveDays(body.from, body.to);
  if (days < 1) {
    throw new AppError(400, 'INVALID_DATES', 'Leave period must include at least one day');
  }

  const applyAs = body.apply_as ?? 'hr';
  const employeeMember = await loadEmployeeMember(companyId, employmentId);
  const hrActor = await findHrActor(companyId);

  let appliedByKind: 'hr' | 'manager' = 'hr';
  let appliedById: string | null = hrActor?.id ?? null;
  let status: 'pending' | 'approved' = 'approved';
  let decidedAt: Date | null = new Date();
  let decidedById: string | null = hrActor?.id ?? null;

  if (applyAs === 'manager') {
    const managerId = employeeMember?.manager_company_member_id;
    if (!managerId) {
      throw new AppError(
        400,
        'NO_REPORTING_MANAGER',
        'This employee has no reporting manager. Assign a manager, or apply as HR to auto-approve.',
      );
    }
    appliedByKind = 'manager';
    appliedById = managerId;
    status = 'pending';
    decidedAt = null;
    decidedById = null;
  }

  await prisma.leaveRequest.create({
    data: {
      company_id: companyId,
      employment_id: employmentId,
      leave_type_id: leaveType.id,
      from_date: new Date(`${body.from}T00:00:00.000Z`),
      to_date: new Date(`${body.to}T00:00:00.000Z`),
      days,
      reason: body.reason,
      applied_by_kind: appliedByKind,
      applied_by_company_member_id: appliedById,
      decided_by_company_member_id: decidedById,
      status,
      decided_at: decidedAt,
    },
  });

  return getEmployeeLeaveService(companyId, employmentId);
}

export async function updateLeaveRequestService(
  companyId: string,
  requestId: string,
  status: 'approved' | 'rejected',
) {
  const existing = await prisma.leaveRequest.findFirst({
    where: { id: requestId, company_id: companyId },
    select: { id: true, employment_id: true, status: true, applied_by_kind: true },
  });
  if (!existing) {
    throw new AppError(404, 'LEAVE_NOT_FOUND', 'Leave request not found');
  }
  if (existing.status !== 'pending') {
    throw new AppError(409, 'LEAVE_ALREADY_DECIDED', 'This leave request has already been decided');
  }
  if (existing.applied_by_kind !== 'manager') {
    throw new AppError(400, 'HR_LEAVE_LOCKED', 'HR-applied leave is already auto-approved');
  }

  const hrActor = await findHrActor(companyId);

  await prisma.leaveRequest.update({
    where: { id: requestId },
    data: {
      status,
      decided_at: new Date(),
      decided_by_company_member_id: hrActor?.id ?? null,
    },
  });

  return getEmployeeLeaveService(companyId, existing.employment_id);
}
