import AsyncStorage from '@react-native-async-storage/async-storage';

export type QuickPreset = {
  id: string;
  label: string;
  prestationType: string;
  suggestedEquipmentCategory: string;
  defaultConsumptionPerM2: number;
  defaultYieldM2PerHour: number;
};

const KEY = 'flywash_quick_presets_v2';

const DEFAULT_PRESETS: QuickPreset[] = [
  { id: 'preset-1', label: 'Toiture standard', prestationType: 'Toiture', suggestedEquipmentCategory: 'drone', defaultConsumptionPerM2: 0.12, defaultYieldM2PerHour: 80 },
  { id: 'preset-2', label: 'Façade classique', prestationType: 'Façade', suggestedEquipmentCategory: 'perche', defaultConsumptionPerM2: 0.08, defaultYieldM2PerHour: 50 },
  { id: 'preset-3', label: 'Panneaux solaires', prestationType: 'Panneaux', suggestedEquipmentCategory: 'perche', defaultConsumptionPerM2: 0.04, defaultYieldM2PerHour: 90 },
];

function sanitizePreset(raw: any, index: number): QuickPreset {
  return {
    id: String(raw?.id || `preset-${index + 1}`),
    label: String(raw?.label || 'Preset'),
    prestationType: String(raw?.prestationType || 'Prestation'),
    suggestedEquipmentCategory: String(raw?.suggestedEquipmentCategory || 'autre'),
    defaultConsumptionPerM2: Math.max(0, Number(raw?.defaultConsumptionPerM2) || 0),
    defaultYieldM2PerHour: Math.max(1, Number(raw?.defaultYieldM2PerHour) || 1),
  };
}

export async function loadQuickPresets(): Promise<QuickPreset[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_PRESETS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_PRESETS;
    return parsed.map(sanitizePreset);
  } catch {
    return DEFAULT_PRESETS;
  }
}

export async function saveQuickPresets(items: QuickPreset[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(items.map(sanitizePreset)));
}
