import AsyncStorage from '@react-native-async-storage/async-storage';

export type ChargesConfig = {
  structuralPercent: number;
};

const KEY = 'flywash_charges_v1';
const DEFAULT_CHARGES: ChargesConfig = { structuralPercent: 18 };

export async function loadCharges(): Promise<ChargesConfig> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_CHARGES;
    return { ...DEFAULT_CHARGES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CHARGES;
  }
}

export async function saveCharges(config: ChargesConfig) {
  await AsyncStorage.setItem(KEY, JSON.stringify(config));
}
