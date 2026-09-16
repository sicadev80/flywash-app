import AsyncStorage from '@react-native-async-storage/async-storage';

export type LegalStatus =
  | 'auto-entrepreneur'
  | 'EI'
  | 'EURL'
  | 'SASU'
  | 'SARL'
  | 'SAS'
  | 'autre';

export type VatStatus = 'non-assujetti' | 'assujetti';

export type CompanyProfile = {
  legalStatus: LegalStatus;
  legalStatusOther: string;
  companyName: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  siret: string;
  rcs: string;
  vatStatus: VatStatus;
  vatNumber: string;
  defaultVatRate: number;
  devisValidityDays: number;
  devisPrefix: string;
  nextDevisNumber: number;
};

const PROFILE_KEY = 'flywash_company_profile_v1';

export const LEGAL_STATUS_LABELS: Record<LegalStatus, string> = {
  'auto-entrepreneur': 'Auto-entrepreneur / Micro-entreprise',
  EI: 'Entreprise individuelle (EI)',
  EURL: 'EURL',
  SASU: 'SASU',
  SARL: 'SARL',
  SAS: 'SAS',
  autre: 'Autre',
};

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  legalStatus: 'auto-entrepreneur',
  legalStatusOther: '',
  companyName: '',
  address: '',
  postalCode: '',
  city: '',
  phone: '',
  email: '',
  siret: '',
  rcs: '',
  vatStatus: 'non-assujetti',
  vatNumber: '',
  defaultVatRate: 20,
  devisValidityDays: 30,
  devisPrefix: 'DEV',
  nextDevisNumber: 1,
};

function sanitizeProfile(raw: any): CompanyProfile {
  const legalStatuses: LegalStatus[] = [
    'auto-entrepreneur',
    'EI',
    'EURL',
    'SASU',
    'SARL',
    'SAS',
    'autre',
  ];

  return {
    legalStatus: legalStatuses.includes(raw?.legalStatus)
      ? raw.legalStatus
      : DEFAULT_COMPANY_PROFILE.legalStatus,
    legalStatusOther: String(raw?.legalStatusOther || ''),
    companyName: String(raw?.companyName || ''),
    address: String(raw?.address || ''),
    postalCode: String(raw?.postalCode || ''),
    city: String(raw?.city || ''),
    phone: String(raw?.phone || ''),
    email: String(raw?.email || ''),
    siret: String(raw?.siret || ''),
    rcs: String(raw?.rcs || ''),
    vatStatus: raw?.vatStatus === 'assujetti' ? 'assujetti' : 'non-assujetti',
    vatNumber: String(raw?.vatNumber || ''),
    defaultVatRate: Math.max(0, Number(raw?.defaultVatRate) || 0),
    devisValidityDays: Math.max(1, Number(raw?.devisValidityDays) || DEFAULT_COMPANY_PROFILE.devisValidityDays),
    devisPrefix: String(raw?.devisPrefix || DEFAULT_COMPANY_PROFILE.devisPrefix),
    nextDevisNumber: Math.max(1, Number(raw?.nextDevisNumber) || 1),
  };
}

export async function loadCompanyProfile(): Promise<CompanyProfile> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_COMPANY_PROFILE;
    return sanitizeProfile(JSON.parse(raw));
  } catch {
    return DEFAULT_COMPANY_PROFILE;
  }
}

export async function saveCompanyProfile(profile: CompanyProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(sanitizeProfile(profile)));
}

/**
 * Réserve et retourne le prochain numéro de devis (ex: "DEV-2026-014"),
 * en incrémentant le compteur persistant. À appeler une seule fois par
 * devis, au moment de sa première génération.
 */
export async function reserveNextDevisNumber(): Promise<string> {
  const profile = await loadCompanyProfile();
  const year = new Date().getFullYear();
  const formatted = `${profile.devisPrefix}-${year}-${String(profile.nextDevisNumber).padStart(3, '0')}`;

  await saveCompanyProfile({
    ...profile,
    nextDevisNumber: profile.nextDevisNumber + 1,
  });

  return formatted;
}
