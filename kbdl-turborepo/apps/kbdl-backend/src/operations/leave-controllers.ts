import {
  CreateCompanyLeaveTypeRequest,
  CreateEmployeeLeaveRequest,
  GetCompanyLeaveCatalogRequest,
  GetCompanyLeaveRequestsRequest,
  GetEmployeeLeaveRequest,
  UpdateCompanyLeavePolicyRequest,
  UpdateCompanyLeaveTypeRequest,
  UpdateLeaveRequestRequest,
} from '@repo/types';
import {
  createCompanyLeaveTypeSchema,
  createEmployeeLeaveSchema,
  getCompanyLeaveCatalogSchema,
  getCompanyLeaveRequestsSchema,
  getEmployeeLeaveSchema,
  updateCompanyLeavePolicySchema,
  updateCompanyLeaveTypeSchema,
  updateLeaveRequestSchema,
} from '@repo/validator/shared';
import { Request, Response } from 'express';
import { sendSuccess } from '../utils/send-success';
import { validate } from '../utils/validate';
import {
  createCompanyLeaveTypeService,
  createEmployeeLeaveService,
  getCompanyLeaveCatalogService,
  getCompanyLeaveRequestsService,
  getEmployeeLeaveService,
  updateCompanyLeavePolicyService,
  updateCompanyLeaveTypeService,
  updateLeaveRequestService,
} from './leave-service';

export const getEmployeeLeave = async (req: Request, res: Response) => {
  const input: GetEmployeeLeaveRequest = validate(getEmployeeLeaveSchema, req);
  const data = await getEmployeeLeaveService(
    req.payload.employer.id,
    input.params.employmentId,
    input.query,
  );
  sendSuccess(res, 'Employee leave retrieved', data);
};

export const createEmployeeLeave = async (req: Request, res: Response) => {
  const input: CreateEmployeeLeaveRequest = validate(createEmployeeLeaveSchema, req);
  const data = await createEmployeeLeaveService(
    req.payload.employer.id,
    input.params.employmentId,
    input.body,
  );
  sendSuccess(res, 'Leave request created', data, 201);
};

export const updateLeaveRequest = async (req: Request, res: Response) => {
  const input: UpdateLeaveRequestRequest = validate(updateLeaveRequestSchema, req);
  const data = await updateLeaveRequestService(
    req.payload.employer.id,
    input.params.requestId,
    input.body.status,
  );
  sendSuccess(res, 'Leave request updated', data);
};

export const getCompanyLeaveCatalog = async (req: Request, res: Response) => {
  const input: GetCompanyLeaveCatalogRequest = validate(getCompanyLeaveCatalogSchema, req);
  const data = await getCompanyLeaveCatalogService(
    req.payload.employer.id,
    Boolean(input.query.include_inactive),
  );
  sendSuccess(res, 'Company leave catalog retrieved', data);
};

export const createCompanyLeaveType = async (req: Request, res: Response) => {
  const input: CreateCompanyLeaveTypeRequest = validate(createCompanyLeaveTypeSchema, req);
  const data = await createCompanyLeaveTypeService(req.payload.employer.id, input.body);
  sendSuccess(res, 'Leave type created', data, 201);
};

export const updateCompanyLeaveType = async (req: Request, res: Response) => {
  const input: UpdateCompanyLeaveTypeRequest = validate(updateCompanyLeaveTypeSchema, req);
  const data = await updateCompanyLeaveTypeService(
    req.payload.employer.id,
    input.params.typeId,
    input.body,
  );
  sendSuccess(res, 'Leave type updated', data);
};

export const updateCompanyLeavePolicy = async (req: Request, res: Response) => {
  const input: UpdateCompanyLeavePolicyRequest = validate(updateCompanyLeavePolicySchema, req);
  const data = await updateCompanyLeavePolicyService(req.payload.employer.id, input.body);
  sendSuccess(res, 'Leave policy updated', data);
};

export const getCompanyLeaveRequests = async (req: Request, res: Response) => {
  const input: GetCompanyLeaveRequestsRequest = validate(getCompanyLeaveRequestsSchema, req);
  const { items, meta } = await getCompanyLeaveRequestsService(
    req.payload.employer.id,
    input.query,
  );
  sendSuccess(res, 'Leave requests retrieved', items, 200, meta);
};
