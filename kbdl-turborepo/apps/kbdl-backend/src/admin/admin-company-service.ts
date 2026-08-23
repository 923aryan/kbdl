import { CompanyStatus, ensureDefaultCompanyRoles, PlatformType, prisma, SYSTEM_ROLE_CODES } from '@repo/db/server';
import type { AdminCompanyListItem, HrInviteView } from '@repo/types';
import { AppError } from '../utils/api-error';
import { statusToVerified } from '../auth/employer-session';
import { ensureCompanyOrgCatalog, seedCompanyDefaults } from '../operations/company-setup-service';

const INVITE_TTL_DAYS = 14;

export async function inviteHrService(args: {
  full_name: string;
  email: string;
  phone_no: string;
  company_id: string;
  invitedByAdminId?: string;
  invitedByUserId?: string;
}): Promise<HrInviteView> {
  const email = args.email.trim().toLowerCase();
  const company = await prisma.company.findUnique({
    where: { id: args.company_id },
    select: { id: true, company_name: true },
  });
  if (!company) throw new AppError(404, 'COMPANY_NOT_FOUND', 'Select an existing company');

  const existingMember = await prisma.user.findUnique({
    where: { email },
    include: {
      companyMemberships: {
        where: { platform_type: 'EMPLOYER', is_active: true },
        take: 1,
      },
    },
  });
  if (existingMember?.companyMemberships.length) {
    throw new AppError(409, 'EMAIL_IN_USE', 'This email already belongs to a company account');
  }

  const phoneTaken = await prisma.user.findUnique({ where: { phone_no: args.phone_no } });
  if (phoneTaken && phoneTaken.email !== email) {
    throw new AppError(409, 'PHONE_IN_USE', 'This phone number is already registered');
  }

  const openInvite = await prisma.hrInvite.findFirst({
    where: { email, status: { in: ['pending', 'accepted'] } },
  });
  if (openInvite?.status === 'accepted' && openInvite.company_id) {
    throw new AppError(409, 'INVITE_EXISTS', 'This HR already onboarded a company');
  }
  if (openInvite?.status === 'pending' && openInvite.expires_at > new Date()) {
    throw new AppError(409, 'INVITE_EXISTS', 'An active invite already exists for this email');
  }

  if (openInvite) {
    await prisma.hrInvite.update({
      where: { id: openInvite.id },
      data: { status: 'revoked' },
    });
  }

  const invite = await prisma.hrInvite.create({
    data: {
      full_name: args.full_name.trim(),
      email,
      phone_no: args.phone_no,
      company: { connect: { id: company.id } },
      expires_at: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
      status: 'pending',
      ...(args.invitedByAdminId
        ? { invited_by: { connect: { id: args.invitedByAdminId } } }
        : {}),
      ...(args.invitedByUserId
        ? { invited_by_user: { connect: { id: args.invitedByUserId } } }
        : {}),
    },
    include: { company: { select: { company_name: true } } },
  });

  return toInviteView(invite);
}

export async function onboardCompanyFounderService(args: {
  company_name: string;
  company_address?: string;
  state?: string;
  founder_name: string;
  founder_email: string;
  founder_phone: string;
}): Promise<AdminCompanyListItem> {
  const email = args.founder_email.trim().toLowerCase();
  const phone = args.founder_phone;

  const emailTaken = await prisma.user.findUnique({ where: { email } });
  if (emailTaken) {
    throw new AppError(409, 'EMAIL_IN_USE', 'This email already belongs to a user');
  }
  const phoneTaken = await prisma.user.findUnique({ where: { phone_no: phone } });
  if (phoneTaken) {
    throw new AppError(409, 'PHONE_IN_USE', 'This phone number is already registered');
  }

  const companyId = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        company_name: args.company_name.trim(),
        company_address: args.company_address?.trim() || null,
        state: args.state?.trim() || null,
        status: 'onboarding',
        is_verified: false,
      },
    });

    const roleIds = await ensureDefaultCompanyRoles(company.id, tx);
    await seedCompanyDefaults(company.id, tx as unknown as typeof prisma);

    const user = await tx.user.create({
      data: {
        name: args.founder_name.trim(),
        email,
        phone_no: phone,
      },
    });

    await tx.companyMember.create({
      data: {
        user_id: user.id,
        company_id: company.id,
        platform_type: PlatformType.EMPLOYER,
        role_id: roleIds[SYSTEM_ROLE_CODES.OWNER]!,
        is_active: true,
      },
    });

    return company.id;
  });

  return getAdminCompanyService(companyId);
}

