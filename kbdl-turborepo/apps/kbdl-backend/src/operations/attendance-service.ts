import { AttendanceStatus, Prisma, prisma } from '@repo/db/server';
import {
  AttendanceRecordDto,
  AttendanceShiftRef,
  BulkMarkHolidayBody,
  BulkMarkHolidayResult,
  BulkMarkPresentBody,
  CompanyHolidayRef,
  DailyAttendanceResponse,
  DailyAttendanceSummary,
  GetDailyAttendanceQuery,
  UpdateAttendanceBody,
  UpsertAttendanceBody,
} from '@repo/types';
import { AppError } from '../utils/api-error';
import {
  attendanceStatusLabel,
  combineDateAndTime,
  computeWorkedMinutes,
  formatDisplayDate,
  formatMinutesAsHours,
  formatTimeLog,
  formatTimeOnly,
  parseAttendanceDate,
  shiftTemplateToRange,
} from './attendance-utils';

type ShiftRow = {
  id: string;
  name: string;
  start_time: Date;
  end_time: Date;
  break_minutes: number;
};

type MemberRow = {
  id: string;
  employment_id: string | null;
  employment: {
    employee_no: string | null;
    hr_profile: { full_name: string } | null;
    workforce_person: { phone_no: string };
  } | null;
  manager: { user: { name: string | null } | null } | null;
  employee_shifts: Array<{ work_shift: ShiftRow }>;
};

type AttendanceRow = {
  id: string;
  company_member_id: string;
  work_shift_id: string;
  date: Date;
  check_in: Date | null;
  check_out: Date | null;
  worked_minutes: number;
  ot_minutes: number;
  lunch_break_minutes: number;
  tea_break_minutes: number;
  is_ot: boolean;
  ot_reason: string | null;
  shift_mismatch: boolean;
  status: AttendanceStatus;
  source: string;
  notes: string | null;
  work_shift: ShiftRow;
};

function toShiftRef(shift: ShiftRow | null): AttendanceShiftRef | null {
  if (!shift) return null;
  return {
    id: shift.id,
    name: shift.name,
    start_time: formatTimeOnly(shift.start_time),
    end_time: formatTimeOnly(shift.end_time),
    break_minutes: shift.break_minutes,
  };
}

function memberShiftKey(memberId: string, shiftId: string) {
  return `${memberId}:${shiftId}`;
}

