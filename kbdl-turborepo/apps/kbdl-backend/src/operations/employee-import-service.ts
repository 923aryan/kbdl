import { prisma, SYSTEM_ROLE_CODES } from '@repo/db/server';
import type { EmployeeImportResult } from '@repo/types';
import { onboardEmployeeSchema } from '@repo/validator/shared';
import { AppError } from '../utils/api-error';
import { onboardEmployeeService } from './operation-services';

export const EMPLOYEE_IMPORT_HEADERS = [
  'phone_no',
  'full_name',
  'email',
  'date_of_birth',
  'gender',
  'address',
  'blood_group',
  'emergency_name',
  'emergency_relation',
  'emergency_phone',
  'designation',
  'department',
  'branch_location',
  'employee_type',
  'joining_date',
  'work_shift',
  'skill_trade',
  'experience_years',
  'safety_training_completed',
  'method',
  'basic_salary',
  'salary_type',
  'payment_frequency',
  'overtime_eligible',
  'pf_applicable',
  'esi_applicable',
  'bank_account_holder',
  'bank_account_number',
  'bank_name',
  'ifsc_code',
  'upi_id',
  'upi_name',
] as const;

export function employeeImportTemplateCsv(): string {
  const header = EMPLOYEE_IMPORT_HEADERS.join(',');
  const sample = [
    '9876543211',
    'Ravi Kumar',
    'ravi@example.com',
    '1994-02-11',
    'male',
    '12 Industrial Area, Chandigarh',
    'B+',
    'Sunita Kumar',
    'Spouse',
    '9876543299',
    'Worker',
    'General',
    'Plant 1',
    'full_time',
    '2026-04-01',
    'General',
    'Helper',
    '2',
    'yes',
    'bank',
    '18000',
    'monthly',
    'monthly',
    'yes',
    'yes',
    'yes',
    'Ravi Kumar',
    '12345678901',
    'State Bank of India',
    'SBIN0001234',
    '',
    '',
  ]
    .map(csvEscape)
    .join(',');
  return `\uFEFF${header}\n${sample}\n`;
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  const input = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"' && input[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell.trim());
      cell = '';
    } else if (ch === '\n') {
      row.push(cell.trim());
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = '';
    } else if (ch !== '\r') {
      cell += ch;
    }
  }
  row.push(cell.trim());
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

function yn(value: string): boolean {
  return ['1', 'true', 'yes', 'y'].includes(value.trim().toLowerCase());
}

async function resolveNamedMeta(companyId: string, name: string, kind: 'department' | 'designation') {
  const trimmed = name.trim();
  if (!trimmed) return null;
  if (kind === 'department') {
    const existing = await prisma.department.findFirst({
      where: { company_id: companyId, name: { equals: trimmed, mode: 'insensitive' } },
    });
    if (existing) return existing.id;
    const created = await prisma.department.create({
      data: { company_id: companyId, name: trimmed },
    });
    return created.id;
  }
  const existing = await prisma.companyDesignation.findFirst({
    where: { company_id: companyId, name: { equals: trimmed, mode: 'insensitive' } },
  });
  if (existing) return existing.id;
  const created = await prisma.companyDesignation.create({
    data: { company_id: companyId, name: trimmed },
  });
  return created.id;
}