export async function listHrInvitesService(query: {
  status?: string;
  search?: string;
  page: number;
  limit: number;
  companyId?: string;
}): Promise<{ items: HrInviteView[]; meta: { page: number; limit: number; total: number } }> {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const where = {
    ...(query.companyId ? { company_id: query.companyId } : {}),
    ...(query.status ? { status: query.status as never } : {}),
    ...(query.search
      ? {
          OR: [
            { email: { contains: query.search, mode: 'insensitive' as const } },
            { full_name: { contains: query.search, mode: 'insensitive' as const } },
            { phone_no: { contains: query.search } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.hrInvite.count({ where }),
    prisma.hrInvite.findMany({
      where,
      include: { company: { select: { company_name: true } } },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    items: rows.map(toInviteView),
    meta: { page, limit, total },
  };
}

export async function revokeHrInviteService(inviteId: string): Promise<HrInviteView> {
  const invite = await prisma.hrInvite.findUnique({
    where: { id: inviteId },
    include: { company: { select: { company_name: true } } },
  });
  if (!invite) throw new AppError(404, 'INVITE_NOT_FOUND', 'Invite not found');
  if (invite.status !== 'pending') {
    throw new AppError(400, 'INVITE_NOT_PENDING', 'Only pending invites can be revoked');
  }
  const updated = await prisma.hrInvite.update({
    where: { id: inviteId },
    data: { status: 'revoked' },
    include: { company: { select: { company_name: true } } },
  });
  return toInviteView(updated);
}

export async function listAdminCompaniesService(query: {
  status?: string;
  search?: string;
  page: number;
  limit: number;
}): Promise<{ items: AdminCompanyListItem[]; meta: { page: number; limit: number; total: number; pages: number } }> {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const where = {
    ...(query.status ? { status: query.status as CompanyStatus } : {}),
    ...(query.search
      ? {
          OR: [
            { company_name: { contains: query.search, mode: 'insensitive' as const } },
            { gst_number: { contains: query.search, mode: 'insensitive' as const } },
            { state: { contains: query.search, mode: 'insensitive' as const } },
            {
              members: {
                some: {
                  platform_type: 'EMPLOYER' as const,
                  user: {
                    OR: [
                      { email: { contains: query.search, mode: 'insensitive' as const } },
                      { name: { contains: query.search, mode: 'insensitive' as const } },
                    ],
                  },
                },
              },
            },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.company.count({ where }),
    prisma.company.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { employments: true } },
        members: {
          where: { platform_type: 'EMPLOYER', is_active: true },
          include: { user: { select: { name: true, email: true, phone_no: true } }, role: true },
        },
      },
    }),
  ]);

  return {
    items: rows.map((row) => toCompanyListItem(row)),
    meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  };
}

export async function getAdminCompanyService(companyId: string): Promise<AdminCompanyListItem> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      _count: { select: { employments: true } },
      members: {
        where: { platform_type: 'EMPLOYER', is_active: true },
        include: { user: { select: { name: true, email: true, phone_no: true } }, role: true },
      },
    },
  });
  if (!company) throw new AppError(404, 'COMPANY_NOT_FOUND', 'Company not found');
  return toCompanyListItem(company);
}

function assertAdminStatusTransition(from: CompanyStatus, to: CompanyStatus) {
  if (from === to) return;

  if (to === 'active' && from !== 'pending_review' && from !== 'suspended') {
    throw new AppError(
      409,
      'REVIEW_REQUIRED',
      'Company owner must submit for review before you can set Active. Wait until status is pending review.',
    );
  }

  if (to === 'pending_review') {
    throw new AppError(
      409,
      'OWNER_MUST_SUBMIT',
      'Pending review is set when the company owner or HR clicks Submit for review in the employer app.',
    );
  }

  if (from === 'onboarding' && to !== 'rejected') {
    throw new AppError(
      409,
      'REVIEW_REQUIRED',
      'This company is still onboarding. The owner has not submitted for review yet.',
    );
  }
}

export async function patchCompanyStatusService(
  companyId: string,
  status: CompanyStatus,
): Promise<AdminCompanyListItem> {
  const existing = await prisma.company.findUnique({ where: { id: companyId } });
  if (!existing) throw new AppError(404, 'COMPANY_NOT_FOUND', 'Company not found');
  assertAdminStatusTransition(existing.status, status);

  await prisma.company.update({
    where: { id: companyId },
    data: {
      status,
      is_verified: statusToVerified(status),
    },
  });
  if (status === 'active') {
    await ensureCompanyOrgCatalog(companyId);
  }

  return getAdminCompanyService(companyId);
}

function toCompanyListItem(row: {
  id: string;
  company_name: string;
  status: string;
  is_verified: boolean;
  gst_number: string | null;
  state: string | null;
  created_at: Date;
  _count: { employments: number };
  members: Array<{
    role: { code: string };
    user: { name: string | null; email: string | null; phone_no: string } | null;
  }>;
}): AdminCompanyListItem {
  const founder = row.members.find((m) => m.role.code === 'OWNER')?.user;
  const hr = row.members.find((m) => m.role.code === 'HR')?.user;
  return {
    id: row.id,
    company_name: row.company_name,
    status: row.status,
    is_verified: row.is_verified,
    gst_number: row.gst_number,
    state: row.state,
    founder_name: founder?.name ?? null,
    founder_email: founder?.email ?? null,
    hr_name: hr?.name ?? null,
    hr_email: hr?.email ?? null,
    hr_phone: hr?.phone_no ?? null,
    employee_count: row._count.employments,
    created_at: row.created_at.toISOString(),
  };
}

function toInviteView(invite: {
  id: string;
  full_name: string;
  email: string;
  phone_no: string;
  status: string;
  expires_at: Date;
  accepted_at: Date | null;
  company_id: string | null;
  created_at: Date;
  company?: { company_name: string } | null;
}): HrInviteView {
  return {
    id: invite.id,
    full_name: invite.full_name,
    email: invite.email,
    phone_no: invite.phone_no,
    status: invite.status,
    expires_at: invite.expires_at.toISOString(),
    accepted_at: invite.accepted_at?.toISOString() ?? null,
    company_id: invite.company_id,
    company_name: invite.company?.company_name ?? null,
    created_at: invite.created_at.toISOString(),
  };
}
