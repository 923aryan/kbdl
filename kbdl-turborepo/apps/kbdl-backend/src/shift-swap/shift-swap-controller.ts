import {
  AcceptShiftRequest,
  ApproveShiftCompletionRequest,
  ApproveShiftRequest,
  CancelShiftRequest,
  CreateShiftRequest,
  GetBestShiftMatchesRequest,
  GetEmployeeShiftsResponse,
  GetEmployerShiftsRequest,
  GetExtraShiftsRequest,
  GetLatestShiftsRequest,
  GetPendingShiftsRequest,
  getReferredEmployeeRequest,
  GetShiftDetailsRequest,
  RateShiftRequest,
  RejectShiftRequest,
  ReportShiftNoShowRequest,
  SyncSavedShiftsRequest,
  UpdateShiftRequest,
  WithdrawShiftApplicationRequest,
} from '@repo/types';
import {
  acceptShiftSchema,
  applyForPublicShiftSchema,
  approveShiftCompletionSchema,
  approveShiftSchema,
  cancelShiftSchema,
  createShiftSchema,
  getBestShiftMatchesSchema,
  getEmployerShiftsSchema,
  getExtraShiftsSchema,
  getLatestShiftsSchema,
  getPendingShiftsSchema,
  getReferredEmployeeSchema,
  getShiftDetailsSchema,
  rateShiftSchema,
  rejectShiftSchema,
  reportShiftNoShowSchema,
  syncSavedShiftsSchema,
  updateShiftSchema,
  withdrawShiftApplicationSchema,
} from '@repo/validator/shared';
import { Request, Response } from 'express';
import { ROLES } from '../utils/constants';
import { sendSuccess } from '../utils/send-success';
import { validate } from '../utils/validate';
import {
  acceptShiftService,
  applyForPublicShiftsService,
  approveShiftCompletionService,
  approveShiftRequestService,
  cancelShiftService,
  createShiftService,
  getBestShiftMatchesService,
  getCreatedShiftsForEmployeeService,
  getEmployeeShiftsService,
  getEmployerShiftsService,
  getExtraShiftsService,
  getLatestShiftsService,
  getOpenShiftsForEmployeeService,
  getPendingShiftsForEmployerService,
  getReferredEmployeeService,
  getScheduledShiftsService,
  getShiftDetailsService,
  rateShiftService,
  rejectShiftApplicationService,
  reportShiftNoShowService,
  syncSavedShiftsService,
  updateShiftService,
  withdrawShiftApplicationService,
} from './shift-swap-service';

// A. Create Shift Swap (Handles employee-to-employee, public, and employer creation)
const createShiftSwap = async (req: Request, res: Response) => {
  const input: CreateShiftRequest = validate(createShiftSchema, req);
  const userType = req.role === ROLES.EMPLOYER ? ROLES.EMPLOYER : ROLES.USER;
  const userId = userType === ROLES.USER ? req.payload.user.id : req.payload.employer.id;
  const shift = await createShiftService(userId, userType, input.body);
  sendSuccess(res, 'Shift swap created successfully', shift, 201);
};

// A. Accept Shift Swap
const acceptShiftSwap = async (req: Request, res: Response) => {
  const input: AcceptShiftRequest = validate(acceptShiftSchema, req);
  const workerId = req.payload.user.id;
  const shift = await acceptShiftService(workerId, input.body);
  sendSuccess(res, 'Shift request accepted', shift, 200);
};

// A1. Apply For Public Shifts
const applyForPublicShifts = async (req: Request, res: Response) => {
  const input: AcceptShiftRequest = validate(applyForPublicShiftSchema, req);
  const workerId = req.payload.user.id;
  const shift = await applyForPublicShiftsService(workerId, input.body);
  sendSuccess(
    res,
    'Shift applied successfully, once accepted we will send you the notificaiton.',
    shift,
    200,
  );
};

