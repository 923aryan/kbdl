import {
  AcceptShiftRequest,
  CancelShiftRequest,
  CreateShiftRequest,
  GetEmployeeShiftsResponse,
  GetExtraShiftsRequest,
  getReferredEmployeeRequest,
  RateShiftRequest,
  UpdateShiftRequest,
} from '@repo/types';
import {
  acceptShiftSchema,
  cancelShiftSchema,
  createShiftSchema,
  getExtraShiftsSchema,
  getReferredEmployeeSchema,
  rateShiftSchema,
  updateShiftSchema,
} from '@repo/validator/shared';
import { Request, Response } from 'express';
import { ROLES } from '../utils/constants';
import { sendSuccess } from '../utils/send-success';
import { validate } from '../utils/validate';
import {
  acceptShiftService,
  cancelShiftService,
  createShiftService,
  getEmployeeShiftsService,
  getEmployerShiftsService,
  getExtraShiftsService,
  getOpenShiftsForEmployeeService,
  getReferredEmployeeService,
  getScheduledShiftsService,
  rateShiftService,
  updateShiftService,
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

// B1. See Accepted Shifts (Worker)
const getEmployeeShifts = async (req: Request, res: Response) => {
  const employeeId = req.payload.user.id;
  const shifts = await getEmployeeShiftsService(employeeId);
  sendSuccess<GetEmployeeShiftsResponse>(res, 'Scheduled shifts retrieved', shifts, 200);
};

// B. Get Scheduled Shifts (Worker)
const getScheduledShifts = async (req: Request, res: Response) => {
  const employeeId = req.payload.user.id;
  const shifts = await getScheduledShiftsService(employeeId);
  sendSuccess(res, 'Scheduled shifts retrieved successfully', shifts, 200);
};

// B2. See Created Shifts (Employer)
const getEmployerShifts = async (req: Request, res: Response) => {
  const employerId = req.payload.employer.id;
  const shifts = await getEmployerShiftsService(employerId);
  sendSuccess(res, 'Created shifts retrieved', shifts, 200);
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
  const userId = req.payload.user.id
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
export {
  acceptShiftSwap,
  cancelShift,
  createShiftSwap,
  getEmployeeOpenShifts,
  getEmployeeShifts,
  getEmployerShifts,
  getExtraShifts,
  getReferredEmployee,
  getScheduledShifts,
  rateShift,
  updateShift
};

