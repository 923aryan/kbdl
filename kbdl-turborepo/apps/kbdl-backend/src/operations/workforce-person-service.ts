import { Prisma, prisma } from '@repo/db/server';

type Tx = Prisma.TransactionClient;

export const employmentForAppUserWhere = (userId: string) => ({
  workforce_person: { linked_user_id: userId },
});

/** When a worker has multiple active employments, pick the most recently joined one. */
export const primaryActiveEmploymentOrderBy = { joined_at: 'desc' as const };

export type PrimaryActiveEmploymentRow = {
  id: string;
  company_id: string;
  workforce_person_id: string;
  is_active: boolean;
  joined_at: Date;
};

/**
 * App user → workforce person (via linked_user_id) → one active employment row.
 * Use for shift-swap, find-job, and any flow that needs a single "current" company for now.
 */
export async function findPrimaryActiveEmploymentForAppUser(
  userId: string,
  tx?: Tx,
): Promise<PrimaryActiveEmploymentRow | null> {
  const client = tx ?? prisma;
  return client.employeeEmployment.findFirst({
    where: {
      ...employmentForAppUserWhere(userId),
      is_active: true,
    },
    orderBy: primaryActiveEmploymentOrderBy,
    select: {
      id: true,
      company_id: true,
      workforce_person_id: true,
      is_active: true,
      joined_at: true,
    },
  });
}

/** Roster check: active employment at a specific company (employer-initiated flows). */
export async function findActiveEmploymentForAppUserAtCompany(
  userId: string,
  companyId: string,
  tx?: Tx,
): Promise<{ id: string; company_id: string } | null> {
  const client = tx ?? prisma;
  return client.employeeEmployment.findFirst({
    where: {
      ...employmentForAppUserWhere(userId),
      company_id: companyId,
      is_active: true,
    },
    orderBy: primaryActiveEmploymentOrderBy,
    select: { id: true, company_id: true },
  });
}

export async function findWorkforcePersonByPhoneOrKarigari(
  phone_no?: string,
  karigari_id?: string,
  tx?: Tx,
) {
  if (!phone_no && !karigari_id) return null;
  const client = tx ?? prisma;
  return client.workforcePerson.findFirst({
    where: {
      OR: [
        ...(phone_no ? [{ phone_no }] : []),
        ...(karigari_id ? [{ karigari_id }] : []),
      ],
    },
  });
}

export async function findOrCreateWorkforcePerson(
  params: { phone_no: string; karigari_id?: string | null },
  tx?: Tx,
) {
  const client = tx ?? prisma;
  const existing = await findWorkforcePersonByPhoneOrKarigari(
    params.phone_no,
    params.karigari_id ?? undefined,
    client,
  );

  if (existing) {
    if (params.karigari_id && !existing.karigari_id) {
      return client.workforcePerson.update({
        where: { id: existing.id },
        data: { karigari_id: params.karigari_id },
      });
    }
    return existing;
  }

  return client.workforcePerson.create({
    data: {
      phone_no: params.phone_no,
      karigari_id: params.karigari_id ?? null,
    },
  });
}

/** Link HR workforce record to app user after OTP verify; sync org membership rows. */
export async function linkWorkforcePersonToUser(userId: string, phoneNo: string, tx?: Tx) {
  const client = tx ?? prisma;
  const person = await client.workforcePerson.findUnique({
    where: { phone_no: phoneNo },
  });

  if (!person) return null;

  if (person.linked_user_id && person.linked_user_id !== userId) {
    return person;
  }

  if (!person.linked_user_id) {
    await client.workforcePerson.update({
      where: { id: person.id },
      data: { linked_user_id: userId },
    });
  }

  const employments = await client.employeeEmployment.findMany({
    where: { workforce_person_id: person.id },
    select: { id: true },
  });

  if (employments.length > 0) {
    await client.companyMember.updateMany({
      where: {
        employment_id: { in: employments.map((row) => row.id) },
        user_id: null,
      },
      data: { user_id: userId },
    });
  }

  return client.workforcePerson.findUnique({
    where: { id: person.id },
  });
}

export async function resolveWorkforcePersonIdForUser(userId: string): Promise<string | null> {
  const person = await prisma.workforcePerson.findFirst({
    where: { linked_user_id: userId },
    select: { id: true },
  });
  return person?.id ?? null;
}
