import { create } from 'zustand';
export {
  payrollCoverageOptions,
  payrollDesignations,
  payrollMonths,
  payrollStatuses,
  payrollTypes,
  payrollWorkers,
  type PayrollStage,
  type PayrollWorker,
  type PayslipStatus,
} from '../data/payroll-data';

import { type PayrollStage } from '../data/payroll-data';

type PayrollState = {
  search: string;
  selectedDesignations: string[];
  selectedStatuses: string[];
  selectedTypes: string[];
  selectedCoverage: string[];
  selectedMonth: string;
  selectedStage: PayrollStage;
  payslipPreviewOpen: boolean;
  openDropdown: string | null;
  setSearch: (search: string) => void;
  setSelectedDesignations: (designations: string[]) => void;
  setSelectedStatuses: (statuses: string[]) => void;
  setSelectedTypes: (types: string[]) => void;
  setSelectedCoverage: (coverage: string[]) => void;
  setSelectedMonth: (month: string) => void;
  setSelectedStage: (stage: PayrollStage) => void;
  setPayslipPreviewOpen: (open: boolean) => void;
  setOpenDropdown: (dropdown: string | null) => void;
};

export const usePayrollStore = create<PayrollState>((set) => ({
  search: '',
  selectedDesignations: [],
  selectedStatuses: [],
  selectedTypes: [],
  selectedCoverage: [],
  selectedMonth: 'October 2026',
  selectedStage: 'attendance',
  payslipPreviewOpen: false,
  openDropdown: null,
  setSearch: (search) => set({ search }),
  setSelectedDesignations: (selectedDesignations) => set({ selectedDesignations }),
  setSelectedStatuses: (selectedStatuses) => set({ selectedStatuses }),
  setSelectedTypes: (selectedTypes) => set({ selectedTypes }),
  setSelectedCoverage: (selectedCoverage) => set({ selectedCoverage }),
  setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
  setSelectedStage: (selectedStage) => set({ selectedStage }),
  setPayslipPreviewOpen: (payslipPreviewOpen) => set({ payslipPreviewOpen }),
  setOpenDropdown: (openDropdown) => set({ openDropdown }),
}));
