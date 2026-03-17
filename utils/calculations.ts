export function round(value: number, digits = 2) {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function calcDilution(surface: number, rendement: number, dilution: number, prixProduitLitre: number) {
  const produitFini = rendement > 0 ? surface / rendement : 0;
  const litresParLitrePur = 1 + dilution;
  const produitPur = litresParLitrePur > 0 ? produitFini / litresParLitrePur : 0;
  const eau = produitFini - produitPur;
  const coutTotal = produitPur * prixProduitLitre;
  const coutM2 = surface > 0 ? coutTotal / surface : 0;

  return {
    produitFini: round(produitFini),
    produitPur: round(produitPur),
    eau: round(eau),
    coutTotal: round(coutTotal),
    coutM2: round(coutM2),
  };
}

export function calcRoofFlatWithSlope(surfaceAPlat: number, angleDeg: number) {
  const radians = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(radians);
  const surfaceReelle = cos > 0 ? surfaceAPlat / cos : 0;
  return round(surfaceReelle);
}

export function calcTripCost(distanceKm: number, consommationL100: number, prixCarburant: number, peage = 0) {
  const litres = (distanceKm * consommationL100) / 100;
  const carburant = litres * prixCarburant;
  return {
    litres: round(litres),
    carburant: round(carburant),
    total: round(carburant + peage),
  };
}

export function calcMissionPricing(params: {
  surface: number;
  coutProduit: number;
  coutTrip: number;
  coutMateriel: number;
  chargeM2: number;
  margePct: number;
  tvaPct: number;
}) {
  const charges = params.surface * params.chargeM2;
  const revient = params.coutProduit + params.coutTrip + params.coutMateriel + charges;
  const revientM2 = params.surface > 0 ? revient / params.surface : 0;
  const venteHtM2 = revientM2 * (1 + params.margePct / 100);
  const totalHt = venteHtM2 * params.surface;
  const totalTtc = totalHt * (1 + params.tvaPct / 100);
  return {
    charges: round(charges),
    revient: round(revient),
    revientM2: round(revientM2),
    venteHtM2: round(venteHtM2),
    totalHt: round(totalHt),
    totalTtc: round(totalTtc),
  };
}
