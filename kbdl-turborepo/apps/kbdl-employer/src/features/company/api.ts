import { api } from '@/lib/api-client';
import type { CompanyCatalogView } from '@repo/types';

export async function fetchCompanyCatalog() {
  return api.get<CompanyCatalogView>('/operations/employer/catalog');
}

export async function createCatalogDepartment(body: { name: string; description?: string }) {
  return api.post<CompanyCatalogView>('/operations/employer/catalog/departments', body);
}

export async function createCatalogDesignation(body: { name: string; description?: string }) {
  return api.post<CompanyCatalogView>('/operations/employer/catalog/designations', body);
}

export async function createCatalogBranch(body: { name: string; latitude: number; longitude: number }) {
  return api.post<CompanyCatalogView>('/operations/employer/catalog/branches', body);
}

export async function saveCatalogHq(body: { latitude: number; longitude: number }) {
  return api.put<CompanyCatalogView>('/operations/employer/catalog/hq-location', body);
}

export async function createCatalogWorkShift(body: {
  name: string;
  start_time: string;
  end_time: string;
  break_minutes?: number;
}) {
  return api.post<CompanyCatalogView>('/operations/employer/catalog/work-shifts', body);
}

export async function createCatalogHoliday(body: { date: string; name: string; is_optional?: boolean }) {
  return api.post<CompanyCatalogView>('/operations/employer/catalog/holidays', body);
}
