import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProductApplication =
  | 'toiture'
  | 'facade'
  | 'bardage'
  | 'panneaux-solaires'
  | 'vitre'
  | 'multi-usages';

export type ProductTreatment =
  | 'choc'
  | 'action-lente'
  | 'entretien'
  | 'curatif'
  | 'degraissant'
  | 'booster';

export type ProductContainerPreset =
  | '1'
  | '5'
  | '10'
  | '20'
  | '25'
  | '30'
  | 'manual';

export type ProductItem = {
  id: string;
  supplier: string;
  name: string;
  applications: ProductApplication[];
  treatment: ProductTreatment;
  containerPreset: ProductContainerPreset;
  manualContainerLiters: number;
  purchasePrice: number;
  pricePerL: number;
};

const KEY = 'flywash_products_v3';

const DEFAULT_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    supplier: 'Standard',
    name: 'DESTRUCTOR',
    applications: ['toiture', 'facade'],
    treatment: 'choc',
    containerPreset: '20',
    manualContainerLiters: 0,
    purchasePrice: 110,
    pricePerL: 5.5,
  },
  {
    id: 'prod-2',
    supplier: 'Standard',
    name: 'BOOSTER MAX',
    applications: ['multi-usages'],
    treatment: 'booster',
    containerPreset: '5',
    manualContainerLiters: 0,
    purchasePrice: 85,
    pricePerL: 17,
  },
];

export function resolveContainerLiters(
  containerPreset: ProductContainerPreset,
  manualContainerLiters: number
) {
  if (containerPreset === 'manual') return Math.max(0, manualContainerLiters || 0);
  return Math.max(0, Number(containerPreset) || 0);
}

export function computePricePerL(
  purchasePrice: number,
  containerPreset: ProductContainerPreset,
  manualContainerLiters: number
) {
  const liters = resolveContainerLiters(containerPreset, manualContainerLiters);
  return liters > 0 ? Math.max(0, purchasePrice) / liters : 0;
}

function normalizeApplications(rawApps: any): ProductApplication[] {
  const allowed: ProductApplication[] = [
    'toiture',
    'facade',
    'bardage',
    'panneaux-solaires',
    'vitre',
    'multi-usages',
  ];

  if (Array.isArray(rawApps)) {
    const cleaned = rawApps.filter((v) => allowed.includes(v));
    if (cleaned.length) return Array.from(new Set(cleaned));
  }

  if (typeof rawApps === 'string' && allowed.includes(rawApps as ProductApplication)) {
    return [rawApps as ProductApplication];
  }

  return ['multi-usages'];
}

function sanitizeProduct(raw: any, index: number): ProductItem {
  const containerPreset: ProductContainerPreset = ['1', '5', '10', '20', '25', '30', 'manual'].includes(raw?.containerPreset)
    ? raw.containerPreset
    : '20';

  const purchasePrice = Math.max(0, Number(raw?.purchasePrice) || 0);
  const manualContainerLiters = Math.max(0, Number(raw?.manualContainerLiters) || 0);

  return {
    id: String(raw?.id || `prod-${index + 1}`),
    supplier: String(raw?.supplier || ''),
    name: String(raw?.name || 'Produit'),
    applications: normalizeApplications(raw?.applications ?? raw?.application),
    treatment: raw?.treatment || 'entretien',
    containerPreset,
    manualContainerLiters,
    purchasePrice,
    pricePerL: computePricePerL(purchasePrice, containerPreset, manualContainerLiters),
  };
}

export async function loadProducts(): Promise<ProductItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_PRODUCTS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_PRODUCTS;
    return parsed.map(sanitizeProduct);
  } catch {
    return DEFAULT_PRODUCTS;
  }
}

export async function saveProducts(items: ProductItem[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(items.map(sanitizeProduct)));
}

export function getBoosterProducts(items: ProductItem[]) {
  return items.filter((i) => i.treatment === 'booster');
}

export function getMainProducts(items: ProductItem[]) {
  return items.filter((i) => i.treatment !== 'booster');
}
