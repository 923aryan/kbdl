export type ApiValidationIssue = {
  field?: string;
  message?: string;
};

export type EmployerValidationError = {
  label: string;
  message: string;
};

const SEGMENT_LABELS: Record<string, string> = {
  personal: 'Personal Information',
  job: 'Job Information',
  payment: 'Salary & Payment',
  identity: 'Identity Documents',
  bank: 'Bank Details',
  upi: 'UPI Details',
  addresses: 'Address',
  present: 'Current Address',
  permanent: 'Permanent Address',
  emergency_contact: 'Emergency Contact',
  employment_terms: 'Employment Terms',
  full_name: 'Full Name',
  email: 'Email',
  date_of_birth: 'Date of Birth',
  gender: 'Gender',
  address: 'Address',
  line1: 'Address Line',
  city: 'City',
  state: 'State',
  pincode: 'Pincode',
  blood_group: 'Blood Group',
  alternate_phone: 'Alternate Mobile',
  marital_status: 'Marital Status',
  father_name: "Father's Name",
  mother_name: "Mother's Name",
  nationality: 'Nationality',
  religion: 'Religion',
  languages_known: 'Languages Known',
  phone_no: 'Mobile Number',
  karigari_id: 'Karigari ID',
  employee_no: 'Employee Number',
  designation_id: 'Designation',
  department_id: 'Department',
  branch_location: 'Branch / Location',
  reporting_supervisor_id: 'Reporting Supervisor',
  employee_type: 'Employee Type',
  joining_date: 'Joining Date',
  work_shift_id: 'Work Shift',
  work_location: 'Work Location',
  skill_trade: 'Skill / Trade',
  experience_years: 'Experience (Years)',
  certification_licenses: 'Certifications',
  safety_training_completed: 'Safety Training',
  method: 'Payment Method',
  basic_salary: 'Basic Salary',
  salary_type: 'Salary Type',
  payment_frequency: 'Payment Frequency',
  overtime_eligible: 'Overtime Eligible',
  pf_applicable: 'PF Applicable',
  esi_applicable: 'ESI Applicable',
  account_holder_name: 'Account Holder Name',
  account_number: 'Account Number',
  bank_name: 'Bank Name',
  ifsc_code: 'IFSC Code',
  upi_id: 'UPI ID',
  name: 'Name',
  wage_amount: 'Wage Amount',
  frequency: 'Payment Frequency',
  aadhaar_number: 'Aadhaar Number',
  pan_number: 'PAN Number',
  driving_license_number: 'Driving License Number',
  voter_id: 'Voter ID',
  uan_number: 'UAN Number',
  esi_number: 'ESI Number',
  pf_number: 'PF Number',
  identity_document_url: 'Aadhaar Document Upload',
  additional_document_url: 'Additional Document Upload',
  relation: 'Relation',
  notes: 'Notes',
};

const MESSAGE_OVERRIDES: Record<string, string> = {
  'Invalid IFSC code': 'Please enter a valid IFSC code (example: SBIN0001234).',
  'Invalid IFSC code format': 'Please enter a valid IFSC code (example: SBIN0001234).',
  'Invalid PAN': 'Please enter a valid PAN number (example: ABCDE1234F).',
  'pan_number must be a valid PAN (e.g. ABCDE1234F)': 'Please enter a valid PAN number (example: ABCDE1234F).',
  'aadhaar_number must be exactly 12 digits': 'Aadhaar number must be exactly 12 digits.',
  'pincode must be exactly 6 digits': 'Pincode must be a 6-digit number.',
  'Phone number must be a 10-digit Indian mobile (optionally prefixed with +91)':
    'Mobile number must be a valid 10-digit Indian number.',
  'Either phone_no (10 digits) or karigari_id is required':
    'Please enter mobile number or Karigari ID.',
  'Either address or addresses.present is required':
    'Please enter current address details.',
  'upi details are required when method is upi': 'Please fill UPI payment details.',
  'bank details are required when method is bank': 'Please fill bank account details.',
};

function titleCase(value: string): string {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function fieldPathToEmployerLabel(fieldPath?: string): string {
  if (!fieldPath?.trim()) return 'Form';

  const parts = fieldPath
    .replace(/^body\./, '')
    .split('.')
    .filter((part) => part && part !== 'body');

  if (parts.length === 0) return 'Form';

  return parts.map((part) => SEGMENT_LABELS[part] ?? titleCase(part)).join(' → ');
}

export function humanizeValidationMessage(message?: string, fieldPath?: string): string {
  if (!message?.trim()) return 'Please check this field and try again.';

  const trimmed = message.trim();
  if (MESSAGE_OVERRIDES[trimmed]) return MESSAGE_OVERRIDES[trimmed];

  const leaf = fieldPath?.split('.').pop();
  if (leaf && trimmed === `${leaf} is required`) {
    return `Please enter ${SEGMENT_LABELS[leaf] ?? titleCase(leaf)}.`;
  }

  if (trimmed.endsWith(' is required')) {
    return trimmed.replace(/_/g, ' ');
  }

  return trimmed.replace(/_/g, ' ');
}

export function formatOnboardValidationErrors(
  details: unknown,
): EmployerValidationError[] {
  if (!Array.isArray(details)) return [];

  const seen = new Set<string>();
  const rows: EmployerValidationError[] = [];

  for (const item of details) {
    if (!item || typeof item !== 'object') continue;
    const issue = item as ApiValidationIssue;
    const label = fieldPathToEmployerLabel(issue.field);
    const message = humanizeValidationMessage(issue.message, issue.field);
    const key = `${label}::${message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ label, message });
  }

  return rows;
}

const CONFLICT_FIELD_LABELS: Record<string, string> = {
  employee_no: 'Employee Number',
  phone_no: 'Mobile Number',
  karigari_id: 'Karigari ID',
  workforce_person: 'Employee Record',
};

function conflictFieldLabel(field?: string | null): string {
  if (!field) return 'Employee';
  return CONFLICT_FIELD_LABELS[field] ?? fieldPathToEmployerLabel(field);
}

export function extractOnboardApiErrors(error: unknown): {
  title: string;
  errors: EmployerValidationError[];
} {
  const err = error as { message?: string; details?: unknown; code?: string };

  const validationErrors = formatOnboardValidationErrors(err.details);
  if (validationErrors.length > 0) {
    return {
      title: 'Please fix the following',
      errors: validationErrors,
    };
  }

  if (err.code === 'ALREADY_ONBOARDED' || err.code === 'EMPLOYEE_NO_EXISTS') {
    const conflictDetails =
      err.details && typeof err.details === 'object' && !Array.isArray(err.details)
        ? (err.details as { conflict_field?: string })
        : undefined;

    return {
      title: 'Employee already exists',
      errors: [
        {
          label: conflictFieldLabel(conflictDetails?.conflict_field),
          message:
            err.message && err.message !== 'Invalid request data'
              ? humanizeValidationMessage(err.message)
              : 'This employee is already active in your company.',
        },
      ],
    };
  }

  return {
    title: 'Could not save employee',
    errors: [
      {
        label: 'Error',
        message:
          err.message && err.message !== 'Invalid request data'
            ? humanizeValidationMessage(err.message)
            : 'Something went wrong while saving. Please review the form and try again.',
      },
    ],
  };
}