async function getAssignedShift(
  companyMemberId: string,
  date: Date,
): Promise<ShiftRow | null> {
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

function resolveCheckOut(
  dateStr: string,
  checkIn: Date,
  checkOutTime: string,
  checkInTime: string,
): Date {
  let checkOut = combineDateAndTime(dateStr, checkOutTime);
  if (checkOut <= checkIn) {
    checkOut = new Date(checkOut.getTime() + 24 * 60 * 60 * 1000);
  }
  if (checkOutTime <= checkInTime && checkOut <= checkIn) {
    checkOut = new Date(checkOut.getTime() + 24 * 60 * 60 * 1000);
  }
  return checkOut;
}

function mapAttendanceToDto(
  member: MemberRow,
  assignedShift: ShiftRow | null,
  attendance: AttendanceRow | null,
  dateStr: string,
  pendingShift?: ShiftRow | null,
): AttendanceRecordDto {
  const employeeName =
    member.employment?.hr_profile?.full_name ??
    member.employment?.workforce_person.phone_no ??
    'Unknown';

  if (!attendance) {
    const shift = pendingShift ?? assignedShift;
    return {
      id: '',
      row_key: `pending:${member.id}:${shift?.id ?? 'none'}`,
      company_member_id: member.id,
      employment_id: member.employment_id,
      employee_name: employeeName,
      employee_no: member.employment?.employee_no ?? null,
      supervisor_name: member.manager?.user?.name ?? null,
      date: dateStr,
      assigned_shift: toShiftRef(assignedShift),
      work_shift: toShiftRef(shift),
      check_in: null,
      check_out: null,
      lunch_break_minutes: 0,
      tea_break_minutes: 0,
      worked_minutes: 0,
      worked_hours_label: '-',
      ot_minutes: 0,
      overtime_label: '-',
      is_ot: false,
      ot_reason: null,
      shift_mismatch: false,
      status: 'pending',
      status_label: 'Pending',
      source: '',
      notes: null,
      time_log: '-',
    };
  }

  return {
    id: attendance.id,
    row_key: attendance.id,
    company_member_id: attendance.company_member_id,
    employment_id: member.employment_id,
    employee_name: employeeName,
    employee_no: member.employment?.employee_no ?? null,
    supervisor_name: member.manager?.user?.name ?? null,
    date: dateStr,
    assigned_shift: toShiftRef(assignedShift),
    work_shift: toShiftRef(attendance.work_shift),
    check_in: attendance.check_in?.toISOString() ?? null,
    check_out: attendance.check_out?.toISOString() ?? null,
    lunch_break_minutes: attendance.lunch_break_minutes,
    tea_break_minutes: attendance.tea_break_minutes,
    worked_minutes: attendance.worked_minutes,
    worked_hours_label: formatMinutesAsHours(attendance.worked_minutes),
    ot_minutes: attendance.ot_minutes,
    overtime_label: attendance.is_ot ? formatMinutesAsHours(attendance.ot_minutes) : '-',
    is_ot: attendance.is_ot,
    ot_reason: attendance.ot_reason,
    shift_mismatch: attendance.shift_mismatch,
    status: attendance.status,
    status_label: attendanceStatusLabel(attendance.status),
    source: attendance.source,
    notes: attendance.notes,
    time_log: formatTimeLog(attendance.check_in, attendance.check_out),
  };
}

function buildSummary(items: AttendanceRecordDto[]): DailyAttendanceSummary {
  const summary: DailyAttendanceSummary = {
    present: 0,
    absent: 0,
    half_day: 0,
    leave: 0,
    week_off: 0,
    holiday: 0,
    pending: 0,
    ot_count: 0,
    shift_mismatch_count: 0,
  };

  for (const item of items) {
    if (item.status === 'pending') {
      summary.pending += 1;
      continue;
    }
    if (item.status === 'present') summary.present += 1;
    else if (item.status === 'absent') summary.absent += 1;
    else if (item.status === 'half_day') summary.half_day += 1;
    else if (item.status === 'leave') summary.leave += 1;
    else if (item.status === 'week_off') summary.week_off += 1;
    else if (item.status === 'holiday') summary.holiday += 1;
    if (item.is_ot) summary.ot_count += 1;
    if (item.shift_mismatch) summary.shift_mismatch_count += 1;
  }

  return summary;
}

async function loadActiveMembers(companyId: string): Promise<MemberRow[]> {
  return prisma.companyMember.findMany({
    where: {
      company_id: companyId,
      is_active: true,
      employment_id: { not: null },
      employment: { is_active: true },
    },
    select: {
      id: true,
      employment_id: true,
      employment: {
        select: {
          employee_no: true,
          hr_profile: { select: { full_name: true } },
          workforce_person: { select: { phone_no: true } },
        },
      },
      manager: { select: { user: { select: { name: true } } } },
      employee_shifts: {
        where: { effective_to: null },
        orderBy: { effective_from: 'desc' },
        take: 1,
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
      },
    },
    orderBy: { created_at: 'asc' },
  });
}

function buildDailyItems(
  members: MemberRow[],
  attendances: AttendanceRow[],
  dateStr: string,
): AttendanceRecordDto[] {
  const byMember = new Map<string, AttendanceRow[]>();
  for (const row of attendances) {
    const list = byMember.get(row.company_member_id) ?? [];
    list.push(row);
    byMember.set(row.company_member_id, list);
  }

  const items: AttendanceRecordDto[] = [];

  for (const member of members) {
    const assignedShift = member.employee_shifts[0]?.work_shift ?? null;
    const memberRows = byMember.get(member.id) ?? [];

    for (const attendance of memberRows) {
      items.push(mapAttendanceToDto(member, assignedShift, attendance, dateStr));
    }

    // Pending only when nothing marked yet.
    // If another shift is already marked (e.g. General while assigned Evening),
    // that row is the day's attendance; a 2nd row = OT / extra shift via "+ Shift".
    if (memberRows.length > 0) {
      continue;
    }

    if (assignedShift) {
      items.push(mapAttendanceToDto(member, assignedShift, null, dateStr, assignedShift));
    }
  }

  return items.sort((a, b) => {
    const name = a.employee_name.localeCompare(b.employee_name);
    if (name !== 0) return name;
    return (a.work_shift?.name ?? '').localeCompare(b.work_shift?.name ?? '');
  });
}

export async function getDailyAttendanceService(
  companyId: string,
  query: GetDailyAttendanceQuery,
): Promise<{
  data: DailyAttendanceResponse;
  meta: Record<string, unknown> & {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    facets: { status: Record<string, number>; shift: Record<string, number> };
  };
}> {
  const date = parseAttendanceDate(query.date);
  const dateStr = query.date;
  const search = query.search?.trim().toLowerCase();
  const statusFilters = query.status?.map((s) => s.trim()).filter(Boolean) ?? [];
  const shiftFilters = query.shift?.map((s) => s.trim()).filter(Boolean) ?? [];

  const members = await loadActiveMembers(companyId);

  const [attendances, companyHoliday] = await Promise.all([
    prisma.attendance.findMany({
      where: { company_id: companyId, date },
      include: {
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
    }),
    prisma.companyHoliday.findUnique({
      where: { company_id_date: { company_id: companyId, date } },
      select: { date: true, name: true, is_optional: true },
    }),
  ]);

  let items = buildDailyItems(members, attendances as AttendanceRow[], dateStr);

  if (search) {
    items = items.filter((item) =>
      [item.employee_name, item.employee_no, item.supervisor_name, item.status_label, item.work_shift?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search),
    );
  }

  // Facets: same exclusion logic as employee list — apply other filters, skip own dimension
  const forStatusFacet = applyShiftFilter(items, shiftFilters);
  const forShiftFacet = applyStatusFilter(items, statusFilters);

  const facets = {
    status: countFacet(forStatusFacet, (item) => item.status_label),
    shift: countFacet(forShiftFacet, (item) => item.work_shift?.name ?? item.assigned_shift?.name ?? 'Unassigned'),
  };

  items = applyStatusFilter(items, statusFilters);
  items = applyShiftFilter(items, shiftFilters);

  if (query.pending_only) {
    items = items.filter((item) => item.status === 'pending');
  }

  const summary = buildSummary(items);
  const total = items.length;
  const page = query.page ?? 1;
  const limit = query.limit ?? 50;
  const skip = (page - 1) * limit;
  const pagedItems = items.slice(skip, skip + limit);

  return {
    data: {
      date: dateStr,
      items: pagedItems,
      summary,
      company_holiday: companyHoliday
        ? {
            date: dateStr,
            name: companyHoliday.name,
            is_optional: companyHoliday.is_optional,
          }
        : null,
    },
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1, facets },
  };
}

function applyStatusFilter(items: AttendanceRecordDto[], statuses: string[]) {
  if (!statuses.length) return items;
  const selected = new Set(statuses.map((s) => s.toLowerCase()));
  return items.filter(
    (item) =>
      selected.has(item.status_label.toLowerCase()) || selected.has(item.status.toLowerCase()),
  );
}

function applyShiftFilter(items: AttendanceRecordDto[], shifts: string[]) {
  if (!shifts.length) return items;
  const selected = new Set(shifts.map((s) => s.toLowerCase()));
  return items.filter((item) => {
    const name = (item.work_shift?.name ?? item.assigned_shift?.name ?? 'Unassigned').toLowerCase();
    return selected.has(name);
  });
}

function countFacet(
  items: AttendanceRecordDto[],
  keyFn: (item: AttendanceRecordDto) => string,
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const item of items) {
    const key = keyFn(item) || 'Unassigned';
    map[key] = (map[key] ?? 0) + 1;
  }
  return map;
}

