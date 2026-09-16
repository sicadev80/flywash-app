import AsyncStorage from '@react-native-async-storage/async-storage';

// Store local (comme contactStore/companyStore) : pas de vrai système de
// paiement branché pour l'instant. On suit juste la date de départ de
// l'essai gratuit et, plus tard, l'offre choisie une fois le paiement en
// ligne disponible.

export type PlanId = 'trial' | 'pro' | 'multi-user';
export type ChosenPlan = 'pro' | 'multi-user';

export type SubscriptionState = {
  trialStartDate: string; // ISO, vide tant que l'essai n'a pas démarré
  chosenPlan: ChosenPlan | null; // null tant qu'on est en essai / indécis
};

const SUBSCRIPTION_KEY = 'flywash_subscription_v1';
export const TRIAL_DURATION_DAYS = 30;

export const DEFAULT_SUBSCRIPTION_STATE: SubscriptionState = {
  trialStartDate: '',
  chosenPlan: null,
};

export const PLAN_LABELS: Record<PlanId, string> = {
  trial: 'Essai gratuit',
  pro: 'Offre Pro',
  'multi-user': 'Offre Multi-utilisateurs',
};

function sanitizeSubscriptionState(raw: any): SubscriptionState {
  const chosenPlan: ChosenPlan | null =
    raw?.chosenPlan === 'pro' || raw?.chosenPlan === 'multi-user' ? raw.chosenPlan : null;

  return {
    trialStartDate: String(raw?.trialStartDate || ''),
    chosenPlan,
  };
}

export async function loadSubscriptionState(): Promise<SubscriptionState> {
  try {
    const raw = await AsyncStorage.getItem(SUBSCRIPTION_KEY);
    if (!raw) return DEFAULT_SUBSCRIPTION_STATE;
    return sanitizeSubscriptionState(JSON.parse(raw));
  } catch {
    return DEFAULT_SUBSCRIPTION_STATE;
  }
}

export async function saveSubscriptionState(state: SubscriptionState): Promise<void> {
  await AsyncStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(sanitizeSubscriptionState(state)));
}

/**
 * Démarre l'essai gratuit de 30 jours s'il ne l'est pas déjà — idempotent,
 * n'écrase jamais une date déjà enregistrée. À appeler à la fin de
 * l'onboarding, et en filet de sécurité à l'ouverture de l'écran d'offre
 * (pour les comptes déjà onboardés avant l'ajout de cette fonctionnalité).
 */
export async function ensureTrialStarted(): Promise<SubscriptionState> {
  const current = await loadSubscriptionState();
  if (current.trialStartDate) return current;
  const next: SubscriptionState = { ...current, trialStartDate: new Date().toISOString() };
  await saveSubscriptionState(next);
  return next;
}

export function getTrialDaysRemaining(state: SubscriptionState): number {
  if (!state.trialStartDate) return TRIAL_DURATION_DAYS;
  const start = new Date(state.trialStartDate).getTime();
  if (Number.isNaN(start)) return TRIAL_DURATION_DAYS;
  const elapsedDays = Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24));
  return Math.max(0, TRIAL_DURATION_DAYS - elapsedDays);
}

export function isTrialExpired(state: SubscriptionState): boolean {
  return getTrialDaysRemaining(state) <= 0;
}
