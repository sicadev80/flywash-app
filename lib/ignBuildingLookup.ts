import type { LatLng } from './polygonArea';

// Service WFS de la BD TOPO (IGN / Géoplateforme) : contours réels des
// bâtiments (murs vus du dessus), pas juste une image satellite. Permet de
// remplir le polygone toiture d'un coup en tapant sur le bâtiment plutôt
// qu'en posant les points un par un.
const WFS_URL = 'https://data.geopf.fr/wfs/ows';
const BUILDING_TYPENAME = 'BDTOPO_V3:batiment';

// Rayon de recherche autour du point tapé (en degrés) — assez large pour
// couvrir une maison individuelle, assez petit pour éviter de remonter le
// pâté de maisons voisin. ~30 m selon la latitude.
const SEARCH_RADIUS_DEG = 0.0003;

type GeoJsonPosition = [number, number];
type GeoJsonPolygonRings = GeoJsonPosition[][];

function toLatLngRing(ring: GeoJsonPosition[]): LatLng[] {
  const ptsList = ring.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
  // Les anneaux GeoJSON sont fermés (premier === dernier point) — l'appli ne
  // stocke que les sommets distincts du polygone, donc on retire le doublon.
  if (ptsList.length > 1) {
    const first = ptsList[0];
    const last = ptsList[ptsList.length - 1];
    if (first.latitude === last.latitude && first.longitude === last.longitude) {
      ptsList.pop();
    }
  }
  return ptsList;
}

function extractOuterRings(geometry: any): GeoJsonPosition[][] {
  // On ne garde que le contour extérieur de chaque polygone : les trous
  // éventuels (patios, cours intérieures) ne concernent pas le calcul de
  // surface au sol recherché ici.
  if (!geometry) return [];
  if (geometry.type === 'Polygon') {
    const rings = geometry.coordinates as GeoJsonPolygonRings;
    return rings[0] ? [rings[0]] : [];
  }
  if (geometry.type === 'MultiPolygon') {
    const polygons = geometry.coordinates as GeoJsonPolygonRings[];
    return polygons.map((rings) => rings[0]).filter((ring): ring is GeoJsonPosition[] => !!ring);
  }
  return [];
}

function isPointInRing(point: LatLng, ring: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i].longitude;
    const yi = ring[i].latitude;
    const xj = ring[j].longitude;
    const yj = ring[j].latitude;
    const intersects =
      yi > point.latitude !== yj > point.latitude &&
      point.longitude < ((xj - xi) * (point.latitude - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function ringCentroid(ring: LatLng[]): LatLng {
  const sum = ring.reduce(
    (acc, p) => ({ latitude: acc.latitude + p.latitude, longitude: acc.longitude + p.longitude }),
    { latitude: 0, longitude: 0 }
  );
  return { latitude: sum.latitude / ring.length, longitude: sum.longitude / ring.length };
}

async function queryBuildingsNear(coordinate: LatLng): Promise<LatLng[][]> {
  const minLon = coordinate.longitude - SEARCH_RADIUS_DEG;
  const maxLon = coordinate.longitude + SEARCH_RADIUS_DEG;
  const minLat = coordinate.latitude - SEARCH_RADIUS_DEG;
  const maxLat = coordinate.latitude + SEARCH_RADIUS_DEG;

  // CRS:84 force l'ordre (longitude, latitude) — évite l'ambiguïté d'axe
  // classique d'EPSG:4326 en WFS 2.0 (qui suit l'ordre officiel lat/lon).
  const bbox = `${minLon},${minLat},${maxLon},${maxLat},CRS:84`;
  const params = new URLSearchParams({
    SERVICE: 'WFS',
    VERSION: '2.0.0',
    REQUEST: 'GetFeature',
    TYPENAMES: BUILDING_TYPENAME,
    OUTPUTFORMAT: 'application/json',
    SRSNAME: 'CRS:84',
    COUNT: '30',
  });

  const response = await fetch(`${WFS_URL}?${params.toString()}&BBOX=${bbox}`);
  if (!response.ok) {
    throw new Error(`IGN WFS indisponible (${response.status})`);
  }

  const data = await response.json();
  const features = Array.isArray(data?.features) ? data.features : [];

  const rings: LatLng[][] = [];
  for (const feature of features) {
    for (const outerRing of extractOuterRings(feature?.geometry)) {
      const ring = toLatLngRing(outerRing);
      if (ring.length >= 3) rings.push(ring);
    }
  }
  return rings;
}

/**
 * Cherche le contour du bâtiment BD TOPO (IGN) au point tapé sur la carte.
 * Renvoie le polygone (murs vus du dessus, hors débord de toit éventuel) du
 * bâtiment contenant ce point, ou à défaut le plus proche parmi ceux trouvés
 * autour (le tap peut être légèrement à côté du contour réel) — ou null si
 * le service ne renvoie rien d'exploitable à cet endroit.
 */
export async function findBuildingFootprintAt(coordinate: LatLng): Promise<LatLng[] | null> {
  const rings = await queryBuildingsNear(coordinate);
  if (rings.length === 0) return null;

  const containing = rings.find((ring) => isPointInRing(coordinate, ring));
  if (containing) return containing;

  let closest = rings[0];
  let closestDist = Infinity;
  for (const ring of rings) {
    const centroid = ringCentroid(ring);
    const dist = Math.hypot(centroid.latitude - coordinate.latitude, centroid.longitude - coordinate.longitude);
    if (dist < closestDist) {
      closestDist = dist;
      closest = ring;
    }
  }
  return closest;
}
