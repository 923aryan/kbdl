'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bell,
  Briefcase,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  CreditCard,
  Download,
  Edit3,
  Eye,
  FileText,
  HelpCircle,
  IdCard,
  Info,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Star,
  Trash2,
  UploadCloud,
  User,
  Users,
  WalletCards,
  Wrench,
  X,
} from 'lucide-react';
import { z } from 'zod';

import { useEmployeesList } from '../hooks/use-employees-list';
import { useMetaSearch } from '../hooks/use-meta-search';
import { AsyncSearchSelect } from '../components/async-search-select';
import { AddressFormBlock } from '../components/address-form-block';
import { AsyncMultiSearchSelect } from '../components/async-multi-search-select';
import { SelectField } from '../components/async-single-select';
import { OnboardErrorModal } from '../components/onboard-error-modal';
import { extractOnboardApiErrors } from '../lib/onboard-error-messages';
import { filterBanks } from '../lib/indian-banks';
import {
  filterOptions,
  INDIAN_LANGUAGES,
  INDIAN_RELIGIONS,
  joinCommaList,
  parseCommaList,
} from '../lib/personal-options';
import {
  fetchDepartmentsMeta,
  fetchDesignationsMeta,
  fetchEmployeeDetails,
  fetchNextEmployeeNumber,
  fetchOnboardMetaInitial,
  fetchSupervisorsMeta,
  fetchWorkShiftsMeta,
  uploadEmployeeDocument,
  addEmployeeDocument,
  type MetaDepartment,
  type MetaDesignation,
  type MetaSupervisor,
  type MetaWorkShift,
} from '../api';
import { mapEmploymentDtoToEmployee } from '../lib/employee-detail-mapper';
import {
  detailTabFromSearchParam,
  EMPLOYEE_LIST_PATH,
  EMPLOYEE_ONBOARD_PATH,
  employeeDetailPath,
} from '../lib/employee-routes';
import {
  displayNameFromFileKey,
  formatDocumentStoredValue,
  openStoredDocument,
} from '../lib/document-upload';
import { api } from '@/lib/api-client';
import type { EmployeeEmploymentDTO } from '@repo/types';
import {
  dropdownOptions,
  statuses,
  useEmployeeStore,
  type DetailTab,
  type Employee,
  type PaymentMethod,
  type Status,
} from '../stores/use-employee-store';

type DocumentUploadContext = {
  employmentId: string;
  documentType: string;
  documentNumber?: string;
};

const detailTabs: DetailTab[] = [
  'Personal Info',
  'Job & Work Info',
  'Documents',
  'Bank & Payments',
  'Attendance',
  'Leave',
];

const statusStyle: Record<Status, string> = {
  Active: 'border-[#4CAF50] bg-[#E5FFEB] text-[#4CAF50]',
  Inactive: 'border-[#525252] bg-[#E5E5E5] text-[#525252]',
  'On Boarding': 'border-[#0658C2] bg-[#DBEAFF] text-[#0658C2]',
  Onboard: 'border-[#0658C2] bg-[#DBEAFF] text-[#0658C2]',
  'On Leave': 'border-[#FFA000] bg-[#FFF4E3] text-[#FFA000]',
  Probation: 'border-[#8B5CF6] bg-[#EDE9FE] text-[#8B5CF6]',
  Absent: 'border-[#F54A4A] bg-[#FEE9E5] text-[#F54A4A]',
};

type OnboardDocument = {
  id: string;
  documentType: string;
  documentNumber: string;
  fileKey: string;
  fileName: string;
};

const ONBOARD_DOCUMENT_TYPES = [
  'Aadhaar Card',
  'PAN Card',
  'Driving License',
  'Other Document',
] as const;

const createOnboardDocument = (documentType = 'Aadhaar Card'): OnboardDocument => ({
  id: crypto.randomUUID(),
  documentType,
  documentNumber: '',
  fileKey: '',
  fileName: '',
});

const getUploadedOnboardDocuments = (documents: OnboardDocument[]) =>
  documents.filter((doc) => doc.fileKey.trim() && doc.documentType.trim());

const validateOnboardDocuments = (documents: OnboardDocument[], action: 'draft' | 'submit') => {
  if (action === 'draft') return null;

  const uploaded = getUploadedOnboardDocuments(documents);
  if (uploaded.length === 0) {
    return 'Upload at least one document before submitting the profile.';
  }

  const incomplete = documents.some(
    (doc) =>
      (doc.documentType.trim() || doc.fileKey.trim()) &&
      !(doc.documentType.trim() && doc.fileKey.trim()),
  );
  if (incomplete) {
    return 'Each document row needs both a document type and an uploaded file.';
  }

  return null;
};

const displayOrDash = (value?: string) => value?.trim() || '-';

const normalizePhoneNumber = (value: string) => {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');

  if (trimmed.startsWith('+91') && /^\+91\d{10}$/.test(trimmed)) {
    return trimmed;
  }

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }

  return trimmed;
};

const mapGender = (value: string) => {
  const key = value.trim().toLowerCase();
  if (key === 'male' || key === 'female' || key === 'other') return key;
  return undefined;
};

const mapEmployeeType = (value: string) => {
  const map: Record<string, string> = {
    'full time': 'full_time',
    contract: 'contract',
    worker: 'worker',
    trainee: 'trainee',
  };
  return map[value.trim().toLowerCase()];
};

const mapSalaryType = (value: string) => {
  const map: Record<string, string> = {
    monthly: 'monthly',
    'daily wage': 'daily_wage',
    hourly: 'hourly',
  };
  return map[value.trim().toLowerCase()];
};

const mapFrequency = (value: string) => {
  const map: Record<string, string> = {
    daily: 'daily',
    weekly: 'weekly',
    'bi-weekly': 'biweekly',
    biweekly: 'biweekly',
    monthly: 'monthly',
  };
  return map[value.trim().toLowerCase()];
};

const toYesNoBoolean = (value: string) => value.trim().toLowerCase() === 'yes';

const parseNonNegativeNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : undefined;
};

const OTHER_BANK_OPTION = 'Other Bank (type below)';

const resolveBankName = (form: OnboardFormState) =>
  form.bankName === OTHER_BANK_OPTION ? form.bankNameManual.trim() : form.bankName.trim();

/** Build JSON body for POST /operations/employer/onboard (document fields are S3 fileKeys). */
const buildOnboardApiPayload = (
  form: OnboardFormState,
  paymentMethod: PaymentMethod,
  action: 'draft' | 'submit',
) => {
  const phoneDigits = form.mobileNumber.replace(/\D/g, '');
  const phone_no =
    phoneDigits.length === 10
      ? phoneDigits
      : phoneDigits.length === 12 && phoneDigits.startsWith('91')
        ? phoneDigits.slice(2)
        : form.mobileNumber.trim() || undefined;

  const emergencyPhoneDigits = form.emergencyContactNumber.replace(/\D/g, '');
  const emergencyPhone =
    emergencyPhoneDigits.length === 10
      ? emergencyPhoneDigits
      : emergencyPhoneDigits.length === 12 && emergencyPhoneDigits.startsWith('91')
        ? emergencyPhoneDigits.slice(2)
        : form.emergencyContactNumber.trim() || undefined;

  const alternatePhoneDigits = form.alternatePhone.replace(/\D/g, '');
  const alternatePhone =
    alternatePhoneDigits.length === 10
      ? alternatePhoneDigits
      : alternatePhoneDigits.length === 12 && alternatePhoneDigits.startsWith('91')
        ? alternatePhoneDigits.slice(2)
        : form.alternatePhone.trim() || undefined;

  const hasStructuredPresent =
    form.presentAddressLine1.trim() &&
    form.presentCity.trim() &&
    form.presentState.trim() &&
    form.presentPincode.trim();

  const presentAddress = hasStructuredPresent
    ? {
        line1: form.presentAddressLine1.trim(),
        city: form.presentCity.trim(),
        state: form.presentState.trim(),
        pincode: form.presentPincode.trim(),
      }
    : undefined;

  const useSamePermanent = form.sameAsPresentAddress.trim().toLowerCase() === 'yes';
  const hasStructuredPermanent =
    !useSamePermanent &&
    form.permanentAddressLine1.trim() &&
    form.permanentCity.trim() &&
    form.permanentState.trim() &&
    form.permanentPincode.trim();

  const permanentAddress = useSamePermanent
    ? presentAddress
    : hasStructuredPermanent
      ? {
          line1: form.permanentAddressLine1.trim(),
          city: form.permanentCity.trim(),
          state: form.permanentState.trim(),
          pincode: form.permanentPincode.trim(),
        }
      : undefined;

  const mapMaritalStatus = (value: string) => {
    const key = value.trim().toLowerCase();
    if (['unmarried', 'married', 'divorced', 'widowed'].includes(key)) return key;
    return undefined;
  };

  const personal = {
    ...(form.fullName.trim() ? { full_name: form.fullName.trim() } : {}),
    ...(form.email.trim() ? { email: form.email.trim() } : {}),
    ...(form.dateOfBirth.trim() ? { date_of_birth: form.dateOfBirth.trim() } : {}),
    ...(mapGender(form.gender) ? { gender: mapGender(form.gender) } : {}),
    ...(form.address.trim() && !presentAddress ? { address: form.address.trim() } : {}),
    ...(presentAddress
      ? {
          addresses: {
            present: presentAddress,
            ...(permanentAddress ? { permanent: permanentAddress } : {}),
          },
        }
      : {}),
    ...(form.bloodGroup.trim() ? { blood_group: form.bloodGroup.trim() } : {}),
    ...(alternatePhone ? { alternate_phone: alternatePhone } : {}),
    ...(mapMaritalStatus(form.maritalStatus)
      ? { marital_status: mapMaritalStatus(form.maritalStatus) }
      : {}),
    ...(form.fatherName.trim() ? { father_name: form.fatherName.trim() } : {}),
    ...(form.motherName.trim() ? { mother_name: form.motherName.trim() } : {}),
    ...(form.nationality.trim() ? { nationality: form.nationality.trim() } : {}),
    ...(form.religion.trim() ? { religion: form.religion.trim() } : {}),
    ...(form.languagesKnown.trim() ? { languages_known: form.languagesKnown.trim() } : {}),
    ...((form.probationPeriodMonths.trim() ||
      form.noticePeriodDays.trim() ||
      form.weeklyOff.trim() ||
      form.workingHours.trim() ||
      form.confirmationDate.trim()) && {
      employment_terms: {
        ...(parseNonNegativeNumber(form.probationPeriodMonths) !== undefined
          ? { probation_period_months: Math.floor(Number(form.probationPeriodMonths)) }
          : {}),
        ...(parseNonNegativeNumber(form.noticePeriodDays) !== undefined
          ? { notice_period_days: Math.floor(Number(form.noticePeriodDays)) }
          : {}),
        ...(form.weeklyOff.trim() ? { weekly_off: form.weeklyOff.trim() } : {}),
        ...(form.workingHours.trim() ? { working_hours: form.workingHours.trim() } : {}),
        ...(form.confirmationDate.trim()
          ? { confirmation_date: form.confirmationDate.trim() }
          : {}),
      },
    }),
    ...((form.emergencyContactName.trim() ||
      form.emergencyContactRelation.trim() ||
      emergencyPhone) && {
      emergency_contact: {
        ...(form.emergencyContactName.trim()
          ? { name: form.emergencyContactName.trim() }
          : {}),
        ...(form.emergencyContactRelation.trim()
          ? { relation: form.emergencyContactRelation.trim() }
          : {}),
        ...(emergencyPhone ? { phone_no: emergencyPhone } : {}),
      },
    }),
  };

  const job = {
    ...(form.designationId.trim() ? { designation_id: form.designationId.trim() } : {}),
    ...(form.departmentId.trim() ? { department_id: form.departmentId.trim() } : {}),
    ...(form.branchLocation.trim() ? { branch_location: form.branchLocation.trim() } : {}),
    ...(form.reportingSupervisorId.trim()
      ? { reporting_supervisor_id: form.reportingSupervisorId.trim() }
      : {}),
    ...(mapEmployeeType(form.employeeType)
      ? { employee_type: mapEmployeeType(form.employeeType) }
      : {}),
    ...(form.joiningDate.trim() ? { joining_date: form.joiningDate.trim() } : {}),
    ...(form.workShiftId.trim() ? { work_shift_id: form.workShiftId.trim() } : {}),
    ...(form.workLocation.trim() ? { work_location: form.workLocation.trim() } : {}),
    ...(form.skillTrade.trim() ? { skill_trade: form.skillTrade.trim() } : {}),
    ...(parseNonNegativeNumber(form.experienceYears) !== undefined
      ? { experience_years: parseNonNegativeNumber(form.experienceYears) }
      : {}),
    ...(form.certificationLicenses.trim()
      ? { certification_licenses: form.certificationLicenses.trim() }
      : {}),
    ...(form.safetyTrainingCompleted
      ? { safety_training_completed: toYesNoBoolean(form.safetyTrainingCompleted) }
      : {}),
  };

  const payment: Record<string, unknown> = {
    method: paymentMethod,
    ...(parseNonNegativeNumber(form.basicSalary) !== undefined
      ? { basic_salary: parseNonNegativeNumber(form.basicSalary) }
      : {}),
    ...(mapSalaryType(form.salaryType) ? { salary_type: mapSalaryType(form.salaryType) } : {}),
    ...(mapFrequency(form.salaryPaymentFrequency)
      ? { payment_frequency: mapFrequency(form.salaryPaymentFrequency) }
      : {}),
    overtime_eligible: toYesNoBoolean(form.overtimeEligible),
    pf_applicable: toYesNoBoolean(form.pfApplicable),
    esi_applicable: toYesNoBoolean(form.esiApplicable),
  };

  if (paymentMethod === 'upi') {
    payment.upi = {
      ...(form.upiId.trim() ? { upi_id: form.upiId.trim() } : {}),
      ...(form.upiName.trim() ? { name: form.upiName.trim() } : {}),
      ...(parseNonNegativeNumber(form.wageAmount) !== undefined
        ? { wage_amount: parseNonNegativeNumber(form.wageAmount) }
        : {}),
      ...(mapFrequency(form.upiPaymentFrequency)
        ? { frequency: mapFrequency(form.upiPaymentFrequency) }
        : {}),
    };
  }

  if (paymentMethod === 'bank') {
    payment.bank = {
      ...(form.accountHolderName.trim()
        ? { account_holder_name: form.accountHolderName.trim() }
        : {}),
      ...(form.accountNumber.trim() ? { account_number: form.accountNumber.trim() } : {}),
      ...(resolveBankName(form) ? { bank_name: resolveBankName(form) } : {}),
      ...(form.ifscCode.trim() ? { ifsc_code: form.ifscCode.trim().toUpperCase() } : {}),
    };
  }

  const uploadedDocuments = getUploadedOnboardDocuments(form.documents);
  const primaryDocument = uploadedDocuments[0];

  const identity = {
    ...(form.aadhaarNumber.trim() ? { aadhaar_number: form.aadhaarNumber.trim() } : {}),
    ...(form.panNumber.trim() ? { pan_number: form.panNumber.trim().toUpperCase() } : {}),
    ...(form.drivingLicenseNumber.trim()
      ? { driving_license_number: form.drivingLicenseNumber.trim() }
      : {}),
    ...(form.voterId.trim() ? { voter_id: form.voterId.trim() } : {}),
    ...(form.uanNumber.trim() ? { uan_number: form.uanNumber.trim() } : {}),
    ...(form.esiNumber.trim() ? { esi_number: form.esiNumber.trim() } : {}),
    ...(form.pfNumber.trim() ? { pf_number: form.pfNumber.trim() } : {}),
    ...(primaryDocument?.fileKey
      ? { identity_document_url: primaryDocument.fileKey.trim() }
      : {}),
  };

  return {
    action,
    ...(phone_no ? { phone_no } : {}),
    ...(form.karigariId.trim() ? { karigari_id: form.karigariId.trim() } : {}),
    ...(form.employeeNumber.trim() ? { employee_no: form.employeeNumber.trim() } : {}),
    ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    ...(Object.keys(personal).length ? { personal } : {}),
    ...(Object.keys(job).length ? { job } : {}),
    ...(action === 'submit' || Object.keys(payment).length > 4 ? { payment } : {}),
    ...(Object.keys(identity).length ? { identity } : {}),
  };
};

