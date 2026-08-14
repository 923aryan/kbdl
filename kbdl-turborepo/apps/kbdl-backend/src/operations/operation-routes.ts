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
  getNextEmployeeNumber,
  onboardEmployee,
  searchAddress,
  updateEmploymentStatus,
  updateEmployeeProfile,
  addEmployeeDocument,
} from './operation-controllers';
import {
  bulkMarkHoliday,
  bulkMarkPresent,
  getAttendanceAnalyticsBreakdown,
  getAttendanceAnalyticsInsights,
  getAttendanceAnalyticsSummary,
  getAttendanceAnalyticsTrend,
  getDailyAttendance,
  updateAttendance,
  upsertAttendance,
} from './attendance-controllers';

const operationsRouter: Router = Router();

const employerAuth = authenticate([ROLES.EMPLOYER]);

// --- Roster + meta (meta MUST be registered before /employer/:id) ---
operationsRouter.get('/employer', employerAuth, getEmployerRoster);

operationsRouter.get('/employer/meta/departments', employerAuth, getEmployerDepartmentsMeta);
operationsRouter.get('/employer/meta/designations', employerAuth, getEmployerDesignationsMeta);
operationsRouter.get('/employer/meta/supervisors', employerAuth, getEmployerSupervisorsMeta);
operationsRouter.get('/employer/meta/work-shifts', employerAuth, getEmployerWorkShiftsMeta);
operationsRouter.get('/employer/meta/next-employee-no', employerAuth, getNextEmployeeNumber);

operationsRouter.post('/employer/onboard', employerAuth, onboardEmployee);

operationsRouter.get('/employer/employees', employerAuth, getEmployerEmployeesList);

operationsRouter.get('/employer/attendance', employerAuth, getDailyAttendance);
operationsRouter.get(
  '/employer/attendance/analytics/summary',
  employerAuth,
  getAttendanceAnalyticsSummary,
);
operationsRouter.get(
  '/employer/attendance/analytics/trend',
  employerAuth,
  getAttendanceAnalyticsTrend,
);
operationsRouter.get(
  '/employer/attendance/analytics/breakdown',
  employerAuth,
  getAttendanceAnalyticsBreakdown,
);
operationsRouter.get(
  '/employer/attendance/analytics/insights',
  employerAuth,
  getAttendanceAnalyticsInsights,
);
operationsRouter.post('/employer/attendance/bulk-mark-present', employerAuth, bulkMarkPresent);
operationsRouter.post('/employer/attendance/bulk-mark-holiday', employerAuth, bulkMarkHoliday);
operationsRouter.post('/employer/attendance', employerAuth, upsertAttendance);
operationsRouter.patch('/employer/attendance/:attendanceId', employerAuth, updateAttendance);

operationsRouter.post('/employer/:id/documents', employerAuth, addEmployeeDocument);

operationsRouter.get('/employer/:id', employerAuth, getEmployeeDetails);

operationsRouter.patch('/employer/:id/profile', employerAuth, updateEmployeeProfile);

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
