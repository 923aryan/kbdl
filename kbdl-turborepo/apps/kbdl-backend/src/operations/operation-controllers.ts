import {
  GetAllEmployeeEmploymentRequest,
  GetEmployeeDetailsRequest,
  GetEmployeeEmploymentRequest,
  GetEmployeePendingEmploymentsRequest,
  GetEmployerDepartmentsMetaRequest,
  GetEmployerDesignationsMetaRequest,
  GetEmployerEmployeesListRequest,
  GetEmployerRosterRequest,
  GetEmployerSupervisorsMetaRequest,
  GetEmployerWorkShiftsMetaRequest,
  OnboardEmployeeRequest,
  AddEmployeeDocumentRequest,
  SearchAddressRequest,
  UpdateEmploymentStatusRequest,
  UpdateEmployeeProfileRequest,
} from '@repo/types';
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
  addEmployeeDocumentSchema,
  searchAddressSchema,
  updateEmploymentStatusSchema,
  updateEmployeeProfileSchema,
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
  getEmployerDepartmentsMetaService,
  getEmployerDesignationsMetaService,
  getEmployerRosterService,
  getEmployerSupervisorsMetaService,
  getEmployerWorkShiftsMetaService,
  getNextEmployeeNumberService,
  onboardEmployeeService,
  updateEmploymentStatusService,
  updateEmployeeProfileService,
} from './operation-services';
import { addEmployeeDocumentService } from './employee-document-service';
import { getEmployerEmployeesListService } from './employee-list-service';
import {
  getCompanyProfileService,
  upsertCompanyProfileService,
} from './company-setup-service';
import {
  employeeImportTemplateCsv,
  importEmployeesFromCsv,
} from './employee-import-service';
import { EmployerInviteHrRequest, UpsertCompanyProfileRequest } from '@repo/types';
import {
  createCompanyBranchSchema,
  createCompanyDepartmentSchema,
  createCompanyDesignationSchema,
  createCompanyHolidaySchema,
  createCompanyWorkShiftSchema,
  employerInviteHrSchema,
  saveCompanyHqLocationSchema,
  upsertCompanyProfileSchema,
} from '@repo/validator/shared';
import type {
  CreateCompanyBranchRequest,
  CreateCompanyDepartmentRequest,
  CreateCompanyDesignationRequest,
  CreateCompanyHolidayRequest,
  CreateCompanyWorkShiftRequest,
  SaveCompanyHqLocationRequest,
} from '@repo/types';
import { inviteHrService, listHrInvitesService } from '../admin/admin-company-service';
import { resolveEmployerStaff } from '../auth/employer-session';
import { AppError } from '../utils/api-error';
import { ROLES } from '../utils/constants';
import { setAuthCookies } from '../auth/auth-controller';
import {
  createCompanyBranchService,
  createCompanyDepartmentService,
  createCompanyDesignationService,
  createCompanyHolidayService,
  createCompanyWorkShiftService,
  getCompanyCatalogService,
  saveCompanyHqLocationService,
} from './org-catalog-service';

export const getEmployerRoster = async (req: Request, res: Response) => {
  const input: GetEmployerRosterRequest = validate(getEmployerRosterSchema, req);
  const employerId = req.payload.employer.id;

  const { roster, meta } = await getEmployerRosterService(employerId, input.query);
  sendSuccess(res, 'Employer roster retrieved successfully', roster, 200, meta);
};

export const getEmployerEmployeesList = async (req: Request, res: Response) => {
  const input: GetEmployerEmployeesListRequest = validate(getEmployerEmployeesListSchema, req);
  const employerId = req.payload.employer.id;

  const { items, meta } = await getEmployerEmployeesListService(employerId, input.query);
  sendSuccess(res, 'Employees retrieved successfully', items, 200, meta);
};

export const getEmployerDepartmentsMeta = async (req: Request, res: Response) => {
  const input: GetEmployerDepartmentsMetaRequest = validate(getEmployerDepartmentsMetaSchema, req);
  const companyId = req.payload.employer.id;
  const { items, meta } = await getEmployerDepartmentsMetaService(companyId, input.query);
  sendSuccess(res, 'Departments retrieved successfully', items, 200, meta);
};

