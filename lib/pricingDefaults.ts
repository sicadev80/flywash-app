import type { PricingParams } from './pricingEngine';

export const DEFAULT_PRICING_PARAMS: PricingParams = {
  productPricePerL: 4.5,
  consumptionPerM2: 0.12,
  boosterPercent: 10,
  hourlyRate: 42,
  productivity: 25,
  vehicleCostPerJob: 18,
  structuralPercent: 18,
  marginPercent: 30,
};
