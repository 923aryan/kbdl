import { create } from 'zustand';

export type ShiftStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'open'
  | 'cancelled'
  | 'completed'
  | 'all';

export type ShiftCreator = 'all' | 'employer' | 'worker';

interface ShiftState {
  isCreateModalOpen: boolean;
  selectedShiftId: string | null;
  filters: {
    search: string;
    statuses: ShiftStatus[];
    createdBy: ShiftCreator;
    dateFrom: string;
    dateTo: string;
  };
  toggleCreateModal: () => void;
  setSelectedShiftId: (id: string | null) => void;
  setFilters: (filters: Partial<ShiftState['filters']>) => void;
}

export const useShiftStore = create<ShiftState>((set) => ({
  isCreateModalOpen: false,
  selectedShiftId: null,
  filters: {
    search: '',
    statuses: ['all'],
    createdBy: 'all',
    dateFrom: '',
    dateTo: '',
  },
  toggleCreateModal: () => set((state) => ({ isCreateModalOpen: !state.isCreateModalOpen })),
  setSelectedShiftId: (id) => set({ selectedShiftId: id }),
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
}));