export const getEmployerSupervisorsMeta = async (req: Request, res: Response) => {
  const input: GetEmployerSupervisorsMetaRequest = validate(getEmployerSupervisorsMetaSchema, req);
  const companyId = req.payload.employer.id;
  const { items, meta } = await getEmployerSupervisorsMetaService(companyId, input.query);
  sendSuccess(res, 'Supervisors retrieved successfully', items, 200, meta);
};

export const getEmployerWorkShiftsMeta = async (req: Request, res: Response) => {
  const input: GetEmployerWorkShiftsMetaRequest = validate(getEmployerWorkShiftsMetaSchema, req);
  const companyId = req.payload.employer.id;
  const { items, meta } = await getEmployerWorkShiftsMetaService(companyId, input.query);
  sendSuccess(res, 'Work shifts retrieved successfully', items, 200, meta);
};

export const getEmployerDesignationsMeta = async (req: Request, res: Response) => {
  const input: GetEmployerDesignationsMetaRequest = validate(
    getEmployerDesignationsMetaSchema,
    req,
  );
  const companyId = req.payload.employer.id;
  const { items, meta } = await getEmployerDesignationsMetaService(companyId, input.query);
  sendSuccess(res, 'Designations retrieved successfully', items, 200, meta);
};

export const getNextEmployeeNumber = async (req: Request, res: Response) => {
  const companyId = req.payload.employer.id;
  const nextEmployeeNo = await getNextEmployeeNumberService(companyId);
  sendSuccess(res, 'Next employee number retrieved successfully', {
    employee_no: nextEmployeeNo,
  });
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
  const message =
    input.body.action === 'draft'
      ? 'Employee draft saved successfully'
      : 'Employee onboarded successfully';
  sendSuccess(res, message, newEmployee, 201);
};

export const updateEmployeeProfile = async (req: Request, res: Response) => {
  const input: UpdateEmployeeProfileRequest = validate(updateEmployeeProfileSchema, req);
  const employerId = req.payload.employer.id;

  const updated = await updateEmployeeProfileService(
    employerId,
    input.params.id,
    input.body,
  );
  sendSuccess(res, 'Employee profile updated successfully', updated);
};

export const addEmployeeDocument = async (req: Request, res: Response) => {
  const input: AddEmployeeDocumentRequest = validate(addEmployeeDocumentSchema, req);
  const employerId = req.payload.employer.id;

  const updated = await addEmployeeDocumentService(employerId, input.params.id, input.body);
  sendSuccess(res, 'Document saved successfully', updated, 201);
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
  const { employments, meta } = await getAllEmployeeEmploymentService(employeeId, input.query);
  sendSuccess(res, 'Employee employments retrieved successfully', employments, 200, meta);
};

export const getEmployeeEmployment = async (req: Request, res: Response) => {
  const input: GetEmployeeEmploymentRequest = validate(getEmployeeEmploymentSchema, req);
  const employeeId = (req.payload as any).user.id;
  const employmentId = input.params.id;
  const employment = await getEmployeeEmploymentService(employeeId, employmentId);
  sendSuccess(res, 'Employee employment retrieved successfully', employment);
};

