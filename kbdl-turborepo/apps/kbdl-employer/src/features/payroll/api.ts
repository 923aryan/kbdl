import { api } from '@/lib/api-client';
import type {
  PayrollRunView,
  PayrollSettingsView,
  PayslipPreviewView,
  StatutoryHistoryRow,
  StatutoryMonthView,
  WorkerWagesPage,
} from '@repo/types';

export type {
  PayrollLineView,
  PayrollRunView,
  PayrollSettingsView,
  PayslipPreviewView,
  StatutoryHistoryRow,
  StatutoryMonthView,
  WorkerWageView,
  WorkerWagesPage,
} from '@repo/types';

function periodQuery(year: number, month: number, extra?: Record<string, string | number | undefined>) {
  const query = new URLSearchParams({ year: String(year), month: String(month) });
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value != null && value !== '') query.set(key, String(value));
    }
  }
  return query.toString();
}

export async function fetchPayrollRun(year: number, month: number, extra?: { search?: string; page?: number; limit?: number }) {
  const response = await api.get<PayrollRunView>(
    `/operations/employer/payroll/runs?${periodQuery(year, month, extra)}`,
  );
  return response.data;
}

export async function patchPayrollLine(
  runId: string,
  lineId: string,
  body: Record<string, number>,
) {
  const response = await api.patch<PayrollRunView>(
    `/operations/employer/payroll/runs/${runId}/employees/${lineId}`,
    body,
  );
  return response.data;
}

export async function confirmPayrollStage(
  runId: string,
  stage: 'attendance' | 'wages' | 'deductions',
) {
  const response = await api.post<PayrollRunView>(
    `/operations/employer/payroll/runs/${runId}/confirm-${stage}`,
    {},
  );
  return response.data;
}

export async function disbursePayrollRun(
  runId: string,
  payload: { method?: 'NEFT' | 'UPI' | 'CASH'; confirm: boolean },
) {
  const response = await api.post<PayrollRunView>(
    `/operations/employer/payroll/runs/${runId}/disburse`,
    payload,
  );
  return response.data;
}

export async function fetchWorkerWages(params?: { search?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  const response = await api.get<WorkerWagesPage>(
    `/operations/employer/payroll/worker-wages${qs ? `?${qs}` : ''}`,
  );
  return response.data;
}

export async function patchWorkerWage(
  employmentId: string,
  body: {
    daily_rate?: number;
    ot_rate?: number;
    payment_method?: 'NEFT' | 'UPI' | 'CASH';
    pf_applicable?: boolean;
    esi_applicable?: boolean;
  },
) {
  const response = await api.patch<WorkerWagesPage>(
    `/operations/employer/payroll/worker-wages/${employmentId}`,
    body,
  );
  return response.data;
}

export async function fetchPayslips(year: number, month: number, extra?: { search?: string; page?: number; limit?: number }) {
  const response = await api.get<PayrollRunView>(
    `/operations/employer/payroll/payslips?${periodQuery(year, month, extra)}`,
  );
  return response.data;
}

export async function fetchPayslipPreview(lineId: string) {
  const response = await api.get<PayslipPreviewView>(`/operations/employer/payroll/payslips/${lineId}`);
  return response.data;
}

export async function sendPayslip(lineId: string) {
  const response = await api.post<PayslipPreviewView>(
    `/operations/employer/payroll/payslips/${lineId}/send`,
    {},
  );
  return response.data;
}

export async function fetchPayrollSettings() {
  const response = await api.get<PayrollSettingsView>('/operations/employer/payroll/settings');
  return response.data;
}

export async function savePayrollSettings(body: Partial<PayrollSettingsView> & Record<string, unknown>) {
  const response = await api.put<PayrollSettingsView>('/operations/employer/payroll/settings', body);
  return response.data;
}

export async function fetchStatutoryMonth(year: number, month: number) {
  const response = await api.get<StatutoryMonthView>(
    `/operations/employer/payroll/statutory?${periodQuery(year, month)}`,
  );
  return response.data;
}

export async function fileStatutory(filingId: string) {
  const response = await api.post<StatutoryMonthView>(
    `/operations/employer/payroll/statutory/${filingId}/file`,
    {},
  );
  return response.data;
}

export async function fileAllStatutory(year: number, month: number) {
  const response = await api.post<StatutoryMonthView>(
    `/operations/employer/payroll/statutory/file-all?${periodQuery(year, month)}`,
    {},
  );
  return response.data;
}

export async function fetchStatutoryHistory() {
  const response = await api.get<StatutoryHistoryRow[]>('/operations/employer/payroll/statutory/history');
  return response.data;
}