// A2. Withdraw Shift Application
const withdrawShiftApplication = async (req: Request, res: Response) => {
  const input: WithdrawShiftApplicationRequest = validate(withdrawShiftApplicationSchema, req);
  const workerId = req.payload.user.id;
  const application = await withdrawShiftApplicationService(
    workerId,
    input.body.shift_application_id,
  );
  sendSuccess(res, 'Shift application withdrawn successfully', application, 200);
};

// B1. See Accepted Shifts (Worker)
const getEmployeeShifts = async (req: Request, res: Response) => {
  const employeeId = req.payload.user.id;
  const shifts = await getEmployeeShiftsService(employeeId);
  sendSuccess<GetEmployeeShiftsResponse>(res, 'Scheduled shifts retrieved', shifts, 200);
};

// B1.5 See Created Shifts (Worker)
const getCreatedShiftsForEmployee = async (req: Request, res: Response) => {
  const employeeId = req.payload.user.id;
  const shifts = await getCreatedShiftsForEmployeeService(employeeId);
  sendSuccess(res, 'Created shifts retrieved successfully', shifts, 200);
};

// B. Get Scheduled Shifts (Worker)
const getScheduledShifts = async (req: Request, res: Response) => {
  const employeeId = req.payload.user.id;
  const shifts = await getScheduledShiftsService(employeeId);
  sendSuccess(res, 'Scheduled shifts retrieved successfully', shifts, 200);
};

// B2. See Created Shifts (Employer)
const getEmployerShifts = async (req: Request, res: Response) => {
  const input: GetEmployerShiftsRequest = validate(getEmployerShiftsSchema, req);
  const employerId = (req.payload as any).employer.id;
  const { shifts, meta } = await getEmployerShiftsService(employerId, input.query);
  sendSuccess(res, 'Created shifts retrieved', shifts, 200, meta);
};

// B3. Cancel Shift (Both User Types)
const cancelShift = async (req: Request, res: Response) => {
  const input: CancelShiftRequest = validate(cancelShiftSchema, req);
  const userType = req.role as 'user' | 'employer';
  const userId = userType === ROLES.USER ? req.payload.user.id : req.payload.employer.id;

  const shift = await cancelShiftService(userId, userType, input.body.shift_id);
  sendSuccess(res, 'Shift cancelled successfully', shift, 200);
};

// B4. Update Shift (Only before acceptance)
const updateShift = async (req: Request, res: Response) => {
  const input: UpdateShiftRequest = validate(updateShiftSchema, req);
  const userType = req.role as 'user' | 'employer';
  const userId = userType === ROLES.USER ? req.payload.user.id : req.payload.employer.id;

  const shift = await updateShiftService(userId, userType, input.body);
  sendSuccess(res, 'Shift updated successfully', shift, 200);
};

// C. Get Extra Shifts (Public matching)
const getExtraShifts = async (req: Request, res: Response) => {
  const input: GetExtraShiftsRequest = validate(getExtraShiftsSchema, req);
  const userId = req.payload.user.id;
  const shifts = await getExtraShiftsService(input.query, userId);
  sendSuccess(res, 'Extra shifts retrieved', shifts, 200);
};

// D. Rate Employee/Employer
const rateShift = async (req: Request, res: Response) => {
  const input: RateShiftRequest = validate(rateShiftSchema, req);
  const raterType = req.role as 'user' | 'employer';
  const raterId = raterType === ROLES.USER ? req.payload.user.id : req.payload.employer.id;

  const rating = await rateShiftService(raterId, raterType, input.body);
  sendSuccess(res, 'Rating submitted successfully', rating, 201);
};

const getReferredEmployee = async (req: Request, res: Response) => {
  const input: getReferredEmployeeRequest = validate(getReferredEmployeeSchema, req);
  const id = await getReferredEmployeeService(input.body);
  sendSuccess(res, 'Id retrieved successfully', id, 200);
};

const getEmployeeOpenShifts = async (req: Request, res: Response) => {
  const input = req.payload.user.id;
  const id = await getOpenShiftsForEmployeeService(input);
  sendSuccess(res, 'Shifts retrieved successfully', id, 200);
};

