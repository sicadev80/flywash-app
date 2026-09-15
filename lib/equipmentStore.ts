import AsyncStorage from '@react-native-async-storage/async-storage';

export type EquipmentCategory = 'drone' | 'perche' | 'karcher' | 'autre';
export type EquipmentPricingMode = 'achat';

export type EquipmentItem = {
  id: string;
  category: EquipmentCategory;
  label: string;
  pricingMode: EquipmentPricingMode;
  purchasePrice: number;
  amortizationMonths: number;
  monthlyMaintenance: number;
};

const KEY = 'flywash_equipment_v2';

const DEFAULT_EQUIPMENT: EquipmentItem[] = [
  { id: 'eq-1', category: 'drone', label: 'Matrice 300', pricingMode: 'achat', purchasePrice: 16566.68, amortizationMonths: 36, monthlyMaintenance: 60 },
  { id: 'eq-2', category: 'perche', label: 'Perche Bekky', pricingMode: 'achat', purchasePrice: 1800, amortizationMonths: 36, monthlyMaintenance: 15 },
];

function sanitizeEquipment(raw: any, index: number): EquipmentItem {
  const category: EquipmentCategory = ['drone', 'perche', 'karcher', 'autre'].includes(raw?.category)
    ? raw.category
    : 'autre';
  return {
    id: String(raw?.id || `eq-${index + 1}`),
    category,
    label: String(raw?.label || 'Matériel'),
    pricingMode: 'achat',
    purchasePrice: Math.max(0, Number(raw?.purchasePrice) || 0),
    amortizationMonths: Math.max(1, Number(raw?.amortizationMonths) || 1),
    monthlyMaintenance: Math.max(0, Number(raw?.monthlyMaintenance) || 0),
  };
}

export async function loadEquipment(): Promise<EquipmentItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_EQUIPMENT;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_EQUIPMENT;
    return parsed.map(sanitizeEquipment);
  } catch {
    return DEFAULT_EQUIPMENT;
  }
}

export async function saveEquipment(items: EquipmentItem[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(items.map(sanitizeEquipment)));
}

export function getEquipmentMonthlyCost(item: EquipmentItem) {
  const amortized = item.amortizationMonths > 0 ? item.purchasePrice / item.amortizationMonths : 0;
  return amortized + item.monthlyMaintenance;
}

export function getEquipmentDailyCost(item: EquipmentItem, workingDaysPerMonth = 16) {
  return workingDaysPerMonth > 0 ? getEquipmentMonthlyCost(item) / workingDaysPerMonth : 0;
}

export function getEquipmentHourlyCost(item: EquipmentItem, workingDaysPerMonth = 16, productiveHoursPerDay = 7) {
  const daily = getEquipmentDailyCost(item, workingDaysPerMonth);
  return productiveHoursPerDay > 0 ? daily / productiveHoursPerDay : 0;
}

export function computeSelectedEquipmentCost(
  items: EquipmentItem[],
  selectedIds: string[],
  durationHours: number,
  workingDaysPerMonth = 16,
  productiveHoursPerDay = 7
) {
  const selected = items.filter((i) => selectedIds.includes(i.id));
  const hourly = selected.reduce((sum, item) => sum + getEquipmentHourlyCost(item, workingDaysPerMonth, productiveHoursPerDay), 0);
  return { selected, hourly, total: hourly * Math.max(0, durationHours) };
}
