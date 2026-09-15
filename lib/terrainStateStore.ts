import type { LatLng } from './polygonArea';
import type { Region } from 'react-native-maps';

export type PendingTerrainState = {
  points: LatLng[];
  closed: boolean;
  angle: string;
  region?: Region | null;
};

let pendingTerrainState: PendingTerrainState | null = null;

export function setPendingTerrainState(data: PendingTerrainState) {
  pendingTerrainState = data;
}

export function getPendingTerrainState() {
  return pendingTerrainState;
}

export function clearPendingTerrainState() {
  pendingTerrainState = null;
}
