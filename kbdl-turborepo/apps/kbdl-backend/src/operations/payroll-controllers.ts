import {
  CreatePayrollRunRequest,
  DisbursePayrollRunRequest,
  GetPayrollPeriodRequest,
  GetPayrollRunRequest,
  GetWorkerWagesRequest,
  PatchPayrollRunEmployeeRequest,
  PatchWorkerWageRequest,
  PayrollFilingIdRequest,
  PayrollHistoryQueryRequest,
  PayrollPayslipIdRequest,
  PayrollRunIdRequest,
  PutPayrollSettingsRequest,
} from '@repo/types';
import {
  createPayrollRunSchema,
  disbursePayrollRunSchema,
  getPayrollRunSchema,
  getWorkerWagesSchema,
  patchPayrollRunEmployeeSchema,
  patchWorkerWageSchema,
  payrollFilingIdSchema,
  payrollHistoryQuerySchema,
  payrollPayslipIdSchema,
  payrollPeriodQuerySchema,
  payrollRunIdSchema,
  putPayrollSettingsSchema,
} from '@repo/validator/shared';
import { Request, Response } from 'express';
import { sendSuccess } from '../utils/send-success';
import { validate } from '../utils/validate';
import {
  confirmAttendanceService,
  confirmDeductionsService,
  confirmWagesService,
  disbursePayrollRunService,
  fileAllStatutoryService,
  fileStatutoryService,
  getOrCreatePayrollRunService,
  getPayrollRunService,
  getPayrollSettingsService,
  getPayslipPreviewService,
  getPayslipsService,
  getStatutoryHistoryService,
  getStatutoryMonthService,
  getWorkerWagesService,
  patchPayrollRunEmployeeService,
  patchWorkerWageService,
  putPayrollSettingsService,
  sendPayslipService,
} from './payroll-service';

export const getOrCreatePayrollRun = async (req: Request, res: Response) => {
  const input: GetPayrollPeriodRequest = validate(payrollPeriodQuerySchema, req);
  const data = await getOrCreatePayrollRunService(
    req.payload.employer.id,
    input.query.year,
    input.query.month,
    { search: input.query.search, page: input.query.page, limit: input.query.limit },
  );
  sendSuccess(res, 'Payroll run retrieved', data);
};

export const createPayrollRun = async (req: Request, res: Response) => {
  const input: CreatePayrollRunRequest = validate(createPayrollRunSchema, req);
  const data = await getOrCreatePayrollRunService(req.payload.employer.id, input.body.year, input.body.month, {
    page: 1,
    limit: 50,
  });
  sendSuccess(res, 'Payroll run ready', data, 201);
};

export const getPayrollRun = async (req: Request, res: Response) => {
  const input: GetPayrollRunRequest = validate(getPayrollRunSchema, req);
  const data = await getPayrollRunService(req.payload.employer.id, input.params.runId, {
    search: input.query.search,
    page: input.query.page,
    limit: input.query.limit,
  });
  sendSuccess(res, 'Payroll run retrieved', data);
};

export const patchPayrollRunEmployee = async (req: Request, res: Response) => {
  const input: PatchPayrollRunEmployeeRequest = validate(patchPayrollRunEmployeeSchema, req);
  const data = await patchPayrollRunEmployeeService(
    req.payload.employer.id,
    input.params.runId,
    input.params.lineId,
    input.body,
  );
  sendSuccess(res, 'Payroll line updated', data);
};

export const confirmAttendance = async (req: Request, res: Response) => {
  const input: PayrollRunIdRequest = validate(payrollRunIdSchema, req);
  const data = await confirmAttendanceService(req.payload.employer.id, input.params.runId);
  sendSuccess(res, 'Attendance confirmed', data);
};

export const confirmWages = async (req: Request, res: Response) => {
  const input: PayrollRunIdRequest = validate(payrollRunIdSchema, req);
  const data = await confirmWagesService(req.payload.employer.id, input.params.runId);
  sendSuccess(res, 'Wages confirmed', data);
};

