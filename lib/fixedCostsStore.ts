import AsyncStorage from '@react-native-async-storage/async-storage';

export type FixedCostPeriod = 'monthly' | 'yearly';

export type FixedCostItem = {
  id: string;
  label: string;
  amount: number;
  period: FixedCostPeriod;
};

export type FixedCostsConfig = {
  workingDaysPerYear: number;
  productiveHoursPerDay: number;
};

const ITEMS_KEY = 'flywash_fixed_cost_items_v2';
const CONFIG_KEY = 'flywash_fixed_cost_config_v2';

const DEFAULT_ITEMS: FixedCostItem[] = [
  { id: 'fc-1', label: 'Comptable', amount: 180, period: 'monthly' },
  { id: 'fc-2', label: 'Assurance RC Pro', amount: 1200, period: 'yearly' },
  { id: 'fc-3', label: 'Téléphone', amount: 35, period: 'monthly' },
];

const DEFAULT_CONFIG: FixedCostsConfig = {
  workingDaysPerYear: 180,
  productiveHoursPerDay: 7,
};

function sanitizeItem(raw: any, index: number): FixedCostItem {
  return {
    id: String(raw?.id || `fc-${index + 1}`),
    label: String(raw?.label || 'Charge'),
    amount: Math.max(0, Number(raw?.amount) || 0),
    period: raw?.period === 'yearly' ? 'yearly' : 'monthly',
  };
}

export async function loadFixedCostItems(): Promise<FixedCostItem[]> {
  try {
    const raw = await AsyncStorage.getItem(ITEMS_KEY);
    if (!raw) return DEFAULT_ITEMS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_ITEMS;
    return parsed.map(sanitizeItem);
  } catch {
    return DEFAULT_ITEMS;
  }
}

export async function saveFixedCostItems(items: FixedCostItem[]) {
  await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(items.map(sanitizeItem)));
}

export async function loadFixedCostsConfig(): Promise<FixedCostsConfig> {
  try {
    const raw = await AsyncStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      workingDaysPerYear: Math.max(1, Number(parsed?.workingDaysPerYear) || DEFAULT_CONFIG.workingDaysPerYear),
      productiveHoursPerDay: Math.max(1, Number(parsed?.productiveHoursPerDay) || DEFAULT_CONFIG.productiveHoursPerDay),
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveFixedCostsConfig(config: FixedCostsConfig) {
  await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify({
    workingDaysPerYear: Math.max(1, Number(config.workingDaysPerYear) || DEFAULT_CONFIG.workingDaysPerYear),
    productiveHoursPerDay: Math.max(1, Number(config.productiveHoursPerDay) || DEFAULT_CONFIG.productiveHoursPerDay),
  }));
}

export function getYearlyFixedCosts(items: FixedCostItem[]) {
  return items.reduce((sum, item) => sum + (item.period === 'monthly' ? item.amount * 12 : item.amount), 0);
}

export function getMonthlyFixedCosts(items: FixedCostItem[]) {
  return getYearlyFixedCosts(items) / 12;
}

export function getFixedCostPerDay(items: FixedCostItem[], config: FixedCostsConfig) {
  return config.workingDaysPerYear > 0 ? getYearlyFixedCosts(items) / config.workingDaysPerYear : 0;
}

export function getFixedCostPerHour(items: FixedCostItem[], config: FixedCostsConfig) {
  const daily = getFixedCostPerDay(items, config);
  return config.productiveHoursPerDay > 0 ? daily / config.productiveHoursPerDay : 0;
}
