import type { VehicleItem } from './vehiclesStore';

export function computeVehicleMission(args: {
  vehicle: VehicleItem | null;
  distanceOneWayKm: number;
  visits: number;
  fuelPricePerL: number;
  workingDaysPerMonth?: number;
}) {
  const { vehicle, distanceOneWayKm, visits, fuelPricePerL } = args;
  const workingDaysPerMonth = args.workingDaysPerMonth || 16;

  const totalKm = Math.max(distanceOneWayKm, 0) * 2 * Math.max(visits, 0);

  if (!vehicle) {
    return {
      totalKm,
      totalFuelLiters: 0,
      fuelCost: 0,
      fixedAllocated: 0,
      totalVehicleCost: 0,
      modeLabel: '-',
    };
  }

  if (vehicle.type === 'particulier') {
    const totalVehicleCost = totalKm * vehicle.mileageAllowance;
    return {
      totalKm,
      totalFuelLiters: 0,
      fuelCost: 0,
      fixedAllocated: 0,
      totalVehicleCost,
      modeLabel: 'frais kilométrique',
    };
  }

  const totalFuelLiters = (totalKm / 100) * vehicle.litersPer100;
  const fuelCost = totalFuelLiters * fuelPricePerL;
  const fixedAllocated = workingDaysPerMonth > 0 ? vehicle.monthlyLease / workingDaysPerMonth : 0;
  const totalVehicleCost = fuelCost + fixedAllocated;

  return {
    totalKm,
    totalFuelLiters,
    fuelCost,
    fixedAllocated,
    totalVehicleCost,
    modeLabel: 'société',
  };
}