async function assertMemberBelongsToCompany(companyId: string, companyMemberId: string) {
  const member = await prisma.companyMember.findFirst({
    where: { id: companyMemberId, company_id: companyId, is_active: true },
    select: { id: true },
  });
  if (!member) {
    throw new AppError(404, 'MEMBER_NOT_FOUND', 'Employee not found for this company');
  }
}

async function assertShiftBelongsToCompany(companyId: string, workShiftId: string) {
  const shift = await prisma.workShift.findFirst({
    where: { id: workShiftId, company_id: companyId, is_active: true },
    select: { id: true },
  });
  if (!shift) {
    throw new AppError(400, 'INVALID_WORK_SHIFT', 'work_shift_id is not valid for this company');
  }
}

async function loadShift(companyId: string, workShiftId: string): Promise<ShiftRow> {
  const shift = await prisma.workShift.findFirst({
    where: { id: workShiftId, company_id: companyId, is_active: true },
    select: {
      id: true,
      name: true,
      start_time: true,
      end_time: true,
      break_minutes: true,
    },
  });
  if (!shift) {
    throw new AppError(400, 'INVALID_WORK_SHIFT', 'work_shift_id is not valid for this company');
  }
  return shift;
}

async function buildPresentDefaults(
  companyId: string,
  companyMemberId: string,
  dateStr: string,
  workShiftId?: string,
) {
  const assignedShift = await getAssignedShift(companyMemberId, parseAttendanceDate(dateStr));
  const targetShiftId = workShiftId ?? assignedShift?.id;

  if (!targetShiftId) {
    throw new AppError(
      400,
      'NO_ASSIGNED_SHIFT',
      'Employee has no assigned work shift. Assign a shift before marking attendance.',
    );
  }

  const shift = workShiftId ? await loadShift(companyId, workShiftId) : assignedShift!;

  const { checkIn, checkOut } = shiftTemplateToRange(dateStr, shift.start_time, shift.end_time);

  const lunchBreak = shift.break_minutes;
  const teaBreak = 0;
  const workedMinutes = computeWorkedMinutes(checkIn, checkOut, lunchBreak, teaBreak);
  const shiftMismatch = assignedShift ? assignedShift.id !== shift.id : false;

  // Night / alternate shift on same day → HR can mark OT later; default no OT on bulk present
  const isAlternateShift = shiftMismatch;

  return {
    assignedShift,
    data: {
      company_id: companyId,
      company_member_id: companyMemberId,
      work_shift_id: shift.id,
      date: parseAttendanceDate(dateStr),
      check_in: checkIn,
      check_out: checkOut,
      lunch_break_minutes: lunchBreak,
      tea_break_minutes: teaBreak,
      worked_minutes: workedMinutes,
      ot_minutes: 0,
      is_ot: isAlternateShift,
      ot_reason: isAlternateShift ? 'Alternate shift' : null,
      shift_mismatch: shiftMismatch,
      status: 'present' as AttendanceStatus,
      source: 'hr_manual' as const,
      notes: null,
    },
  };
}