const getLatestShifts = async (req: Request, res: Response) => {
  const input: GetLatestShiftsRequest = validate(getLatestShiftsSchema, req);
  const userId = req.payload.user.id;
  const shifts = await getLatestShiftsService(input.query, userId);
  sendSuccess(res, 'Latest shifts retrieved', shifts, 200);
};

const getBestShiftMatches = async (req: Request, res: Response) => {
  const input: GetBestShiftMatchesRequest = validate(getBestShiftMatchesSchema, req);
  const userId = req.payload.user.id;
  const shifts = await getBestShiftMatchesService(input.query, userId);
  sendSuccess(res, 'Best shift matches retrieved', shifts, 200);
};

const getPendingShiftsForEmployer = async (req: Request, res: Response) => {
  const input: GetPendingShiftsRequest = validate(getPendingShiftsSchema, req);
  const employerId = (req.payload as any).employer.id;
  const { pendingApplications, meta } = await getPendingShiftsForEmployerService(
    employerId,
    input.query,
  );
  sendSuccess(res, 'Pending shifts retrieved successfully', pendingApplications, 200, meta);
};

const approveShiftRequest = async (req: Request, res: Response) => {
  const input: ApproveShiftRequest = validate(approveShiftSchema, req);
  const employerId = (req.payload as any).employer.id;
  const shift = await approveShiftRequestService(employerId, input.params);
  sendSuccess(res, 'Shift request approved successfully', shift, 200);
};

const getShiftDetails = async (req: Request, res: Response) => {
  const input: GetShiftDetailsRequest = validate(getShiftDetailsSchema, req);
  const userType = req.role === ROLES.EMPLOYER ? ROLES.EMPLOYER : ROLES.USER;
  const userId = userType === ROLES.USER ? req.payload.user.id : req.payload.employer.id;
  const shift = await getShiftDetailsService(userId, userType, input.params.id);
  sendSuccess(res, 'Shift details retrieved successfully', shift, 200);
};

const approveShiftCompletion = async (req: Request, res: Response) => {
  const input: ApproveShiftCompletionRequest = validate(approveShiftCompletionSchema, req);
  const employerId = (req.payload as any).employer.id;
  const shift = await approveShiftCompletionService(employerId, input.params.id);
  sendSuccess(res, 'Shift completion approved successfully', shift, 200);
};

const reportShiftNoShow = async (req: Request, res: Response) => {
  const input: ReportShiftNoShowRequest = validate(reportShiftNoShowSchema, req);
  const employerId = (req.payload as any).employer.id;
  const shift = await reportShiftNoShowService(employerId, input.params.id);
  sendSuccess(res, 'No-show reported successfully', shift, 200);
};

// B3. Cancel Shift (Both User Types)
const rejectShift = async (req: Request, res: Response) => {
  const input: RejectShiftRequest = validate(rejectShiftSchema, req);
  const employerId = (req.payload as any).employer.id;
  const shift = await rejectShiftApplicationService(employerId, input.body.shift_application_id);
  sendSuccess(res, 'Shift rejected successfully', shift, 200);
};

const syncSavedShifts = async (req: Request, res: Response) => {
  const input: SyncSavedShiftsRequest = validate(syncSavedShiftsSchema, req);
  const userId = req.payload.user.id;
  const shifts = await syncSavedShiftsService(userId, input.body.shift_ids);
  sendSuccess(res, 'Saved shifts synced successfully', shifts, 200);
};

export {
  acceptShiftSwap,
  applyForPublicShifts,
  approveShiftCompletion,
  approveShiftRequest,
  cancelShift,
  createShiftSwap,
  getBestShiftMatches,
  getCreatedShiftsForEmployee,
  getEmployeeOpenShifts,
  getEmployeeShifts,
  getEmployerShifts,
  getExtraShifts,
  getLatestShifts,
  getPendingShiftsForEmployer,
  getReferredEmployee,
  getScheduledShifts,
  getShiftDetails,
  rateShift,
  rejectShift,
  reportShiftNoShow,
  syncSavedShifts,
  updateShift,
  withdrawShiftApplication,
};
