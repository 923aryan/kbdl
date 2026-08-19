import type { UpdateEmployeeProfilePayload } from '@repo/types';
import {
  fetchDepartmentsMeta,
  fetchDesignationsMeta,
  fetchSupervisorsMeta,
  fetchWorkShiftsMeta,
} from '../api';

export type ProfileCardKind =
  | 'personal'
  | 'contact'
  | 'emergency'
  | 'identity'
  | 'other'
  | 'job'
  | 'work'
  | 'payroll'
  | 'bank'
  | 'payment';

const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

function rowsMap(rows: string[][]): Record<string, string> {
  return Object.fromEntries(rows.map(([k, v]) => [k ?? '', (v ?? '').trim()]));
}

function filled(value?: string) {
  const t = value?.trim() ?? '';
  if (!t || t === '-' || t === '—') return undefined;
  return t;
}

function parseIsoDate(value?: string): string | undefined {
  const t = filled(value);
  if (!t) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const match = t.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (match) {
    const day = Number(match[1]);
    const month = MONTHS.indexOf(match[2]!.toLowerCase());
    const year = Number(match[3]);
    if (month >= 0) {
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  const d = new Date(t);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return undefined;
}

function parseGender(value?: string) {
  const t = filled(value)?.toLowerCase();
  if (t === 'male' || t === 'female' || t === 'other') return t;
  return undefined;
}

function parseMarital(value?: string) {
  const t = filled(value)?.toLowerCase();
  if (t === 'unmarried' || t === 'married' || t === 'divorced' || t === 'widowed') return t;
  return undefined;
}

function parseEmployeeType(value?: string) {
  const t = filled(value)?.toLowerCase();
  if (!t) return undefined;
  const map: Record<string, 'full_time' | 'contract' | 'worker' | 'trainee'> = {
    'full time': 'full_time',
    full_time: 'full_time',
    contract: 'contract',
    worker: 'worker',
    trainee: 'trainee',
  };
  return map[t];
}

function parsePaymentMethod(value?: string) {
  const t = filled(value)?.toLowerCase() ?? '';
  if (t.includes('bank')) return 'bank' as const;
  if (t.includes('upi')) return 'upi' as const;
  if (t.includes('cash')) return 'cash' as const;
  return undefined;
}

function parseYesNo(value?: string) {
  const t = filled(value)?.toLowerCase();
  if (t === 'yes') return true;
  if (t === 'no') return false;
  return undefined;
}

function parseLeadingNumber(value?: string) {
  const t = filled(value);
  if (!t) return undefined;
  const num = Number(t.replace(/[^\d.]/g, ''));
  return Number.isFinite(num) ? num : undefined;
}

function parseSalaryAmount(value?: string) {
  const t = filled(value);
  if (!t) return undefined;
  const num = Number(t.replace(/[₹,\s]/g, '').replace(/\/.*/, ''));
  return Number.isFinite(num) && num > 0 ? num : undefined;
}

function parseFrequency(value?: string) {
  const t = (filled(value) ?? '').toLowerCase();
  if (t.includes('bi')) return 'biweekly' as const;
  if (t.includes('week')) return 'weekly' as const;
  if (t.includes('day')) return 'daily' as const;
  if (t.includes('month')) return 'monthly' as const;
  return undefined;
}

function parseBlood(value?: string) {
  const t = filled(value)?.toUpperCase();
  const allowed = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
  return allowed.find((item) => item === t);
}

async function matchMetaId<T extends { id: string; name?: string | null }>(
  fetcher: (params: { search?: string; limit?: number }) => Promise<{ data: T[] }>,
  name?: string,
): Promise<string | undefined> {
  const t = filled(name);
  if (!t) return undefined;
  const { data } = await fetcher({ search: t, limit: 20 });
  const exact = data.find((row) => (row.name ?? '').toLowerCase() === t.toLowerCase());
  return exact?.id ?? data[0]?.id;
}

export async function buildProfileUpdateFromCard(
  kind: ProfileCardKind,
  rows: string[][],
): Promise<UpdateEmployeeProfilePayload> {
  const v = rowsMap(rows);

  if (kind === 'personal') {
    return {
      personal: {
        ...(filled(v['Full Name']) ? { full_name: filled(v['Full Name']) } : {}),
        ...(parseIsoDate(v['Date of Birth']) ? { date_of_birth: parseIsoDate(v['Date of Birth']) } : {}),
        ...(parseGender(v.Gender) ? { gender: parseGender(v.Gender) } : {}),
        ...(parseMarital(v['Marital Status']) ? { marital_status: parseMarital(v['Marital Status']) } : {}),
        ...(filled(v["Father's Name"]) ? { father_name: filled(v["Father's Name"]) } : {}),
        ...(filled(v["Mother's Name"]) ? { mother_name: filled(v["Mother's Name"]) } : {}),
        ...(filled(v.Nationality) ? { nationality: filled(v.Nationality) } : {}),
        ...(filled(v.Religion) ? { religion: filled(v.Religion) } : {}),
        ...(filled(v['Language Known']) ? { languages_known: filled(v['Language Known']) } : {}),
        ...(parseBlood(v['Blood Group']) ? { blood_group: parseBlood(v['Blood Group']) } : {}),
      },
    };
  }

  if (kind === 'contact') {
    const present = filled(v['Present Address']);
    const permanent = filled(v['Permanent Address']);
    return {
      personal: {
        ...(filled(v.Email) ? { email: filled(v.Email) } : {}),
        ...(filled(v['Alternate Number']) ? { alternate_phone: filled(v['Alternate Number'])?.replace(/\D/g, '') } : {}),
        ...(present || permanent
          ? {
              addresses: {
                ...(present ? { present: { line1: present } } : {}),
                ...(permanent ? { permanent: { line1: permanent } } : {}),
              },
            }
          : {}),
        ...(present ? { address: present } : {}),
      },
    };
  }

  if (kind === 'emergency') {
    return {
      personal: {
        emergency_contact: {
          ...(filled(v['Contact Name']) ? { name: filled(v['Contact Name']) } : {}),
          ...(filled(v.Relation) ? { relation: filled(v.Relation) } : {}),
          ...(filled(v['Mobile Number'])
            ? { phone_no: filled(v['Mobile Number'])?.replace(/\D/g, '') }
            : {}),
        },
      },
    };
  }

  if (kind === 'identity') {
    const aadhaar = filled(v['Aadhaar Number'])?.replace(/\D/g, '');
    const pan = filled(v['PAN Number'])?.replace(/\s/g, '').toUpperCase();
    return {
      identity: {
        ...(aadhaar && /^\d{12}$/.test(aadhaar) ? { aadhaar_number: aadhaar } : {}),
        ...(pan && /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan) ? { pan_number: pan } : {}),
        ...(filled(v['Voter ID']) ? { voter_id: filled(v['Voter ID']) } : {}),
        ...(filled(v['Driving License']) ? { driving_license_number: filled(v['Driving License']) } : {}),
        ...(filled(v['UAN Number'])?.replace(/\D/g, '').length === 12
          ? { uan_number: filled(v['UAN Number'])!.replace(/\D/g, '') }
          : {}),
        ...(filled(v['ESI Number']) ? { esi_number: filled(v['ESI Number']) } : {}),
        ...(filled(v['PF Number']) ? { pf_number: filled(v['PF Number']) } : {}),
      },
    };
  }

  if (kind === 'other') {
    return {
      personal: {
        employment_terms: {
          ...(parseLeadingNumber(v['Probation Period']) != null
            ? { probation_period_months: parseLeadingNumber(v['Probation Period']) }
            : {}),
          ...(parseLeadingNumber(v['Notice Period']) != null
            ? { notice_period_days: parseLeadingNumber(v['Notice Period']) }
            : {}),
          ...(filled(v['Working Timing']) ? { working_hours: filled(v['Working Timing']) } : {}),
          ...(filled(v['Weekly Off']) ? { weekly_off: filled(v['Weekly Off']) } : {}),
        },
      },
      job: {
        ...(parseEmployeeType(v['Employee Type'])
          ? { employee_type: parseEmployeeType(v['Employee Type']) }
          : {}),
      },
    };
  }

  if (kind === 'job') {
    const [department_id, designation_id] = await Promise.all([
      matchMetaId(fetchDepartmentsMeta, v.Department),
      matchMetaId(fetchDesignationsMeta, v['Job Title']),
    ]);
    return {
      job: {
        ...(department_id ? { department_id } : {}),
        ...(designation_id ? { designation_id } : {}),
        ...(filled(v['Job Role']) ? { skill_trade: filled(v['Job Role']) } : {}),
        ...(parseEmployeeType(v['Job Type']) ? { employee_type: parseEmployeeType(v['Job Type']) } : {}),
        ...(filled(v['Work Location']) ? { work_location: filled(v['Work Location']) } : {}),
        ...(parseIsoDate(v['Date of Joining']) ? { joining_date: parseIsoDate(v['Date of Joining']) } : {}),
      },
      personal: {
        employment_terms: {
          ...(parseIsoDate(v['Confirmation Date'])
            ? { confirmation_date: parseIsoDate(v['Confirmation Date']) }
            : {}),
        },
      },
    };
  }

  if (kind === 'work') {
    const work_shift_id = await matchMetaId(fetchWorkShiftsMeta, v.Shift);
    return {
      job: {
        ...(work_shift_id ? { work_shift_id } : {}),
        ...(filled(v['Work Location / Site']) ? { work_location: filled(v['Work Location / Site']) } : {}),
        ...(parseLeadingNumber(v['Experience (Years)']) != null
          ? { experience_years: parseLeadingNumber(v['Experience (Years)']) }
          : {}),
        ...(filled(v['Certification / Licenses'])
          ? { certification_licenses: filled(v['Certification / Licenses']) }
          : {}),
        ...(parseYesNo(v['Safety Training']) != null
          ? { safety_training_completed: parseYesNo(v['Safety Training']) }
          : {}),
      },
      personal: {
        employment_terms: {
          ...(filled(v['Working Time']) ? { working_hours: filled(v['Working Time']) } : {}),
          ...(filled(v['Weekly Off']) ? { weekly_off: filled(v['Weekly Off']) } : {}),
        },
      },
      payment: {
        ...(parseYesNo(v['Overtime Eligible']) != null
          ? { overtime_eligible: parseYesNo(v['Overtime Eligible']) }
          : {}),
      },
    };
  }

  if (kind === 'payroll') {
    const reporting_supervisor_id = await matchMetaId(fetchSupervisorsMeta, v['Reporting Manager']);
    return {
      job: {
        ...(reporting_supervisor_id ? { reporting_supervisor_id } : {}),
        ...(filled(v['Salary Structure']) ? { skill_trade: filled(v['Salary Structure']) } : {}),
      },
      payment: {
        ...(parsePaymentMethod(v['Payment Mode']) ? { method: parsePaymentMethod(v['Payment Mode']) } : {}),
        ...(parseSalaryAmount(v.CTC) ? { basic_salary: parseSalaryAmount(v.CTC) } : {}),
        ...(parseFrequency(v['Pay Schedule']) ? { payment_frequency: parseFrequency(v['Pay Schedule']) } : {}),
      },
    };
  }

  if (kind === 'bank') {
    return {
      payment: {
        method: filled(v['UPI ID']) && !filled(v['Account Number']) ? 'upi' : 'bank',
        bank: {
          ...(filled(v['Bank Name']) ? { bank_name: filled(v['Bank Name']) } : {}),
          ...(filled(v['Account Number']) ? { account_number: filled(v['Account Number']) } : {}),
          ...(filled(v['IFSC Code']) ? { ifsc_code: filled(v['IFSC Code']) } : {}),
          ...(filled(v['Account Holder Name'])
            ? { account_holder_name: filled(v['Account Holder Name']) }
            : {}),
        },
        upi: {
          ...(filled(v['UPI ID']) ? { upi_id: filled(v['UPI ID']) } : {}),
          ...(filled(v['Name on UPI']) ? { name: filled(v['Name on UPI']) } : {}),
        },
      },
    };
  }

  return {
    payment: {
      ...(parsePaymentMethod(v['Payment Mode']) ? { method: parsePaymentMethod(v['Payment Mode']) } : {}),
      ...(parseSalaryAmount(v['Basic Salary / Wage'])
        ? { basic_salary: parseSalaryAmount(v['Basic Salary / Wage']) }
        : {}),
      ...(parseFrequency(v['Payment Frequency'])
        ? { payment_frequency: parseFrequency(v['Payment Frequency']) }
        : {}),
      ...(parseYesNo(v['Overtime Eligible']) != null
        ? { overtime_eligible: parseYesNo(v['Overtime Eligible']) }
        : {}),
      ...(parseYesNo(v['PF Applicable']) != null ? { pf_applicable: parseYesNo(v['PF Applicable']) } : {}),
      ...(parseYesNo(v['ESI Applicable']) != null ? { esi_applicable: parseYesNo(v['ESI Applicable']) } : {}),
    },
  };
}
