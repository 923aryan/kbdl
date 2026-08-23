import { create } from 'zustand';
import { currentPayrollPeriod, type PayrollPeriod, type PayrollStage } from '../data/payroll-data';

export {
  payrollCoverageOptions,
  payrollMonths,
  payrollStatuses,
  payrollTypes,
  type PayrollStage,
} from '../data/payroll-data';

type PayrollState = {
  search: string;
  selectedDesignations: string[];
  selectedStatuses: string[];
  selectedTypes: string[];
  selectedCoverage: string[];
  selectedPeriod: PayrollPeriod;
  selectedStage: PayrollStage;
  payslipPreviewOpen: boolean;
  openDropdown: string | null;
  setSearch: (search: string) => void;
  setSelectedDesignations: (designations: string[]) => void;
  setSelectedStatuses: (statuses: string[]) => void;
  setSelectedTypes: (types: string[]) => void;
  setSelectedCoverage: (coverage: string[]) => void;
  setSelectedPeriod: (period: PayrollPeriod) => void;
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
  selectedPeriod: currentPayrollPeriod(),
  selectedStage: 'attendance',
  payslipPreviewOpen: false,
  openDropdown: null,
  setSearch: (search) => set({ search }),
  setSelectedDesignations: (selectedDesignations) => set({ selectedDesignations }),
  setSelectedStatuses: (selectedStatuses) => set({ selectedStatuses }),
  setSelectedTypes: (selectedTypes) => set({ selectedTypes }),
  setSelectedCoverage: (selectedCoverage) => set({ selectedCoverage }),
  setSelectedPeriod: (selectedPeriod) => set({ selectedPeriod }),
  setSelectedStage: (selectedStage) => set({ selectedStage }),
  setPayslipPreviewOpen: (payslipPreviewOpen) => set({ payslipPreviewOpen }),
  setOpenDropdown: (openDropdown) => set({ openDropdown }),
}));
