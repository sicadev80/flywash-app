export type LatLng = {
  latitude: number;
  longitude: number;
};

const EARTH_RADIUS = 6378137;

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

// Approximation locale robuste pour des petites surfaces
export function polygonAreaSquareMeters(points: LatLng[]): number {
  if (!points || points.length < 3) return 0;

  const lat0 = points.reduce((sum, p) => sum + p.latitude, 0) / points.length;
  const cosLat0 = Math.cos(toRad(lat0));

  const projected = points.map((p) => {
    const x = EARTH_RADIUS * toRad(p.longitude) * cosLat0;
    const y = EARTH_RADIUS * toRad(p.latitude);
    return { x, y };
  });

  let area = 0;
  for (let i = 0; i < projected.length; i++) {
    const a = projected[i];
    const b = projected[(i + 1) % projected.length];
    area += a.x * b.y - b.x * a.y;
  }

  return Math.abs(area) / 2;
}
