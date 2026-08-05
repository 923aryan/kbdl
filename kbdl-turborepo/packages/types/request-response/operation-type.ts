import { EmployeeEmployment, EmployeeHrProfile } from '@repo/db';
import {
  getAllEmployeeEmploymentSchema,
  getEmployeeDetailsSchema,
  getEmployeeEmploymentSchema,
  getEmployeePendingEmploymentsSchema,
  getEmployerDepartmentsMetaSchema,
  getEmployerDesignationsMetaSchema,
  getEmployerRosterSchema,
  getEmployerSupervisorsMetaSchema,
  getEmployerWorkShiftsMetaSchema,
  onboardEmployeeSchema,
  searchAddressSchema,
  updateEmploymentStatusSchema,
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
  work_shift: { id: string; name: string } | null;
};

export type EmployeeStatusView = {
  employment_status: EmployeeEmployment['employment_status'];
  onboarding_stage: string | null;
  /** Employer UI badge label */
  ui_status: string;
};

// Assuming you have a DTO representing the joined EmployeeEmployment & User model
export type EmployeeEmploymentDTO = EmployeeEmployment & {
  employer_id: string;
  employee: UserDTO;
  hr_profile?: EmployeeHrProfile | null;
  organization?: EmployeeOrgContext;
  status?: EmployeeStatusView;
};
export type EmployeeEmploymentWithEmployerDTO = EmployeeEmployment & {
  employer_id: string;
  employer: EmployerDTO;
};

export type GetEmployerRosterRequest = z.infer<typeof getEmployerRosterSchema>;
export type GetEmployerRosterQuery = z.infer<typeof getEmployerRosterSchema>['query'];
export type GetEmployerRosterResponse = EmployeeEmploymentDTO[];

export type GetEmployeeDetailsRequest = z.infer<typeof getEmployeeDetailsSchema>;
export type GetEmployeeDetailsResponse = EmployeeEmploymentDTO;

export type OnboardEmployeeRequest = z.infer<typeof onboardEmployeeSchema>;
export type OnboardEmployeePayload = z.infer<typeof onboardEmployeeSchema>['body'];
export type OnboardEmployeeResponse = EmployeeEmploymentDTO;

export type UpdateEmploymentStatusRequest = z.infer<typeof updateEmploymentStatusSchema>;
export type UpdateEmploymentStatusPayload = z.infer<typeof updateEmploymentStatusSchema>['body'];
export type UpdateEmploymentStatusResponse = EmployeeEmploymentDTO;

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
