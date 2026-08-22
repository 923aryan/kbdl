import { prisma } from '@repo/db/server';
import type {
  EmployeePunchAttendanceBody,
  EmployeePunchCompany,
  EmployeePunchContext,
  EmployeePunchResult,
} from '@repo/types';
import { env } from '@repo/validator/server';
import { AppError } from '../utils/api-error';
import { employmentForAppUserWhere } from './workforce-person-service';
import {
  attendanceStatusLabel,
  computeWorkedMinutes,
  formatDisplayDate,
  formatShiftTimeRange,
  formatTimeOnly,
  parseAttendanceDate,
  todayInIndia,
} from './attendance-utils';

export const EMPLOYEE_PUNCH_RADIUS_METERS = 50;
const MAX_GPS_ACCURACY_METERS = 50;
const BLOCKED_STATUSES = new Set(['leave', 'holiday']);

type PunchGeoRow = { distance_m: number | null; has_location: boolean };

function clockLabel(value: Date | null): string | null {
  if (!value) return null;
  return value.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

async function listPunchCompanies(userId: string): Promise<EmployeePunchCompany[]> {
  const employments = await prisma.employeeEmployment.findMany({
    where: {
      ...employmentForAppUserWhere(userId),
      is_active: true,
    },
    orderBy: { joined_at: 'desc' },
    select: {
      id: true,
      company_id: true,
      company: { select: { company_name: true } },
      company_member: { select: { id: true, is_active: true } },
      hr_profile: {
        select: {
          branch_location: true,
          branch: { select: { id: true, name: true } },
        },
      },
    },
  });

  const withMember = employments.filter((row) => row.company_member?.is_active && row.company_member.id);
  const branchIds = withMember
    .map((row) => row.hr_profile?.branch?.id)
    .filter((id): id is string => Boolean(id));

  const located = new Set<string>();
  if (branchIds.length > 0) {
    const geoRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `
      SELECT cb.id::text AS id
      FROM company_branches cb
      WHERE cb.id = ANY($1::uuid[])
        AND (
          cb.location IS NOT NULL
          OR EXISTS (
            SELECT 1 FROM companies c
            WHERE c.id = cb.company_id AND c.company_location IS NOT NULL
          )
        )
      `,
      branchIds,
    );
    for (const row of geoRows) located.add(row.id);
  }

  const companyIdsWithoutBranch = withMember
    .filter((row) => !row.hr_profile?.branch?.id)
    .map((row) => row.company_id);
  const companyLocated = new Set<string>();
  if (companyIdsWithoutBranch.length > 0) {
    const geoRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `
      SELECT id::text AS id
      FROM companies
      WHERE id = ANY($1::uuid[])
        AND company_location IS NOT NULL
      `,
      companyIdsWithoutBranch,
    );
    for (const row of geoRows) companyLocated.add(row.id);
  }

  return withMember.map((row) => {
    const branchId = row.hr_profile?.branch?.id;
    return {
      employment_id: row.id,
      company_member_id: row.company_member!.id,
      company_id: row.company_id,
      company_name: row.company.company_name,
      branch_name: row.hr_profile?.branch?.name ?? row.hr_profile?.branch_location ?? null,
      branch_has_location: branchId ? located.has(branchId) : companyLocated.has(row.company_id),
    };
  });
}

async function loadAssignedShift(companyMemberId: string, date: Date) {
  const row = await prisma.employeeShift.findFirst({
    where: {
      company_member_id: companyMemberId,
      effective_from: { lte: date },
      OR: [{ effective_to: null }, { effective_to: { gte: date } }],
    },
    orderBy: { effective_from: 'desc' },
    select: {
      work_shift: {
        select: {
          id: true,
          name: true,
          start_time: true,
          end_time: true,
          break_minutes: true,
        },
      },
    },
  });
  return row?.work_shift ?? null;
}

function resolveMode(input: {
  blockedReason: string | null;
  needsCompanyPick: boolean;
  checkIn: Date | null;
  checkOut: Date | null;
  source: string | null;
}): EmployeePunchContext['mode'] {
  if (input.needsCompanyPick) return 'select_company';
  if (input.blockedReason) return 'blocked';
  if (input.source === 'app' && input.checkIn && input.checkOut) return 'completed';
  if (input.checkIn && !input.checkOut) return 'punch_out';
  if (input.source === 'app' && input.checkIn) return 'punch_out';
  if (!input.checkIn) return 'punch_in';
  if (input.source === 'hr_manual' && input.checkIn && input.checkOut) return 'punch_in';
  return 'punch_out';
}

