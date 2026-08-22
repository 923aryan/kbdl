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
  getEmployeeAttendanceMonth,
  getEmployeeAttendanceContext,
  employeePunchAttendance,
  updateAttendance,
  upsertAttendance,
} from './attendance-controllers';
import {
  createCompanyLeaveType,
  createEmployeeLeave,
  getCompanyLeaveCatalog,
  getCompanyLeaveRequests,
  getEmployeeLeave,
  updateCompanyLeavePolicy,
  updateCompanyLeaveType,
  updateLeaveRequest,
} from './leave-controllers';
import {
  confirmAttendance,
  confirmDeductions,
  confirmWages,
  createPayrollRun,
  disbursePayrollRun,
  fileAllStatutory,
  fileStatutory,
  getOrCreatePayrollRun,
  getPayrollRun,
  getPayrollSettings,
  getPayslipPreview,
  getPayslips,
  getStatutoryHistory,
  getStatutoryMonth,
  getWorkerWages,
  patchPayrollRunEmployee,
  patchWorkerWage,
  putPayrollSettings,
  sendPayslip,
} from './payroll-controllers';

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
operationsRouter.get(
  '/employer/attendance/employee/:employmentId',
  employerAuth,
  getEmployeeAttendanceMonth,
);
operationsRouter.post('/employer/attendance/bulk-mark-present', employerAuth, bulkMarkPresent);
operationsRouter.post('/employer/attendance/bulk-mark-holiday', employerAuth, bulkMarkHoliday);
operationsRouter.post('/employer/attendance', employerAuth, upsertAttendance);
operationsRouter.patch('/employer/attendance/:attendanceId', employerAuth, updateAttendance);

operationsRouter.get('/employer/leave/types', employerAuth, getCompanyLeaveCatalog);
operationsRouter.post('/employer/leave/types', employerAuth, createCompanyLeaveType);
operationsRouter.patch('/employer/leave/types/:typeId', employerAuth, updateCompanyLeaveType);
operationsRouter.get('/employer/leave/policy', employerAuth, getCompanyLeaveCatalog);
operationsRouter.put('/employer/leave/policy', employerAuth, updateCompanyLeavePolicy);
operationsRouter.get('/employer/leave/requests', employerAuth, getCompanyLeaveRequests);
operationsRouter.get(
  '/employer/leave/employee/:employmentId',
  employerAuth,
  getEmployeeLeave,
);
operationsRouter.post(
  '/employer/leave/employee/:employmentId',
  employerAuth,
  createEmployeeLeave,
);
operationsRouter.patch('/employer/leave/:requestId', employerAuth, updateLeaveRequest);

operationsRouter.get('/employer/payroll/runs', employerAuth, getOrCreatePayrollRun);
operationsRouter.post('/employer/payroll/runs', employerAuth, createPayrollRun);
operationsRouter.get('/employer/payroll/runs/:runId', employerAuth, getPayrollRun);
operationsRouter.patch(
  '/employer/payroll/runs/:runId/employees/:lineId',
  employerAuth,
  patchPayrollRunEmployee,
);
operationsRouter.post('/employer/payroll/runs/:runId/confirm-attendance', employerAuth, confirmAttendance);
operationsRouter.post('/employer/payroll/runs/:runId/confirm-wages', employerAuth, confirmWages);
operationsRouter.post('/employer/payroll/runs/:runId/confirm-deductions', employerAuth, confirmDeductions);
operationsRouter.post('/employer/payroll/runs/:runId/disburse', employerAuth, disbursePayrollRun);
operationsRouter.get('/employer/payroll/worker-wages', employerAuth, getWorkerWages);
operationsRouter.patch('/employer/payroll/worker-wages/:employmentId', employerAuth, patchWorkerWage);
operationsRouter.get('/employer/payroll/payslips', employerAuth, getPayslips);
operationsRouter.get('/employer/payroll/payslips/:lineId', employerAuth, getPayslipPreview);
operationsRouter.post('/employer/payroll/payslips/:lineId/send', employerAuth, sendPayslip);
operationsRouter.get('/employer/payroll/settings', employerAuth, getPayrollSettings);
operationsRouter.put('/employer/payroll/settings', employerAuth, putPayrollSettings);
operationsRouter.get('/employer/payroll/statutory/history', employerAuth, getStatutoryHistory);
operationsRouter.get('/employer/payroll/statutory', employerAuth, getStatutoryMonth);
operationsRouter.post('/employer/payroll/statutory/file-all', employerAuth, fileAllStatutory);
operationsRouter.post('/employer/payroll/statutory/:filingId/file', employerAuth, fileStatutory);

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

operationsRouter.get(
  '/employee/attendance/context',
  authenticate([ROLES.USER]),
  getEmployeeAttendanceContext,
);
operationsRouter.post(
  '/employee/attendance/punch',
  authenticate([ROLES.USER]),
  employeePunchAttendance,
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
