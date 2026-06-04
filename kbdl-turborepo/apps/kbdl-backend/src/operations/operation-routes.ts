import { Router } from 'express';

import { authenticate } from '../middleware/auth-middleware';

import { ROLES } from '../utils/constants';
import {
  acceptEmploymentRequest,
  declineEmploymentRequest,
  getAllEmployeeEmployment,
  getEmployeeDetails,
  getEmployeeEmployment,
  getEmployeePendingEmployments,
  getEmployerRoster,
  onboardEmployee,
  searchAddress,
  updateEmploymentStatus,
} from './operation-controllers';

const operationsRouter: Router = Router();

// --- Roster Queries ---
// Retrieves historical rows from the EmployeeEmployment model tied to the employer context
operationsRouter.get('/employer', authenticate([ROLES.EMPLOYER]), getEmployerRoster);

// Returns complete structural details joining the User entity attributes and company data
operationsRouter.get('/employer/:id', authenticate([ROLES.EMPLOYER]), getEmployeeDetails);

// POST /api/employees/onboard
// Verifies user identifier parameters and pushes a record to the mapping registry
operationsRouter.post('/employer/onboard', authenticate([ROLES.EMPLOYER]), onboardEmployee);

// Handles updates to the EmploymentStatus enum (active, inactive, terminated, resigned)
operationsRouter.patch(
  '/employer/:id/status',
  authenticate([ROLES.EMPLOYER]),
  updateEmploymentStatus,
);

// Handles retrieval of EmployeeEmployment model with pending status tied to the employer context
operationsRouter.get(
  '/employee/pending',
  authenticate([ROLES.USER]),
  getEmployeePendingEmployments,
);

// Handles retrieval of all EmployeeEmployment model tied to the employer context
operationsRouter.get('/employee', authenticate([ROLES.USER]), getAllEmployeeEmployment);

// Handles retrieval of EmployeeEmployment model tied to the employer context
operationsRouter.get('/employee/:id', authenticate([ROLES.USER]), getEmployeeEmployment);

// Handles accepting an onboard job request
operationsRouter.patch('/employee/:id/accept', authenticate([ROLES.USER]), acceptEmploymentRequest);

// Handles declining an onboard job request
operationsRouter.patch(
  '/employee/:id/decline',
  authenticate([ROLES.USER]),
  declineEmploymentRequest,
);

// Handles address autocomplete search
operationsRouter.get('/addresses/search', authenticate([ROLES.USER]), searchAddress);
export default operationsRouter;