async function measurePunchDistance(
  companyId: string,
  branchId: string | null,
  longitude: number,
  latitude: number,
): Promise<PunchGeoRow> {
  const rows = await prisma.$queryRawUnsafe<PunchGeoRow[]>(
    `
    SELECT
      CASE
        WHEN COALESCE(cb.location, c.company_location) IS NULL THEN NULL
        ELSE ST_Distance(
          COALESCE(cb.location, c.company_location),
          ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography
        )
      END AS distance_m,
      COALESCE(cb.location, c.company_location) IS NOT NULL AS has_location
    FROM companies c
    LEFT JOIN company_branches cb
      ON cb.id = $2::uuid
    WHERE c.id = $1::uuid
    LIMIT 1
    `,
    companyId,
    branchId,
    longitude,
    latitude,
  );

  return rows[0] ?? { distance_m: null, has_location: false };
}

async function buildContext(
  userId: string,
  employmentId?: string,
): Promise<EmployeePunchContext> {
  const companies = await listPunchCompanies(userId);
  const dateStr = todayInIndia();
  const date = parseAttendanceDate(dateStr);

  let selected: EmployeePunchCompany | null = null;
  if (employmentId) {
    selected = companies.find((row) => row.employment_id === employmentId) ?? null;
    if (!selected) {
      throw new AppError(
        404,
        'EMPLOYMENT_NOT_FOUND',
        'Active employment not found for attendance.',
      );
    }
  } else if (companies.length === 1) {
    selected = companies[0]!;
  }

  const emptyAttendance = {
    id: null,
    status: null,
    status_label: null,
    source: null,
    check_in: null,
    check_out: null,
  };

  if (!selected) {
    return {
      companies,
      selected: null,
      date: dateStr,
      date_label: formatDisplayDate(date),
      shift: null,
      attendance: emptyAttendance,
      mode: companies.length === 0 ? 'blocked' : 'select_company',
      punch_blocked_reason:
        companies.length === 0 ? 'No active company found. Accept an onboarding request first.' : null,
      radius_meters: EMPLOYEE_PUNCH_RADIUS_METERS,
    };
  }

  const shift = await loadAssignedShift(selected.company_member_id, date);
  const attendance = shift
    ? await prisma.attendance.findUnique({
        where: {
          company_member_id_date_work_shift_id: {
            company_member_id: selected.company_member_id,
            date,
            work_shift_id: shift.id,
          },
        },
      })
    : null;

  let blockedReason: string | null = null;
  if (!shift) {
    blockedReason = 'No work shift assigned. Ask HR to assign a shift.';
  } else if (!selected.branch_has_location) {
    blockedReason = 'Branch location is not set. Ask HR to add branch coordinates.';
  } else if (attendance && BLOCKED_STATUSES.has(attendance.status)) {
    blockedReason =
      attendance.status === 'leave'
        ? 'Leave is marked by HR for today.'
        : 'Holiday is marked by HR for today.';
  }

  const mode = resolveMode({
    blockedReason,
    needsCompanyPick: false,
    checkIn: attendance?.check_in ?? null,
    checkOut: attendance?.check_out ?? null,
    source: attendance?.source ?? null,
  });

  return {
    companies,
    selected,
    date: dateStr,
    date_label: formatDisplayDate(date),
    shift: shift
      ? {
          id: shift.id,
          name: shift.name,
          start_time: formatTimeOnly(shift.start_time),
          end_time: formatTimeOnly(shift.end_time),
          label: formatShiftTimeRange(shift.start_time, shift.end_time),
        }
      : null,
    attendance: {
      id: attendance?.id ?? null,
      status: attendance?.status ?? null,
      status_label: attendance ? attendanceStatusLabel(attendance.status) : null,
      source: attendance?.source ?? null,
      check_in: clockLabel(attendance?.check_in ?? null),
      check_out: clockLabel(attendance?.check_out ?? null),
    },
    mode,
    punch_blocked_reason: blockedReason,
    radius_meters: EMPLOYEE_PUNCH_RADIUS_METERS,
  };
}

export const getEmployeeAttendanceContextService = async (
  userId: string,
  employmentId?: string,
): Promise<EmployeePunchContext> => {
  return buildContext(userId, employmentId);
};