const formatSalary = (amount: string, type: string) => {
  if (!amount.trim()) {
    return '-';
  }

  return type.trim() ? `${amount.trim()} / ${type.trim()}` : amount.trim();
};

const createOnboardDetails = (form: OnboardFormState, paymentMethod: PaymentMethod): Employee['onboardDetails'] => ({
  personal: [
    ['Full Name', form.fullName],
    ['Date of Birth', form.dateOfBirth],
    ['Gender', form.gender],
    ['Blood Group', form.bloodGroup],
  ],
  contact: [
    ['Mobile Number', form.mobileNumber],
    ['Email', form.email],
    ['Present Address', form.address],
    ['Permanent Address', form.address],
  ],
  emergency: [
    ['Contact Name', form.emergencyContactName],
    ['Relation', form.emergencyContactRelation],
    ['Mobile Number', form.emergencyContactNumber],
  ],
  identity: [
    ['Aadhaar Number', form.aadhaarNumber],
    ['PAN Number', form.panNumber],
    ['Driving License', form.drivingLicenseNumber],
    ['Karigari ID', form.karigariId],
  ],
  other: [
    ['Employee Type', form.employeeType],
    ['Safety Training Completed', form.safetyTrainingCompleted],
  ],
  job: [
    ['Department', form.departmentLabel],
    ['Job Title', form.designationLabel],
    ['Job Role', form.skillTrade],
    ['Job Type', form.employeeType],
    ['Work Location', form.branchLocation],
    ['Date of Joining', form.joiningDate],
    ['Employee Status', ''],
  ],
  work: [
    ['Shift', form.workShiftLabel],
    ['Work Location / Site', form.workLocation],
    ['Experience (Years)', form.experienceYears],
    ['Certification / Licenses', form.certificationLicenses],
  ],
  payroll: [
    ['Reporting Manager', form.reportingSupervisorLabel],
    ['Payment Mode', paymentMethod === 'bank' ? 'Bank Transfer' : paymentMethod === 'upi' ? 'UPI Transfer' : 'Cash Payment'],
    ['Basic Salary / Wage', form.basicSalary],
    ['Salary / Wage Type', form.salaryType],
    ['Payment Frequency', form.salaryPaymentFrequency || form.upiPaymentFrequency],
    ['CTC', formatSalary(form.basicSalary || form.wageAmount, form.salaryType || form.upiPaymentFrequency)],
  ],
  bank: [
    ['Bank Name', resolveBankName(form) || form.bankName],
    ['Account Number', form.accountNumber],
    ['IFSC Code', form.ifscCode],
    ['Account Holder Name', form.accountHolderName],
    ['UPI ID', form.upiId],
    ['Name on UPI', form.upiName],
  ],
  payment: [
    ['Payment Mode', paymentMethod === 'bank' ? 'Bank Transfer' : paymentMethod === 'upi' ? 'UPI Transfer' : 'Cash Payment'],
    ['Basic Salary / Wage', form.basicSalary || form.wageAmount],
    ['Payment Frequency', form.salaryPaymentFrequency || form.upiPaymentFrequency],
    ['Overtime Eligible', form.overtimeEligible],
    ['PF Applicable', form.pfApplicable],
    ['ESI Applicable', form.esiApplicable],
  ],
  documents: getUploadedOnboardDocuments(form.documents).map((doc) => [
    doc.documentType,
    doc.documentNumber || '-',
    doc.fileKey,
    '-',
    'Uploaded',
  ]),
  notes: form.notes,
});

const hasRequiredDocuments = (form: OnboardFormState) =>
  getUploadedOnboardDocuments(form.documents).length > 0;

const createEmployeeFromForm = (form: OnboardFormState, paymentMethod: PaymentMethod, action: 'draft' | 'submit'): Employee => {
  const employeeNo = form.employeeNumber.trim();
  const generatedId = `EMP${Date.now().toString().slice(-6)}`;
  const status: Status = action === 'submit' && hasRequiredDocuments(form) ? 'Probation' : 'Onboard';

  return {
    id: employeeNo || generatedId,
    uid: form.karigariId.trim() || '-',
    name: displayOrDash(form.fullName),
    email: displayOrDash(form.email),
    phone: displayOrDash(normalizePhoneNumber(form.mobileNumber)),
    designation: displayOrDash(form.designationLabel),
    status,
    rating: 0,
    joined: displayOrDash(form.joiningDate),
    location: displayOrDash(form.branchLocation || form.workLocation),
    department: displayOrDash(form.departmentLabel),
    salary: formatSalary(form.basicSalary || form.wageAmount, form.salaryType || form.upiPaymentFrequency),
    onboardDetails: createOnboardDetails(form, paymentMethod),
  };
};

function EmployeesPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f7f8] text-[#111827]">
      <TopBar />
      <main className="p-[20px]">{children}</main>
    </div>
  );
}

export function EmployeeListScreen() {
  const router = useRouter();
  const {
    search,
    selectedDesignations,
    selectedStatuses,
    employeeVersion,
    setSearch,
    setSelectedDesignations,
    setSelectedStatuses,
  } = useEmployeeStore();

  const [page, setPage] = useState(1);
  const [roster, setRoster] = useState<'active' | 'past'>('active');

  const { employees, facets, pagination, isFetching, isInitialLoading, error } = useEmployeesList({
    roster,
    search,
    selectedDesignations,
    selectedStatuses,
    page,
    refreshKey: employeeVersion,
  });

  useEffect(() => {
    setPage(1);
  }, [search, selectedDesignations, selectedStatuses, roster]);

  const designationOptions = useMemo(() => {
    const fromFacets = facets?.designation ? Object.keys(facets.designation) : [];
    const merged = new Set([...fromFacets, ...selectedDesignations]);
    return [...merged].sort((a, b) => a.localeCompare(b));
  }, [facets?.designation, selectedDesignations]);

  const statusOptions = useMemo(() => {
    const fromFacets = facets?.status ? Object.keys(facets.status) : [];
    const merged = new Set([...fromFacets, ...statuses, ...selectedStatuses]);
    return [...merged].sort((a, b) => a.localeCompare(b));
  }, [facets?.status, selectedStatuses]);

  const openDetails = (employee: Employee) => {
    if (!employee.employmentId) return;
    router.push(employeeDetailPath(employee.employmentId));
  };

  return (
    <EmployeesPageShell>
      <EmployeeList
        employees={employees}
        roster={roster}
        search={search}
        selectedDesignations={selectedDesignations}
        selectedStatuses={selectedStatuses}
        designationOptions={designationOptions}
        statusOptions={statusOptions}
        designationFacetCounts={facets?.designation}
        statusFacetCounts={facets?.status}
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        isFetching={isFetching}
        isInitialLoading={isInitialLoading}
        error={error}
        onSearch={setSearch}
        onDesignations={setSelectedDesignations}
        onStatuses={setSelectedStatuses}
        onPageChange={setPage}
        onRosterChange={setRoster}
        onAdd={() => router.push(EMPLOYEE_ONBOARD_PATH)}
        onView={openDetails}
      />
    </EmployeesPageShell>
  );
}

