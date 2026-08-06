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
  getEmployerDepartmentsMeta,
  getEmployerDesignationsMeta,
  getEmployerEmployeesList,
  getEmployerRoster,
  getEmployerSupervisorsMeta,
  getEmployerWorkShiftsMeta,
  onboardEmployee,
  searchAddress,
  updateEmploymentStatus,
} from './operation-controllers';

const operationsRouter: Router = Router();

const employerAuth = authenticate([ROLES.EMPLOYER]);

// --- Roster + meta (meta MUST be registered before /employer/:id) ---
operationsRouter.get('/employer', employerAuth, getEmployerRoster);

operationsRouter.get('/employer/meta/departments', employerAuth, getEmployerDepartmentsMeta);
operationsRouter.get('/employer/meta/designations', employerAuth, getEmployerDesignationsMeta);
operationsRouter.get('/employer/meta/supervisors', employerAuth, getEmployerSupervisorsMeta);
operationsRouter.get('/employer/meta/work-shifts', employerAuth, getEmployerWorkShiftsMeta);

operationsRouter.post('/employer/onboard', employerAuth, onboardEmployee);

operationsRouter.get('/employer/employees', employerAuth, getEmployerEmployeesList);

operationsRouter.get('/employer/:id', employerAuth, getEmployeeDetails);

operationsRouter.patch('/employer/:id/status', employerAuth, updateEmploymentStatus);

// --- Employee (worker app) ---
operationsRouter.get(
  '/employee/pending',
  authenticate([ROLES.USER]),
  getEmployeePendingEmployments,
);

operationsRouter.get('/employee', authenticate([ROLES.USER]), getAllEmployeeEmployment);

operationsRouter.get('/employee/:id', authenticate([ROLES.USER]), getEmployeeEmployment);

operationsRouter.patch('/employee/:id/accept', authenticate([ROLES.USER]), acceptEmploymentRequest);

operationsRouter.patch(
  '/employee/:id/decline',
  authenticate([ROLES.USER]),
  declineEmploymentRequest,
);

operationsRouter.get('/addresses/search', authenticate([ROLES.USER]), searchAddress);

export default operationsRouter;
