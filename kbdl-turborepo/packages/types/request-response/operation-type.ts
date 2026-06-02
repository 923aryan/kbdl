import { EmployeeEmployment } from '@repo/db';
import {
  getAllEmployeeEmploymentSchema,
  getEmployeeDetailsSchema,
  getEmployeeEmploymentSchema,
  getEmployerRosterSchema,
  onboardEmployeeSchema,
  searchAddressSchema,
  updateEmploymentStatusSchema,
} from '@repo/validator/shared';
import { z } from 'zod';
import { EmployerDTO, UserDTO } from './profile-type';

// Assuming you have a DTO representing the joined EmployeeEmployment & User model
export type EmployeeEmploymentDTO = EmployeeEmployment & { employee: UserDTO };
export type EmployeeEmploymentWithEmployerDTO = EmployeeEmployment & { employer: EmployerDTO };

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
export type GetAllEmployeeEmploymentResponse = EmployeeEmploymentWithEmployerDTO[];

export type GetEmployeeEmploymentRequest = z.infer<typeof getEmployeeEmploymentSchema>;
export type GetEmployeeEmploymentResponse = EmployeeEmploymentWithEmployerDTO;

export type GetEmployeePendingEmploymentResponse = EmployeeEmploymentWithEmployerDTO[];

export type SearchAddressRequest = z.infer<typeof searchAddressSchema>;
export type SearchAddressPayload = z.infer<typeof searchAddressSchema>['query'];

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
