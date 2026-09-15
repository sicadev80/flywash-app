import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PRICING_PARAMS } from './pricingDefaults';
import type { PricingParams } from './pricingEngine';

const KEY = 'flywash_pricing_params_v2';

export async function loadPricingParams(): Promise<PricingParams> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_PRICING_PARAMS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PRICING_PARAMS,
      ...parsed,
    };
  } catch {
    return DEFAULT_PRICING_PARAMS;
  }
}

export async function savePricingParams(params: PricingParams) {
  await AsyncStorage.setItem(KEY, JSON.stringify(params));
}

export async function resetPricingParams() {
  await AsyncStorage.removeItem(KEY);
}
