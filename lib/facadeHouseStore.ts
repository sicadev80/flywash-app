
import { useSyncExternalStore } from 'react';

export type Point = { x: number; y: number };

export type FacadeItem = {
  id: string;
  name: string;
  imageUri: string;
  outerPolygon: Point[];
  voidPolygons: Point[][];
  scalePoints: Point[];
  realDistanceMeters: number;
  grossAreaM2: number;
  voidsAreaM2: number;
  netAreaM2: number;
  createdAt: number;
};

type State = { facades: FacadeItem[] };

let state: State = { facades: [] };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function useFacadeHouseStore() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => state
  );
}

export function generateFacadeId() {
  return `facade-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getFacadeById(id?: string | null) {
  if (!id) return null;
  return state.facades.find((f) => f.id === id) ?? null;
}

export function upsertFacade(item: FacadeItem) {
  const exists = state.facades.some((f) => f.id === item.id);
  state = {
    facades: exists
      ? state.facades.map((f) => (f.id === item.id ? item : f))
      : [...state.facades, item],
  };
  emit();
}

export function deleteFacade(id: string) {
  state = { facades: state.facades.filter((f) => f.id !== id) };
  emit();
}