export const confirmDeductions = async (req: Request, res: Response) => {
  const input: PayrollRunIdRequest = validate(payrollRunIdSchema, req);
  const data = await confirmDeductionsService(req.payload.employer.id, input.params.runId);
  sendSuccess(res, 'Deductions confirmed', data);
};

export const disbursePayrollRun = async (req: Request, res: Response) => {
  const input: DisbursePayrollRunRequest = validate(disbursePayrollRunSchema, req);
  const data = await disbursePayrollRunService(req.payload.employer.id, input.params.runId, input.body);
  sendSuccess(res, input.body.confirm ? 'Payroll disbursed' : 'Disbursement draft saved', data);
};

export const getWorkerWages = async (req: Request, res: Response) => {
  const input: GetWorkerWagesRequest = validate(getWorkerWagesSchema, req);
  const data = await getWorkerWagesService(req.payload.employer.id, input.query);
  sendSuccess(res, 'Worker wages retrieved', data);
};

export const patchWorkerWage = async (req: Request, res: Response) => {
  const input: PatchWorkerWageRequest = validate(patchWorkerWageSchema, req);
  const data = await patchWorkerWageService(req.payload.employer.id, input.params.employmentId, input.body);
  sendSuccess(res, 'Worker wage updated', data);
};

export const getPayslips = async (req: Request, res: Response) => {
  const input: GetPayrollPeriodRequest = validate(payrollPeriodQuerySchema, req);
  const data = await getPayslipsService(
    req.payload.employer.id,
    input.query.year,
    input.query.month,
    { search: input.query.search, page: input.query.page, limit: input.query.limit },
  );
  sendSuccess(res, 'Payslips retrieved', data);
};

export const getPayslipPreview = async (req: Request, res: Response) => {
  const input: PayrollPayslipIdRequest = validate(payrollPayslipIdSchema, req);
  const data = await getPayslipPreviewService(req.payload.employer.id, input.params.lineId);
  sendSuccess(res, 'Payslip preview retrieved', data);
};

export const sendPayslip = async (req: Request, res: Response) => {
  const input: PayrollPayslipIdRequest = validate(payrollPayslipIdSchema, req);
  const data = await sendPayslipService(req.payload.employer.id, input.params.lineId);
  sendSuccess(res, 'Payslip marked sent', data);
};

export const getPayrollSettings = async (req: Request, res: Response) => {
  const data = await getPayrollSettingsService(req.payload.employer.id);
  sendSuccess(res, 'Payroll settings retrieved', data);
};

export const putPayrollSettings = async (req: Request, res: Response) => {
  const input: PutPayrollSettingsRequest = validate(putPayrollSettingsSchema, req);
  const data = await putPayrollSettingsService(req.payload.employer.id, input.body);
  sendSuccess(res, 'Payroll settings saved', data);
};

export const getStatutoryMonth = async (req: Request, res: Response) => {
  const input: GetPayrollPeriodRequest = validate(payrollPeriodQuerySchema, req);
  const data = await getStatutoryMonthService(req.payload.employer.id, input.query.year, input.query.month);
  sendSuccess(res, 'Statutory filings retrieved', data);
};

export const fileStatutory = async (req: Request, res: Response) => {
  const input: PayrollFilingIdRequest = validate(payrollFilingIdSchema, req);
  const data = await fileStatutoryService(req.payload.employer.id, input.params.filingId);
  sendSuccess(res, 'Filing marked as filed', data);
};

export const fileAllStatutory = async (req: Request, res: Response) => {
  const input: GetPayrollPeriodRequest = validate(payrollPeriodQuerySchema, req);
  const data = await fileAllStatutoryService(req.payload.employer.id, input.query.year, input.query.month);
  sendSuccess(res, 'Pending filings marked as filed', data);
};

export const getStatutoryHistory = async (req: Request, res: Response) => {
  const _input: PayrollHistoryQueryRequest = validate(payrollHistoryQuerySchema, req);
  const data = await getStatutoryHistoryService(req.payload.employer.id);
  sendSuccess(res, 'Filing history retrieved', data);
};
