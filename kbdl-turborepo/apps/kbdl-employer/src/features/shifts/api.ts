import { CreateShiftPayload, CreateShiftResponse, Shift } from '@repo/types';
import { api } from '../../lib/api-client';

/**
 * Create a new shift for an employee
 */
export const createShift = async (payload: CreateShiftPayload): Promise<CreateShiftResponse> => {
  const response = await api.post<CreateShiftResponse>('/shift-swap', payload);
  return response.data;
};

/**
 * Get all shifts created by the employer
 */
export const getEmployerShifts = async (): Promise<Shift[]> => {
  const response = await api.get<Shift[]>('/shift-swap/employer');
  return response.data;
};

/**
 * Update an existing shift
 */
export const updateShift = async (payload: {
  shift_id: string;
  [key: string]: unknown;
}): Promise<Shift> => {
  const response = await api.patch<Shift>('/shift-swap', payload);
  return response.data;
};

/**
 * Cancel a shift
 */
export const cancelShift = async (payload: { shift_id: string }): Promise<Shift> => {
  const response = await api.post<Shift>('/shift-swap/cancel', payload);
  return response.data;
};
