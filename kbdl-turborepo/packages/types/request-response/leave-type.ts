import {
  createCompanyLeaveTypeSchema,
  createEmployeeLeaveSchema,
  getCompanyLeaveCatalogSchema,
  getCompanyLeaveRequestsSchema,
  getEmployeeLeaveSchema,
  updateCompanyLeavePolicySchema,
  updateCompanyLeaveTypeSchema,
  updateLeaveRequestSchema,
} from '@repo/validator/shared';
import { z } from 'zod';

export type GetEmployeeLeaveRequest = z.infer<typeof getEmployeeLeaveSchema>;
export type CreateEmployeeLeaveRequest = z.infer<typeof createEmployeeLeaveSchema>;
export type UpdateLeaveRequestRequest = z.infer<typeof updateLeaveRequestSchema>;
export type GetCompanyLeaveCatalogRequest = z.infer<typeof getCompanyLeaveCatalogSchema>;
export type CreateCompanyLeaveTypeRequest = z.infer<typeof createCompanyLeaveTypeSchema>;
export type UpdateCompanyLeaveTypeRequest = z.infer<typeof updateCompanyLeaveTypeSchema>;
export type UpdateCompanyLeavePolicyRequest = z.infer<typeof updateCompanyLeavePolicySchema>;
export type GetCompanyLeaveRequestsRequest = z.infer<typeof getCompanyLeaveRequestsSchema>;

export type LeavePolicyView = {
  accrue_per_month: number;
  annual_quota: number;
  max_carry_forward: number;
  carry_forward_at_year_end: boolean;
  encash_excess: boolean;
  lines: string[];
};

export type LeaveBalanceView = {
  available: number;
  unused_this_year: number;
  pending: number;
  used: number;
  carry_forward: number;
  as_on: string;
  year_label: string;
};

export type LeaveTypeBalanceView = {
  leave_type: string;
  earned: number;
  used: number;
  pending: number;
  current_year_balance: number;
  carry_forward: number;
  total_balance: number;
};

export type LeaveRequestView = {
  id: string;
  leave_type: string;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: string;
  status_label: string;
  applied_on: string;
  applied_by_kind: 'hr' | 'manager';
  applied_by_label: string;
};

export type EmployeeLeaveOverview = {
  employment_id: string;
  policy: LeavePolicyView;
  balance: LeaveBalanceView;
  type_balances: LeaveTypeBalanceView[];
  requests: LeaveRequestView[];
  leave_types: Array<{ id: string; name: string }>;
  reporting_manager: { id: string; name: string } | null;
  permissions: {
    can_apply_as_hr: boolean;
    can_apply_as_manager: boolean;
    can_approve: boolean;
  };
};

export type CompanyLeaveTypeView = {
  id: string;
  name: string;
  days_per_year: number;
  is_paid: boolean;
  is_active: boolean;
  sort_order: number;
};

export type CompanyLeaveCatalog = {
  policy: LeavePolicyView;
  types: CompanyLeaveTypeView[];
};

export type CompanyLeaveRequestView = LeaveRequestView & {
  employment_id: string;
  employee_name: string;
  employee_no: string | null;
  supervisor_name: string | null;
};

export type CompanyLeaveRequestsPage = {
  items: CompanyLeaveRequestView[];
};
