import { EmployeeEmployment, EmployeeHrProfile, EmployeeHrAddress } from '@repo/db';
import {
  getAllEmployeeEmploymentSchema,
  getEmployeeDetailsSchema,
  getEmployeeEmploymentSchema,
  getEmployeePendingEmploymentsSchema,
  getEmployerDepartmentsMetaSchema,
  getEmployerDesignationsMetaSchema,
  getEmployerEmployeesListSchema,
  getEmployerRosterSchema,
  getEmployerSupervisorsMetaSchema,
  getEmployerWorkShiftsMetaSchema,
  onboardEmployeeSchema,
  searchAddressSchema,
  addEmployeeDocumentSchema,
  updateEmploymentStatusSchema,
  updateEmployeeProfileSchema,
  createCompanyDepartmentSchema,
  createCompanyDesignationSchema,
  createCompanyBranchSchema,
  saveCompanyHqLocationSchema,
  createCompanyWorkShiftSchema,
  createCompanyHolidaySchema,
} from '@repo/validator/shared';
import { z } from 'zod';
import { EmployerDTO, UserDTO } from './profile-type';

export type EmployeeOrgContext = {
  designation: { id: string; name: string } | null;
  department: { id: string; name: string } | null;
  manager: {
    id: string;
    user_id: string;
    name: string | null;
    phone_no: string;
  } | null;
  work_shift: {
    id: string;
    name: string;
    start_time?: string;
    end_time?: string;
    break_minutes?: number;
  } | null;
};

export type EmployeeProfileSections = {
  personal: string[][];
  contact: string[][];
  emergency: string[][];
  identity: string[][];
  other: string[][];
  job: string[][];
  work: string[][];
  payroll: string[][];
  bank: string[][];
  payment: string[][];
  documents: string[][];
  notes?: string;
  addresses: {
    present: EmployeeHrAddress | null;
    permanent: EmployeeHrAddress | null;
  };
};

export type WorkforcePersonDTO = {
  id: string;
  phone_no: string;
  karigari_id: string | null;
  linked_user_id: string | null;
  linked_user?: UserDTO | null;
};

export type EmployeeStatusView = {
  is_active: boolean;
  separation_reason: EmployeeEmployment['separation_reason'];
  onboarding_stage: string | null;
  /** Employer UI badge label */
  ui_status: string;
};

// Assuming you have a DTO representing the joined EmployeeEmployment & User model
export type EmployeeEmploymentDTO = EmployeeEmployment & {
  employer_id: string;
  workforce_person: WorkforcePersonDTO;
  /** Linked app user view, or HR identity snapshot when not registered on app */
  employee: UserDTO;
  hr_profile?: (EmployeeHrProfile & {
    designation?: { id: string; name: string } | null;
    department?: { id: string; name: string } | null;
    addresses?: EmployeeHrAddress[];
    documents?: EmployeeHrDocumentDTO[];
  }) | null;
  organization?: EmployeeOrgContext;
  status?: EmployeeStatusView;
  /** UI-ready label/value rows for employer detail tabs */
  profile_sections?: EmployeeProfileSections;
};
export type EmployeeEmploymentWithEmployerDTO = EmployeeEmployment & {
  employer_id: string;
  employer: EmployerDTO;
};

export type GetEmployerRosterRequest = z.infer<typeof getEmployerRosterSchema>;
export type GetEmployerRosterQuery = z.infer<typeof getEmployerRosterSchema>['query'];
export type GetEmployerRosterResponse = EmployeeEmploymentDTO[];

export type GetEmployerEmployeesListRequest = z.infer<typeof getEmployerEmployeesListSchema>;
export type GetEmployerEmployeesListQuery = z.infer<
  typeof getEmployerEmployeesListSchema
>['query'];

export type EmployerEmployeeListItem = {
  employment_id: string;
  employee_no: string | null;
  workforce_person_id: string;
  user_id: string | null;
  karigari_id: string | null;
  name: string;
  email: string | null;
  phone_no: string;
  designation: string;
  designation_id: string | null;
  department: string | null;
  department_id: string | null;
  gender: string | null;
  employee_type: string | null;
  rating: number | null;
  joined_at: string;
  left_at: string | null;
  status: EmployeeStatusView;
};

export type EmployerEmployeeFacets = {
  designation: Record<string, number>;
  status: Record<string, number>;
  gender: Record<string, number>;
  department: Record<string, number>;
  employee_type: Record<string, number>;
};

export type GetEmployerEmployeesListResponse = EmployerEmployeeListItem[];

export type GetEmployeeDetailsRequest = z.infer<typeof getEmployeeDetailsSchema>;
export type GetEmployeeDetailsResponse = EmployeeEmploymentDTO;

export type OnboardEmployeeRequest = z.infer<typeof onboardEmployeeSchema>;
export type OnboardEmployeePayload = z.infer<typeof onboardEmployeeSchema>['body'];
export type OnboardEmployeeResponse = EmployeeEmploymentDTO;

export type UpdateEmploymentStatusRequest = z.infer<typeof updateEmploymentStatusSchema>;
export type UpdateEmploymentStatusPayload = z.infer<typeof updateEmploymentStatusSchema>['body'];
export type UpdateEmploymentStatusResponse = EmployeeEmploymentDTO;

