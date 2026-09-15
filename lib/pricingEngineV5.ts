import { getEquipmentMonthlyCost, type EquipmentItem } from './equipmentStore';
import { getVehicleCostPerKm, getVehicleFixedMonthlyCost, type VehicleItem } from './vehiclesStore';
import type { FixedCostsConfig } from './fixedCostsStore';
import type { ProductItem } from './productsStore';

export function yearlyFixedCosts(config: FixedCostsConfig) {
  return config.periodType === 'yearly'
    ? config.fixedChargesAmount
    : config.fixedChargesAmount * 12;
}

export function fixedCostPerDay(config: FixedCostsConfig) {
  return config.operatingDaysPerYear > 0
    ? yearlyFixedCosts(config) / config.operatingDaysPerYear
    : 0;
}

export function fixedCostPerHour(config: FixedCostsConfig) {
  const daily = fixedCostPerDay(config);
  return config.productiveHoursPerDay > 0 ? daily / config.productiveHoursPerDay : 0;
}

export function vehicleCostForJob(vehicle: VehicleItem | null, distanceKm: number, config: FixedCostsConfig) {
  if (!vehicle) return { fuelCost: 0, fixedAllocated: 0, total: 0 };
  const fuelCost = getVehicleCostPerKm(vehicle) * distanceKm;
  const monthlyFixed = getVehicleFixedMonthlyCost(vehicle);
  const yearlyFixed = monthlyFixed * 12;
  const fixedAllocated = config.operatingDaysPerYear > 0 ? yearlyFixed / config.operatingDaysPerYear : 0;
  return {
    fuelCost,
    fixedAllocated,
    total: fuelCost + fixedAllocated,
  };
}

export function equipmentCostForJob(
  equipment: EquipmentItem[],
  durationHours: number,
  config: FixedCostsConfig
) {
  const monthly = equipment.reduce((sum, item) => sum + getEquipmentMonthlyCost(item), 0);
  const yearly = monthly * 12;
  const daily = config.operatingDaysPerYear > 0 ? yearly / config.operatingDaysPerYear : 0;
  const hourly = config.productiveHoursPerDay > 0 ? daily / config.productiveHoursPerDay : 0;
  return {
    monthly,
    daily,
    hourly,
    total: hourly * durationHours,
  };
}

export function productCostForJob(product: ProductItem | null, surface: number, consumptionPerM2: number) {
  if (!product) {
    return { liters: 0, boosterLiters: 0, mixLiters: 0, total: 0 };
  }
  const liters = surface * consumptionPerM2;
  const boosterLiters = liters * (product.boosterPercent / 100);
  const mixLiters = liters + boosterLiters;
  const total = mixLiters * product.pricePerL;
  return { liters, boosterLiters, mixLiters, total };
}

export function computePricingV5(args: {
  fixedCosts: FixedCostsConfig;
  product: ProductItem | null;
  vehicle: VehicleItem | null;
  equipment: EquipmentItem[];
  surface: number;
  durationHours: number;
  distanceKm: number;
  consumptionPerM2: number;
  otherVariableCosts: number;
  marginPercent: number;
}) {
  const fixedHourly = fixedCostPerHour(args.fixedCosts);
  const fixedAllocated = fixedHourly * args.durationHours;

  const product = productCostForJob(args.product, args.surface, args.consumptionPerM2);
  const vehicle = vehicleCostForJob(args.vehicle, args.distanceKm, args.fixedCosts);
  const equipment = equipmentCostForJob(args.equipment, args.durationHours, args.fixedCosts);

  const variableTotal = product.total + vehicle.total + equipment.total + args.otherVariableCosts;
  const totalCost = fixedAllocated + variableTotal;
  const sellingPrice =
    args.marginPercent >= 100 ? totalCost : totalCost / (1 - args.marginPercent / 100);
  const pricePerM2 = args.surface > 0 ? sellingPrice / args.surface : 0;

  return {
    fixedHourly,
    fixedAllocated,
    product,
    vehicle,
    equipment,
    otherVariableCosts: args.otherVariableCosts,
    variableTotal,
    totalCost,
    sellingPrice,
    pricePerM2,
  };
}
