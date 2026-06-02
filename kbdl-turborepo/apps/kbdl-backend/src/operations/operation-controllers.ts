import {
  GetAllEmployeeEmploymentRequest,
  GetEmployeeDetailsRequest,
  GetEmployeeEmploymentRequest,
  GetEmployerRosterRequest,
  OnboardEmployeeRequest,
  SearchAddressRequest,
  UpdateEmploymentStatusRequest,
} from '@repo/types';
import {
  getAllEmployeeEmploymentSchema,
  getEmployeeDetailsSchema,
  getEmployeeEmploymentSchema,
  getEmployerRosterSchema,
  onboardEmployeeSchema,
  searchAddressSchema,
  updateEmploymentStatusSchema,
} from '@repo/validator/shared';
import { Request, Response } from 'express';
import { sendSuccess } from '../utils/send-success';
import { validate } from '../utils/validate';
import {
  acceptEmploymentRequestService,
  declineEmploymentRequestService,
  getAddressSuggestionsService,
  getAllEmployeeEmploymentService,
  getEmployeeDetailsService,
  getEmployeeEmploymentService,
  getEmployeePendingEmploymentsService,
  getEmployerRosterService,
  onboardEmployeeService,
  updateEmploymentStatusService,
} from './operation-services';

export const getEmployerRoster = async (req: Request, res: Response) => {
  const input: GetEmployerRosterRequest = validate(getEmployerRosterSchema, req);
  const employerId = req.payload.employer.id;

  const roster = await getEmployerRosterService(employerId, input.query);
  sendSuccess(res, 'Employer roster retrieved successfully', roster);
};

export const getEmployeeDetails = async (req: Request, res: Response) => {
  const input: GetEmployeeDetailsRequest = validate(getEmployeeDetailsSchema, req);
  const employerId = req.payload.employer.id;

  // employerId is passed to ensure the employer owns this EmployeeEmployment row
  const employeeDetails = await getEmployeeDetailsService(employerId, input.params.id);
  sendSuccess(res, 'Employee details retrieved successfully', employeeDetails);
};

export const onboardEmployee = async (req: Request, res: Response) => {
  const input: OnboardEmployeeRequest = validate(onboardEmployeeSchema, req);
  const employerId = req.payload.employer.id;

  const newEmployee = await onboardEmployeeService(employerId, input.body);
  sendSuccess(res, 'Employee onboarded successfully', newEmployee, 201);
};

export const updateEmploymentStatus = async (req: Request, res: Response) => {
  const input: UpdateEmploymentStatusRequest = validate(updateEmploymentStatusSchema, req);
  const employerId = req.payload.employer.id;

  const updatedStatus = await updateEmploymentStatusService(
    employerId,
    input.params.id,
    input.body,
  );
  sendSuccess(res, 'Employment status updated successfully', updatedStatus);
};

export const getAllEmployeeEmployment = async (req: Request, res: Response) => {
  const input: GetAllEmployeeEmploymentRequest = validate(getAllEmployeeEmploymentSchema, req);
  const employeeId = req.payload.user.id;
  const employments = await getAllEmployeeEmploymentService(employeeId);
  sendSuccess(res, 'Employee employments retrieved successfully', employments);
};

export const getEmployeeEmployment = async (req: Request, res: Response) => {
  const input: GetEmployeeEmploymentRequest = validate(getEmployeeEmploymentSchema, req);
  const employeeId = (req.payload as any).user.id;
  const employmentId = input.params.id;
  const employment = await getEmployeeEmploymentService(employeeId, employmentId);
  sendSuccess(res, 'Employee employment retrieved successfully', employment);
};

export const getEmployeePendingEmployments = async (req: Request, res: Response) => {
  const employeeId = (req.payload as any).user.id;
  const employment = await getEmployeePendingEmploymentsService(employeeId);
  sendSuccess(res, 'Employee pending employments retrieved successfully', employment);
};

export const acceptEmploymentRequest = async (req: Request, res: Response) => {
  const input: GetEmployeeEmploymentRequest = validate(getEmployeeEmploymentSchema, req);
  const employeeId = (req.payload as any).user.id;
  const employmentId = input.params.id;
  const employment = await acceptEmploymentRequestService(employeeId, employmentId);
  sendSuccess(res, 'Employment request accepted successfully', employment);
};

export const declineEmploymentRequest = async (req: Request, res: Response) => {
  const input: GetEmployeeEmploymentRequest = validate(getEmployeeEmploymentSchema, req);
  const employeeId = (req.payload as any).user.id;
  const employmentId = input.params.id;
  const employment = await declineEmploymentRequestService(employeeId, employmentId);
  sendSuccess(res, 'Employment request declined successfully', employment);
};

export const searchAddress = async (req: Request, res: Response) => {
  const input: SearchAddressRequest = validate(searchAddressSchema, req);
  const addresses = await getAddressSuggestionsService(input.query.query);
  sendSuccess(res, 'Addresses retrieved successfully', addresses);
};
