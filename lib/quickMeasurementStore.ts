import { create } from 'zustand';

export type Facade = {
  id: string;
  name: string;
  imageUri: string;
  grossAreaM2: number;
  voidsAreaM2: number;
  netAreaM2: number;
  createdAt: string;
};

type Store = {
  facades: Facade[];

  addFacade: (f: Facade) => void;
  removeFacade: (id: string) => void;
  reset: () => void;
};

export const useQuickMeasurementStore = create<Store>((set) => ({
  facades: [],

  addFacade: (f) =>
    set((s) => ({
      facades: [...s.facades, f],
    })),

  removeFacade: (id) =>
    set((s) => ({
      facades: s.facades.filter((f) => f.id !== id),
    })),

  reset: () => set({ facades: [] }),
}));