export const employeePunchAttendanceService = async (
  userId: string,
  body: EmployeePunchAttendanceBody,
): Promise<EmployeePunchResult> => {
  if (
    !env.DISABLE_PUNCH_RADIUS_CHECK &&
    body.accuracy !== undefined &&
    body.accuracy > MAX_GPS_ACCURACY_METERS
  ) {
    throw new AppError(
      400,
      'GPS_ACCURACY_TOO_LOW',
      'GPS accuracy is too weak. Move outdoors and try again.',
    );
  }

  const context = await buildContext(userId, body.employment_id);
  if (!context.selected) {
    throw new AppError(400, 'COMPANY_REQUIRED', 'Select a company before punching.');
  }
  if (context.punch_blocked_reason) {
    throw new AppError(403, 'PUNCH_BLOCKED', context.punch_blocked_reason);
  }
  if (!context.shift) {
    throw new AppError(400, 'NO_ASSIGNED_SHIFT', 'Employee has no assigned work shift.');
  }

  if (body.action === 'in' && context.mode !== 'punch_in') {
    throw new AppError(409, 'PUNCH_IN_NOT_ALLOWED', 'Punch in is not available for today.');
  }
  if (body.action === 'out' && context.mode !== 'punch_out') {
    throw new AppError(409, 'PUNCH_OUT_NOT_ALLOWED', 'Punch out is not available until you punch in.');
  }

  const employment = await prisma.employeeEmployment.findFirst({
    where: { id: body.employment_id, ...employmentForAppUserWhere(userId), is_active: true },
    select: {
      company_id: true,
      hr_profile: { select: { branch_id: true } },
    },
  });
  if (!employment) {
    throw new AppError(404, 'EMPLOYMENT_NOT_FOUND', 'Active employment not found.');
  }

  const geo = await measurePunchDistance(
    employment.company_id,
    employment.hr_profile?.branch_id ?? null,
    body.longitude,
    body.latitude,
  );
  if (!geo.has_location || geo.distance_m === null) {
    throw new AppError(
      400,
      'BRANCH_LOCATION_NOT_SET',
      'Branch location is not set. Ask HR to add branch coordinates.',
    );
  }

  const distanceMeters = Math.round(Number(geo.distance_m) * 10) / 10;
  if (!env.DISABLE_PUNCH_RADIUS_CHECK && distanceMeters > EMPLOYEE_PUNCH_RADIUS_METERS) {
    throw new AppError(
      403,
      'OUTSIDE_PUNCH_RADIUS',
      `You must be within ${EMPLOYEE_PUNCH_RADIUS_METERS}m of your branch to punch. Current distance: ${distanceMeters}m.`,
      { distance_meters: distanceMeters, radius_meters: EMPLOYEE_PUNCH_RADIUS_METERS },
    );
  }

  const date = parseAttendanceDate(context.date);
  const now = new Date();
  const memberId = context.selected.company_member_id;
  const shiftId = context.shift.id;
  const existing = context.attendance.id
    ? await prisma.attendance.findUnique({ where: { id: context.attendance.id } })
    : await prisma.attendance.findUnique({
        where: {
          company_member_id_date_work_shift_id: {
            company_member_id: memberId,
            date,
            work_shift_id: shiftId,
          },
        },
      });

  const shift = await prisma.workShift.findFirst({
    where: { id: shiftId, company_id: employment.company_id },
    select: { break_minutes: true },
  });
  const lunchBreak = existing?.lunch_break_minutes ?? shift?.break_minutes ?? 0;
  const teaBreak = existing?.tea_break_minutes ?? 0;

  if (body.action === 'in') {
    await prisma.attendance.upsert({
      where: {
        company_member_id_date_work_shift_id: {
          company_member_id: memberId,
          date,
          work_shift_id: shiftId,
        },
      },
      create: {
        company_id: employment.company_id,
        company_member_id: memberId,
        work_shift_id: shiftId,
        date,
        check_in: now,
        check_out: null,
        lunch_break_minutes: lunchBreak,
        tea_break_minutes: teaBreak,
        worked_minutes: 0,
        ot_minutes: 0,
        is_ot: false,
        shift_mismatch: false,
        status: 'present',
        source: 'app',
        punch_in_lat: body.latitude,
        punch_in_lng: body.longitude,
        punch_in_accuracy: body.accuracy ?? null,
      },
      update: {
        check_in: now,
        check_out: null,
        worked_minutes: 0,
        status: 'present',
        source: 'app',
        punch_in_lat: body.latitude,
        punch_in_lng: body.longitude,
        punch_in_accuracy: body.accuracy ?? null,
        punch_out_lat: null,
        punch_out_lng: null,
        punch_out_accuracy: null,
      },
    });
  } else {
    const checkIn = existing?.check_in;
    if (!checkIn) {
      throw new AppError(409, 'PUNCH_OUT_NOT_ALLOWED', 'Punch in first.');
    }
    if (now <= checkIn) {
      throw new AppError(400, 'INVALID_PUNCH_OUT', 'Punch out time must be after punch in.');
    }
    const workedMinutes = computeWorkedMinutes(checkIn, now, lunchBreak, teaBreak);
    await prisma.attendance.update({
      where: { id: existing!.id },
      data: {
        check_out: now,
        worked_minutes: workedMinutes,
        status: 'present',
        source: 'app',
        punch_out_lat: body.latitude,
        punch_out_lng: body.longitude,
        punch_out_accuracy: body.accuracy ?? null,
      },
    });
  }

  const next = await buildContext(userId, body.employment_id);
  return { ...next, distance_meters: distanceMeters };
};
