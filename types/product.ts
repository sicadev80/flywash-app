export type Product = {
  id: string;
  nom: string;
  fournisseur?: string | null;
  prix_ht_litre?: number | null;
  dilution?: number | null;
  rendement_m2_l?: number | null;
  type_action?: string | null;
  toiture?: boolean | null;
  facade?: boolean | null;
  bardage?: boolean | null;
  terrasse?: boolean | null;
};
