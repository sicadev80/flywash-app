export type PendingSurface = {
  surface: number;
  type?: string;
  date?: string;
};

let pendingSurface: PendingSurface | null = null;

export function setPendingSurface(data: PendingSurface) {
  pendingSurface = data;
}

export function getPendingSurface() {
  return pendingSurface;
}

export function clearPendingSurface() {
  pendingSurface = null;
}
