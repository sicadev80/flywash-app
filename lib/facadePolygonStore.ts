
import { useSyncExternalStore } from 'react';

export type Point = { x: number; y: number };

export type ScaleReference = {
  points: [Point, Point] | [];
  realDistanceMeters: number;
};

export type FacadePolygonMeasure = {
  id: string;
  name: string;
  imageUri: string;
  outerPolygon: Point[];
  voidPolygons: Point[][];
  scaleReference: ScaleReference;
  grossSurfaceM2: number;
  voidSurfaceM2: number;
  netSurfaceM2: number;
  createdAt: number;
  updatedAt: number;
};

type StoreState = {
  facades: FacadePolygonMeasure[];
};

let state: StoreState = { facades: [] };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function useFacadePolygonStore() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => state
  );
}

export function createFacadeId() {
  return `facade-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getFacadePolygonById(id?: string | null) {
  if (!id) return null;
  return state.facades.find((item) => item.id === id) ?? null;
}

export function distance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function polygonArea(points: Point[]) {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
}

export function computeFacadeMetrics(input: {
  outerPolygon: Point[];
  voidPolygons: Point[][];
  scaleReference: ScaleReference;
}) {
  const outerPx = polygonArea(input.outerPolygon);
  const voidPx = input.voidPolygons.reduce((sum, polygon) => sum + polygonArea(polygon), 0);

  const scalePoints = input.scaleReference.points;
  if (scalePoints.length !== 2 || input.scaleReference.realDistanceMeters <= 0) {
    return {
      grossSurfaceM2: 0,
      voidSurfaceM2: 0,
      netSurfaceM2: 0,
      pixelLength: 0,
    };
  }

  const pixelLength = distance(scalePoints[0], scalePoints[1]);
  if (pixelLength <= 0) {
    return {
      grossSurfaceM2: 0,
      voidSurfaceM2: 0,
      netSurfaceM2: 0,
      pixelLength,
    };
  }

  const ratioMetersPerPixel = input.scaleReference.realDistanceMeters / pixelLength;
  const grossSurfaceM2 = outerPx * ratioMetersPerPixel * ratioMetersPerPixel;
  const voidSurfaceM2 = voidPx * ratioMetersPerPixel * ratioMetersPerPixel;
  const netSurfaceM2 = Math.max(0, grossSurfaceM2 - voidSurfaceM2);

  return {
    grossSurfaceM2,
    voidSurfaceM2,
    netSurfaceM2,
    pixelLength,
  };
}

export function upsertFacadePolygon(
  input: Omit<
    FacadePolygonMeasure,
    'grossSurfaceM2' | 'voidSurfaceM2' | 'netSurfaceM2' | 'createdAt' | 'updatedAt'
  > & { createdAt?: number }
) {
  const metrics = computeFacadeMetrics({
    outerPolygon: input.outerPolygon,
    voidPolygons: input.voidPolygons,
    scaleReference: input.scaleReference,
  });

  const existing = state.facades.find((item) => item.id === input.id);

  const next: FacadePolygonMeasure = {
    ...input,
    grossSurfaceM2: metrics.grossSurfaceM2,
    voidSurfaceM2: metrics.voidSurfaceM2,
    netSurfaceM2: metrics.netSurfaceM2,
    createdAt: existing?.createdAt ?? input.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  };

  state = {
    facades: existing
      ? state.facades.map((item) => (item.id === input.id ? next : item))
      : [...state.facades, next],
  };

  emit();
  return next;
}

export function duplicateFacadePolygon(id: string) {
  const current = getFacadePolygonById(id);
  if (!current) return null;

  const clone = upsertFacadePolygon({
    ...current,
    id: createFacadeId(),
    name: `${current.name} copie`,
  });

  return clone;
}

export function deleteFacadePolygon(id: string) {
  state = {
    facades: state.facades.filter((item) => item.id !== id),
  };
  emit();
}