async function reloadAttendanceDto(
  companyId: string,
  attendanceId: string,
): Promise<AttendanceRecordDto> {
  const attendance = await prisma.attendance.findFirst({
    where: { id: attendanceId, company_id: companyId },
    include: {
      work_shift: {
        select: {
          id: true,
          name: true,
          start_time: true,
          end_time: true,
          break_minutes: true,
        },
      },
      company_member: {
        select: {
          id: true,
          employment_id: true,
          employment: {
            select: {
              employee_no: true,
              hr_profile: { select: { full_name: true } },
              workforce_person: { select: { phone_no: true } },
            },
          },
          manager: { select: { user: { select: { name: true } } } },
        },
      },
    },
  });

  if (!attendance) {
    throw new AppError(404, 'ATTENDANCE_NOT_FOUND', 'Attendance record not found');
  }

  const assignedShift = await getAssignedShift(
    attendance.company_member_id,
    attendance.date,
  );

  const member: MemberRow = {
    id: attendance.company_member.id,
    employment_id: attendance.company_member.employment_id,
    employment: attendance.company_member.employment,
    manager: attendance.company_member.manager,
    employee_shifts: assignedShift ? [{ work_shift: assignedShift }] : [],
  };

  return mapAttendanceToDto(
    member,
    assignedShift,
    attendance as AttendanceRow,
    attendance.date.toISOString().slice(0, 10),
  );
}

