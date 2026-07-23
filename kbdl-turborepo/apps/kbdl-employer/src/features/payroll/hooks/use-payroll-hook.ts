import { useMemo } from 'react';
import { payrollWorkers } from '../data/payroll-data';

export const useFilteredPayrollWorkers = ({
  search,
  selectedDesignations = [],
  selectedStatuses = [],
  selectedTypes = [],
  selectedCoverage = [],
}: {
  search: string;
  selectedDesignations?: string[];
  selectedStatuses?: string[];
  selectedTypes?: string[];
  selectedCoverage?: string[];
}) => {
  return useMemo(() => {
    const query = search.trim().toLowerCase();

    return payrollWorkers.filter((worker) => {
      const matchesSearch =
        !query ||
        worker.name.toLowerCase().includes(query) ||
        worker.id.toLowerCase().includes(query) ||
        worker.designation.toLowerCase().includes(query) ||
        worker.department.toLowerCase().includes(query) ||
        worker.contract.toLowerCase().includes(query) ||
        worker.paymentMode.toLowerCase().includes(query) ||
        worker.payrollStatus.toLowerCase().includes(query) ||
        worker.payslipStatus.toLowerCase().includes(query);
      const matchesDesignation = selectedDesignations.length === 0 || selectedDesignations.includes(worker.designation);
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(worker.payrollStatus);
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(worker.contract);
      const matchesCoverage =
        selectedCoverage.length === 0 ||
        selectedCoverage.some((coverage) => {
          if (coverage === 'EPF Covered') return worker.epfCovered;
          if (coverage === 'ESIC Covered') return worker.esicCovered;
          if (coverage === 'EPF Not Covered') return !worker.epfCovered;
          if (coverage === 'ESIC Not Covered') return !worker.esicCovered;
          return true;
        });

      return matchesSearch && matchesDesignation && matchesStatus && matchesType && matchesCoverage;
    });
  }, [search, selectedDesignations, selectedStatuses, selectedTypes, selectedCoverage]);
};
