import { Prisma } from '@repo/db/server';

type Tx = Prisma.TransactionClient;

/** Find or create a company branch by onboard name (coordinates filled later). */
export async function upsertCompanyBranchByName(
  tx: Tx,
  companyId: string,
  name: string | null | undefined,
): Promise<string | null> {
  const trimmed = name?.trim();
  if (!trimmed) return null;

  const existing = await tx.companyBranch.findFirst({
    where: { company_id: companyId, name: trimmed },
    select: { id: true },
  });
  if (existing) {
    await tx.$executeRawUnsafe(
      `
      UPDATE company_branches cb
      SET location = c.company_location
      FROM companies c
      WHERE cb.id = $1::uuid
        AND c.id = $2::uuid
        AND cb.location IS NULL
        AND c.company_location IS NOT NULL
      `,
      existing.id,
      companyId,
    );
    return existing.id;
  }

  const created = await tx.companyBranch.create({
    data: { company_id: companyId, name: trimmed },
    select: { id: true },
  });

  await tx.$executeRawUnsafe(
    `
    UPDATE company_branches cb
    SET location = c.company_location
    FROM companies c
    WHERE cb.id = $1::uuid
      AND c.id = $2::uuid
      AND cb.location IS NULL
      AND c.company_location IS NOT NULL
    `,
    created.id,
    companyId,
  );

  return created.id;
}
