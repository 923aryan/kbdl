import { Router } from 'express';
import { authenticate } from '../middleware/auth-middleware';
import { ROLES } from '../utils/constants';
import {
  acceptShiftSwap,
  cancelShift,
  createShiftSwap,
  getEmployeeShifts,
  getEmployerShifts,
  getExtraShifts,
  rateShift,
  updateShift,
} from './shift-swap-controller';

const shiftSwapRouter: Router = Router();

shiftSwapRouter.post('/', authenticate([ROLES.EMPLOYER, ROLES.USER]), createShiftSwap);
shiftSwapRouter.post('/accept', authenticate([ROLES.USER]), acceptShiftSwap);

// --- View Shifts ---
shiftSwapRouter.get('/employee', authenticate([ROLES.USER]), getEmployeeShifts);
shiftSwapRouter.get('/employer', authenticate([ROLES.EMPLOYER]), getEmployerShifts);
shiftSwapRouter.get('/extra', authenticate([ROLES.USER]), getExtraShifts);

// --- Manage Shifts ---
shiftSwapRouter.patch('/', authenticate([ROLES.EMPLOYER, ROLES.USER]), updateShift);
shiftSwapRouter.post('/cancel', authenticate([ROLES.EMPLOYER, ROLES.USER]), cancelShift);

// --- Ratings ---
shiftSwapRouter.post('/rate', authenticate([ROLES.EMPLOYER]), rateShift);

export default shiftSwapRouter;
