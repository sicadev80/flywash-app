import AsyncStorage from '@react-native-async-storage/async-storage';

// Ce store est volontairement local (AsyncStorage) pour le moment : pas de
// vrai compte / mot de passe tant que Supabase n'est pas branché. Les noms de
// champs sont choisis pour correspondre directement à une future table
// "profiles" Supabase (civility, first_name, last_name, birth_date, email,
// phone, role_in_company), afin que la migration soit une simple recopie
// champ à champ le moment venu.

export type Civility = 'M' | 'Mme';

export type ContactProfile = {
  civility: Civility;
  firstName: string;
  lastName: string;
  birthDate: string; // format libre saisi par l'utilisateur, ex "JJ/MM/AAAA"
  email: string;
  phone: string;
  roleInCompany: string;
};

const CONTACT_KEY = 'flywash_contact_profile_v1';

export const DEFAULT_CONTACT_PROFILE: ContactProfile = {
  civility: 'M',
  firstName: '',
  lastName: '',
  birthDate: '',
  email: '',
  phone: '',
  roleInCompany: '',
};

function sanitizeContactProfile(raw: any): ContactProfile {
  const civilities: Civility[] = ['M', 'Mme'];

  return {
    civility: civilities.includes(raw?.civility) ? raw.civility : DEFAULT_CONTACT_PROFILE.civility,
    firstName: String(raw?.firstName || ''),
    lastName: String(raw?.lastName || ''),
    birthDate: String(raw?.birthDate || ''),
    email: String(raw?.email || ''),
    phone: String(raw?.phone || ''),
    roleInCompany: String(raw?.roleInCompany || ''),
  };
}

export async function loadContactProfile(): Promise<ContactProfile> {
  try {
    const raw = await AsyncStorage.getItem(CONTACT_KEY);
    if (!raw) return DEFAULT_CONTACT_PROFILE;
    return sanitizeContactProfile(JSON.parse(raw));
  } catch {
    return DEFAULT_CONTACT_PROFILE;
  }
}

export async function saveContactProfile(profile: ContactProfile): Promise<void> {
  await AsyncStorage.setItem(CONTACT_KEY, JSON.stringify(sanitizeContactProfile(profile)));
}

/**
 * Un profil de contact est considéré comme "complet" dès que les infos
 * minimales pour identifier la personne sont là. Le reste (civilité, date de
 * naissance, téléphone, fonction) reste facultatif pour ne pas ralentir le
 * premier lancement.
 */
export function isContactProfileComplete(profile: ContactProfile): boolean {
  return !!profile.firstName.trim() && !!profile.lastName.trim() && !!profile.email.trim();
}