export const getEmployeePendingEmployments = async (req: Request, res: Response) => {
  const input: GetEmployeePendingEmploymentsRequest = validate(
    getEmployeePendingEmploymentsSchema,
    req,
  );
  const employeeId = (req.payload as any).user.id;
  const { employments, meta } = await getEmployeePendingEmploymentsService(employeeId, input.query);
  sendSuccess(res, 'Employee pending employments retrieved successfully', employments, 200, meta);
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

function requireEmployerAuth(req: Request) {
  if (req.role !== 'employer' || !req.payload || !('employer' in req.payload)) {
    throw new AppError(401, 'UNAUTHORIZED', 'Employer session required');
  }
  return req.payload.employer;
}

export const getCompanyProfile = async (req: Request, res: Response) => {
  const emp = requireEmployerAuth(req);
  const profile = await getCompanyProfileService({
    id: emp.id,
    user_id: emp.user_id,
    setup_pending: emp.setup_pending,
  });
  sendSuccess(res, 'Company profile', profile);
};

export const upsertCompanyProfile = async (req: Request, res: Response) => {
  const emp = requireEmployerAuth(req);
  if (!emp.user_id) {
    throw new AppError(401, 'UNAUTHORIZED', 'Please log in again to continue company setup');
  }
  const input: UpsertCompanyProfileRequest = validate(upsertCompanyProfileSchema, req);
  const result = await upsertCompanyProfileService({
    userId: emp.user_id,
    email: emp.email,
    companyId: emp.id,
    setupPending: emp.setup_pending,
    roleCode: emp.role_code,
    body: input.body,
  });
  setAuthCookies(res, result.accessToken, result.refreshToken, ROLES.EMPLOYER);
  sendSuccess(res, 'Company saved', {
    profile: result.profile,
    employer: result.employer,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
};

export const inviteCompanyHr = async (req: Request, res: Response) => {
  const emp = requireEmployerAuth(req);
  const staff = await resolveEmployerStaff(emp);
  if (staff.roleCode !== 'OWNER') {
    throw new AppError(403, 'FORBIDDEN', 'Only the company owner can invite HR');
  }
  const input: EmployerInviteHrRequest = validate(employerInviteHrSchema, req);
  const invite = await inviteHrService({
    ...input.body,
    company_id: staff.id,
    invitedByUserId: staff.userId,
  });
  sendSuccess(res, 'HR invite created. They can log in with this email.', invite, 201);
};

export const listCompanyHrInvites = async (req: Request, res: Response) => {
  const emp = requireEmployerAuth(req);
  if (!emp.id || emp.setup_pending) {
    throw new AppError(403, 'COMPANY_SETUP_REQUIRED', 'Company is not set up yet');
  }
  const result = await listHrInvitesService({
    page: 1,
    limit: 50,
    companyId: emp.id,
  });
  sendSuccess(res, 'HR invites', result.items, 200, result.meta);
};

export const getCompanyCatalog = async (req: Request, res: Response) => {
  const emp = requireEmployerAuth(req);
  sendSuccess(res, 'Company catalog', await getCompanyCatalogService(emp.id));
};

export const createCompanyDepartment = async (req: Request, res: Response) => {
  const emp = requireEmployerAuth(req);
  const input: CreateCompanyDepartmentRequest = validate(createCompanyDepartmentSchema, req);
  sendSuccess(res, 'Department added', await createCompanyDepartmentService(emp.id, input.body), 201);
};

export const createCompanyDesignation = async (req: Request, res: Response) => {
  const emp = requireEmployerAuth(req);
  const input: CreateCompanyDesignationRequest = validate(createCompanyDesignationSchema, req);
  sendSuccess(res, 'Job title added', await createCompanyDesignationService(emp.id, input.body), 201);
};

export const createCompanyBranch = async (req: Request, res: Response) => {
  const emp = requireEmployerAuth(req);
  const input: CreateCompanyBranchRequest = validate(createCompanyBranchSchema, req);
  sendSuccess(res, 'Branch added', await createCompanyBranchService(emp.id, input.body), 201);
};

export const saveCompanyHqLocation = async (req: Request, res: Response) => {
  const emp = requireEmployerAuth(req);
  const input: SaveCompanyHqLocationRequest = validate(saveCompanyHqLocationSchema, req);
  sendSuccess(res, 'Head-office location saved', await saveCompanyHqLocationService(emp.id, input.body));
};

export const createCompanyWorkShift = async (req: Request, res: Response) => {
  const emp = requireEmployerAuth(req);
  const input: CreateCompanyWorkShiftRequest = validate(createCompanyWorkShiftSchema, req);
  sendSuccess(res, 'Work shift added', await createCompanyWorkShiftService(emp.id, input.body), 201);
};

export const createCompanyHoliday = async (req: Request, res: Response) => {
  const emp = requireEmployerAuth(req);
  const input: CreateCompanyHolidayRequest = validate(createCompanyHolidaySchema, req);
  sendSuccess(res, 'Holiday added', await createCompanyHolidayService(emp.id, input.body), 201);
};

export const downloadEmployeeImportTemplate = async (_req: Request, res: Response) => {
  const csv = employeeImportTemplateCsv();
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="kbdl-employee-onboard-template.csv"');
  res.status(200).send(csv);
};

export const importEmployeesSpreadsheet = async (req: Request, res: Response) => {
  const emp = requireEmployerAuth(req);
  const file = (req as Request & { file?: Express.Multer.File }).file;
  if (!file?.buffer) {
    throw new AppError(400, 'FILE_REQUIRED', 'Upload a CSV file');
  }
  const result = await importEmployeesFromCsv(emp.id, file.buffer);
  sendSuccess(res, 'Employee import finished', result);
};