export function EmployeeDetailScreen({ employmentId }: { employmentId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { uploadOpen, setUploadOpen } = useEmployeeStore();

  const activeTab = detailTabFromSearchParam(searchParams.get('tab'));
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [uploadContext, setUploadContext] = useState<DocumentUploadContext | null>(null);

  const refreshEmployee = (fallback?: Employee) => {
    setDetailLoading(true);
    setDetailError(null);
    return fetchEmployeeDetails(employmentId)
      .then((dto) => {
        const mapped = mapEmploymentDtoToEmployee(dto, fallback ?? employee ?? undefined);
        setEmployee(mapped);
        return mapped;
      })
      .catch((err: unknown) => {
        setDetailError(err instanceof Error ? err.message : 'Failed to load employee details');
        throw err;
      })
      .finally(() => setDetailLoading(false));
  };

  useEffect(() => {
    void refreshEmployee();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when employment id changes
  }, [employmentId]);

  const handleTabChange = (tab: DetailTab) => {
    router.replace(employeeDetailPath(employmentId, tab));
  };

  const handleDocumentUploadRequest = (ctx: Omit<DocumentUploadContext, 'employmentId'>) => {
    setUploadContext({
      employmentId,
      documentType: ctx.documentType,
      documentNumber: ctx.documentNumber,
    });
    setUploadOpen(true);
  };

  if (!employee && detailLoading) {
    return (
      <EmployeesPageShell>
        <p className="py-12 text-center text-sm text-[#676767]">Loading employee profile…</p>
      </EmployeesPageShell>
    );
  }

  return (
    <EmployeesPageShell>
      <EmployeeDetails
        employee={
          employee ?? {
            id: employmentId.slice(0, 8).toUpperCase(),
            uid: '-',
            name: '-',
            email: '',
            phone: '',
            designation: '-',
            status: 'Onboard',
            rating: 0,
            joined: '-',
            location: '',
            department: '',
            salary: '-',
            employmentId,
          }
        }
        activeTab={activeTab}
        loading={detailLoading}
        error={detailError}
        onTab={handleTabChange}
        onBack={() => router.push(EMPLOYEE_LIST_PATH)}
        onUpload={handleDocumentUploadRequest}
      />

      {uploadOpen && uploadContext && (
        <UploadModal
          employmentId={uploadContext.employmentId}
          documentType={uploadContext.documentType}
          documentNumber={uploadContext.documentNumber}
          onClose={() => {
            setUploadOpen(false);
            setUploadContext(null);
          }}
          onSuccess={() => {
            void refreshEmployee(employee ?? undefined).finally(() => {
              setUploadOpen(false);
              setUploadContext(null);
            });
          }}
        />
      )}
    </EmployeesPageShell>
  );
}

export function EmployeeOnboardScreen() {
  const router = useRouter();
  const { paymentMethod, setPaymentMethod, bumpEmployeeListVersion } = useEmployeeStore();

  return (
    <EmployeesPageShell>
      <AddEmployee
        paymentMethod={paymentMethod}
        onPaymentMethod={setPaymentMethod}
        onAddEmployee={() => {
          bumpEmployeeListVersion();
          router.push(EMPLOYEE_LIST_PATH);
        }}
        onBack={() => router.push(EMPLOYEE_LIST_PATH)}
      />
    </EmployeesPageShell>
  );
}

/** @deprecated Use route-based screens: EmployeeListScreen, EmployeeDetailScreen, EmployeeOnboardScreen */
export const EmployeeDashboardScreen = EmployeeListScreen;

function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#D3D3D3] bg-white px-4 sm:px-6 lg:px-8">
      <div className="relative w-full max-w-[315px]">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#676767]" />
        <input
          className="h-12 w-full rounded-lg bg-[#FAFAFA] pl-12 pr-4 text-sm outline-none ring-1 ring-transparent focus:ring-blue-500"
          placeholder="Search anything..."
        />
      </div>
      <div className="flex items-center gap-5">
        <button className="relative rounded-full p-2 text-[#676767] hover:bg-[#FAFAFA]" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-1 h-2 w-2 rounded-full bg-blue-600" />
        </button>
        <button className="rounded-full p-2 text-[#676767] hover:bg-[#FAFAFA]" aria-label="Help">
          <HelpCircle className="h-5 w-5" />
        </button>
        <div className="hidden h-10 w-px bg-gray-200 sm:block" />
        <div className="flex items-center gap-3">
          <Avatar name="Abhinav Barwal" size="md" />
          <div className="hidden sm:block">
            <p className="text-sm font-semibold">Abhinav Barwal</p>
            <p className="text-xs text-[#676767]">Operations Head</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function EmployeeList({
  employees,
  roster,
  search,
  selectedDesignations,
  selectedStatuses,
  designationOptions,
  statusOptions,
  designationFacetCounts,
  statusFacetCounts,
  page,
  totalPages,
  total,
  isFetching,
  isInitialLoading,
  error,
  onSearch,
  onDesignations,
  onStatuses,
  onPageChange,
  onRosterChange,
  onAdd,
  onView,
}: {
  employees: Employee[];
  roster: 'active' | 'past';
  search: string;
  selectedDesignations: string[];
  selectedStatuses: Status[];
  designationOptions: string[];
  statusOptions: string[];
  designationFacetCounts?: Record<string, number>;
  statusFacetCounts?: Record<string, number>;
  page: number;
  totalPages: number;
  total: number;
  isFetching: boolean;
  isInitialLoading: boolean;
  error: string | null;
  onSearch: (value: string) => void;
  onDesignations: (value: string[]) => void;
  onStatuses: (value: Status[]) => void;
  onPageChange: (page: number) => void;
  onRosterChange: (roster: 'active' | 'past') => void;
  onAdd: () => void;
  onView: (employee: Employee) => void;
}) {
  const activePage = Math.min(page, totalPages);

  return (
    <section className={`rounded-[20px] border border-[#D3D3D3] bg-white p-[20px] shadow-sm ${isFetching && !isInitialLoading ? 'opacity-90' : ''}`}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-normal">EMPLOYEES</h1>
          <p className="mt-1 text-sm text-[#676767]">Manage Your Employee</p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0658C2] px-8 text-base font-semibold text-white shadow-sm hover:bg-blue-700 cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          Add New Onboard
        </button>
      </div>

      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-[#D3D3D3] p-1">
          <button
            type="button"
            onClick={() => onRosterChange('active')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              roster === 'active'
                ? 'bg-[#0658C2] text-white'
                : 'text-[#676767] hover:bg-[#FAFAFA]'
            }`}
          >
            Current Employees
          </button>
          <button
            type="button"
            onClick={() => onRosterChange('past')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              roster === 'past'
                ? 'bg-[#0658C2] text-white'
                : 'text-[#676767] hover:bg-[#FAFAFA]'
            }`}
          >
            Left / Terminated
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-4 sm:flex-row xl:items-center xl:justify-between">
        <div className="relative max-w-full sm:max-w-[500px] flex-1">
          <Search className="absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            className="h-12 w-full rounded-lg border border-gray-300 px-6 pr-14 text-sm outline-none focus:border-[#0658C2]"
            placeholder="Search Employee..."
          />
        </div>
        <div className="flex flex-row flex-wrap  gap-4 sm:flex-row">
          <MultiSelect
            label="All Designations"
            selectedLabel="Designation"
            options={designationOptions}
            selected={selectedDesignations}
            facetCounts={designationFacetCounts}
            onChange={onDesignations}
          />
          <MultiSelect
            label="All Status"
            selectedLabel="Status"
            options={statusOptions}
            selected={selectedStatuses}
            facetCounts={statusFacetCounts}
            onChange={(items) => onStatuses(items as Status[])}
          />
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left rounded-t-[12px] overflow-hidden">
          <thead>
            <tr className="bg-[#FAFAFA] text-sm font-semibold text-[#676767]">
              <th className="px-5 py-[10px]">Employee Name</th>
              <th className="px-5 py-[10px]">ID & Designation</th>
              <th className="px-5 py-[10px]">Phone</th>
              <th className="px-5 py-[10px]">Rating</th>
              <th className="px-5 py-[10px]">Date of Joined</th>
              <th className="px-5 py-[10px]">Status</th>
              <th className="px-5 py-[10px] text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {isInitialLoading ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm text-[#676767]">
                  Loading employees…
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm text-[#676767]">
                  No employees found
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
              <tr key={employee.id} className="border-b border-[#D3D3D3] text-sm">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={employee.name} size="sm" />
                    <div>
                      <p className="font-medium leading-4">{employee.name}</p>
                      <p className="text-xs text-[#676767]">{employee.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <p className="font-medium leading-4">{employee.designation}</p>
                  <p className="text-xs text-[#676767]">ID: {employee.id}</p>
                </td>
                <td className="px-5 py-3">{employee.phone}</td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 fill-[#FFA000] text-[#FFA000]" />
                    {employee.rating}
                  </span>
                </td>
                <td className="px-5 py-3">{employee.joined}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={employee.status} />
                </td>
                <td className="px-5 py-3 text-center">
                  <button
                    onClick={() => onView(employee)}
                    className="rounded-full p-2 text-[#0658C2] hover:bg-[#DBEAFF] cursor-pointer"
                    aria-label={`View ${employee.name}`}
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={activePage}
        totalPages={Math.max(1, totalPages)}
        onPageChange={onPageChange}
      />
      {!isInitialLoading && total > 0 && (
        <p className="mt-2 text-center text-xs text-[#676767]">
          Showing page {activePage} of {Math.max(1, totalPages)} ({total} employees)
        </p>
      )}
    </section>
  );
}

function MultiSelect({
  label,
  selectedLabel,
  options,
  selected,
  facetCounts,
  onChange,
}: {
  label: string;
  selectedLabel: string;
  options: string[];
  selected: string[];
  facetCounts?: Record<string, number>;
  onChange: (items: string[]) => void;
}) {
  const { openDropdown, setOpenDropdown } = useEmployeeStore();
  const dropdownId = `filter-${selectedLabel}`;
  const open = openDropdown === dropdownId;
  const selectedText = selected.length ? `${selectedLabel} (${selected.length})` : label;

  const toggle = (option: string) => {
    onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]);
  };
  const [search, setSearch] = useState('');

  const filteredOptions = options.filter(
    (option) =>
      !selected.includes(option) &&
      option.toLowerCase().includes(search.toLowerCase())
  );

  const formatOption = (option: string) => {
    const count = facetCounts?.[option];
    return count != null ? `${option} (${count})` : option;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpenDropdown(open ? null : dropdownId)}
        className={`flex h-12 min-w-[210px] items-center justify-between rounded-xl border px-6 text-base font-semibold cursor-pointer ${
          open ? 'border-[#0658C2] text-blue-950' : 'border-gray-300 text-gray-900'
        }`}
      >
        {selectedText}
        {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute left-0 sm:left-auto sm:right-0 z-30 mt-2 w-[212px] sm:w-[300px] rounded-xl border border-[#DBEAFF] bg-white p-3 shadow-xl">
          {/* Search */}
          <div className="relative mb-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${selectedLabel === 'Status' ? 'Status' : 'Designation'}...`}
              className="w-full rounded-md border border-transparent bg-[#F8F8F8] px-[16px] py-[9px] text-[14px] outline-none focus:border-[#0658C2]"
            />

            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#000000]">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>

          <button
            onClick={() => onChange(options)}
            className="flex w-full items-center justify-between rounded-md bg-[#DBEAFF] px-[16px] py-[9px] text-left text-[#0658C2] text-[14px]"
          >
            {label}
            <span className="relative h-4 w-4 rounded bg-white">
              <span className="absolute inset-0 bg-[url('/Vector-Check.svg')] bg-[length:15px_16px] top-[-2px] left-[2px] bg-no-repeat w-[22px]" />
            </span>
          </button>

          {selected.length > 0 && (
            <>
              <div className="flex items-center justify-between px-1 py-3 text-xs font-semibold uppercase text-[#676767]">
                <span>Selected ({selected.length})</span>

                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="normal-case text-[#0658C2] cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              <div className="max-h-[260px] overflow-y-auto space-y-1 border-b border-[#D3D3D3] pb-3">
                {selected.map((option) => (
                  <button
                    key={option}
                    onClick={() => toggle(option)}
                    className="flex w-full items-center justify-between rounded-md bg-[#DBEAFF] px-[16px] py-[9px] text-[14px] text-left text-[#0658C2] cursor-pointer"
                  >
                    {formatOption(option)}

                    <span className="relative h-4 w-4 rounded bg-white">
                      <span className="absolute inset-0 bg-[url('/Vector-Check.svg')] bg-[length:15px_16px] top-[-2px] left-[2px] bg-no-repeat w-[22px]" />
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          <p className="px-1 py-3 text-xs font-semibold uppercase text-[#676767]">
            Available {selectedLabel === 'Status' ? 'Statuses' : 'Designations'}
          </p>

          <div className="max-h-[260px] space-y-1 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => toggle(option)}
                  className="group flex w-full items-center justify-between rounded-md border border-[#D3D3D3] px-[16px] py-[9px] text-[14px] text-left hover:bg-[#DBEAFF] cursor-pointer hover:border-transparent hover:text-[#0658C2]"
                >
                  {formatOption(option)}

                  <span className="h-4 w-4 rounded border border-[#D3D3D3] group-hover:bg-white group-hover:border-transparent" />
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-[#676767]">No results found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EmployeeDetails({
  employee,
  activeTab,
  loading,
  error,
  onTab,
  onBack,
  onUpload,
}: {
  employee: Employee;
  activeTab: DetailTab;
  loading?: boolean;
  error?: string | null;
  onTab: (tab: DetailTab) => void;
  onBack: () => void;
  onUpload: (ctx: Omit<DocumentUploadContext, 'employmentId'>) => void;
}) {
  return (
    <section className="rounded-[24px] border border-[#D3D3D3] bg-white p-[20px] shadow-sm">
      <PageTitle title="Employee Details" crumb="Employees > Employee Details" onBack={onBack} />
      <EmployeeHero employee={employee} />
      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-5 grid rounded-xl border border-[#D3D3D3] bg-white shadow-sm sm:grid-cols-3 lg:grid-cols-6 overflow-hidden">
        {detailTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTab(tab)}
            className={`h-12 border-b-2 text-sm font-semibold text-[#0658C2] cursor-pointer ${
              activeTab === tab ? 'border-[#0658C2]' : 'border-transparent'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="mt-5">
        {loading ? (
          <p className="py-12 text-center text-sm text-[#676767]">Loading employee profile…</p>
        ) : (
          <>
            {activeTab === 'Personal Info' && <PersonalInfo employee={employee} />}
            {activeTab === 'Job & Work Info' && <JobWorkInfo employee={employee} />}
            {activeTab === 'Documents' && <DocumentsTab employee={employee} onUpload={onUpload} />}
            {activeTab === 'Bank & Payments' && <BankPayments employee={employee} />}
            {activeTab === 'Attendance' && <Attendance />}
            {activeTab === 'Leave' && <LeaveTab />}
          </>
        )}
      </div>
    </section>
  );
}

function EmployeeHero({ employee }: { employee: Employee }) {
  const editing = false;
  const [draft, setDraft] = useState({
    name: employee.name,
    designation: employee.designation,
    phone: employee.phone,
    email: employee.email,
    location: employee.location,
    department: employee.department,
    salary: employee.salary,
  });

  useEffect(() => {
    setDraft({
      name: employee.name,
      designation: employee.designation,
      phone: employee.phone,
      email: employee.email,
      location: employee.location,
      department: employee.department,
      salary: employee.salary,
    });
  }, [employee]);

  const heroInput = (key: keyof typeof draft, className = '') => (
    <input
      value={draft[key]}
      onChange={(event) => setDraft((value) => ({ ...value, [key]: event.target.value }))}
      className={`rounded-md border border-[#D3D3D3] px-3 py-1 outline-none focus:border-[#0658C2] ${className}`}
    />
  );

  return (
    <div className="mt-6 rounded-xl border border-[#D3D3D3] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <Avatar name={employee.name} size="xl" />
          <div>
            <div className="flex flex-wrap items-center gap-4">
              {editing ? (
                heroInput('name', 'text-2xl font-bold uppercase')
              ) : (
                <h2 className="text-2xl font-bold uppercase">{draft.name}</h2>
              )}
              <StatusBadge status={employee.status} />
              <span className="inline-flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
                {employee.rating}
              </span>
            </div>
            {editing ? (
              heroInput('designation', 'mt-2 text-lg font-semibold')
            ) : (
              <p className="text-lg font-semibold">{draft.designation}</p>
            )}
            <p className="mt-1 text-sm text-[#676767]">
              EMP ID :- {employee.id} <span className="mx-4">|</span> UID :- {employee.uid}
            </p>
            <div className="mt-5 grid gap-3 text-sm">
              {editing ? (
                <>
                  <EditableIconLine icon={Phone}>{heroInput('phone')}</EditableIconLine>
                  <EditableIconLine icon={Mail}>{heroInput('email')}</EditableIconLine>
                </>
              ) : (
                <>
                  <IconLine icon={Phone} text={draft.phone} />
                  <IconLine icon={Mail} text={draft.email} />
                </>
              )}
              <IconLine icon={MapPin} text={displayOrDash(employee.onboardDetails?.contact.find(([label]) => label === 'Present Address')?.[1])} />
            </div>
          </div>
        </div>
        <div className="grid gap-5 border-[#D3D3D3] grid-cols-2 xl:border-l xl:pl-8">
          <HeroMetric icon={Calendar} label="Date of Joining" value={displayOrDash(employee.joined)} />
          <HeroMetric icon={MapPin} label="Work Location" value={displayOrDash(draft.location)} editable={editing} onChange={(value) => setDraft((item) => ({ ...item, location: value }))} />
          <HeroMetric icon={Users} label="Reporting Manager" value={displayOrDash(employee.onboardDetails?.payroll.find(([label]) => label === 'Reporting Manager')?.[1])} />
          <HeroMetric icon={Briefcase} label="Job Type" value={displayOrDash(employee.onboardDetails?.job.find(([label]) => label === 'Job Type')?.[1])} />
          <HeroMetric icon={Building2} label="Department" value={draft.department} editable={editing} onChange={(value) => setDraft((item) => ({ ...item, department: value }))} />
          <HeroMetric icon={CreditCard} label="Salary" value={displayOrDash(draft.salary)} editable={editing} onChange={(value) => setDraft((item) => ({ ...item, salary: value }))} />
        </div>
      </div>
      {/* <button
        type="button"
        onClick={() => setEditing((value) => !value)}
        className="float-right -mt-2 inline-flex items-center gap-1 text-sm text-[#0658C2]">
        <Edit3 className="h-4 w-4" /> {editing ? 'Save' : 'Edit'}
      </button> */}
    </div>
  );
}

function PersonalInfo({ employee }: { employee: Employee }) {
  const details = employee.onboardDetails;
  const emptyRow: string[][] = [['—', 'No data available']];

  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      <InfoCard title="Personal Information" icon={IdCard} rows={details?.personal ?? emptyRow} />
      <div className="space-y-4">
        <InfoCard title="Contact Information" icon={Phone} rows={details?.contact ?? emptyRow} />
                </div>
        <div className="space-y-4">
        <InfoCard title="Emergency Contact" icon={Phone} rows={details?.emergency ?? emptyRow} />

      </div>
      <div className="space-y-4">
        <InfoCard title="Identity Details" icon={IdCard} rows={details?.identity ?? emptyRow} />
      </div>
      <div className="space-y-4">
        <InfoCard title="Other Information" icon={Briefcase} rows={details?.other ?? emptyRow} />
      </div>
    </div>
  );
}

function JobWorkInfo({ employee }: { employee: Employee }) {
  const details = employee.onboardDetails;
  const emptyRow: string[][] = [['—', 'No data available']];
  const jobRows = details?.job.map(([label, value]): string[] => [
    label || '',
    label === 'Employee Status' ? employee.status : value || '',
  ]);

  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      <InfoCard title="Job Information" icon={Briefcase} rows={jobRows ?? emptyRow} />
      <InfoCard title="Work Details" icon={Wrench} rows={details?.work ?? emptyRow} />
      <InfoCard title="Reporting & Payroll" icon={Users} rows={details?.payroll ?? emptyRow} />
    </div>
  );
}

function DocumentsTab({
  employee,
  onUpload,
}: {
  employee: Employee;
  onUpload: (ctx: Omit<DocumentUploadContext, 'employmentId'>) => void;
}) {
  const [documents, setDocuments] = useState<string[][]>(employee.onboardDetails?.documents ?? []);
  const [editingRows, setEditingRows] = useState<number[]>([]);
  const [openingDoc, setOpeningDoc] = useState(false);
  const [docActionError, setDocActionError] = useState<string | null>(null);

  useEffect(() => {
    setDocuments(employee.onboardDetails?.documents ?? []);
  }, [employee.onboardDetails?.documents]);

  const updateDocument = (rowIndex: number, cellIndex: number, value: string) => {
    setDocuments((items) =>
      items.map((row, index) =>
        index === rowIndex
          ? row.map((cellValue, currentCellIndex) =>
              currentCellIndex === cellIndex ? value : cellValue,
            )
          : row,
      ),
    );
  };

  const addDocument = () => {
    onUpload({ documentType: 'Other Document' });
  };

  const handleOpenDocument = async (fileRef: string) => {
    if (!fileRef?.trim() || fileRef === '-') return;
    setOpeningDoc(true);
    setDocActionError(null);
    try {
      await openStoredDocument(fileRef);
    } catch (error) {
      setDocActionError((error as Error).message || 'Could not open document');
    } finally {
      setOpeningDoc(false);
    }
  };

  const renderDocumentCell = (cell: string | undefined, cellIndex: number) => {
    if (cellIndex === 2) return formatDocumentStoredValue(cell ?? '');
    return cell ?? '';
  };

  return (
    <div className="outer-main">
      {docActionError && (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {docActionError}
        </p>
      )}
      <div className="table-data overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse text-left text-sm rounded-t-[12px] overflow-hidden">
          <thead>
            <tr className="bg-[#FAFAFA] text-[#676767]">
              <th className="px-5 py-[10px]">Document Type</th>
              <th className="px-5 py-[10px]">Document Number</th>
              <th className="px-5 py-[10px]">Uploaded On</th>
              <th className="px-5 py-[10px]">Expiry Date</th>
              <th className="px-5 py-[10px]">Status</th>
              <th className="px-5 py-[10px] text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-[#676767]">
                  No documents yet. Use ADD DOCUMENT to upload files.
                </td>
              </tr>
            )}
            {documents.map(([type, number, uploaded, expiry, status], rowIndex) => {
              const editing = editingRows.includes(rowIndex);
              const fileRef = uploaded?.trim() && uploaded !== '-' ? uploaded : '';
              return (
              <tr key={`${type}-${rowIndex}`} className="border-b border-[#D3D3D3]">
                {[type, number, uploaded, expiry].map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-5 py-4">
                    {editing ? (
                      <input
                        value={cell}
                        onChange={(event) => updateDocument(rowIndex, cellIndex, event.target.value)}
                        className="h-9 w-full rounded-md border border-[#D3D3D3] px-3 outline-none focus:border-[#0658C2]"
                      />
                    ) : (
                      renderDocumentCell(cell, cellIndex)
                    )}
                  </td>
                ))}
                <td className="px-5 py-4">
                    <span
                      className={`rounded-md border px-4 py-1.5 text-xs font-semibold [display:ruby] ${
                        status === 'Expired'
                          ? 'border-red-500 bg-[#FEE9E5] text-red-600'
                          : status === 'Pending Upload'
                            ? 'border-[#0658C2] bg-[#DBEAFF] text-[#0658C2]'
                            : 'border-[#4CAF50] bg-[#E5FFEB] text-[#4CAF50]'
                      }`}
                    >
                      {status}
                    </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-center gap-3 text-[#0658C2]">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingRows((items) =>
                          editing ? items.filter((item) => item !== rowIndex) : [...items, rowIndex],
                        )
                      }
                    >
                      {editing ? 'Save' : 'Edit'}
                    </button>
                    {status === 'Pending Upload' ? (
                      <button
                        type="button"
                        onClick={() =>
                          onUpload({
                            documentType: type ?? 'Document',
                            documentNumber: number && number !== '-' ? number : undefined,
                          })
                        }
                      >
                        Upload
                      </button>
                    ) : (
                      <>
                      <button
                        type="button"
                        disabled={!fileRef || openingDoc}
                        onClick={() => void handleOpenDocument(fileRef)}
                        aria-label={`View ${type}`}
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        disabled={!fileRef || openingDoc}
                        onClick={() => void handleOpenDocument(fileRef)}
                        aria-label={`Download ${type}`}
                      >
                        <Download className="h-5 w-5" />
                      </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
      <button
        onClick={addDocument}
        className="mt-3 flex h-11 w-full items-center justify-center gap-2 border border-[#0658C2] text-sm font-semibold text-[#0658C2]">
        <Plus className="h-4 w-4" /> ADD DOCUMENT
      </button>
    </div>
  );
}

function BankPayments({ employee }: { employee: Employee }) {
  const details = employee.onboardDetails;
  const history = Array.from({ length: 10 }, (_, index) => ({
    id: index,
    month: 'May 2026',
    payDate: '31 May 2026',
    paidDays: 26,
    gross: '₹ 100,000',
    deductions: '₹ 35,000',
    net: '₹ 65,000',
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <InfoCard title="Bank Details" icon={Landmark} rows={details?.bank ?? [
          ['Bank Name', 'State Bank of India'],
          ['Account Number', '100085678394'],
          ['IFSC Code', 'ADHF000678'],
          ['Branch', 'Chauntra'],
          ['Account Holder Name', 'Abhinav Barwal'],
          ['Account Type', 'Savings'],
        ]} />
        <InfoCard title="Salary & Payment Details" icon={WalletCards} rows={details?.payment ?? [
          ['Payroll Group', 'Monthly Paid Worker'],
          ['Payroll Schedule', 'Monthly'],
          ['Payment Mode', 'Bank Transfer'],
          ['Salary Structure', 'Electrician - Grade 2'],
          ['Basic Salary', '₹ 65,000'],
          ['Allowances', '₹ 35,000'],
          ['Total Salary (CTC)', '₹ 100,000 / Month'],
          ['Effective Form', '02 June 2026'],
        ]} />
      </div>
      <div className="rounded-xl border border-[#D3D3D3] p-5 shadow-sm">
        <SectionHeading icon={Clock} title="Payment History" />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead>
              <tr className="bg-[#FAFAFA] text-[#676767]">
                {['Month', 'Pay Date', 'Paid Days', 'Gross Salary', 'Deductions', 'Net Pay', 'Payslip'].map((head) => (
                  <th key={head} className="px-5 py-4">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} className="border-b border-[#D3D3D3]">
                  <td className="px-5 py-4">{item.month}</td>
                  <td className="px-5 py-4">{item.payDate}</td>
                  <td className="px-5 py-4">{item.paidDays}</td>
                  <td className="px-5 py-4">{item.gross}</td>
                  <td className="px-5 py-4">{item.deductions}</td>
                  <td className="px-5 py-4">{item.net}</td>
                  <td className="px-5 py-4 text-[#0658C2]">
                    <Download className="h-5 w-5" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={1} totalPages={1} onPageChange={() => undefined} />
      </div>
    </div>
  );
}

function Attendance() {
  const [calendarDate, setCalendarDate] = useState(new Date(2026, 5, 1));
  const [legendsOpen, setLegendsOpen] = useState(true);
  const [logOpen, setLogOpen] = useState(true);
  const calendarDays = useMemo(() => buildCalendarDays(calendarDate), [calendarDate]);
  const monthLabel = calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const changeMonth = (offset: number) => {
    setCalendarDate((date) => new Date(date.getFullYear(), date.getMonth() + offset, 1));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#D3D3D3] shadow-sm overflow-x-auto">
        <div className="calendar min-w-[900px]">
          <div className="flex items-center justify-between px-5 py-4">
            <button type="button" onClick={() => changeMonth(-1)} className="inline-flex items-center gap-2 text-[#676767]">
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <h3 className="text-2xl font-semibold">{monthLabel}</h3>
            <button type="button" onClick={() => changeMonth(1)} className="inline-flex items-center gap-2 text-[#676767]">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 border-t border-[#D3D3D3] bg-[#FAFAFA] text-sm font-semibold text-[#676767]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="px-4 py-3">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map(({ day, code, muted }, index) => (
              <div
                key={`${day}-${index}`}
                className={`min-h-[92px] border-r border-t border-[#D3D3D3] p-3 text-sm hover:bg-[#e7effb] ${muted ? 'text-gray-300' : 'text-[#676767]'} ${
                  code === 'P'
                    ? 'bg-[#E5FFEB]'
                    : code === 'A'
                      ? 'bg-[#FEE9E5]'
                      : code === 'L'
                        ? 'bg-[#EDE9FE]'
                        : code === 'H'
                          ? 'bg-[#DBEAFF]'
                          : code === 'OF'
                            ? 'bg-[#F4F4F4]'
                            : 'bg-white'
                }`}
              >
                <span>{day.toString().padStart(2, '0')}</span>
                {code && (
                  <div className={`mt-2 text-center font-semibold ${legendColor(code)}`}>{code}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <CollapsibleTitle title="Legends" open={legendsOpen} onToggle={() => setLegendsOpen((value) => !value)} />
      {legendsOpen && (
        <div className="grid gap-3 rounded-xl border border-[#D3D3D3] p-4 text-sm text-[#676767] shadow-sm sm:grid-cols-3 xl:grid-cols-6">
          {([
            ['P', 'Present'],
            ['A', 'Absent'],
            ['OF', 'Off Day'],
            ['L', 'Leave'],
            ['P', 'Alert for Deduction'],
            ['H', 'Holiday'],
          ] as [string, string][]).map(([code, label]) => (
            <span key={label} className="inline-flex items-center gap-3">
              <span className={`px-1.5 text-xs font-semibold ${legendChip(code)}`}>{code}</span>
              {label}
            </span>
          ))}
        </div>
      )}
      <CollapsibleTitle title="Attendance Log" open={logOpen} onToggle={() => setLogOpen((value) => !value)} />
      {logOpen && (
        <DataTable
          headers={['Date', 'Time', 'Location']}
          rows={[
            ['03 June 2026', '06:06:43 am', 'Chandigarh'],
            ['03 June 2026', '12:02:23 pm', 'Chandigarh'],
            ['03 June 2026', '02:25:50 pm', 'Chandigarh'],
            ['03 June 2026', '05:45:34 pm', 'Chandigarh'],
          ]}
        />
      )}
    </div>
  );
}

function LeaveTab() {
  const [rangeOpen, setRangeOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const requests = Array.from({ length: 8 }, (_, index) => [
    'Casual Leave',
    `${15 + index} Jun 2026`,
    `${17 + index} Jun 2026`,
    '3',
    'Personal work',
    index === 3 || index === 6 ? 'Rejected' : 'Approved',
    '03 Jun 2026',
  ]);
  const filteredRequests = requests.filter((row) => {
    const from = parseDisplayDate(row[1] ?? '');
    const to = parseDisplayDate(row[2] ?? '');
    const rangeFrom = dateRange.from ? new Date(dateRange.from) : null;
    const rangeTo = dateRange.to ? new Date(dateRange.to) : null;

    return (!rangeFrom || to >= rangeFrom) && (!rangeTo || from <= rangeTo);
  });

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-[#D3D3D3] p-5 shadow-sm">
          <h3 className="text-2xl font-semibold">Leave Balance</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <LeaveBalanceCard title="Available Leave Balance" value="8.0" note="As on 6 June 2024" color="green" />
            <LeaveBalanceCard title="Unused Leaves (This Year)" value="6.0" note="01 Jan 2025 - 31 Dec 2025" color="violet" />
            <LeaveBalanceCard title="Pending Leaves" value="1.0" note="Approval Pending" color="orange" />
          </div>
        </div>
        <div className="rounded-xl border border-[#D3D3D3] p-5 shadow-sm">
          <h3 className="text-2xl font-semibold">Leave Policy</h3>
          <ul className="mt-4 space-y-3 text-sm text-[#676767]">
            {[
              'Earn 1 leave every month',
              'Leave balance updates monthly',
              'Max 12 leaves carry forward from previous year',
              'Carry forward applies only at year-end',
              'Excess leaves may be encashed as per policy',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[#0658C2]">▸</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-2xl font-semibold">Leave Request</h3>
        <div className="relative">
          <button
            type="button"
            onClick={() => setRangeOpen((value) => !value)}
            className="inline-flex h-12 items-center justify-center gap-6 rounded-lg border border-gray-300 px-6 font-semibold"
          >
            Date Range {rangeOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          {rangeOpen && (
            <div className="absolute right-0 z-30 mt-2 grid w-[320px] gap-3 rounded-xl border border-[#D3D3D3] bg-white p-4 shadow-xl">
              <label className="grid gap-1 text-sm font-semibold">
                From
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(event) => setDateRange((value) => ({ ...value, from: event.target.value }))}
                  className="h-11 rounded-lg border border-[#D3D3D3] px-3 outline-none focus:border-[#0658C2]"
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                To
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(event) => setDateRange((value) => ({ ...value, to: event.target.value }))}
                  className="h-11 rounded-lg border border-[#D3D3D3] px-3 outline-none focus:border-[#0658C2]"
                />
              </label>
              <button
                type="button"
                onClick={() => setDateRange({ from: '', to: '' })}
                className="justify-self-end text-sm font-semibold text-[#0658C2]"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#D3D3D3] shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="bg-[#FAFAFA] text-[#676767]">
              {['Leave Type', 'From', 'To', 'Days', 'Reason', 'Status', 'Applied On'].map((head) => (
                <th key={head} className="px-5 py-4">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((row, index) => (
              <tr key={index} className="border-b border-[#D3D3D3] text-[#676767]">
                {row.map((cell, cellIndex) => (
                  <td key={`${cell}-${cellIndex}`} className="px-5 py-4">
                    {cellIndex === 5 ? (
                      <span className={`rounded-md border px-4 py-1.5 text-xs font-semibold ${
                        cell === 'Approved'
                          ? 'border-[#4CAF50] bg-[#E5FFEB] text-[#4CAF50]'
                          : 'border-red-500 bg-[#FEE9E5] text-red-600'
                      }`}>
                        {cell}
                      </span>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 className="text-2xl font-semibold">Leave Type Balance</h3>
      <DataTable
        headers={['Leave Type', 'Earned This year', 'Used', 'Pending', 'Current Year Balance', 'Carry Forward (2025)', 'Total Balance']}
        rows={[['Casual Leave', '5 Days', '2 Days', '1 Day', '2 Days', '6 Days', '8 Days']]}
      />
      <div className="flex items-start gap-3 rounded-xl bg-[#DBEAFF] p-4 text-blue-950">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#0658C2]" />
        <p className="text-sm">
          <strong>Note:</strong> Up to 12 unused leaves can be carried forward. Excess leave balance will be encashed and credited to the employee&apos;s bank account or paid through an approved payment method, as per company policy.
        </p>
      </div>
    </div>
  );
}

function parseDisplayDate(value: string) {
  const [day, month, year] = value.split(' ');
  const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(
    month ?? '',
  );

  return new Date(Number(year), monthIndex, Number(day));
}

function buildCalendarDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - startOffset + 1;
    const inCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
    const displayedDay =
      dayNumber < 1 ? previousMonthDays + dayNumber : dayNumber > daysInMonth ? dayNumber - daysInMonth : dayNumber;
    const currentDate = new Date(year, month, Math.min(Math.max(dayNumber, 1), daysInMonth));
    const statusMap: Record<number, string> = {
      1: 'A',
      2: 'P',
      3: 'L',
      4: 'L',
      5: 'P',
      17: 'H',
    };
    const code = inCurrentMonth ? statusMap[dayNumber] ?? (currentDate.getDay() === 0 ? 'OF' : '') : '';

    return { day: displayedDay, code, muted: !inCurrentMonth };
  });
}

const requiredString = (message: string) => z.string({ required_error: message }).min(1, { message });

const numericString = (message: string) =>
  requiredString(message).regex(/^\d+(\.\d+)?$/, {
    message: 'Must be a valid number',
  });

const phoneRegex = /^\+91\d{10}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/i;
const aadhaarRegex = /^\d{12}$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
const pincodeRegex = /^\d{6}$/;

const getOnboardValidationSchema = (paymentMethod: PaymentMethod) => {
  const baseSchema = z.object({
    // Personal Info
    fullName: z.string()
    .trim()
    .min(1, 'Full Name is required')
    .regex(/^[A-Za-z\s]+$/, 'Full Name can contain only letters'),
    mobileNumber: requiredString('Mobile Number is required')
      .transform((val) => normalizePhoneNumber(val))
      .refine((val) => phoneRegex.test(val), {
        message: 'Must be a valid 10-digit Indian mobile number',
      }),
    email: z
  .string()
  .email({ message: 'Invalid email address' })
  .optional()
  .or(z.literal('')),
    dateOfBirth: requiredString('Date of Birth is required').refine(
      (value) => {
        const dob = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        const actualAge =
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < dob.getDate())
            ? age - 1
            : age;
        return actualAge >= 14;
      },
      {
        message: 'Employee must be at least 14 years old',
      },
    ),
    gender: requiredString('Gender is required'),
    bloodGroup: requiredString('Blood Group is required'),
    emergencyContactName: z.string()
    .trim()
    .min(1, 'Emergency Contact Name is required')
    .regex(/^[A-Za-z\s]+$/, 'Emergency Contact Name can contain only letters'),
    emergencyContactRelation: z.string()
      .trim()
      .min(1, 'Emergency Contact Relation is required')
      .regex(/^[A-Za-z\s]+$/, 'Emergency Contact Relation can contain only letters'),

    emergencyContactNumber: requiredString('Emergency Contact Number is required')
      .transform((val) => normalizePhoneNumber(val))
      .refine((val) => phoneRegex.test(val), {
        message: 'Must be a valid 10-digit Indian mobile number',
      }),
    fatherName: z.string().trim().refine(
        (value) => value === '' || /^[A-Za-z\s]+$/.test(value),
        'Father\'s Name can contain only letters',
      ),

      motherName: z.string().trim().refine(
        (value) => value === '' || /^[A-Za-z\s]+$/.test(value),
        'Mother\'s Name can contain only letters',
      ),

      nationality: z.string().trim().refine(
        (value) => value === '' || /^[A-Za-z\s]+$/.test(value),
        'Invalid nationality',
      ),

      alternatePhone: z.string().trim().refine(
        (value) => value === '' || /^[6-9]\d{9}$/.test(value),
        'Invalid mobile number',
      ),

    // Address
    address: z.string().trim().refine(
      (value) => value === '' || value.length >= 5,
      'Address must be at least 5 characters',
    ),
    presentAddressLine1: requiredString('Present Address Line 1 is required'),
    presentCity: requiredString('Present City is required'),
    presentState: requiredString('Present State is required'),
    presentPincode: requiredString('Present Pincode is required').regex(
      pincodeRegex,
      'Pincode must be 6 digits',
    ),
    sameAsPresentAddress: requiredString(
      'Please specify whether permanent address is same as present address',
    ),

    // Job Info
    designationId: requiredString('Designation is required'),
    departmentId: requiredString('Department is required'),
    branchLocation: requiredString('Branch / Location is required'),
    reportingSupervisorId: requiredString('Reporting Supervisor is required'),
    employeeType: requiredString('Employee Type is required'),
    joiningDate: requiredString('Joining Date is required'),
    workShiftId: requiredString('Shift Assignment is required'),
    probationPeriodMonths: z.string().trim().refine(
    (value) => value === '' || /^\d+$/.test(value),
      'Probation Period must be a valid number',
    ),
    noticePeriodDays: z.string().trim().refine(
      (value) => value === '' || /^\d+$/.test(value),
      'Notice Period must be a valid number',
    ),
    weeklyOff: z.string().trim().refine(
      (value) => value === '' || /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/i.test(value),
      'Please enter a valid day',
    ),
    workingHours: z.string().trim().refine(
      (value) => value === '' || value.length >= 5,
      'Please enter valid working hours',
    ),
    confirmationDate: z.string().trim().refine(
      (value) => value === '' || !Number.isNaN(Date.parse(value)),
      'Invalid confirmation date',
    ),
    workLocation: z.string().trim().refine(
      (value) => value === '' || /^[A-Za-z0-9\s,./()&-]+$/.test(value),
      'Work Location contains invalid characters',
    ),

    // Work Details
    skillTrade: requiredString('Skill / Trade is required'),
    experienceYears: numericString('Experience is required'),
    safetyTrainingCompleted: requiredString('Safety Training completion status is required'),
    certificationLicenses: z.string().trim().refine(
      (value) => value === '' || /^[A-Za-z0-9\s,./()&-]+$/.test(value),
      'Certification / Licenses contains invalid characters',
    ),

    // Identity
    aadhaarNumber: requiredString('Aadhaar Number is required').regex(aadhaarRegex, 'Aadhaar must be 12 digits'),
    panNumber: requiredString('PAN Number is required').regex(panRegex, 'Invalid PAN format'),
    drivingLicenseNumber: z.string().trim().refine(
      (value) => value === '' || /^[A-Za-z0-9-]{5,20}$/.test(value),
      'Invalid Driving License Number',
    ),
    voterId: z.string().trim().refine(
      (value) => value === '' || /^[A-Za-z0-9]{10}$/.test(value),
      'Voter ID must be 10 characters',
    ),
    uanNumber: z.string().trim().refine(
      (value) => value === '' || /^\d{12}$/.test(value),
      'UAN Number must be exactly 12 digits',
    ),
    esiNumber: z.string().trim().refine(
      (value) => value === '' || /^\d{10,17}$/.test(value),
      'Invalid ESI Number',
    ),
    pfNumber: z.string().trim().refine(
      (value) => value === '' || /^[A-Za-z0-9/-]{5,30}$/.test(value),
      'Invalid PF Number',
    ),

    // Salary
    basicSalary: numericString('Basic Salary / Wage is required'),
    salaryType: requiredString('Salary / Wage Type is required'),
    salaryPaymentFrequency: requiredString('Payment Frequency is required'),
    overtimeEligible: requiredString('Overtime eligibility is required'),
    pfApplicable: requiredString('PF applicability is required'),
    esiApplicable: requiredString('ESI applicability is required'),

    //Documents
    documents: z.array(z.any()).min(1, 'At least one document is required'),
  });

  let schema = baseSchema;

  if (paymentMethod === 'upi') {
    schema = schema.extend({
      upiId: z.string().trim().min(1, 'UPI ID is required').regex(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/, 'Invalid UPI ID format'),
      upiName: z.string().trim().min(1, 'Name on UPI is required').regex(/^[A-Za-z\s]+$/, 'Name on UPI can contain only letters'),
      wageAmount: z.string().trim().min(1, 'Wage Amount is required').regex(/^\d+(\.\d{1,2})?$/, 'Wage Amount must be a valid number'),
      upiPaymentFrequency: requiredString('Payment Frequency is required'),
    });
  }

  if (paymentMethod === 'bank') {
    schema = schema.extend({
      accountHolderName: z.string().trim().min(1, 'Account Holder Name is required').regex(/^[A-Za-z\s]+$/, 'Account Holder Name can contain only letters'),
      accountNumber: z.string().trim().min(1, 'Account Number is required').regex(/^\d{9,18}$/, 'Account Number must contain 9-18 digits'),
      bankName: z.string().trim().min(1, 'Bank Name is required').regex(/^[A-Za-z0-9\s&.-]+$/, 'Bank Name contains invalid characters'),
      ifscCode: z.string().trim().min(1, 'IFSC Code is required').regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format'),
    });
  }
  

  return schema.passthrough().superRefine((data: OnboardFormState, ctx) => {
    if (data.sameAsPresentAddress?.toLowerCase() === 'no') {
      if (!data.permanentAddressLine1?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Permanent Address Line 1 is required', path: ['permanentAddressLine1'] });
      if (!data.permanentCity?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Permanent City is required', path: ['permanentCity'] });
      if (!data.permanentState?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Permanent State is required', path: ['permanentState'] });
      if (!data.permanentPincode?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Permanent Pincode is required', path: ['permanentPincode'] });
      else if (!pincodeRegex.test(data.permanentPincode.trim())) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Pincode must be 6 digits', path: ['permanentPincode'] });
    }
    if (paymentMethod === 'bank' && data.bankName === OTHER_BANK_OPTION && !data.bankNameManual.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter the bank name manually',
        path: ['bankNameManual'],
      });
    }
  });
};

function AddEmployee({
  paymentMethod,
  onPaymentMethod,
  onAddEmployee,
  onBack,
}: {
  paymentMethod: PaymentMethod;
  onPaymentMethod: (method: PaymentMethod) => void;
  onAddEmployee: () => void;
  onBack: () => void;
}) {
  const { form, setValue, resetForm } = useEmployeeStore();
  const [submitting, setSubmitting] = useState(false);
  const [errorModal, setErrorModal] = useState<{
    open: boolean;
    title: string;
    errors: { label: string; message: string }[];
  }>({ open: false, title: '', errors: [] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [initialDepartments, setInitialDepartments] = useState<MetaDepartment[]>([]);
  const [initialDesignations, setInitialDesignations] = useState<MetaDesignation[]>([]);
  const [initialSupervisors, setInitialSupervisors] = useState<MetaSupervisor[]>([]);
  const [initialWorkShifts, setInitialWorkShifts] = useState<MetaWorkShift[]>([]);
  const [religionSearch, setReligionSearch] = useState('');
  const [languageSearch, setLanguageSearch] = useState('');
  const [bankSearch, setBankSearch] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const bankOptions = useMemo(
    () =>
      filterBanks(bankSearch).map((bank) => ({
        id: bank,
        label: bank,
      })),
    [bankSearch],
  );

  const religionOptions = useMemo(
    () =>
      filterOptions(INDIAN_RELIGIONS, religionSearch).map((religion) => ({
        id: religion,
        label: religion,
      })),
    [religionSearch],
  );

  const languageOptions = useMemo(
    () =>
      filterOptions(INDIAN_LANGUAGES, languageSearch).map((language) => ({
        id: language,
        label: language,
      })),
    [languageSearch],
  );

  const selectedLanguages = useMemo(() => parseCommaList(form.languagesKnown), [form.languagesKnown]);

  const handleValueChange = (key: keyof OnboardFormState, value: string) => {
    setValue(key, value);
    setErrorModal((current) =>
      current.open ? { ...current, open: false } : current
    );
  };

  useEffect(() => {
  let cancelled = false;
  setMetaLoading(true);
  setMetaError(null);

  fetchOnboardMetaInitial(40)
    .then((meta) => {
      if (cancelled) return;

      setInitialDepartments(meta.departments);
      setInitialDesignations(meta.designations);
      setInitialSupervisors(meta.supervisors);
      setInitialWorkShifts(meta.workShifts);

      if (!form.employeeNumber.trim()) {
        setValue('employeeNumber', meta.nextEmployeeNo);
      }
    })
    .catch((err: unknown) => {
      if (cancelled) return;

      setMetaError(
        err instanceof Error
          ? err.message
          : 'Failed to load departments / designations / supervisors',
      );
    })
    .finally(() => {
      if (!cancelled) {
        setMetaLoading(false);
      }
    });

  return () => {
    cancelled = true;
  };
}, []);

  const designationSearch = useMetaSearch(
    async (search) => (await fetchDesignationsMeta({ search, limit: 40 })).data,
    initialDesignations,
  );
  const departmentSearch = useMetaSearch(
    async (search) => (await fetchDepartmentsMeta({ search, limit: 40 })).data,
    initialDepartments,
  );
  const supervisorSearch = useMetaSearch(
    async (search) => (await fetchSupervisorsMeta({ search, limit: 40 })).data,
    initialSupervisors,
  );
  const workShiftSearch = useMetaSearch(
    async (search) => (await fetchWorkShiftsMeta({ search, limit: 40 })).data,
    initialWorkShifts,
  );

  const saveEmployee = async (action: 'draft' | 'submit') => {
    setSubmitting(true);
    setErrorModal((current) => ({ ...current, open: false }));

    if (action === 'submit') {
      setSubmitted(true);
      const validationSchema = getOnboardValidationSchema(paymentMethod);
      const result = validationSchema.safeParse(form);

        if (!result.success) {
          const fieldErrors: Record<string, string> = {};

          result.error.issues.forEach((issue) => {
            const field = issue.path.join('.');

            if (!fieldErrors[field]) {
              fieldErrors[field] = issue.message;
            }
          });

          setErrors(fieldErrors);

          setSubmitting(false);
          return;
        }

        setErrors({});
      }

    const documentError = validateOnboardDocuments(form.documents, action);
    if (documentError) {
      setErrorModal({
        open: true,
        title: 'Documents required',
        errors: [{ label: 'Documents', message: documentError }],
      });
      setSubmitting(false);
      return;
    }

    try {
      const payload = buildOnboardApiPayload(form, paymentMethod, action);
      const response = await api.post<EmployeeEmploymentDTO>('/operations/employer/onboard', payload);
      const employmentId = response.data.id;
      const uploadedDocs = getUploadedOnboardDocuments(form.documents);
      for (const doc of uploadedDocs.slice(1)) {
        await addEmployeeDocument(employmentId, {
          document_type: doc.documentType.trim(),
          file_key: doc.fileKey.trim(),
          file_name: doc.fileName.trim() || undefined,
          ...(doc.documentNumber.trim() ? { document_number: doc.documentNumber.trim() } : {}),
        });
      }
      resetForm();
      onAddEmployee();
    } catch (error) {
      const parsed = extractOnboardApiErrors(error);
      const errWithCode = error as { code?: string };
      if (errWithCode.code === 'EMPLOYEE_NO_EXISTS') {
        fetchNextEmployeeNumber()
          .then((response) => {
            setValue('employeeNumber', response.data.employee_no);
          })
          .catch(() => undefined);
      }
      setErrorModal({
        open: true,
        title: parsed.title,
        errors: parsed.errors,
      });
    } finally {
      setSubmitting(false);
    }
  };
  const identitySalaryPanels = (
    <div className="grid gap-4 xl:grid-cols-2">
        <FormPanel title="Identity Documents" icon={IdCard} columns="single">
          <Field label="Aadhaar Number" required placeholder="Enter Aadhaar Number" value={form.aadhaarNumber} onChange={(value) => setValue('aadhaarNumber', value)} error={errors?.aadhaarNumber} />
          <Field label="PAN Number" required placeholder="Enter PAN Number" value={form.panNumber} onChange={(value) => setValue('panNumber', value)} error={errors?.panNumber} />
          <Field label="Driving License Number (if applicable)" placeholder="Enter Driving License Number" value={form.drivingLicenseNumber} onChange={(value) => setValue('drivingLicenseNumber', value)} error={errors?.drivingLicenseNumber} />
          <Field label="Voter ID" placeholder="Enter Voter ID" value={form.voterId} onChange={(value) => setValue('voterId', value)} error={errors?.voterId} />
          <Field label="UAN Number" placeholder="12-digit UAN" value={form.uanNumber} onChange={(value) => setValue('uanNumber', value)} error={errors?.uanNumber} />
          <Field label="ESI Number" placeholder="Enter ESI Number" value={form.esiNumber} onChange={(value) => setValue('esiNumber', value)} error={errors?.esiNumber} />
          <Field label="PF Number" placeholder="Enter PF Number" value={form.pfNumber} onChange={(value) => setValue('pfNumber', value)} error={errors?.pfNumber} />
        </FormPanel>

        <FormPanel title="Salary Details" icon={WalletCards} columns="single">
          <Field label="Basic Salary / Wage" required placeholder="Enter amount" value={form.basicSalary} onChange={(value) => setValue('basicSalary', value)} error={errors?.basicSalary} />
          <SelectField label="Salary / Wage Type" required placeholder="Select Type" options={dropdownOptions.salaryType} value={form.salaryType} onChange={(value) => setValue('salaryType', value)} error={errors?.salaryType} />
          <SelectField id="salary-payment-frequency" label="Payment Frequency" required placeholder="Select Frequency" options={dropdownOptions.frequency} value={form.salaryPaymentFrequency} onChange={(value) => setValue('salaryPaymentFrequency', value)} error={errors?.salaryPaymentFrequency} />
          <div className="grid gap-4 sm:grid-cols-2">
            <RadioGroup label="Overtime Eligible" required options={['Yes', 'No']} value={form.overtimeEligible} onChange={(value) => setValue('overtimeEligible', value)} error={errors?.overtimeEligible} />
            <RadioGroup label="PF Applicable" required options={['Yes', 'No']} value={form.pfApplicable} onChange={(value) => setValue('pfApplicable', value)} error={errors?.pfApplicable} />
            <RadioGroup label="ESI Applicable" required options={['Yes', 'No']} value={form.esiApplicable} onChange={(value) => setValue('esiApplicable', value)} error={errors?.esiApplicable} />
          </div>
        </FormPanel>
    </div>
  );

  return (
    <section className="rounded-[24px] border border-[#D3D3D3] bg-white p-5 shadow-sm sm:p-7">
      <PageTitle title="ADD NEW EMPLOYEE" crumb="Employee > Add New Employee" onBack={onBack} />
      <div className="mt-6 space-y-4">
      <FormPanel title="Personal Information" icon={IdCard}>
        <Field label="Full Name" required placeholder="Enter full name" value={form.fullName} onChange={(value) => setValue('fullName', value)} error={errors.fullName} />
        <Field label="Mobile Number" required placeholder="Enter mobile number" value={form.mobileNumber} onChange={(value) => setValue('mobileNumber', value)} error={errors.mobileNumber} />
        <Field label="Email" placeholder="Enter email" value={form.email} onChange={(value) => setValue('email', value)} error={errors?.email} />
        <Field label="Date of Birth" required type="date" placeholder="YYYY-MM-DD" value={form.dateOfBirth} onChange={(value) => setValue('dateOfBirth', value)} error={errors.dateOfBirth} />
        <SelectField label="Gender" required placeholder="Select Gender" options={dropdownOptions.gender} value={form.gender} onChange={(value) => setValue('gender', value)} error={errors.gender} />
        <SelectField label="Marital Status" placeholder="Select Marital Status" options={dropdownOptions.maritalStatus} value={form.maritalStatus} onChange={(value) => setValue('maritalStatus', value)} error={errors?.maritalStatus} />
        <Field label="Father's Name" placeholder="Enter father's name" value={form.fatherName} onChange={(value) => setValue('fatherName', value)} error={errors?.fatherName} />
        <Field label="Mother's Name" placeholder="Enter mother's name" value={form.motherName} onChange={(value) => setValue('motherName', value)} error={errors?.motherName} />
        <Field label="Nationality" placeholder="Indian" value={form.nationality} onChange={(value) => setValue('nationality', value)} error={errors?.nationality} />
        <AsyncSearchSelect label="Religion" placeholder="Search religion" valueId={form.religion} valueLabel={form.religion} search={religionSearch} onSearchChange={setReligionSearch} options={religionOptions} error={errors?.religion} onSelect={(option) => setValue('religion', option.label)} onClear={() => setValue('religion', '')} />
        <AsyncMultiSearchSelect label="Languages Known" placeholder="Search and select languages" selected={selectedLanguages} search={languageSearch} onSearchChange={setLanguageSearch} options={languageOptions} onAdd={(language) => setValue('languagesKnown', joinCommaList([...selectedLanguages, language]))} onRemove={(language) => setValue('languagesKnown', joinCommaList(selectedLanguages.filter((item) => item !== language)))} onClear={() => setValue('languagesKnown', '')} />
        <Field label="Alternate Mobile" placeholder="Enter alternate number (not unique — can repeat)" value={form.alternatePhone} onChange={(value) => setValue('alternatePhone', value)} error={errors?.alternatePhone} />
        <Field label="Legacy Address (optional)" placeholder="Or enter full address as single line" value={form.address} onChange={(value) => setValue('address', value)} error={errors?.address} />
        <SelectField label="Blood Group" required placeholder="Select Blood Group" options={dropdownOptions.blood} value={form.bloodGroup} onChange={(value) => setValue('bloodGroup', value)} error={errors.bloodGroup} />
        <Field label="Emergency Contact Name" required placeholder="Enter emergency contact name" value={form.emergencyContactName} onChange={(value) => setValue('emergencyContactName', value)} error={errors.emergencyContactName} />
        <Field label="Emergency Contact Relation" required placeholder="Enter emergency contact relation" value={form.emergencyContactRelation} onChange={(value) => setValue('emergencyContactRelation', value)} error={errors.emergencyContactRelation} />
        <Field label="Emergency Contact Number" required placeholder="Enter emergency contact number (not unique)" value={form.emergencyContactNumber} onChange={(value) => setValue('emergencyContactNumber', value)} error={errors.emergencyContactNumber} />
      </FormPanel>

      <FormPanel title="Current Address (Present)" icon={MapPin} columns="single">
        <AddressFormBlock
          title="Where the employee currently lives"
          required
          showErrors={submitted}
          values={{
            line1: form.presentAddressLine1,
            city: form.presentCity,
            state: form.presentState,
            pincode: form.presentPincode,
          }}
          errors={{
            line1: errors?.presentAddressLine1,
            city: errors?.presentCity,
            state: errors?.presentState,
            pincode: errors?.presentPincode,
          }}
          onChange={(patch) => {
            if (patch.line1 !== undefined) setValue('presentAddressLine1', patch.line1);
            if (patch.city !== undefined) setValue('presentCity', patch.city);
            if (patch.state !== undefined) setValue('presentState', patch.state);
            if (patch.pincode !== undefined) setValue('presentPincode', patch.pincode);
          }}
        />
      </FormPanel>

        <FormPanel title="Permanent Address" icon={MapPin} columns="single">
          <RadioGroup label="Permanent same as Current" options={['Yes', 'No']} value={form.sameAsPresentAddress} onChange={(value) => setValue('sameAsPresentAddress', value)} error={errors.sameAsPresentAddress} />
            {form.sameAsPresentAddress.trim().toLowerCase() === 'no' ? (
              <AddressFormBlock
                title="Permanent / native address"
                required
                showErrors={submitted}
                values={{ line1: form.permanentAddressLine1, city: form.permanentCity, state: form.permanentState, pincode: form.permanentPincode }}
                errors={{ line1: errors?.permanentAddressLine1, city: errors?.permanentCity, state: errors?.permanentState, pincode: errors?.permanentPincode }}
                onChange={(patch) => {
                  if (patch.line1 !== undefined) setValue('permanentAddressLine1', patch.line1);
                  if (patch.city !== undefined) setValue('permanentCity', patch.city);
                  if (patch.state !== undefined) setValue('permanentState', patch.state);
                  if (patch.pincode !== undefined) setValue('permanentPincode', patch.pincode);
                }}
              />
            ) : (
              <p className="text-sm text-[#676767]">
                Permanent address will be copied from current address on submit.
              </p>
            )}
        </FormPanel>

        <FormPanel title="Job Information" icon={Briefcase}>
          <Field label="Employee Number" placeholder="Auto-generated from company sequence" value={form.employeeNumber} onChange={(value) => setValue('employeeNumber', value)} />
          <p className="-mt-2 text-xs text-[#676767]">Suggested next number from your company (EMP-001, EMP-002…). You can edit if needed.</p>
          <Field label="Karigari ID" placeholder="Platform worker ID e.g. KG1000 (globally unique if set)" value={form.karigariId} onChange={(value) => setValue('karigariId', value)} />
          <AsyncSearchSelect label="Designation" required placeholder={metaLoading ? 'Loading designations…' : 'Search designation'} valueId={form.designationId} valueLabel={form.designationLabel} search={designationSearch.search} onSearchChange={designationSearch.setSearch} loading={metaLoading || designationSearch.loading} error={errors.designationId || metaError || designationSearch.error} options={designationSearch.items.map((item) => ({ id: item.id, label: item.name, sublabel: item.description || undefined }))} onSelect={(option) => { setValue('designationId', option.id); setValue('designationLabel', option.label); }} onClear={() => { setValue('designationId', ''); setValue('designationLabel', ''); }} />
          <AsyncSearchSelect label="Department" required placeholder={metaLoading ? 'Loading departments…' : 'Search department'} valueId={form.departmentId} valueLabel={form.departmentLabel} search={departmentSearch.search} onSearchChange={departmentSearch.setSearch} loading={metaLoading || departmentSearch.loading} error={errors.departmentId || metaError || departmentSearch.error} options={departmentSearch.items.map((item) => ({ id: item.id, label: item.name, sublabel: item.description || undefined }))} onSelect={(option) => { setValue('departmentId', option.id); setValue('departmentLabel', option.label); }} onClear={() => { setValue('departmentId', ''); setValue('departmentLabel', ''); }} />
          <SelectField label="Branch / Location" required placeholder="Select Branch" options={dropdownOptions.branch} value={form.branchLocation} onChange={(value) => setValue('branchLocation', value)} error={errors.branchLocation} />
          <AsyncSearchSelect label="Reporting Supervisor" required placeholder={metaLoading ? 'Loading supervisors…' : 'Search supervisor'} valueId={form.reportingSupervisorId} valueLabel={form.reportingSupervisorLabel} search={supervisorSearch.search} onSearchChange={supervisorSearch.setSearch} loading={metaLoading || supervisorSearch.loading} error={errors.reportingSupervisorId || metaError || supervisorSearch.error} options={supervisorSearch.items.map((item) => ({ id: item.id, label: item.name || item.phone_no, sublabel: [item.role_name, item.department_name, item.phone_no].filter(Boolean).join(' · ') }))} onSelect={(option) => { setValue('reportingSupervisorId', option.id); setValue('reportingSupervisorLabel', option.label); }} onClear={() => { setValue('reportingSupervisorId', ''); setValue('reportingSupervisorLabel', ''); }} />
          <SelectField label="Employee Type" required placeholder="Select Employee Type" options={dropdownOptions.type} value={form.employeeType} onChange={(value) => setValue('employeeType', value)} error={errors.employeeType} />
          <Field label="Joining Date" required type="date" placeholder="YYYY-MM-DD" value={form.joiningDate} onChange={(value) => setValue('joiningDate', value)} error={errors.joiningDate} />
          <AsyncSearchSelect label="Shift Assignment" required placeholder={metaLoading ? 'Loading shifts…' : 'Search work shift'} valueId={form.workShiftId} valueLabel={form.workShiftLabel} search={workShiftSearch.search} onSearchChange={workShiftSearch.setSearch} loading={metaLoading || workShiftSearch.loading} error={errors.workShiftId || metaError || workShiftSearch.error} options={workShiftSearch.items.map((item) => ({ id: item.id, label: item.name, sublabel: `${item.start_time?.slice(0, 5) ?? ''} – ${item.end_time?.slice(0, 5) ?? ''}` }))} onSelect={(option) => { setValue('workShiftId', option.id); setValue('workShiftLabel', option.label); }} onClear={() => { setValue('workShiftId', ''); setValue('workShiftLabel', ''); }} />
          <Field label="Probation Period (months)" placeholder="e.g. 3" value={form.probationPeriodMonths} onChange={(value) => setValue('probationPeriodMonths', value)} error={errors?.probationPeriodMonths} />
          <Field label="Notice Period (days)" placeholder="e.g. 15" value={form.noticePeriodDays} onChange={(value) => setValue('noticePeriodDays', value)} error={errors?.noticePeriodDays} />
          <Field label="Weekly Off" placeholder="Sunday" value={form.weeklyOff} onChange={(value) => setValue('weeklyOff', value)} error={errors?.weeklyOff} />
          <Field label="Working Hours" placeholder="e.g. 09:00 AM - 06:00 PM" value={form.workingHours} onChange={(value) => setValue('workingHours', value)} error={errors?.workingHours} />
          <Field label="Confirmation Date" type="date" placeholder="YYYY-MM-DD" value={form.confirmationDate} onChange={(value) => setValue('confirmationDate', value)} error={errors?.confirmationDate} />
          <Field label="Work Location / Site" placeholder="Enter work location or site" value={form.workLocation} onChange={(value) => setValue('workLocation', value)} error={errors?.workLocation} />
        </FormPanel>

        <div className="grid gap-4 xl:grid-cols-2">
          <FormPanel title="Work Details" icon={Wrench} columns="single">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Skill / Trade" required placeholder="Select Skill / Trade" options={dropdownOptions.skill} value={form.skillTrade} onChange={(value) => setValue('skillTrade', value)} error={errors?.skillTrade} />
              <Field label="Experience (Years)" required placeholder="Enter experience in years" value={form.experienceYears} onChange={(value) => setValue('experienceYears', value)} error={errors.experienceYears} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Certification / Licenses" placeholder="Enter Certifications (if any)" value={form.certificationLicenses} onChange={(value) => setValue('certificationLicenses', value)} error={errors?.certificationLicenses} />
              <RadioGroup label="Safety Training Completed" required options={['Yes', 'No']} value={form.safetyTrainingCompleted} onChange={(value) => setValue('safetyTrainingCompleted', value)} error={errors.safetyTrainingCompleted} />
            </div>
          </FormPanel>
          <FormPanel title="Payment Method" icon={CreditCard} columns="single">
            <div className="grid gap-4 sm:grid-cols-2">
              <PaymentOption label="Cash Payment" active={paymentMethod === 'cash'} onClick={() => onPaymentMethod('cash')} />
              <PaymentOption label="Bank Tranfer" active={paymentMethod === 'bank'} onClick={() => onPaymentMethod('bank')} />
              <PaymentOption label="UPI Transfer" active={paymentMethod === 'upi'} onClick={() => onPaymentMethod('upi')} />
            </div>
          </FormPanel>
        </div>

        {paymentMethod === 'upi' && (
          <FormPanel title="UPI Transfer" icon={WalletCards}>
            <Field label="UPI ID" required placeholder="Enter UPI ID" value={form.upiId} onChange={(value) => setValue('upiId', value)} error={errors.upiId} />
            <Field label="Name on UPI" required placeholder="Enter name on UPI" value={form.upiName} onChange={(value) => setValue('upiName', value)} error={errors.upiName} />
            <Field label="Wage Amount" required placeholder="Enter wage amount" value={form.wageAmount} onChange={(value) => setValue('wageAmount', value)} error={errors.wageAmount} />
            <SelectField id="upi-payment-frequency" label="Payment Frequency" required placeholder="Select Frequency" options={dropdownOptions.frequency} value={form.upiPaymentFrequency} onChange={(value) => setValue('upiPaymentFrequency', value)} error={errors?.upiPaymentFrequency} />
          </FormPanel>
        )}

        {paymentMethod === 'bank' && (
          <>
            <FormPanel title="Bank Details" icon={Landmark}>
              <Field label="Account Holder Name" required placeholder="Enter Account Holder Name" value={form.accountHolderName} onChange={(value) => setValue('accountHolderName', value)} error={errors.accountHolderName} />
              <Field label="Account Number" required placeholder="Enter Account Number" value={form.accountNumber} onChange={(value) => setValue('accountNumber', value)} error={errors.accountNumber} />
              <AsyncSearchSelect label="Bank Name" required placeholder="Search bank (SBI, HDFC, ICICI…)" valueId={form.bankName} valueLabel={form.bankName} search={bankSearch} onSearchChange={setBankSearch} options={bankOptions} error={errors?.bankName} onSelect={(option) => setValue('bankName', option.label)} onClear={() => { setValue('bankName', ''); setValue('bankNameManual', ''); }} />
              {form.bankName === OTHER_BANK_OPTION && (
                <Field label="Enter Bank Name" required placeholder="Type your bank name" value={form.bankNameManual} onChange={(value) => setValue('bankNameManual', value)} error={errors.bankNameManual} />
              )}
              <Field label="IFSC Code" required placeholder="Enter IFSC Code" value={form.ifscCode} onChange={(value) => setValue('ifscCode', value)} error={errors.ifscCode} />
            </FormPanel>
            {identitySalaryPanels}
          </>
        )}

        {paymentMethod !== 'bank' && identitySalaryPanels}

        <FormPanel title="Documents & Notes" icon={FileText} columns="single">
            <OnboardDocumentsSection
              documents={form.documents}
              notes={form.notes}
              onDocumentsChange={(documents) => setValue('documents', documents)}
              onNotesChange={(value) => setValue('notes', value)}
              error={errors?.documents}
            />
        </FormPanel>

        <OnboardErrorModal
          open={errorModal.open}
          title={errorModal.title}
          errors={errorModal.errors}
          onClose={() => setErrorModal((current) => ({ ...current, open: false }))}
        />

        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:justify-end">
        <button type="button" disabled={submitting} onClick={() => saveEmployee('draft')} className="h-12 cursor-pointer rounded-xl border border-[#0658C2] px-8 text-base font-semibold text-[#0658C2] transition-all duration-200 hover:bg-[#F0F6FF] hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 hidden">
          Save as Draft
        </button>

        <button type="button" onClick={() => resetForm()} className="h-12 cursor-pointer rounded-xl border border-[#0658C2] px-8 text-base font-semibold text-[#0658C2] transition-all duration-200 hover:bg-[#F0F6FF] hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">
          Reset
        </button>

          <button type="button" disabled={submitting} onClick={() => saveEmployee('submit')} className="h-12 cursor-pointer rounded-xl bg-[#0658C2] px-8 text-base font-semibold text-white transition-all duration-200 hover:bg-[#054A9F] hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">
            Submit Profile
          </button>
        </div>
      </div>
    </section>
  );
}

function PageTitle({ title, crumb, onBack }: { title: string; crumb: string; onBack: () => void }) {
  return (
    <div className="flex items-start gap-1">
      <button onClick={onBack} className="group rounded-full p-1 cursor-pointer hover:bg-[#DBEAFF]" aria-label="Back">
        <ChevronLeft className="group-hover:text-[#0658C2] h-7 w-7" />
      </button>
      <div>
        <h1 className="text-2xl font-bold tracking-normal">{title}</h1>
        <p className="mt-1 text-sm text-[#676767]">{crumb}</p>
      </div>
    </div>
  );
}

function InfoCard({ title, icon: Icon, rows }: { title: string; icon: typeof User; rows: string[][] }) {
  const [editing, setEditing] = useState(false);
  const [draftRows, setDraftRows] = useState(rows);

  return (
    <div className="h-full rounded-xl border border-[#D3D3D3] p-5 shadow-sm">
      <div className="mb-[16px] flex items-center justify-between">
        <SectionHeading icon={Icon} title={title} />
        <button
          type="button"
          onClick={() => setEditing((value) => !value)}
          className="inline-flex items-center gap-1 text-sm text-[#0658C2] cursor-pointer"
        >
          <Edit3 className="h-4 w-4" /> {editing ? 'Save' : 'Edit'}
        </button>
      </div>
      <div className="space-y-0">
        {draftRows.map(([label, value], index) => (
          <div key={label} className="grid grid-cols-[45%_1fr] gap-4 border-b border-[#D3D3D3] py-3 text-sm">
            <span className="text-[#676767]">{label}</span>
            {editing ? (
              <input
                value={value}
                onChange={(event) =>
                  setDraftRows((items) =>
                    items.map((item, itemIndex) =>
                      itemIndex === index ? [item[0] ?? '', event.target.value] : item,
                    ),
                  )
                }
                className="h-9 rounded-md border border-[#D3D3D3] px-3 font-semibold outline-none focus:border-[#0658C2]"
              />
            ) : (
              <span className="font-semibold">{value || '-'}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function OnboardDocumentsSection({
  documents,
  notes,
  onDocumentsChange,
  onNotesChange,
  error,
}: {
  documents: OnboardDocument[];
  notes: string;
  onDocumentsChange: (documents: OnboardDocument[]) => void;
  onNotesChange: (value: string) => void;
  error?: string;
}) {
  const updateDocument = (id: string, patch: Partial<OnboardDocument>) => {
    onDocumentsChange(
      documents.map((doc) => (doc.id === id ? { ...doc, ...patch } : doc)),
    );
  };

  const removeDocument = (id: string) => {
    onDocumentsChange(documents.filter((doc) => doc.id !== id));
  };

  const addDocument = () => {
    onDocumentsChange([...documents, createOnboardDocument()]);
  };

  const uploadedCount = getUploadedOnboardDocuments(documents).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">
            Employee Documents <span className="text-[#F54A4A]">*</span>
          </p>
          <p className="text-xs text-[#676767]">
            Add at least one document. JPG, PNG, WEBP or PDF — max 5MB each.
          </p>
        </div>
        <button
          type="button"
          onClick={addDocument}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#0658C2] px-4 text-sm font-semibold text-white cursor-pointer transition-all duration-200 hover:bg-[#054A9F] hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" /> Add Document
        </button>
      </div>

      {documents.length === 0 ? (
        <>
          <div className={`rounded-xl border border-dashed bg-[#FAFAFA] px-6 py-10 text-center ${error ? 'border-[#F54A4A]' : 'border-[#D3D3D3]'}`}>
            <FileText className="mx-auto h-8 w-8 text-[#0658C2]" />
            <p className="mt-3 text-sm font-semibold">No documents added yet</p>
            <p className="mt-1 text-xs text-[#676767]">
              Click &quot;Add Document&quot; to upload Aadhaar, PAN, or other files.
            </p>
            <button
              type="button"
              onClick={addDocument}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-[#0658C2] px-4 text-sm font-semibold text-[#0658C2] cursor-pointer transition-all duration-200 hover:bg-[#F0F6FF] hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" /> Add Document
            </button>
          </div>
          {error && (
            <span className="mt-1 block text-xs font-medium text-[#F54A4A]">
              {error}
            </span>
          )}
        </>
      ) : (
        <div className="space-y-3">
          {documents.map((doc, index) => (
            <div
              key={doc.id}
              className="rounded-xl border border-[#D3D3D3] bg-[#FAFAFA] p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Document {index + 1}</p>
                <button
                  type="button"
                  onClick={() => removeDocument(doc.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#F54A4A]"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">
                    Document Type <span className="text-[#F54A4A]">*</span>
                  </span>
                  <select
                    value={doc.documentType}
                    onChange={(event) => updateDocument(doc.id, { documentType: event.target.value })}
                    className="h-11 w-full rounded-lg border border-[#D3D3D3] bg-white px-4 text-sm outline-none focus:border-[#0658C2]"
                  >
                    <option value="">Select type</option>
                    {ONBOARD_DOCUMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <Field
                  label="Document Number"
                  placeholder="Optional ID / number"
                  value={doc.documentNumber}
                  onChange={(value) => updateDocument(doc.id, { documentNumber: value })}
                />
              </div>

              <div className="mt-4">
                <DocumentUploadField
                  label="Upload File"
                  required
                  hint="JPG, PNG, WEBP or PDF"
                  fileKey={doc.fileKey}
                  fileName={doc.fileName}
                  onUploaded={(fileKey, name) =>
                    updateDocument(doc.id, { fileKey, fileName: name })
                  }
                  onClear={() => updateDocument(doc.id, { fileKey: '', fileName: '' })}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {uploadedCount > 0 && (
        <p className="text-xs font-medium text-[#0658C2]">
          {uploadedCount} document{uploadedCount === 1 ? '' : 's'} ready to save
        </p>
      )}

      <label className="block border-t border-[#ECECEC] pt-5">
        <span className="mb-2 block text-sm font-semibold">Notes (Optional)</span>
        <textarea
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          className="h-[120px] w-full resize-none rounded-lg border border-[#D3D3D3] px-4 py-3 text-sm outline-none focus:border-[#0658C2]"
          placeholder="Enter any additional notes"
        />
      </label>
    </div>
  );
}

function FormPanel({
  title,
  icon: Icon,
  children,
  columns = 'three',
}: {
  title: string;
  icon: typeof User;
  children: React.ReactNode;
  columns?: 'single' | 'three';
}) {
  return (
    <section className="rounded-xl border border-[#D3D3D3] p-5 shadow-sm">
      <SectionHeading icon={Icon} title={title} />
      <div className={`mt-4 grid gap-4 ${columns >= 'three' ? 'md:grid-cols-2 2xl:grid-cols-3' : ''}`}>{children}</div>
    </section>
  );
}

function Field({
  label,
  placeholder,
  required,
  icon: Icon,
  value,
  onChange,
  type = 'text',
  error,
}: {
  label: string;
  placeholder: string;
  required?: boolean;
  icon?: typeof User;
  value?: string;
  onChange?: (value: string) => void;
  type?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">
        {label} {required && <span className="text-[#F54A4A]">*</span>}
      </span>

      <span className="relative block">
        <input
          type={type}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          className={`h-11 w-full rounded-lg border px-4 text-sm outline-none ${
            error
              ? 'border-[#F54A4A] focus:border-[#F54A4A]'
              : 'border-[#D3D3D3] focus:border-[#0658C2]'
          }`}
          placeholder={placeholder}
        />

        {Icon && (
          <Icon className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />
        )}
      </span>

      {error && (
        <span className="mt-1 block text-xs font-medium text-[#F54A4A]">
          {error}
        </span>
      )}
    </label>
  );
}

function RadioGroup({
  label,
  options,
  value,
  required,
  onChange,
  error,
}: {
  label: string;
  options: string[];
  value: string;
  required?: boolean;
  onChange?: (value: string) => void;
  error?: string;
}) {
  const [selected, setSelected] = useState(value);

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">
        {label} {required && <span className="text-[#F54A4A]">*</span>}
      </span>

      <div className="flex flex-wrap gap-4">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setSelected(option);
              onChange?.(option);
            }}
            className="inline-flex cursor-pointer items-center gap-2"
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                error
                  ? 'border-[#F54A4A]'
                  : selected === option
                    ? 'border-[#0658C2] ring-4 ring-blue-100'
                    : 'border-gray-300'
              }`}
            >
              {selected === option && (
                <span className="h-2 w-2 rounded-full bg-[#0658C2]" />
              )}
            </span>

            <span className="text-sm">{option}</span>
          </button>
        ))}
      </div>

      {error && (
        <span className="mt-1 block text-xs font-medium text-[#F54A4A]">
          {error}
        </span>
      )}
    </label>
  );
}

function PaymentOption({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 items-center gap-3 rounded-lg border border-[#D3D3D3] px-4 text-left font-medium cursor-pointer"
    >
      <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${active ? "border-[#0658C2] ring-4 ring-blue-100" : "border-gray-300"}`}>
        {active && (
          <span className="h-2 w-2 rounded-full bg-blue-600" />
        )}
      </span>
      {label}
    </button>
  );
}
type UploadBoxProps = {
  label?: string;
  required?: boolean;
  hint?: string;
  onFileSelect?: (file: File) => void;
  fileName?: string;
  disabled?: boolean;
};

function DocumentUploadField({
  label,
  required,
  hint,
  fileKey,
  fileName,
  onUploaded,
  onClear,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  fileKey: string;
  fileName: string;
  onUploaded: (fileKey: string, displayName: string) => void;
  onClear: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const result = await uploadEmployeeDocument(file);
      onUploaded(result.fileKey, result.fileName);
    } catch (err) {
      setError((err as Error).message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const displayName = fileName || (fileKey ? displayNameFromFileKey(fileKey) : '');

  return (
    <div>
      <UploadBox
        label={label}
        required={required}
        hint={hint}
        fileName={uploading ? 'Uploading…' : displayName || undefined}
        disabled={uploading}
        onFileSelect={(file) => void handleFileSelect(file)}
      />
      {fileKey && !uploading && (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-[#D3D3D3] bg-[#F9FAFF] px-3 py-2 text-sm">
          <span className="truncate text-[#0658C2]">{displayName || 'Document uploaded'}</span>
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 text-xs font-semibold text-[#676767] hover:text-[#F54A4A]"
          >
            Remove
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function UploadBox({
  label,
  required,
  hint,
  onFileSelect,
  fileName,
  disabled,
}: UploadBoxProps) {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    onFileSelect?.(file);
    e.target.value = '';
  };

  return (
    <label className={`block ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
      {label && (
        <span className="mb-2 block text-sm font-semibold">
          {label}
          {required && (
            <span className="text-[#F54A4A]"> *</span>
          )}
        </span>
      )}

      <div className="flex h-[150px] flex-col items-center justify-center rounded-lg border border-dashed border-[#D3D3D3] bg-[#F9FAFF] text-center">
        <UploadCloud className="mb-2 h-7 w-7 text-[#0658C2]" />

        <p className="text-sm text-[#676767]">
          Click to upload or drag and drop
        </p>

        <p className="text-xs text-[#676767]">
          {fileName || hint || 'JPG, PNG, WEBP or PDF (max 5MB)'}
        </p>
      </div>

      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        disabled={disabled}
        onChange={handleChange}
      />
    </label>
  );
}

function UploadModal({
  employmentId,
  documentType: initialDocumentType,
  documentNumber: initialDocumentNumber,
  onClose,
  onSuccess,
}: {
  employmentId: string;
  documentType: string;
  documentNumber?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [documentType, setDocumentType] = useState(initialDocumentType);
  const [documentNumber, setDocumentNumber] = useState(initialDocumentNumber ?? '');
  const [expiryDate, setExpiryDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError('');

    if (selectedFile.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setPreviewUrl('');
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl('');
  };

  const handleSubmit = async () => {
    if (!file || !documentType.trim()) return;
    setUploading(true);
    setError('');
    try {
      const uploaded = await uploadEmployeeDocument(file);
      await addEmployeeDocument(employmentId, {
        document_type: documentType.trim(),
        ...(documentNumber.trim() ? { document_number: documentNumber.trim() } : {}),
        file_key: uploaded.fileKey,
        file_name: uploaded.fileName,
        ...(expiryDate.trim() ? { expiry_date: expiryDate.trim() } : {}),
      });
      onSuccess();
    } catch (err) {
      setError((err as Error).message || 'Could not save document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-[680px] overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="overflow-y-auto p-[20px]">
          <div className="flex items-center justify-between pb-[20px]">
            <SectionHeading icon={FileText} title="Upload Document"/>

            <button onClick={onClose} aria-label="Close">
              <X className="h-6 w-6 cursor-pointer" />
            </button>
          </div>
          <div className="max-h-[450px] 2xl:max-h-full overflow-y-auto">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold">
                Document Type <span className="text-[#F54A4A]">*</span>
              </span>
              <input
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value)}
                className="h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm outline-none focus:border-[#0658C2]"
                placeholder="e.g. Education Certificate"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Document Number</span>
              <input
                value={documentNumber}
                onChange={(event) => setDocumentNumber(event.target.value)}
                className="h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm outline-none focus:border-[#0658C2]"
                placeholder="Optional"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Expiry Date</span>
              <input
                type="date"
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
                className="h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm outline-none focus:border-[#0658C2]"
              />
            </label>
          </div>

          <div className="mt-4">
            <UploadBox
              hint="JPG, PNG, WEBP or PDF (max 5MB)"
              onFileSelect={handleFileSelect}
              disabled={uploading}
              fileName={file?.name}
            />
          </div>

          {file && (
            <>
              <div className="mt-[16px] flex items-center gap-4 rounded-xl border border-[#D3D3D3] p-3 shadow-sm">
                <div className="flex h-10 w-16 items-center justify-center overflow-hidden rounded bg-orange-50 ring-1 ring-orange-200">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Document" className="h-full w-full object-cover" />
                  ) : (
                    <FileText className="h-5 w-5 text-[#FFA000]" />
                  )}
                </div>

                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-semibold">{file.name}</p>

                  <p className="text-xs text-[#676767]">
                    {(file.size / 1024 / 1024).toFixed(2)}
                    MB
                  </p>
                </div>

                <Check className="h-5 w-5 rounded-full bg-[#E5FFEB] p-1 text-[#4CAF50]" />

                <button onClick={removeFile}>
                  <Trash2 className="h-5 w-5 text-[#F54A4A] cursor-pointer" />
                </button>
              </div>

              <h3 className="mt-[16px] text-base font-semibold">Document Preview</h3>

              <div className="mt-4 max-h-[250px] md:max-h-[450px] xl:max-h-[550px] 2xl:max-h-[650px] overflow-auto rounded-xl border border-[#D3D3D3] bg-[#FAFAFA] p-4">
                {previewUrl ? (
                  <img src={previewUrl} alt="preview" className="w-full object-contain" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[#676767]">
                    PDF Preview Area
                  </div>
                )}
              </div>
            </>
          )}

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-[16px] flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="h-12 rounded-xl border border-[#0658C2] px-8 font-semibold text-[#0658C2] cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!file || !documentType.trim() || uploading}
              onClick={() => void handleSubmit()}
              className="h-12 rounded-xl bg-[#0658C2] px-8 font-semibold text-white disabled:opacity-50 cursor-pointer"
            >
              {uploading ? 'Uploading…' : 'Upload Document'}
            </button>
          </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function SectionHeading({ icon: Icon, title }: { icon: typeof User; title: string }) {
  return (
    <h2 className="flex items-center gap-2 text-[20px] font-semibold">
      <Icon className="h-5 w-5 text-[#0658C2]" />
      {title}
    </h2>
  );
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-md border px-3 py-1 text-xs font-semibold ${statusStyle[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function Avatar({ name, size }: { name: string; size: 'sm' | 'md' | 'xl' }) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-9 w-9 text-xs',
    xl: 'h-28 w-28 text-2xl',
  };

  return (
    <div className={`${sizes[size]} shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-100 via-emerald-100 to-amber-100 ring-1 ring-gray-200`}>
      <div className="flex h-full w-full items-center justify-center font-bold text-blue-800">
        {name
          .split(' ')
          .map((item) => item[0])
          .join('')
          .slice(0, 2)}
      </div>
    </div>
  );
}

function IconLine({ icon: Icon, text }: { icon: typeof User; text: string }) {
  return (
    <p className="flex items-center gap-4">
      <Icon className="h-5 w-5 text-[#676767]" />
      {text}
    </p>
  );
}

function EditableIconLine({ icon: Icon, children }: { icon: typeof User; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <Icon className="h-5 w-5 text-[#676767]" />
      {children}
    </div>
  );
}

function HeroMetric({
  icon: Icon,
  label,
  value,
  editable,
  onChange,
}: {
  icon: typeof User;
  label: string;
  value: string;
  editable?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DBEAFF]">
        <Icon className="h-5 w-5 text-[#0658C2]" />
      </span>
      <div>
        <p className="text-sm text-[#676767]">{label}</p>
        {editable ? (
          <input
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            className="h-8 rounded-md border border-[#D3D3D3] px-2 text-sm font-semibold outline-none focus:border-[#0658C2]"
          />
        ) : (
          <p className="text-sm font-semibold">{value}</p>
        )}
      </div>
    </div>
  );
}

const getVisiblePages = (currentPage: number, totalPages: number) => {
  if (totalPages <= 4) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.min(Math.max(1, currentPage), Math.max(1, totalPages - 3));
  return [start, start + 1, start + 2, '...', totalPages].filter(
    (page, index, pages) => page !== pages[index - 1],
  );
};

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="mt-6 flex justify-end gap-3 text-sm">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAFAFA] disabled:cursor-not-allowed disabled:text-gray-300"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      {getVisiblePages(currentPage, totalPages).map((page, index) =>
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="px-2 text-[#676767]">
            ...
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page as number)}
            className={`h-8 min-w-8 rounded-lg px-2 ${
              page === currentPage ? 'bg-gray-100 font-semibold text-blue-700' : ''
            }`}
          >
            {page}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAFAFA] disabled:cursor-not-allowed disabled:text-gray-300"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#D3D3D3] shadow-sm">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead>
          <tr className="bg-[#FAFAFA] text-[#676767]">
            {headers.map((head) => (
              <th key={head} className="px-5 py-[10px]">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-[#D3D3D3] text-[#676767]">
              {row.map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`} className="px-5 py-4">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CollapsibleTitle({
  title,
  open,
  onToggle,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-xl border border-[#D3D3D3] px-5 py-[9px] text-left shadow-sm mb-2"
    >
      <h3 className="text-[20px] font-semibold text-[#676767]">{title}</h3>
      {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
    </button>
  );
}

function LeaveBalanceCard({
  title,
  value,
  note,
  color,
}: {
  title: string;
  value: string;
  note: string;
  color: 'green' | 'violet' | 'orange';
}) {
  const colorMap = {
    green: 'bg-[#E5FFEB] text-[#4CAF50]',
    violet: 'bg-[#EDE9FE] text-[#8B5CF6]',
    orange: 'bg-[#FFF4E3] text-[#FFA000]',
  };

  return (
    <div className={`rounded-2xl p-5 text-center ${colorMap[color]}`}>
      <p className="min-h-10 text-sm text-[#676767]">{title}</p>
      <p className="mt-2 text-3xl font-medium">{value}</p>
      <p className="text-xs text-[#676767]">Days</p>
      <p className="mt-4 text-xs text-[#676767]">{note}</p>
    </div>
  );
}

function legendColor(code: string) {
  if (code === 'P') return 'text-[#4CAF50]';
  if (code === 'A') return 'text-[#F54A4A]';
  if (code === 'L') return 'text-[#8B5CF6]';
  if (code === 'H') return 'text-[#0658C2]';
  return 'text-[#676767]';
}

function legendChip(code: string) {
  if (code === 'P') return 'bg-[#E5FFEB] text-[#4CAF50]';
  if (code === 'A') return 'bg-[#FEE9E5] text-[#F54A4A]';
  if (code === 'L') return 'bg-[#EDE9FE] text-[#8B5CF6]';
  if (code === 'H') return 'bg-[#DBEAFF] text-[#0658C2]';
  return 'bg-[#F4F4F4] text-[#676767]';
}
