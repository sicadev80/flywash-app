export const products = [
  { id: '1', nom: 'ECO MOUSSE 30L', fournisseur: 'FlyWash', type: 'Action lente', rendement: 4, dilution: 5, prixHtLitre: 6.8, surfaces: ['Toiture', 'Façade'] },
  { id: '2', nom: 'TYDRONE AQ', fournisseur: 'FlyWash', type: 'Choc', rendement: 6, dilution: 8, prixHtLitre: 8.5, surfaces: ['Toiture', 'Terrasse'] },
  { id: '3', nom: 'BOOST ACTIVE', fournisseur: 'FlyWash', type: 'Boost', rendement: 8, dilution: 10, prixHtLitre: 11.2, surfaces: ['Toiture', 'Bardage'] },
];

export const equipments = [
  { id: 'e1', label: 'DJI Matrice 300', coutHoraire: 42, batteries: 6 },
  { id: 'e2', label: 'Drone pulvérisation XAG', coutHoraire: 55, batteries: 4 },
];

export const vehicles = [
  { id: 'v1', label: 'Nissan X-Trail', carburant: 'Diesel', conso: 7.4 },
  { id: 'v2', label: 'Renault Trafic', carburant: 'Diesel', conso: 8.9 },
];

export const charges = [
  { id: 'c1', label: 'Assurance', montantMois: 490 },
  { id: 'c2', label: 'Banque', montantMois: 45 },
  { id: 'c3', label: 'Expert comptable', montantMois: 180 },
  { id: 'c4', label: 'Logiciels', montantMois: 78 },
];

export const missions = [
  { id: 'm1', client: 'SAS Martin', date: '2026-03-20', surface: 2500, type: 'Toiture', totalTtc: 6420 },
  { id: 'm2', client: 'SCI Bellevue', date: '2026-03-24', surface: 820, type: 'Façade', totalTtc: 2140 },
];

export const providers = [
  { id: 'p1', societe: 'FlyWash Provence', departement: '13', slogan: 'Toitures & façades par drone' },
  { id: 'p2', societe: 'Drone Clean Ouest', departement: '44', slogan: 'Traitement rapide sur grandes surfaces' },
];
