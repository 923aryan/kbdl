import { useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
  fetchEmployeesList,
  type EmployeesListParams,
  type EmployeesListResult,
} from '../api';
import type { Employee, Status } from '../stores/use-employee-store';

function formatJoinedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function mapListItemToEmployee(row: EmployeesListResult['data'][number]): Employee {
  return {
    id: row.employee_no ?? row.employment_id.slice(0, 8).toUpperCase(),
    uid: row.karigari_id ?? '',
    name: row.name,
    email: row.email ?? '',
    phone: row.phone_no,
    designation: row.designation,
    status: row.status.ui_status as Status,
    rating: row.rating ?? 0,
    joined: formatJoinedDate(row.joined_at),
    location: '',
    department: row.department ?? '',
    salary: '',
    employmentId: row.employment_id,
  };
}

export type UseEmployeesListArgs = {
  roster?: 'active' | 'past' | 'all';
  search: string;
  selectedDesignations: string[];
  selectedStatuses: Status[];
  page: number;
  limit?: number;
  refreshKey?: number;
};

export function useEmployeesList({
  roster = 'active',
  search,
  selectedDesignations,
  selectedStatuses,
  page,
  limit = 10,
  refreshKey = 0,
}: UseEmployeesListArgs) {
  const debouncedSearch = useDebouncedValue(search, 300);
  const [result, setResult] = useState<EmployeesListResult | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setIsFetching(true);

    const params: EmployeesListParams = {
      roster,
      search: debouncedSearch,
      designation: selectedDesignations,
      status: selectedStatuses,
      page,
      limit,
    };

    fetchEmployeesList(params)
      .then((response) => {
        if (requestId !== requestIdRef.current) return;
        setResult(response);
        setError(null);
      })
      .catch((err) => {
        if (requestId !== requestIdRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load employees');
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        setIsFetching(false);
      });
  }, [
    roster,
    debouncedSearch,
    selectedDesignations,
    selectedStatuses,
    page,
    limit,
    refreshKey,
  ]);

  const employees = result ? result.data.map(mapListItemToEmployee) : [];
  const facets = result?.meta.facets;
  const pagination = result
    ? {
        page: result.meta.page,
        limit: result.meta.limit,
        total: result.meta.total,
        totalPages: result.meta.totalPages,
      }
    : { page: 1, limit, total: 0, totalPages: 1 };

  return {
    employees,
    facets,
    pagination,
    isFetching,
    isInitialLoading: isFetching && result === null,
    error,
  };
}
