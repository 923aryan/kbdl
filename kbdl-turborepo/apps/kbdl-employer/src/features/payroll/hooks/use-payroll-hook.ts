import { useMemo } from 'react';
import type { PayrollLineView, WorkerWageView } from '../api';

export function useFilteredPayrollLines<T extends PayrollLineView | WorkerWageView>({
  items,
  search,
  selectedDesignations = [],
  selectedStatuses = [],
  selectedTypes = [],
  selectedCoverage = [],
}: {
  items: T[];
  search: string;
  selectedDesignations?: string[];
  selectedStatuses?: string[];
  selectedTypes?: string[];
  selectedCoverage?: string[];
}) {
  return useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const name = 'full_name' in item ? item.full_name : '';
      const id = 'employee_no' in item ? item.employee_no ?? '' : '';
      const payrollStatus = 'payroll_status' in item ? item.payroll_status : '';
      const payslipStatus = 'payslip_status' in item ? item.payslip_status : '';
      const paymentMode = 'payment_mode' in item ? item.payment_mode : '';
      const epfCovered = 'epf_covered' in item ? item.epf_covered : false;
      const esicCovered = 'esic_covered' in item ? item.esic_covered : false;
      const matchesSearch =
        !query ||
        name.toLowerCase().includes(query) ||
        id.toLowerCase().includes(query) ||
        item.designation.toLowerCase().includes(query) ||
        item.department.toLowerCase().includes(query) ||
        item.contract.toLowerCase().includes(query) ||
        paymentMode.toLowerCase().includes(query) ||
        payrollStatus.toLowerCase().includes(query) ||
        payslipStatus.toLowerCase().includes(query);
      const matchesDesignation =
        selectedDesignations.length === 0 || selectedDesignations.includes(item.designation);
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(String(payrollStatus));
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(item.contract);
      const matchesCoverage =
        selectedCoverage.length === 0 ||
        selectedCoverage.some((coverage) => {
          if (coverage === 'EPF Covered') return epfCovered;
          if (coverage === 'ESIC Covered') return esicCovered;
          if (coverage === 'EPF Not Covered') return !epfCovered;
          if (coverage === 'ESIC Not Covered') return !esicCovered;
          return true;
        });
      return matchesSearch && matchesDesignation && matchesStatus && matchesType && matchesCoverage;
    });
  }, [items, search, selectedDesignations, selectedStatuses, selectedTypes, selectedCoverage]);
}
