export type PricingParams = {
  productPricePerL: number;
  consumptionPerM2: number;
  boosterPercent: number;
  hourlyRate: number;
  productivity: number;
  vehicleCostPerJob: number;
  structuralPercent: number;
  marginPercent: number;
};

function safeDiv(a: number, b: number) {
  if (!b) return 0;
  return a / b;
}

export function computePrice(surface: number, params: PricingParams) {
  const productLiters = surface * params.consumptionPerM2;
  const boosterLiters = productLiters * (params.boosterPercent / 100);
  const totalMixLiters = productLiters + boosterLiters;
  const material = totalMixLiters * params.productPricePerL;
  const labor = safeDiv(params.hourlyRate, params.productivity) * surface;
  const vehicle = params.vehicleCostPerJob;
  const subtotal = material + labor + vehicle;
  const structural = subtotal * (params.structuralPercent / 100);
  const totalCost = subtotal + structural;
  const sellingPrice = totalCost / (1 - params.marginPercent / 100);
  const pricePerM2 = safeDiv(sellingPrice, surface);

  return { surface, productLiters, boosterLiters, totalMixLiters, material, labor, vehicle, structural, totalCost, sellingPrice, pricePerM2 };
}
