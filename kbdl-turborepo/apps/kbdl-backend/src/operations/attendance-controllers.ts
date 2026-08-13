import {
  BulkMarkHolidayRequest,
  BulkMarkPresentRequest,
  GetAttendanceAnalyticsRequest,
  GetDailyAttendanceRequest,
  UpdateAttendanceRequest,
  UpsertAttendanceRequest,
} from '@repo/types';
import {
  bulkMarkHolidaySchema,
  bulkMarkPresentSchema,
  getAttendanceAnalyticsRangeSchema,
  getDailyAttendanceSchema,
  updateAttendanceSchema,
  upsertAttendanceSchema,
} from '@repo/validator/shared';
import { Request, Response } from 'express';
import { sendSuccess } from '../utils/send-success';
import { validate } from '../utils/validate';
import {
  getAttendanceAnalyticsBreakdownService,
  getAttendanceAnalyticsInsightsService,
  getAttendanceAnalyticsSummaryService,
  getAttendanceAnalyticsTrendService,
} from './attendance-analytics-service';
import {
  bulkMarkHolidayService,
  bulkMarkPresentService,
  getDailyAttendanceService,
  updateAttendanceService,
  upsertAttendanceService,
} from './attendance-service';

export const getDailyAttendance = async (req: Request, res: Response) => {
  const input: GetDailyAttendanceRequest = validate(getDailyAttendanceSchema, req);
  const companyId = req.payload.employer.id;
  const { data, meta } = await getDailyAttendanceService(companyId, input.query);
  sendSuccess(res, 'Daily attendance retrieved successfully', data, 200, meta);
};

export const getAttendanceAnalyticsSummary = async (req: Request, res: Response) => {
  const input: GetAttendanceAnalyticsRequest = validate(getAttendanceAnalyticsRangeSchema, req);
  const companyId = req.payload.employer.id;
  const data = await getAttendanceAnalyticsSummaryService(companyId, input.query);
  sendSuccess(res, 'Attendance analytics summary retrieved', data);
};

export const getAttendanceAnalyticsTrend = async (req: Request, res: Response) => {
  const input: GetAttendanceAnalyticsRequest = validate(getAttendanceAnalyticsRangeSchema, req);
  const companyId = req.payload.employer.id;
  const data = await getAttendanceAnalyticsTrendService(companyId, input.query);
  sendSuccess(res, 'Attendance analytics trend retrieved', data);
};

export const getAttendanceAnalyticsBreakdown = async (req: Request, res: Response) => {
  const input: GetAttendanceAnalyticsRequest = validate(getAttendanceAnalyticsRangeSchema, req);
  const companyId = req.payload.employer.id;
  const data = await getAttendanceAnalyticsBreakdownService(companyId, input.query);
  sendSuccess(res, 'Attendance analytics breakdown retrieved', data);
};

export const getAttendanceAnalyticsInsights = async (req: Request, res: Response) => {
  const input: GetAttendanceAnalyticsRequest = validate(getAttendanceAnalyticsRangeSchema, req);
  const companyId = req.payload.employer.id;
  const data = await getAttendanceAnalyticsInsightsService(companyId, input.query);
  sendSuccess(res, 'Attendance analytics insights retrieved', data);
};

export const bulkMarkPresent = async (req: Request, res: Response) => {
  const input: BulkMarkPresentRequest = validate(bulkMarkPresentSchema, req);
  const companyId = req.payload.employer.id;
  const result = await bulkMarkPresentService(companyId, input.body);
  sendSuccess(res, 'Attendance marked present successfully', result);
};

export const bulkMarkHoliday = async (req: Request, res: Response) => {
  const input: BulkMarkHolidayRequest = validate(bulkMarkHolidaySchema, req);
  const companyId = req.payload.employer.id;
  const result = await bulkMarkHolidayService(companyId, input.body);
  sendSuccess(res, 'Day marked as holiday successfully', result);
};

export const updateAttendance = async (req: Request, res: Response) => {
  const input: UpdateAttendanceRequest = validate(updateAttendanceSchema, req);
  const companyId = req.payload.employer.id;
  const item = await updateAttendanceService(companyId, input.params.attendanceId, input.body);
  sendSuccess(res, 'Attendance updated successfully', item);
};

export const upsertAttendance = async (req: Request, res: Response) => {
  const input: UpsertAttendanceRequest = validate(upsertAttendanceSchema, req);
  const companyId = req.payload.employer.id;
  const item = await upsertAttendanceService(companyId, input.body);
  sendSuccess(res, 'Attendance saved successfully', item);
};
