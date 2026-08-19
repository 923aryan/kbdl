import type { EmployeeEmploymentDTO } from '@repo/types';
import type { Employee, Status } from '../stores/use-employee-store';

function formatJoinedDate(iso: string | Date): string {
  const date = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function parseSalaryAmount(value: unknown): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    const num = Number(String(value.toString()));
    return Number.isFinite(num) ? num : null;
  }
  const num = Number(String(value));
  return Number.isFinite(num) ? num : null;
}

function formatSalary(hr: EmployeeEmploymentDTO['hr_profile']): string {
  const amount = parseSalaryAmount(hr?.basic_salary);
  if (amount == null) return '';
  const typeMap: Record<string, string> = {
    monthly: 'Month',
    daily_wage: 'Day',
    hourly: 'Hour',
  };
  const unit = hr?.salary_type ? typeMap[hr.salary_type] ?? hr.salary_type : '';
  const formatted = amount.toLocaleString('en-IN');
  return unit ? `₹ ${formatted} / ${unit}` : `₹ ${formatted}`;
}

function formatJobType(value?: string | null): string {
  if (!value) return '';
  const map: Record<string, string> = {
    full_time: 'Full Time',
    contract: 'Contract',
    worker: 'Worker',
    trainee: 'Trainee',
  };
  return map[value] ?? value;
}

function sectionValue(rows: string[][] | undefined, label: string): string {
  const raw = rows?.find(([key]) => key === label)?.[1]?.trim() ?? '';
  return !raw || raw === '-' ? '' : raw;
}

export function mapEmploymentDtoToEmployee(
  dto: EmployeeEmploymentDTO,
  fallback?: Partial<Employee>,
): Employee {
  const hr = dto.hr_profile;
  const sections = dto.profile_sections;
  const wp = dto.workforce_person;
  const linked = wp.linked_user ?? dto.employee;

  return {
    id: dto.employee_no ?? fallback?.id ?? dto.id.slice(0, 8).toUpperCase(),
    uid: wp.karigari_id ?? fallback?.uid ?? '',
    name: hr?.full_name ?? linked?.name ?? fallback?.name ?? '-',
    email: hr?.email ?? fallback?.email ?? '',
    phone: wp.phone_no ?? linked?.phone_no ?? fallback?.phone ?? '',
    designation:
      dto.organization?.designation?.name ??
      hr?.designation?.name ??
      fallback?.designation ??
      '-',
    status: (dto.status?.ui_status ?? fallback?.status ?? 'Active') as Status,
    rating: fallback?.rating ?? (linked?.rating_avg ? Number(linked.rating_avg) : 0),
    joined: formatJoinedDate(dto.joined_at),
    location:
      hr?.work_location ||
      hr?.branch_location ||
      sectionValue(sections?.job, 'Work Location') ||
      sectionValue(sections?.work, 'Work Location / Site') ||
      fallback?.location ||
      '',
    department:
      dto.organization?.department?.name ?? hr?.department?.name ?? fallback?.department ?? '',
    salary:
      formatSalary(hr) ||
      sectionValue(sections?.payment, 'Basic Salary / Wage') ||
      sectionValue(sections?.payroll, 'CTC') ||
      fallback?.salary ||
      '',
    jobType:
      formatJobType(hr?.employee_type) ||
      sectionValue(sections?.job, 'Job Type') ||
      sectionValue(sections?.other, 'Employee Type') ||
      '',
    employmentId: dto.id,
    onboardDetails: sections
      ? {
          personal: sections.personal,
          contact: sections.contact,
          emergency: sections.emergency,
          identity: sections.identity,
          other: sections.other,
          job: sections.job,
          work: sections.work,
          payroll: sections.payroll,
          bank: sections.bank,
          payment: sections.payment,
          documents: sections.documents,
          notes: sections.notes,
        }
      : fallback?.onboardDetails,
  };
}
