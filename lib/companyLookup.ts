export type CompanySearchResult = {
  siren: string;
  siret: string;
  name: string;
  address: string;
  postalCode: string;
  city: string;
};

/**
 * Recherche d'entreprises françaises via l'API publique et gratuite de
 * l'État (recherche-entreprises.api.gouv.fr) — aucune clé requise,
 * données officielles INSEE/RNE.
 */
export async function searchCompanies(
  query: string,
  postalCode?: string
): Promise<CompanySearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const params = new URLSearchParams({ q: trimmed, per_page: '8' });
  if (postalCode?.trim()) {
    params.set('code_postal', postalCode.trim());
  }

  const response = await fetch(
    `https://recherche-entreprises.api.gouv.fr/search?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error('Recherche indisponible pour le moment.');
  }

  const data = await response.json();
  const results = Array.isArray(data?.results) ? data.results : [];

  return results
    .map((item: any): CompanySearchResult => {
      const siege = item?.siege || {};
      const streetParts = [siege.numero_voie, siege.type_voie, siege.libelle_voie].filter(
        (part: unknown) => !!part
      );

      return {
        siren: String(item?.siren || ''),
        siret: String(siege?.siret || item?.siret || ''),
        name: String(item?.nom_complet || item?.nom_raison_sociale || trimmed),
        address: streetParts.join(' '),
        postalCode: String(siege?.code_postal || ''),
        city: String(siege?.libelle_commune || ''),
      };
    })
    .filter((result: CompanySearchResult) => !!result.siret);
}

/**
 * Calcule le numéro de TVA intracommunautaire français à partir du SIREN,
 * via la formule officielle de clé de contrôle. Aucun appel réseau requis.
 */
export function computeVatNumberFromSiren(siren: string): string {
  const digits = siren.replace(/\D/g, '');
  if (digits.length !== 9) return '';

  const sirenNum = parseInt(digits, 10);
  const key = (12 + 3 * (sirenNum % 97)) % 97;

  return `FR${String(key).padStart(2, '0')}${digits}`;
}
