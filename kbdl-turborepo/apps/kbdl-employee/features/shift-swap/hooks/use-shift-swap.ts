import { create } from 'zustand';

import { OpenShift } from '../types/shift-swap-types';

interface ShiftSwapStore {
  shifts: OpenShift[];

  setShifts: (shifts: OpenShift[]) => void;

  addShift: (shift: OpenShift) => void;

  removeShift: (shiftId: string) => void;

  clearShifts: () => void;
}

export const useShiftSwapStore = create<ShiftSwapStore>((set) => ({
  shifts: [],

  setShifts: (shifts) =>
    set({
      shifts,
    }),

  addShift: (shift) =>
    set((state) => {
      const exists = state.shifts.some(
        (s) => s.id === shift.id,
      );

      if (exists) {
        return state;
      }

      return {
        shifts: [shift, ...state.shifts],
      };
    }),

  removeShift: (shiftId) =>
    set((state) => ({
      shifts: state.shifts.filter(
        (shift) => shift.id !== shiftId,
      ),
    })),

  clearShifts: () =>
    set({
      shifts: [],
    }),
}));