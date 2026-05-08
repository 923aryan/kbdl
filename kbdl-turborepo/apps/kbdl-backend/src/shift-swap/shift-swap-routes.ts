import { Router } from "express";
import { authenticate } from "../middleware/auth-middleware";
import { ROLES } from "../utils/constants";
import {
  acceptShiftSwap,
  cancelShift,
  createShiftSwap,
  getEmployeeShifts,
  getEmployerShifts,
  getExtraShifts,
  rateShift,
  updateShift,
} from "./shift-swap-controller";

const shiftSwapRouter: Router = Router();

shiftSwapRouter.post("/", authenticate([ROLES.ORGANIZATION, ROLES.USER]), createShiftSwap);
shiftSwapRouter.post("/accept", authenticate([ROLES.USER]), acceptShiftSwap);

// --- View Shifts ---
shiftSwapRouter.get("/employee", authenticate([ROLES.USER]), getEmployeeShifts);
shiftSwapRouter.get("/employer", authenticate([ROLES.ORGANIZATION]), getEmployerShifts);
shiftSwapRouter.get("/extra", authenticate([ROLES.USER]), getExtraShifts);

// --- Manage Shifts ---
shiftSwapRouter.patch("/", authenticate([ROLES.ORGANIZATION, ROLES.USER]), updateShift);
shiftSwapRouter.post("/cancel", authenticate([ROLES.ORGANIZATION, ROLES.USER]), cancelShift);

// --- Ratings ---
shiftSwapRouter.post("/rate", authenticate([ROLES.ORGANIZATION]), rateShift);

export default shiftSwapRouter;