export async function importEmployeesFromCsv(
  companyId: string,
  fileBuffer: Buffer,
): Promise<EmployeeImportResult> {
  if (fileBuffer.length >= 2 && fileBuffer[0] === 0x50 && fileBuffer[1] === 0x4b) {
    throw new AppError(
      400,
      'XLSX_NOT_SUPPORTED',
      'Save the Excel file as CSV (File → Save As → CSV UTF-8) and upload that.',
    );
  }
  const text = fileBuffer.toString('utf8');

  const table = parseCsv(text);
  if (table.length < 2) {
    throw new AppError(400, 'EMPTY_FILE', 'Spreadsheet has no data rows');
  }

  const header = table[0]!.map((h) => h.trim().toLowerCase());
  const missing = EMPLOYEE_IMPORT_HEADERS.filter((h) => !header.includes(h));
  if (missing.length) {
    throw new AppError(400, 'INVALID_TEMPLATE', `Missing columns: ${missing.join(', ')}`);
  }

  const supervisor = await prisma.companyMember.findFirst({
    where: {
      company_id: companyId,
      is_active: true,
      platform_type: 'EMPLOYER',
      role: { code: { in: [SYSTEM_ROLE_CODES.HR, SYSTEM_ROLE_CODES.OWNER, SYSTEM_ROLE_CODES.ADMIN] } },
    },
    orderBy: { created_at: 'asc' },
  });
  if (!supervisor) {
    throw new AppError(400, 'NO_SUPERVISOR', 'No HR/owner member found to assign as supervisor');
  }

  const shifts = await prisma.workShift.findMany({ where: { company_id: companyId, is_active: true } });
  const col = (row: string[], key: (typeof EMPLOYEE_IMPORT_HEADERS)[number]) =>
    row[header.indexOf(key)]?.trim() ?? '';

  const errors: Array<{ row: number; message: string }> = [];
  let created = 0;

  for (let i = 1; i < table.length; i += 1) {
    const row = table[i]!;
    const sheetRow = i + 1;
    try {
      const shiftName = col(row, 'work_shift') || 'General';
      const shift = shifts.find((s) => s.name.toLowerCase() === shiftName.toLowerCase());
      if (!shift) {
        throw new Error(`Unknown work_shift "${shiftName}". Create the shift in Attendance first.`);
      }
      const departmentId = await resolveNamedMeta(companyId, col(row, 'department') || 'General', 'department');
      const designationId = await resolveNamedMeta(
        companyId,
        col(row, 'designation') || 'Worker',
        'designation',
      );
      const method = (col(row, 'method') || 'cash').toLowerCase();
      const rawBody = {
        action: 'draft',
        phone_no: col(row, 'phone_no'),
        personal: {
          full_name: col(row, 'full_name'),
          email: col(row, 'email') || undefined,
          date_of_birth: col(row, 'date_of_birth'),
          gender: col(row, 'gender').toLowerCase() as 'male' | 'female' | 'other',
          address: col(row, 'address'),
          blood_group: col(row, 'blood_group') as never,
          emergency_contact: {
            name: col(row, 'emergency_name'),
            relation: col(row, 'emergency_relation'),
            phone_no: col(row, 'emergency_phone'),
          },
        },
        job: {
          designation_id: designationId!,
          department_id: departmentId!,
          branch_location: col(row, 'branch_location') || 'Head office',
          reporting_supervisor_id: supervisor.id,
          employee_type: (col(row, 'employee_type') || 'full_time') as never,
          joining_date: col(row, 'joining_date'),
          work_shift_id: shift.id,
          skill_trade: col(row, 'skill_trade') || 'General',
          experience_years: Number(col(row, 'experience_years') || 0),
          safety_training_completed: yn(col(row, 'safety_training_completed') || 'no'),
        },
        payment: {
          method: method as 'cash' | 'upi' | 'bank',
          basic_salary: Number(col(row, 'basic_salary') || 0),
          salary_type: (col(row, 'salary_type') || 'monthly') as never,
          payment_frequency: (col(row, 'payment_frequency') || 'monthly') as never,
          overtime_eligible: yn(col(row, 'overtime_eligible') || 'no'),
          pf_applicable: yn(col(row, 'pf_applicable') || 'no'),
          esi_applicable: yn(col(row, 'esi_applicable') || 'no'),
          ...(method === 'bank'
            ? {
                bank: {
                  account_holder_name: col(row, 'bank_account_holder'),
                  account_number: col(row, 'bank_account_number'),
                  bank_name: col(row, 'bank_name'),
                  ifsc_code: col(row, 'ifsc_code'),
                },
              }
            : {}),
          ...(method === 'upi'
            ? {
                upi: {
                  upi_id: col(row, 'upi_id'),
                  name: col(row, 'upi_name') || col(row, 'full_name'),
                  wage_amount: Number(col(row, 'basic_salary') || 0),
                  frequency: (col(row, 'payment_frequency') || 'monthly') as never,
                },
              }
            : {}),
        },
      };

      const parsed = onboardEmployeeSchema.safeParse({ body: rawBody });
      if (!parsed.success) {
        const message = parsed.error.issues.map((issue) => issue.message).join('; ');
        throw new Error(message);
      }

      await onboardEmployeeService(companyId, parsed.data.body);
      created += 1;
    } catch (err) {
      errors.push({
        row: sheetRow,
        message: err instanceof Error ? err.message : 'Could not import row',
      });
    }
  }

  return {
    total: table.length - 1,
    created,
    failed: errors.length,
    errors,
  };
}