export async function bulkMarkPresentService(
  companyId: string,
  body: BulkMarkPresentBody,
): Promise<{ created: number; skipped: number; items: AttendanceRecordDto[] }> {
  const date = parseAttendanceDate(body.date);
  const dateStr = body.date;

  const members = await loadActiveMembers(companyId);
  const targetIds =
    body.company_member_ids?.length ?
      new Set(body.company_member_ids)
    : null;

  const existing = await prisma.attendance.findMany({
    where: {
      company_id: companyId,
      date,
      ...(targetIds ? { company_member_id: { in: [...targetIds] } } : {}),
    },
    select: { company_member_id: true, work_shift_id: true },
  });

  const existingKeys = new Set(
    existing.map((e) => memberShiftKey(e.company_member_id, e.work_shift_id)),
  );

  const createdItems: AttendanceRecordDto[] = [];
  let created = 0;
  let skipped = 0;

  for (const member of members) {
    if (targetIds && !targetIds.has(member.id)) continue;

    const assignedShift = member.employee_shifts[0]?.work_shift ?? null;
    if (!assignedShift) {
      skipped += 1;
      continue;
    }

    if (existingKeys.has(memberShiftKey(member.id, assignedShift.id))) {
      skipped += 1;
      continue;
    }

    try {
      const { data } = await buildPresentDefaults(companyId, member.id, dateStr, assignedShift.id);
      const row = await prisma.attendance.upsert({
        where: {
          company_member_id_date_work_shift_id: {
            company_member_id: member.id,
            date,
            work_shift_id: assignedShift.id,
          },
        },
        create: data,
        update: {
          status: 'present',
          check_in: data.check_in,
          check_out: data.check_out,
          lunch_break_minutes: data.lunch_break_minutes,
          tea_break_minutes: data.tea_break_minutes,
          worked_minutes: data.worked_minutes,
          source: 'hr_manual',
        },
      });
      created += 1;
      existingKeys.add(memberShiftKey(member.id, assignedShift.id));
      createdItems.push(await reloadAttendanceDto(companyId, row.id));
    } catch (error) {
      if (error instanceof AppError && error.code === 'NO_ASSIGNED_SHIFT') {
        skipped += 1;
        continue;
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Legacy unique (member+date) or race — skip instead of failing the whole bulk
        skipped += 1;
        continue;
      }
      throw error;
    }
  }

  return { created, skipped, items: createdItems };
}

const HOLIDAY_CLEAR_STATUSES = new Set(['absent', 'leave', 'week_off', 'holiday']);

function holidayAttendancePatch(holidayName: string) {
  return {
    status: 'holiday' as AttendanceStatus,
    check_in: null,
    check_out: null,
    lunch_break_minutes: 0,
    tea_break_minutes: 0,
    worked_minutes: 0,
    ot_minutes: 0,
    is_ot: false,
    ot_reason: null,
    shift_mismatch: false,
    source: 'hr_manual' as const,
    notes: holidayName,
  };
}

async function getFallbackCompanyShift(companyId: string): Promise<ShiftRow | null> {
  return prisma.workShift.findFirst({
    where: { company_id: companyId, is_active: true },
    orderBy: { created_at: 'asc' },
    select: {
      id: true,
      name: true,
      start_time: true,
      end_time: true,
      break_minutes: true,
    },
  });
}

