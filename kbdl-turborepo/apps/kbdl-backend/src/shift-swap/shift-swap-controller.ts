import {
  AcceptShiftRequest,
  CancelShiftRequest,
  CreateShiftRequest,
  GetExtraShiftsRequest,
  RateShiftRequest,
  UpdateShiftRequest,
} from "@repo/types";
import {
  acceptShiftSchema,
  cancelShiftSchema,
  createShiftSchema,
  getExtraShiftsSchema,
  rateShiftSchema,
  updateShiftSchema,
} from "@repo/validator/shared";
import { Request, Response } from "express";
import { sendSuccess } from "../utils/send-success";
import { validate } from "../utils/validate";
import {
  acceptShiftService,
  cancelShiftService,
  createShiftService,
  getEmployeeShiftsService,
  getEmployerShiftsService,
  getExtraShiftsService,
  rateShiftService,
  updateShiftService,
} from "./shift-swap-service";

// A. Create Shift Swap (Handles employee-to-employee, public, and employer creation)
const createShiftSwap = async (req: Request, res: Response) => {
  const input: CreateShiftRequest = validate(createShiftSchema, req);

  // Assuming req.user contains { id, role: UserType }
  const userId = req.user.id;
  const userType = req.user.role;

  const shift = await createShiftService(userId, userType, input.body);
  sendSuccess(res, "Shift swap created successfully", shift, 201);
};

// A. Accept Shift Swap
const acceptShiftSwap = async (req: Request, res: Response) => {
  const input: AcceptShiftRequest = validate(acceptShiftSchema, req);
  const workerId = req.user.id;

  const shift = await acceptShiftService(workerId, input.body);
  sendSuccess(res, "Shift request accepted", shift, 200);
};

// B1. See Accepted Shifts (Worker)
const getEmployeeShifts = async (req: Request, res: Response) => {
  const employeeId = req.user.id;
  const shifts = await getEmployeeShiftsService(employeeId);
  sendSuccess(res, "Scheduled shifts retrieved", shifts, 200);
};

// B2. See Created Shifts (Employer)
const getEmployerShifts = async (req: Request, res: Response) => {
  const employerId = req.user.id;
  const shifts = await getEmployerShiftsService(employerId);
  sendSuccess(res, "Created shifts retrieved", shifts, 200);
};

// B3. Cancel Shift (Both User Types)
const cancelShift = async (req: Request, res: Response) => {
  const input: CancelShiftRequest = validate(cancelShiftSchema, req);
  const userId = req.user.id;
  const userType = req.user.role;

  const shift = await cancelShiftService(userId, userType, input.body.shift_id);
  sendSuccess(res, "Shift cancelled successfully", shift, 200);
};

// B4. Update Shift (Only before acceptance)
const updateShift = async (req: Request, res: Response) => {
  const input: UpdateShiftRequest = validate(updateShiftSchema, req);
  const userId = req.user.id;
  const userType = req.user.role;

  const shift = await updateShiftService(userId, userType, input.body);
  sendSuccess(res, "Shift updated successfully", shift, 200);
};

// C. Get Extra Shifts (Public matching)
const getExtraShifts = async (req: Request, res: Response) => {
  const input: GetExtraShiftsRequest = validate(getExtraShiftsSchema, req);
  const shifts = await getExtraShiftsService(input.query);
  sendSuccess(res, "Extra shifts retrieved", shifts, 200);
};

// D. Rate Employee/Employer
const rateShift = async (req: Request, res: Response) => {
  const input: RateShiftRequest = validate(rateShiftSchema, req);
  const raterId = req.user.id;
  const raterType = req.user.role;

  const rating = await rateShiftService(raterId, raterType, input.body);
  sendSuccess(res, "Rating submitted successfully", rating, 201);
};

export {
  acceptShiftSwap, cancelShift, createShiftSwap, getEmployeeShifts,
  getEmployerShifts, getExtraShifts,
  rateShift, updateShift
};
