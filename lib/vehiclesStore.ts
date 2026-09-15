import AsyncStorage from '@react-native-async-storage/async-storage';

export type VehicleType = 'societe' | 'particulier';

export type VehicleItem = {
  id: string;
  label: string;
  type: VehicleType;
  monthlyLease: number;
  litersPer100: number;
  mileageAllowance: number;
};

const KEY = 'flywash_vehicles_v3_metier';

const DEFAULT_VEHICLES: VehicleItem[] = [
  { id: 'veh-1', label: 'Peugeot Expert', type: 'societe', monthlyLease: 390, litersPer100: 7.5, mileageAllowance: 0 },
  { id: 'veh-2', label: 'Véhicule personnel', type: 'particulier', monthlyLease: 0, litersPer100: 0, mileageAllowance: 0.65 },
];

function sanitizeVehicle(raw: any, index: number): VehicleItem {
  const type: VehicleType = raw?.type === 'particulier' ? 'particulier' : 'societe';
  return {
    id: String(raw?.id || `veh-${index + 1}`),
    label: String(raw?.label || 'Véhicule'),
    type,
    monthlyLease: type === 'societe' ? Math.max(0, Number(raw?.monthlyLease) || 0) : 0,
    litersPer100: type === 'societe' ? Math.max(0, Number(raw?.litersPer100) || 0) : 0,
    mileageAllowance: type === 'particulier' ? Math.max(0, Number(raw?.mileageAllowance) || 0) : 0,
  };
}

export async function loadVehicles(): Promise<VehicleItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_VEHICLES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_VEHICLES;
    return parsed.map(sanitizeVehicle);
  } catch {
    return DEFAULT_VEHICLES;
  }
}

export async function saveVehicles(items: VehicleItem[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(items.map(sanitizeVehicle)));
}