/**
 * Declare a company holiday for a date and mark every active employee as holiday.
 * Covers: empty day, and late change after regular attendance was already marked.
 */
export async function bulkMarkHolidayService(
  companyId: string,
  body: BulkMarkHolidayBody,
): Promise<BulkMarkHolidayResult> {
  const date = parseAttendanceDate(body.date);
  const dateStr = body.date;
  const overrideExisting = body.override_existing !== false;
  const holidayName = body.name.trim();
  const isOptional = body.is_optional ?? false;

  const holidayRow = await prisma.companyHoliday.upsert({
    where: { company_id_date: { company_id: companyId, date } },
    create: {
      company_id: companyId,
      date,
      name: holidayName,
      is_optional: isOptional,
    },
    update: {
      name: holidayName,
      is_optional: isOptional,
    },
    select: { date: true, name: true, is_optional: true },
  });

  const holiday: CompanyHolidayRef = {
    date: dateStr,
    name: holidayRow.name,
    is_optional: holidayRow.is_optional,
  };

  const members = await loadActiveMembers(companyId);
  const fallbackShift = await getFallbackCompanyShift(companyId);
  const existing = await prisma.attendance.findMany({
    where: { company_id: companyId, date },
    select: {
      id: true,
      company_member_id: true,
      work_shift_id: true,
      status: true,
    },
  });

  const byMember = new Map<string, typeof existing>();
  for (const row of existing) {
    const list = byMember.get(row.company_member_id) ?? [];
    list.push(row);
    byMember.set(row.company_member_id, list);
  }

  const patch = holidayAttendancePatch(holidayName);
  const resultItems: AttendanceRecordDto[] = [];
  let created = 0;
  let overridden = 0;
  let skipped = 0;

  for (const member of members) {
    const memberRows = byMember.get(member.id) ?? [];
    const assignedShift = member.employee_shifts[0]?.work_shift ?? fallbackShift;

    if (memberRows.length > 0) {
      if (!overrideExisting) {
        // Keep prior marks; only calendar is updated for these people
        skipped += memberRows.filter((r) => r.status !== 'holiday').length;
        continue;
      }

      for (const row of memberRows) {
        if (row.status === 'holiday') {
          await prisma.attendance.update({
            where: { id: row.id },
            data: { notes: holidayName },
          });
          skipped += 1;
          continue;
        }

        await prisma.attendance.update({
          where: { id: row.id },
          data: patch,
        });
        overridden += 1;
        resultItems.push(await reloadAttendanceDto(companyId, row.id));
      }
      continue;
    }

    if (!assignedShift) {
      skipped += 1;
      continue;
    }

    try {
      const row = await prisma.attendance.create({
        data: {
          company_id: companyId,
          company_member_id: member.id,
          work_shift_id: assignedShift.id,
          date,
          ...patch,
        },
      });
      created += 1;
      resultItems.push(await reloadAttendanceDto(companyId, row.id));
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Race / legacy unique — force holiday on whatever exists for member+date
        const raced = await prisma.attendance.findMany({
          where: { company_id: companyId, company_member_id: member.id, date },
          select: { id: true, status: true },
        });
        if (!raced.length) {
          skipped += 1;
          continue;
        }
        for (const row of raced) {
          if (row.status === 'holiday' || !overrideExisting) {
            skipped += 1;
            continue;
          }
          await prisma.attendance.update({ where: { id: row.id }, data: patch });
          overridden += 1;
          resultItems.push(await reloadAttendanceDto(companyId, row.id));
        }
        continue;
      }
      throw error;
    }
  }

  return { holiday, created, overridden, skipped, items: resultItems };
}

