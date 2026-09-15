export type RoofType =
  | 'flat-slope'
  | 'straight-1-2'
  | 'straight-3'
  | 'straight-4'
  | 'l-2'
  | 'l-3'
  | 'l-mixte';

export function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function rad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function calcFlatSlope(surfaceAPlat: number, angleDeg: number) {
  const cos = Math.cos(rad(angleDeg));
  const surface = cos > 0 ? surfaceAPlat / cos : 0;
  return {
    surfaceTotale: round2(surface),
    details: {
      surfaceAPlat: round2(surfaceAPlat),
      angleDeg: round2(angleDeg),
    },
  };
}

export function calcStraight12Pans(
  longueur: number,
  largeur: number,
  hauteur: number,
  nombrePans: 1 | 2
) {
  const demiLargeur = largeur / 2;
  const pentePan = Math.sqrt(hauteur ** 2 + demiLargeur ** 2);
  const surfaceDeuxPans = longueur * pentePan * 2;
  const surfaceTotale = nombrePans === 1 ? surfaceDeuxPans / 2 : surfaceDeuxPans;

  return {
    surfaceTotale: round2(surfaceTotale),
    details: {
      pentePan: round2(pentePan),
      surfacePan: round2(longueur * pentePan),
      nombrePans,
    },
  };
}

export function calcThreePans(L: number, l: number, LC: number, H: number) {
  const hauteurTriangle = Math.sqrt((L - LC) ** 2 + H ** 2);
  const surfaceTriangle = (l * hauteurTriangle) / 2;
  const hauteurTrapeze = Math.sqrt((l / 2) ** 2 + H ** 2);
  const surfaceTrapeze = ((L + LC) / 2) * hauteurTrapeze;
  const surfaceTotale = surfaceTriangle + 2 * surfaceTrapeze;

  return {
    surfaceTotale: round2(surfaceTotale),
    details: {
      hauteurTriangle: round2(hauteurTriangle),
      surfaceTriangle: round2(surfaceTriangle),
      hauteurTrapeze: round2(hauteurTrapeze),
      surfaceTrapeze: round2(surfaceTrapeze),
    },
  };
}

export function calcFourPans(L: number, l: number, LC: number, H: number) {
  const hauteurTriangle = Math.sqrt(((L - LC) / 2) ** 2 + H ** 2);
  const surfaceTriangle = (l * hauteurTriangle) / 2;
  const hauteurTrapeze = Math.sqrt((l / 2) ** 2 + H ** 2);
  const surfaceTrapeze = ((L + LC) / 2) * hauteurTrapeze;
  const surfaceTotale = 2 * surfaceTriangle + 2 * surfaceTrapeze;

  return {
    surfaceTotale: round2(surfaceTotale),
    details: {
      hauteurTriangle: round2(hauteurTriangle),
      surfaceTriangle: round2(surfaceTriangle),
      hauteurTrapeze: round2(hauteurTrapeze),
      surfaceTrapeze: round2(surfaceTrapeze),
    },
  };
}

// Version géométrique corrigée simplifiée
export function calcL2Pans(L1: number, l1: number, L2: number, l2: number, H: number) {
  const pente1 = Math.sqrt((l1 / 2) ** 2 + H ** 2);
  const pente2 = Math.sqrt((l2 / 2) ** 2 + H ** 2);
  const surface1 = L1 * pente1;
  const surface2 = L2 * pente2;
  const raccord1 = ((L1 + L2) / 2) * pente2;
  const raccord2 = ((l1 - l2) / 2) * pente1;
  const surfaceTotale = surface1 + surface2 + raccord1 + raccord2;

  return {
    surfaceTotale: round2(surfaceTotale),
    details: {
      pente1: round2(pente1),
      pente2: round2(pente2),
      surface1: round2(surface1),
      surface2: round2(surface2),
      raccord1: round2(raccord1),
      raccord2: round2(raccord2),
    },
  };
}

// Version géométrique corrigée simplifiée
export function calcL3Pans(L1: number, l1: number, L2: number, l2: number, H: number, LC: number) {
  const pente1 = Math.sqrt((l1 / 2) ** 2 + H ** 2);
  const pente2 = Math.sqrt((l2 / 2) ** 2 + H ** 2);
  const triangle = (LC * pente2) / 2;
  const pan1 = L1 * pente1;
  const pan2 = L2 * pente2;
  const liaison1 = ((L1 + LC) / 2) * pente2;
  const liaison2 = ((l1 - l2) / 2) * pente1;
  const liaison3 = ((L2 + LC) / 2) * pente2;
  const surfaceTotale = triangle + pan1 + pan2 + liaison1 + liaison2 + liaison3;

  return {
    surfaceTotale: round2(surfaceTotale),
    details: {
      pente1: round2(pente1),
      pente2: round2(pente2),
      triangle: round2(triangle),
      pan1: round2(pan1),
      pan2: round2(pan2),
      liaison1: round2(liaison1),
      liaison2: round2(liaison2),
      liaison3: round2(liaison3),
    },
  };
}

// Version géométrique corrigée simplifiée
export function calcLMixte(L1: number, l1: number, L2: number, l2: number, H: number, LC: number) {
  const pente1 = Math.sqrt((l1 / 2) ** 2 + H ** 2);
  const pente2 = Math.sqrt((l2 / 2) ** 2 + H ** 2);
  const triangle = (LC * pente1) / 2;
  const trap1 = L1 * pente1;
  const trap2 = L2 * pente1;
  const trap3 = L2 * pente2;
  const trap4 = ((L1 + L2) / 2) * pente2;
  const surfaceTotale = triangle + trap1 + trap2 + trap3 + trap4;

  return {
    surfaceTotale: round2(surfaceTotale),
    details: {
      pente1: round2(pente1),
      pente2: round2(pente2),
      triangle: round2(triangle),
      trap1: round2(trap1),
      trap2: round2(trap2),
      trap3: round2(trap3),
      trap4: round2(trap4),
    },
  };
}
