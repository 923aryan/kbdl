import { useMemo } from 'react';
import { employees, type Status } from '../stores/use-employee-store';

export const useFilteredEmployees = ({
  search,
  selectedDesignations,
  selectedStatuses,
  refreshKey = 0,
}: {
  search: string;
  selectedDesignations: string[];
  selectedStatuses: Status[];
  refreshKey?: number;
}) => {
  return useMemo(() => {
    void refreshKey;

    return [...employees]
      .filter((employee) => {
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          employee.name.toLowerCase().includes(query) ||
          employee.email.toLowerCase().includes(query) ||
          employee.designation.toLowerCase().includes(query) ||
          employee.id.toLowerCase().includes(query);
        const matchesDesignation =
          selectedDesignations.length === 0 || selectedDesignations.includes(employee.designation);
        const matchesStatus =
          selectedStatuses.length === 0 || selectedStatuses.includes(employee.status);

        return matchesSearch && matchesDesignation && matchesStatus;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [search, selectedDesignations, selectedStatuses, refreshKey]);
};
