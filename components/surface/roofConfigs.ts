export type RoofConfigType =
  | 'straight-1-2'
  | 'straight-2-2'
  | 'straight-2-4'
  | 'l-shape'
  | 'u-shape';

export type RoofConfigItem = {
  type: RoofConfigType;
  title: string;
  subtitle: string;
  image?: any;
};

export const ROOF_CONFIGS: RoofConfigItem[] = [
  {
    type: 'straight-1-2',
    title: '2 pans',
    subtitle: 'Toiture simple à deux versants',
    image: require('../../assets/images/toitures/toiture_1_2_pans.png'),
  },
  {
    type: 'straight-2-2',
    title: '3 pans',
    subtitle: 'Toiture composée à 3 pans',
    image: require('../../assets/images/toitures/toiture_3_pans.png'),
  },
  {
    type: 'straight-2-4',
    title: '4 pans',
    subtitle: 'Toiture à 4 pans',
    image: require('../../assets/images/toitures/toiture_4_pans.png'),
  },
  {
    type: 'l-shape',
    title: 'Forme en L',
    subtitle: 'Toiture en L',
    image: require('../../assets/images/toitures/toiture_L_2_pans.png'),
  },
  {
    type: 'u-shape',
    title: 'Forme composée',
    subtitle: 'Toiture composée complexe',
    image: require('../../assets/images/toitures/toiture_L_mixte.png'),
  },
];

// compatibilité anciens imports
export const roofConfigs = ROOF_CONFIGS;
export default ROOF_CONFIGS;
