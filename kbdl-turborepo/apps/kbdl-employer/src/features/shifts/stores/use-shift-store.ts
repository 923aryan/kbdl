import { create } from 'zustand';

type ShiftStatus = 'open' | 'filled' | 'completed' | 'cancelled' | 'all';

interface ShiftState {
  isCreateModalOpen: boolean;
  selectedShiftId: string | null;
  filters: {
    search: string;
    status: ShiftStatus;
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
    status: 'all',
  },
  toggleCreateModal: () => set((state) => ({ isCreateModalOpen: !state.isCreateModalOpen })),
  setSelectedShiftId: (id) => set({ selectedShiftId: id }),
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
}));
