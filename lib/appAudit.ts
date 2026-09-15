import { loadFixedCostItems, loadFixedCostsConfig } from './fixedCostsStore';
import { loadProducts } from './productsStore';
import { loadVehicles } from './vehiclesStore';
import { loadEquipment } from './equipmentStore';
import { loadQuickPresets } from './quickPresetsStore';

export type AuditLine = {
  level: 'ok' | 'warning';
  label: string;
  detail: string;
};

export async function runAppAudit(): Promise<AuditLine[]> {
  const [products, vehicles, equipment, fixedItems, fixedConfig, presets] = await Promise.all([
    loadProducts(),
    loadVehicles(),
    loadEquipment(),
    loadFixedCostItems(),
    loadFixedCostsConfig(),
    loadQuickPresets(),
  ]);

  const lines: AuditLine[] = [];

  const mainProducts = products.filter((p) => !p.isBooster);
  const boosters = products.filter((p) => p.isBooster);

  lines.push({
    level: mainProducts.length ? 'ok' : 'warning',
    label: 'Produits principaux',
    detail: mainProducts.length ? `${mainProducts.length} produit(s) principal(aux)` : 'Aucun produit principal enregistré',
  });

  lines.push({
    level: boosters.length ? 'ok' : 'warning',
    label: 'Boosters',
    detail: boosters.length ? `${boosters.length} booster(s)` : 'Aucun booster enregistré',
  });

  lines.push({
    level: vehicles.length ? 'ok' : 'warning',
    label: 'Véhicules',
    detail: vehicles.length ? `${vehicles.length} véhicule(s)` : 'Aucun véhicule enregistré',
  });

  lines.push({
    level: equipment.length ? 'ok' : 'warning',
    label: 'Matériel',
    detail: equipment.length ? `${equipment.length} matériel(s)` : 'Aucun matériel enregistré',
  });

  lines.push({
    level: fixedItems.length ? 'ok' : 'warning',
    label: 'Charges fixes',
    detail: fixedItems.length ? `${fixedItems.length} charge(s)` : 'Aucune charge fixe enregistrée',
  });

  lines.push({
    level: presets.length ? 'ok' : 'warning',
    label: 'Presets chantier',
    detail: presets.length ? `${presets.length} preset(s)` : 'Aucun preset métier enregistré',
  });

  lines.push({
    level: fixedConfig.workingDaysPerYear > 0 ? 'ok' : 'warning',
    label: 'Jours travaillés/an',
    detail: `${fixedConfig.workingDaysPerYear} jour(s)`,
  });

  lines.push({
    level: fixedConfig.productiveHoursPerDay > 0 ? 'ok' : 'warning',
    label: 'Heures productives/jour',
    detail: `${fixedConfig.productiveHoursPerDay} heure(s)`,
  });

  return lines;
}