async function applyAttendanceUpdate(
  companyId: string,
  attendanceId: string,
  body: UpdateAttendanceBody,
): Promise<AttendanceRecordDto> {
  const existing = await prisma.attendance.findFirst({
    where: { id: attendanceId, company_id: companyId },
    include: {
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

  if (!existing) {
    throw new AppError(404, 'ATTENDANCE_NOT_FOUND', 'Attendance record not found');
  }

  const dateStr = existing.date.toISOString().slice(0, 10);
  const assignedShift = await getAssignedShift(existing.company_member_id, existing.date);

  let workShiftId = existing.work_shift_id;
  if (body.work_shift_id !== undefined && body.work_shift_id !== null) {
    await assertShiftBelongsToCompany(companyId, body.work_shift_id);
    if (body.work_shift_id !== existing.work_shift_id) {
      const duplicate = await prisma.attendance.findUnique({
        where: {
          company_member_id_date_work_shift_id: {
            company_member_id: existing.company_member_id,
            date: existing.date,
            work_shift_id: body.work_shift_id,
          },
        },
      });
      if (duplicate) {
        throw new AppError(
          409,
          'SHIFT_ATTENDANCE_EXISTS',
          'Attendance for this shift already exists. Edit that row or add a different shift.',
        );
      }
    }
    workShiftId = body.work_shift_id;
  }

  const shiftMismatch =
    assignedShift && workShiftId ? assignedShift.id !== workShiftId : false;

  let checkIn = existing.check_in;
  let checkOut = existing.check_out;

  if (body.check_in) {
    checkIn = combineDateAndTime(dateStr, body.check_in);
  }
  if (body.check_out) {
    if (!checkIn) {
      throw new AppError(400, 'CHECK_IN_REQUIRED', 'check_in is required when setting check_out');
    }
    const inTime = body.check_in ?? formatTimeOnly(checkIn);
    checkOut = resolveCheckOut(dateStr, checkIn, body.check_out, inTime);
  }

  const lunchBreak = body.lunch_break_minutes ?? existing.lunch_break_minutes;
  const teaBreak = body.tea_break_minutes ?? existing.tea_break_minutes;
  const status = body.status ?? existing.status;
  const isOt = body.is_ot ?? existing.is_ot;
  const otMinutes = isOt ? (body.ot_minutes ?? existing.ot_minutes) : 0;
  const otReason = isOt ? (body.ot_reason ?? existing.ot_reason) : null;

  let workedMinutes = existing.worked_minutes;
  if (checkIn && checkOut && !HOLIDAY_CLEAR_STATUSES.has(status)) {
    workedMinutes = computeWorkedMinutes(checkIn, checkOut, lunchBreak, teaBreak);
  } else if (HOLIDAY_CLEAR_STATUSES.has(status)) {
    workedMinutes = 0;
  }

  await prisma.attendance.update({
    where: { id: attendanceId },
    data: {
      work_shift_id: workShiftId,
      check_in: HOLIDAY_CLEAR_STATUSES.has(status) ? null : checkIn,
      check_out: HOLIDAY_CLEAR_STATUSES.has(status) ? null : checkOut,
      lunch_break_minutes: lunchBreak,
      tea_break_minutes: teaBreak,
      worked_minutes: workedMinutes,
      ot_minutes: otMinutes,
      is_ot: isOt,
      ot_reason: otReason,
      shift_mismatch: shiftMismatch,
      status,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      source: 'hr_manual',
    },
  });

  return reloadAttendanceDto(companyId, attendanceId);
}

export async function updateAttendanceService(
  companyId: string,
  attendanceId: string,
  body: UpdateAttendanceBody,
): Promise<AttendanceRecordDto> {
  return applyAttendanceUpdate(companyId, attendanceId, body);
}

export async function upsertAttendanceService(
  companyId: string,
  body: UpsertAttendanceBody,
): Promise<AttendanceRecordDto> {
  let companyMemberId = body.company_member_id;

  if (!companyMemberId && body.employment_id) {
    const member = await prisma.companyMember.findFirst({
      where: { company_id: companyId, employment_id: body.employment_id, is_active: true },
      select: { id: true },
    });
    if (!member) {
      throw new AppError(404, 'MEMBER_NOT_FOUND', 'No active company member for this employment');
    }
    companyMemberId = member.id;
  }

  if (!companyMemberId) {
    throw new AppError(400, 'MEMBER_REQUIRED', 'company_member_id or employment_id is required');
  }

  await assertMemberBelongsToCompany(companyId, companyMemberId);

  const date = parseAttendanceDate(body.date);
  const dateStr = body.date;
  const assignedShift = await getAssignedShift(companyMemberId, date);

  const workShiftId = body.work_shift_id ?? assignedShift?.id;
  if (!workShiftId) {
    throw new AppError(400, 'WORK_SHIFT_REQUIRED', 'work_shift_id is required when employee has no assigned shift');
  }

  await assertShiftBelongsToCompany(companyId, workShiftId);
  const shift = await loadShift(companyId, workShiftId);

  const shiftMismatch =
    assignedShift && workShiftId ? assignedShift.id !== workShiftId : false;

  let checkIn: Date | null = null;
  let checkOut: Date | null = null;
  let lunchBreak = body.lunch_break_minutes ?? shift.break_minutes;
  let teaBreak = body.tea_break_minutes ?? 0;

  if (body.check_in && body.check_out) {
    checkIn = combineDateAndTime(dateStr, body.check_in);
    checkOut = resolveCheckOut(dateStr, checkIn, body.check_out, body.check_in);
  } else if (body.status !== 'absent') {
    const range = shiftTemplateToRange(dateStr, shift.start_time, shift.end_time);
    checkIn = range.checkIn;
    checkOut = range.checkOut;
    lunchBreak = body.lunch_break_minutes ?? shift.break_minutes;
  }

  const status = body.status ?? 'present';
  const isOt = body.is_ot ?? shiftMismatch;
  const otMinutes = isOt ? (body.ot_minutes ?? 0) : 0;

  let workedMinutes = 0;
  if (checkIn && checkOut && !['absent', 'leave', 'week_off', 'holiday'].includes(status)) {
    workedMinutes = computeWorkedMinutes(checkIn, checkOut, lunchBreak, teaBreak);
  }

  const existing = await prisma.attendance.findUnique({
    where: {
      company_member_id_date_work_shift_id: {
        company_member_id: companyMemberId,
        date,
        work_shift_id: workShiftId,
      },
    },
  });

  if (existing) {
    return applyAttendanceUpdate(companyId, existing.id, {
      check_in: checkIn ? formatTimeOnly(checkIn) : undefined,
      check_out: checkOut ? formatTimeOnly(checkOut) : undefined,
      lunch_break_minutes: lunchBreak,
      tea_break_minutes: teaBreak,
      status,
      is_ot: isOt,
      ot_minutes: otMinutes,
      ot_reason: body.ot_reason ?? (shiftMismatch ? 'Alternate shift' : null),
      notes: body.notes,
    });
  }

  const row = await prisma.attendance.create({
    data: {
      company_id: companyId,
      company_member_id: companyMemberId,
      work_shift_id: workShiftId,
      date,
      check_in: ['absent', 'leave', 'week_off', 'holiday'].includes(status) ? null : checkIn,
      check_out: ['absent', 'leave', 'week_off', 'holiday'].includes(status) ? null : checkOut,
      lunch_break_minutes: lunchBreak,
      tea_break_minutes: teaBreak,
      worked_minutes: workedMinutes,
      ot_minutes: otMinutes,
      is_ot: isOt,
      ot_reason: isOt ? body.ot_reason ?? (shiftMismatch ? 'Alternate shift' : null) : null,
      shift_mismatch: shiftMismatch,
      status,
      source: 'hr_manual',
      notes: body.notes ?? null,
    },
  }).catch((error) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(
        409,
        'ATTENDANCE_EXISTS',
        'Attendance already exists for this employee on this date (possibly another shift). Edit that row or use + Shift after fixing the DB unique index.',
      );
    }
    throw error;
  });

  return reloadAttendanceDto(companyId, row.id);
}

export { formatDisplayDate };
