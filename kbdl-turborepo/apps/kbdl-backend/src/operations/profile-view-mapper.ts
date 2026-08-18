import type { EmployeeEmploymentDTO, EmployeeProfileSections } from '@repo/types';
import { formatAddressLine } from './employee-profile-helpers';

const dash = (value?: string | number | null) => {
  if (value === null || value === undefined) return '-';
  const text = String(value).trim();
  return text || '-';
};

const formatDate = (value?: Date | string | null) => {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatGender = (value?: string | null) => {
  if (!value) return '-';
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatMaritalStatus = (value?: string | null) => {
  if (!value) return '-';
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatEmployeeType = (value?: string | null) => {
  if (!value) return '-';
  const map: Record<string, string> = {
    full_time: 'Full Time',
    contract: 'Contract',
    worker: 'Worker',
    trainee: 'Trainee',
  };
  return map[value] ?? value;
};

const formatSalaryType = (value?: string | null) => {
  if (!value) return '-';
  const map: Record<string, string> = {
    monthly: 'Monthly',
    daily_wage: 'Daily Wage',
    hourly: 'Hourly',
  };
  return map[value] ?? value;
};

const formatPaymentMethod = (value?: string | null) => {
  if (!value) return '-';
  const map: Record<string, string> = {
    cash: 'Cash Payment',
    upi: 'UPI Transfer',
    bank: 'Bank Transfer',
  };
  return map[value] ?? value;
};

const maskAadhaar = (value?: string | null) => {
  if (!value || value.length < 4) return dash(value);
  return `xxxx-xxxx-${value.slice(-4)}`;
};

const paymentDetails = (hr: EmployeeEmploymentDTO['hr_profile']) => {
  const details = hr?.payment_details as Record<string, unknown> | null | undefined;
  return details ?? {};
};

export function buildEmployeeProfileSections(
  employment: EmployeeEmploymentDTO,
): EmployeeProfileSections {
  const hr = employment.hr_profile;
  const org = employment.organization;
  const workforce = employment.workforce_person;
  const employee = employment.employee;
  const addresses = hr?.addresses ?? [];
  const present = addresses.find((a) => a.type === 'present');
  const permanent = addresses.find((a) => a.type === 'permanent');
  const pay = paymentDetails(hr);
  const paymentMethod = hr?.payment_method ?? null;

  const presentFormatted = formatAddressLine(present) || dash(hr?.address);
  const permanentFormatted = formatAddressLine(permanent) || presentFormatted;

  const bankName = typeof pay.bank_name === 'string' ? pay.bank_name : '';
  const accountNumber = typeof pay.account_number === 'string' ? pay.account_number : '';
  const ifscCode = typeof pay.ifsc_code === 'string' ? pay.ifsc_code : '';
  const accountHolder =
    typeof pay.account_holder_name === 'string' ? pay.account_holder_name : '';
  const upiId = typeof pay.upi_id === 'string' ? pay.upi_id : '';
  const upiName = typeof pay.name === 'string' ? pay.name : '';

  const salaryAmount =
    hr?.basic_salary != null && String(hr.basic_salary).trim() !== ''
      ? String(hr.basic_salary)
      : '';
  const salaryLabel = salaryAmount
    ? `${salaryAmount} / ${formatSalaryType(hr?.salary_type)}`
    : '-';

  const identityDocKey = hr?.identity_document_url ?? '';

  return {
    personal: [
      ['Full Name', dash(hr?.full_name ?? employee.name)],
      ['Date of Birth', formatDate(hr?.date_of_birth)],
      ['Gender', formatGender(hr?.gender)],
      ['Marital Status', formatMaritalStatus(hr?.marital_status as string | null)],
      ["Father's Name", dash(hr?.father_name)],
      ["Mother's Name", dash(hr?.mother_name)],
      ['Nationality', dash(hr?.nationality ?? 'Indian')],
      ['Religion', dash(hr?.religion)],
      ['Language Known', dash(hr?.languages_known)],
      ['Blood Group', dash(hr?.blood_group)],
    ],
    contact: [
      ['Mobile Number', dash(workforce?.phone_no ?? employee.phone_no)],
      ['Alternate Number', dash(hr?.alternate_phone)],
      ['Email', dash(hr?.email ?? (employee as { email?: string | null }).email)],
      ['Present Address', presentFormatted],
      ['Permanent Address', permanentFormatted],
    ],
    emergency: [
      ['Contact Name', dash(hr?.emergency_contact_name)],
      ['Relation', dash(hr?.emergency_contact_relation)],
      ['Mobile Number', dash(hr?.emergency_contact_phone)],
    ],
    identity: [
      ['Aadhaar Number', maskAadhaar(hr?.aadhaar_number)],
      ['PAN Number', dash(hr?.pan_number)],
      ['Voter ID', dash(hr?.voter_id)],
      ['Driving License', dash(hr?.driving_license_number)],
      ['UAN Number', dash(hr?.uan_number)],
      ['ESI Number', dash(hr?.esi_number)],
      ['PF Number', dash(hr?.pf_number)],
    ],
    other: [
      ['Employee Type', formatEmployeeType(hr?.employee_type)],
      [
        'Probation Period',
        hr?.probation_period_months != null ? `${hr.probation_period_months} Months` : '-',
      ],
      [
        'Notice Period',
        hr?.notice_period_days != null ? `${hr.notice_period_days} Days` : '-',
      ],
      ['Working Timing', dash(hr?.working_hours)],
      ['Weekly Off', dash(hr?.weekly_off)],
    ],
    job: [
      ['Department', dash(org?.department?.name ?? hr?.department?.name)],
      ['Job Title', dash(org?.designation?.name ?? hr?.designation?.name)],
      ['Job Role', dash(hr?.skill_trade)],
      ['Job Type', formatEmployeeType(hr?.employee_type)],
      ['Work Location', dash(hr?.work_location ?? hr?.branch_location)],
      ['Date of Joining', formatDate(employment.joined_at)],
      ['Confirmation Date', formatDate(hr?.confirmation_date)],
      ['Employee Status', employment.status?.ui_status ?? '-'],
    ],
    work: [
      ['Shift', dash(org?.work_shift?.name)],
      ['Working Time', dash(hr?.working_hours)],
      ['Experience (Years)', dash(hr?.experience_years?.toString())],
      ['Certification / Licenses', dash(hr?.certification_licenses)],
      ['Weekly Off', dash(hr?.weekly_off)],
      [
        'Overtime Eligible',
        hr?.overtime_eligible == null ? '-' : hr.overtime_eligible ? 'Yes' : 'No',
      ],
      ['Safety Training', hr?.safety_training_completed == null ? '-' : hr.safety_training_completed ? 'Yes' : 'No'],
    ],
    payroll: [
      ['Reporting Manager', dash(org?.manager?.name)],
      ['Payroll Group', '-'],
      ['Pay Schedule', dash(hr?.salary_payment_frequency)],
      ['Salary Structure', dash(hr?.skill_trade)],
      ['CTC', salaryLabel],
      ['Payment Mode', formatPaymentMethod(paymentMethod)],
    ],
    bank: [
      ['Bank Name', dash(bankName)],
      ['Account Number', dash(accountNumber)],
      ['IFSC Code', dash(ifscCode)],
      ['Account Holder Name', dash(accountHolder)],
      ['UPI ID', dash(upiId)],
      ['Name on UPI', dash(upiName)],
    ],
    payment: [
      ['Payment Mode', formatPaymentMethod(paymentMethod)],
      ['Basic Salary / Wage', dash(salaryAmount)],
      ['Payment Frequency', dash(hr?.salary_payment_frequency)],
      ['Overtime Eligible', hr?.overtime_eligible == null ? '-' : hr.overtime_eligible ? 'Yes' : 'No'],
      ['PF Applicable', hr?.pf_applicable == null ? '-' : hr.pf_applicable ? 'Yes' : 'No'],
      ['ESI Applicable', hr?.esi_applicable == null ? '-' : hr.esi_applicable ? 'Yes' : 'No'],
    ],
    documents: [
      [
        'Aadhaar Card',
        dash(hr?.aadhaar_number),
        identityDocKey || '-',
        '-',
        identityDocKey ? 'Uploaded' : 'Pending Upload',
      ],
      ...(hr?.documents ?? []).map((doc) => [
        doc.document_type,
        dash(doc.document_number),
        doc.file_key,
        formatDate(doc.expiry_date),
        doc.expiry_date && new Date(doc.expiry_date) < new Date()
          ? 'Expired'
          : 'Uploaded',
      ]),
    ],
    notes: hr?.notes ?? undefined,
    addresses: {
      present: present ?? null,
      permanent: permanent ?? null,
    },
  };
}

export function enrichEmploymentWithProfileSections(
  employment: EmployeeEmploymentDTO,
): EmployeeEmploymentDTO {
  return {
    ...employment,
    profile_sections: buildEmployeeProfileSections(employment),
  };
}
