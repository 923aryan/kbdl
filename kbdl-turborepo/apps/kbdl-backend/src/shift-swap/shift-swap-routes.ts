import { Router } from 'express';
import { authenticate } from '../middleware/auth-middleware';
import { ROLES } from '../utils/constants';
import {
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
  getEmployerShiftAnalytics,
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
} from './shift-swap-controller';

const shiftSwapRouter: Router = Router();

shiftSwapRouter.post('/', authenticate([ROLES.EMPLOYER, ROLES.USER]), createShiftSwap);
shiftSwapRouter.post('/accept', authenticate([ROLES.USER]), acceptShiftSwap);
shiftSwapRouter.post('/apply', authenticate([ROLES.USER]), applyForPublicShifts);
shiftSwapRouter.post('/withdraw', authenticate([ROLES.USER]), withdrawShiftApplication);
shiftSwapRouter.post('/sync-saved', authenticate([ROLES.USER]), syncSavedShifts);

// --- View Shifts ---
shiftSwapRouter.get('/employee', authenticate([ROLES.USER]), getEmployeeShifts);
shiftSwapRouter.get('/employee/open', authenticate([ROLES.USER]), getEmployeeOpenShifts);
shiftSwapRouter.get('/employee/created', authenticate([ROLES.USER]), getCreatedShiftsForEmployee);
shiftSwapRouter.get('/scheduled', authenticate([ROLES.USER]), getScheduledShifts);
shiftSwapRouter.get('/employer', authenticate([ROLES.EMPLOYER]), getEmployerShifts);
shiftSwapRouter.get(
  '/employer/pending',
  authenticate([ROLES.EMPLOYER]),
  getPendingShiftsForEmployer,
);
shiftSwapRouter.get(
  '/employer/analytics',
  authenticate([ROLES.EMPLOYER]),
  getEmployerShiftAnalytics,
);
shiftSwapRouter.get('/extra', authenticate([ROLES.USER]), getExtraShifts);
shiftSwapRouter.get('/latest', authenticate([ROLES.USER]), getLatestShifts);
shiftSwapRouter.get('/best-matches', authenticate([ROLES.USER]), getBestShiftMatches);

// --- Manage Shifts ---
shiftSwapRouter.patch('/', authenticate([ROLES.EMPLOYER, ROLES.USER]), updateShift);
shiftSwapRouter.post('/cancel', authenticate([ROLES.EMPLOYER, ROLES.USER]), cancelShift);
shiftSwapRouter.post('/reject', authenticate([ROLES.EMPLOYER]), rejectShift);
shiftSwapRouter.patch(
  '/:shift_application_id/approve',
  authenticate([ROLES.EMPLOYER]),
  approveShiftRequest,
);

// --- Ratings ---
shiftSwapRouter.post('/rate', authenticate([ROLES.EMPLOYER]), rateShift);

//Others
shiftSwapRouter.post(
  '/referred-employee',
  authenticate([ROLES.EMPLOYER, ROLES.USER]),
  getReferredEmployee,
);

// GET /api/shift-swap/:id
// Returns complete shift details, including the original and replacement employee profiles
shiftSwapRouter.get('/:id', authenticate([ROLES.EMPLOYER, ROLES.USER]), getShiftDetails);

// PATCH /api/shift-swap/:id/approve
// Sets organization_approved to true and transitions status to 'completed'
shiftSwapRouter.patch('/:id/complete', authenticate([ROLES.EMPLOYER]), approveShiftCompletion);

// PATCH /api/shift-swap/:id/no-show
// Sets no_show_reported to true, triggering alerts or penalizing the worker
shiftSwapRouter.patch('/:id/no-show', authenticate([ROLES.EMPLOYER]), reportShiftNoShow);

export default shiftSwapRouter;