export type UpdateEmployeeProfileRequest = z.infer<typeof updateEmployeeProfileSchema>;
export type UpdateEmployeeProfilePayload = z.infer<typeof updateEmployeeProfileSchema>['body'];
export type UpdateEmployeeProfileResponse = EmployeeEmploymentDTO;

export type EmployeeHrDocumentDTO = {
  id: string;
  document_type: string;
  document_number: string | null;
  file_key: string;
  file_name: string | null;
  expiry_date: string | null;
  created_at: string;
};

export type AddEmployeeDocumentRequest = z.infer<typeof addEmployeeDocumentSchema>;
export type AddEmployeeDocumentPayload = z.infer<typeof addEmployeeDocumentSchema>['body'];
export type AddEmployeeDocumentResponse = EmployeeEmploymentDTO;

export type GetAllEmployeeEmploymentRequest = z.infer<typeof getAllEmployeeEmploymentSchema>;
export type GetAllEmployeeEmploymentQuery = z.infer<typeof getAllEmployeeEmploymentSchema>['query'];
export type GetAllEmployeeEmploymentResponse = EmployeeEmploymentWithEmployerDTO[];

export type GetEmployeeEmploymentRequest = z.infer<typeof getEmployeeEmploymentSchema>;
export type GetEmployeeEmploymentResponse = EmployeeEmploymentWithEmployerDTO;

export type GetEmployeePendingEmploymentsRequest = z.infer<
  typeof getEmployeePendingEmploymentsSchema
>;
export type GetEmployeePendingEmploymentsQuery = z.infer<
  typeof getEmployeePendingEmploymentsSchema
>['query'];
export type GetEmployeePendingEmploymentResponse = EmployeeEmploymentWithEmployerDTO[];

export type SearchAddressRequest = z.infer<typeof searchAddressSchema>;
export type SearchAddressPayload = z.infer<typeof searchAddressSchema>['query'];

export type GetEmployerDepartmentsMetaRequest = z.infer<typeof getEmployerDepartmentsMetaSchema>;
export type GetEmployerDepartmentsMetaQuery = z.infer<
  typeof getEmployerDepartmentsMetaSchema
>['query'];

export type GetEmployerSupervisorsMetaRequest = z.infer<typeof getEmployerSupervisorsMetaSchema>;
export type GetEmployerSupervisorsMetaQuery = z.infer<
  typeof getEmployerSupervisorsMetaSchema
>['query'];

export type GetEmployerWorkShiftsMetaRequest = z.infer<typeof getEmployerWorkShiftsMetaSchema>;
export type GetEmployerWorkShiftsMetaQuery = z.infer<
  typeof getEmployerWorkShiftsMetaSchema
>['query'];

export type GetEmployerDesignationsMetaRequest = z.infer<typeof getEmployerDesignationsMetaSchema>;
export type GetEmployerDesignationsMetaQuery = z.infer<
  typeof getEmployerDesignationsMetaSchema
>['query'];

export type CreateCompanyDepartmentRequest = z.infer<typeof createCompanyDepartmentSchema>;
export type CreateCompanyDesignationRequest = z.infer<typeof createCompanyDesignationSchema>;
export type CreateCompanyBranchRequest = z.infer<typeof createCompanyBranchSchema>;
export type SaveCompanyHqLocationRequest = z.infer<typeof saveCompanyHqLocationSchema>;
export type CreateCompanyWorkShiftRequest = z.infer<typeof createCompanyWorkShiftSchema>;
export type CreateCompanyHolidayRequest = z.infer<typeof createCompanyHolidaySchema>;

export type CompanyCatalogView = {
  hq: { latitude: number; longitude: number } | null;
  departments: Array<{ id: string; name: string; description: string | null }>;
  designations: Array<{ id: string; name: string; description: string | null; is_active: boolean }>;
  branches: Array<{
    id: string;
    name: string;
    latitude: number | null;
    longitude: number | null;
    has_location: boolean;
  }>;
  work_shifts: Array<{
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    break_minutes: number;
    is_active: boolean;
  }>;
  holidays: Array<{ id: string; date: string; name: string; is_optional: boolean }>;
};

export type MetaDepartmentItem = {
  id: string;
  name: string;
  description: string | null;
};

export type MetaDesignationItem = {
  id: string;
  name: string;
  description: string | null;
};

export type MetaSupervisorItem = {
  id: string;
  user_id: string;
  name: string | null;
  phone_no: string;
  role_code: string;
  role_name: string;
  department_id: string | null;
  department_name: string | null;
};

export type MetaWorkShiftItem = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  is_active: boolean;
};

export interface SearchAddressResponse {
  type: 'FeatureCollection';
  features: SearchAddressFeature[];
  query: {
    text: string;
    parsed: {
      city?: string;
      expected_type?: string;
    };
    categories: string[];
  };
}

export interface SearchAddressFeature {
  type: 'Feature';
  properties: {
    place_id: string;
    formatted: string;

    lat: number;
    lon: number;

    country?: string;
    country_code?: string;

    state?: string;
    city?: string;
    county?: string;
    postcode?: string;

    result_type: string;

    address_line1?: string;
    address_line2?: string;
  };

  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };

  bbox?: number[];
}
