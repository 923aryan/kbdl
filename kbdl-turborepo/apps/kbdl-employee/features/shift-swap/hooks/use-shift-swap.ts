import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { OpenShift } from '../types/shift-swap-types';

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },

  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },

  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

interface ShiftSwapStore {
  shifts: OpenShift[];
  savedShifts: any[];
  setShifts: (shifts: OpenShift[]) => void;
  addShift: (shift: OpenShift) => void;
  removeShift: (shiftId: string) => void;
  clearShifts: () => void;
  toggleSavedShift: (shift: any) => void;
}

export const useShiftSwapStore = create<ShiftSwapStore>()(
  persist(
    (set, get) => ({
      shifts: [],
      savedShifts: [],

      setShifts: (shifts) => set({ shifts }),

      addShift: (shift) =>
        set((state) => {
          const exists = state.shifts.some((s) => s.id === shift.id);

          if (exists) {
            return state;
          }

          return {
            shifts: [shift, ...state.shifts],
          };
        }),

      removeShift: (shiftId) =>
        set((state) => ({
          shifts: state.shifts.filter((shift) => shift.id !== shiftId),
        })),

      clearShifts: () =>
        set({
          shifts: [],
          savedShifts: [],
        }),

      toggleSavedShift: (shift) =>
        set((state) => {
          const isSaved = state.savedShifts.some((s) => s.id === shift.id);

          if (isSaved) {
            return {
              savedShifts: state.savedShifts.filter((s) => s.id !== shift.id),
            };
          }

          return {
            savedShifts: [shift, ...state.savedShifts],
          };
        }),
    }),
    {
      name: 'shift-swap-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        savedShifts: state.savedShifts,
      }),
    },
  ),
);
