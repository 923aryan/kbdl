import { prisma } from '@repo/db/server';
import type { CompanyCatalogView } from '@repo/types';
import { AppError } from '../utils/api-error';
import { formatTimeOnly } from './attendance-utils';
import { ensureCompanyOrgCatalog } from './company-setup-service';

function clockFromHm(value: string) {
  const [hours, minutes] = value.split(':').map((part) => Number(part));
  return new Date(Date.UTC(1970, 0, 1, hours || 0, minutes || 0, 0, 0));
}

async function setPoint(table: 'companies' | 'company_branches', id: string, lng: number, lat: number) {
  const sql =
    table === 'companies'
      ? `
        UPDATE companies
        SET company_location = ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography
        WHERE id = $1::uuid
      `
      : `
        UPDATE company_branches
        SET location = ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography
        WHERE id = $1::uuid
      `;
  await prisma.$executeRawUnsafe(sql, id, lng, lat);
}

export async function getCompanyCatalogService(companyId: string): Promise<CompanyCatalogView> {
  await ensureCompanyOrgCatalog(companyId);

  const [departments, designations, shifts, holidays, hqRows, branchRows] = await Promise.all([
    prisma.department.findMany({
      where: { company_id: companyId },
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
    }),
    prisma.companyDesignation.findMany({
      where: { company_id: companyId },
      select: { id: true, name: true, description: true, is_active: true },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
    }),
    prisma.workShift.findMany({
      where: { company_id: companyId },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
    }),
    prisma.companyHoliday.findMany({
      where: { company_id: companyId },
      orderBy: { date: 'asc' },
    }),
    prisma.$queryRawUnsafe<Array<{ latitude: number | null; longitude: number | null }>>(
      `
      SELECT
        ST_Y(company_location::geometry) AS latitude,
        ST_X(company_location::geometry) AS longitude
      FROM companies
      WHERE id = $1::uuid
      `,
      companyId,
    ),
    prisma.$queryRawUnsafe<
      Array<{ id: string; name: string; latitude: number | null; longitude: number | null }>
    >(
      `
      SELECT
        id::text AS id,
        name,
        ST_Y(location::geometry) AS latitude,
        ST_X(location::geometry) AS longitude
      FROM company_branches
      WHERE company_id = $1::uuid
      ORDER BY name ASC
      `,
      companyId,
    ),
  ]);

  const hq = hqRows[0];
  return {
    hq:
      hq?.latitude != null && hq?.longitude != null
        ? { latitude: hq.latitude, longitude: hq.longitude }
        : null,
    departments,
    designations,
    branches: branchRows.map((row) => ({
      id: row.id,
      name: row.name,
      latitude: row.latitude,
      longitude: row.longitude,
      has_location: row.latitude != null && row.longitude != null,
    })),
    work_shifts: shifts.map((row) => ({
      id: row.id,
      name: row.name,
      start_time: formatTimeOnly(row.start_time),
      end_time: formatTimeOnly(row.end_time),
      break_minutes: row.break_minutes,
      is_active: row.is_active,
    })),
    holidays: holidays.map((row) => ({
      id: row.id,
      date: row.date.toISOString().slice(0, 10),
      name: row.name,
      is_optional: row.is_optional,
    })),
  };
}

export async function createCompanyDepartmentService(
  companyId: string,
  body: { name: string; description?: string },
) {
  const name = body.name.trim();
  const duplicate = await prisma.department.findFirst({
    where: { company_id: companyId, name: { equals: name, mode: 'insensitive' } },
  });
  if (duplicate) throw new AppError(409, 'DEPARTMENT_EXISTS', 'This department already exists');
  await prisma.department.create({
    data: { company_id: companyId, name, description: body.description?.trim() || null },
  });
  return getCompanyCatalogService(companyId);
}

export async function createCompanyDesignationService(
  companyId: string,
  body: { name: string; description?: string },
) {
  const name = body.name.trim();
  const duplicate = await prisma.companyDesignation.findFirst({
    where: { company_id: companyId, name: { equals: name, mode: 'insensitive' } },
  });
  if (duplicate) throw new AppError(409, 'DESIGNATION_EXISTS', 'This job title already exists');
  const maxSort = await prisma.companyDesignation.aggregate({
    where: { company_id: companyId },
    _max: { sort_order: true },
  });
  await prisma.companyDesignation.create({
    data: {
      company_id: companyId,
      name,
      description: body.description?.trim() || null,
      sort_order: (maxSort._max.sort_order ?? 0) + 10,
    },
  });
  return getCompanyCatalogService(companyId);
}

export async function createCompanyBranchService(
  companyId: string,
  body: { name: string; latitude: number; longitude: number },
) {
  const name = body.name.trim();
  const duplicate = await prisma.companyBranch.findFirst({
    where: { company_id: companyId, name: { equals: name, mode: 'insensitive' } },
  });
  if (duplicate) throw new AppError(409, 'BRANCH_EXISTS', 'This branch already exists');
  const created = await prisma.companyBranch.create({
    data: { company_id: companyId, name },
    select: { id: true },
  });
  await setPoint('company_branches', created.id, body.longitude, body.latitude);
  const hq = await prisma.$queryRawUnsafe<Array<{ has_location: boolean }>>(
    `SELECT company_location IS NOT NULL AS has_location FROM companies WHERE id = $1::uuid`,
    companyId,
  );
  if (!hq[0]?.has_location) {
    await setPoint('companies', companyId, body.longitude, body.latitude);
  }
  return getCompanyCatalogService(companyId);
}

export async function saveCompanyHqLocationService(
  companyId: string,
  body: { latitude: number; longitude: number },
) {
  await setPoint('companies', companyId, body.longitude, body.latitude);
  return getCompanyCatalogService(companyId);
}

export async function createCompanyWorkShiftService(
  companyId: string,
  body: { name: string; start_time: string; end_time: string; break_minutes?: number },
) {
  const name = body.name.trim();
  const duplicate = await prisma.workShift.findFirst({
    where: { company_id: companyId, name: { equals: name, mode: 'insensitive' } },
  });
  if (duplicate) throw new AppError(409, 'SHIFT_EXISTS', 'This work shift already exists');
  const maxSort = await prisma.workShift.aggregate({
    where: { company_id: companyId },
    _max: { sort_order: true },
  });
  await prisma.workShift.create({
    data: {
      company_id: companyId,
      name,
      start_time: clockFromHm(body.start_time),
      end_time: clockFromHm(body.end_time),
      break_minutes: body.break_minutes ?? 60,
      sort_order: (maxSort._max.sort_order ?? 0) + 10,
    },
  });
  return getCompanyCatalogService(companyId);
}

export async function createCompanyHolidayService(
  companyId: string,
  body: { date: string; name: string; is_optional?: boolean },
) {
  const date = new Date(`${body.date}T00:00:00.000Z`);
  const duplicate = await prisma.companyHoliday.findFirst({
    where: { company_id: companyId, date },
  });
  if (duplicate) throw new AppError(409, 'HOLIDAY_EXISTS', 'A holiday already exists on this date');
  await prisma.companyHoliday.create({
    data: {
      company_id: companyId,
      date,
      name: body.name.trim(),
      is_optional: body.is_optional ?? false,
    },
  });
  return getCompanyCatalogService(companyId);
}
