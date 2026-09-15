import AsyncStorage from '@react-native-async-storage/async-storage';

export type MaterialConfig = {
  hourlyRate: number;
  productivity: number;
};

const KEY = 'flywash_material_v1';
const DEFAULT_MATERIAL: MaterialConfig = { hourlyRate: 42, productivity: 25 };

export async function loadMaterial(): Promise<MaterialConfig> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_MATERIAL;
    return { ...DEFAULT_MATERIAL, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_MATERIAL;
  }
}

export async function saveMaterial(config: MaterialConfig) {
  await AsyncStorage.setItem(KEY, JSON.stringify(config));
}
