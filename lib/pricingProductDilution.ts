export type DilutionProductInput = {
  surface: number;
  rendementM2PerLitreMelange: number;
  dilutionWaterPer1LProduct: number;
  pricePerLitreProduct: number;
  rinseEnabled?: boolean;
  rinseTimeMultiplier?: number;
  rinseRendementM2PerLitreWater?: number;
};

export type DilutionProductResult = {
  volumeMelange: number;
  produitPur: number;
  eau: number;
  coutProduit: number;
  rinseWater: number;
  effectiveTimeMultiplier: number;
  rinseRendementUsed: number;
};

export function computeDilutionNeed(input: DilutionProductInput): DilutionProductResult {
  const surface = Math.max(0, input.surface || 0);
  const rendement = Math.max(0, input.rendementM2PerLitreMelange || 0);
  const dilution = Math.max(0, input.dilutionWaterPer1LProduct || 0);
  const pricePerLitre = Math.max(0, input.pricePerLitreProduct || 0);
  const rinseEnabled = !!input.rinseEnabled;
  const rinseTimeMultiplier = Math.max(1, input.rinseTimeMultiplier || 2);
  const rinseRendement = Math.max(0, input.rinseRendementM2PerLitreWater || 0);

  if (surface <= 0 || rendement <= 0) {
    return {
      volumeMelange: 0,
      produitPur: 0,
      eau: 0,
      coutProduit: 0,
      rinseWater: 0,
      effectiveTimeMultiplier: rinseEnabled ? rinseTimeMultiplier : 1,
      rinseRendementUsed: rinseRendement,
    };
  }

  const volumeMelange = surface / rendement;
  const produitPur = volumeMelange / (1 + dilution);
  const eau = Math.max(0, volumeMelange - produitPur);
  const coutProduit = produitPur * pricePerLitre;

  let rinseWater = 0;
  if (rinseEnabled) {
    rinseWater = rinseRendement > 0 ? surface / rinseRendement : volumeMelange;
  }

  return {
    volumeMelange,
    produitPur,
    eau,
    coutProduit,
    rinseWater,
    effectiveTimeMultiplier: rinseEnabled ? rinseTimeMultiplier : 1,
    rinseRendementUsed: rinseRendement,
  };
}
