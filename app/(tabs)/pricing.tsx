import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import GlideScreen from '../../components/glide/GlideScreen';
import {
  loadFixedCostsConfig,
  loadFixedCostItems,
  getFixedCostPerHour,
  type FixedCostsConfig,
  type FixedCostItem,
} from '../../lib/fixedCostsStore';
import { loadProducts, type ProductItem } from '../../lib/productsStore';
import { loadVehicles, type VehicleItem } from '../../lib/vehiclesStore';
import {
  loadEquipment,
  type EquipmentItem,
  computeSelectedEquipmentCost,
} from '../../lib/equipmentStore';
import PricingProductsDilutionCard from '../../components/pricing/PricingProductsDilutionCard';
import { useProjectStore } from '../../lib/projectStore';
import { loadCompanyProfile } from '../../lib/companyStore';

type StepKey = 'mission' | 'trajet' | 'produits' | 'vente' | 'detail';

type ProductPayload = {
  treatment: string;
  productId: string;
  rendement: number;
  dilution: number;
  rinseEnabled: boolean;
  rinseRendement?: number;
  volumeMelange: number;
  produitPur: number;
  eau: number;
  coutProduit: number;
  rinseWater: number;
  effectiveTimeMultiplier: number;

  boosterEnabled?: boolean;
  boosterProductId?: string;
  boosterLabel?: string;
  boosterPercent?: number;
  boosterVolume?: number;
  boosterCost?: number;
};

const STEPS: { key: StepKey; label: string }[] = [
  { key: 'mission', label: 'Mission' },
  { key: 'trajet', label: 'Trajet' },
  { key: 'produits', label: 'Produits' },
  { key: 'vente', label: 'Vente' },
  { key: 'detail', label: 'Détail' },
];

const n = (v: string) => Number(String(v || '').replace(',', '.')) || 0;
const money = (v: number) => `${v.toFixed(2).replace('.', ',')} €`;
const qty = (v: number, unit = '') => `${v.toFixed(2).replace('.', ',')}${unit ? ` ${unit}` : ''}`;

function StepChip({
  active,
  done,
  label,
  onPress,
}: {
  active: boolean;
  done: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.stepChip, active && styles.stepChipActive, done && styles.stepChipDone]} onPress={onPress}>
      <Text style={[styles.stepChipText, active && styles.stepChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function ChoiceChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.choiceChip, active && styles.choiceChipActive]} onPress={onPress}>
      <Text style={[styles.choiceChipText, active && styles.choiceChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function SelectChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.selectChip, active && styles.selectChipActive]} onPress={onPress}>
      <Text style={[styles.selectChipText, active && styles.selectChipTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function ResultRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View style={styles.resultRow}>
      <Text style={[styles.resultLabel, strong && styles.resultStrong]}>{label}</Text>
      <Text style={[styles.resultValue, strong && styles.resultStrong]}>{value}</Text>
    </View>
  );
}

export default function PricingTunnelV3Screen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    projectId?: string;
    facadeNetM2?: string;
    roofM2?: string;
    totalM2?: string;
    surface?: string;
    type?: string;
    roofSurface?: string;
    facadeSurface?: string;
    terrainSurface?: string;
  }>();
  const prefillApplied = useRef(false);

  const projectId = typeof params.projectId === 'string' ? params.projectId : '';
  const isProjectMode = !!projectId;
  const projectFacade = Number(params.facadeNetM2 || 0);
  const projectRoof = Number(params.roofM2 || 0);
  const projectTotal = Number(params.totalM2 || 0);

  const project = useProjectStore((state) =>
    projectId ? state.getProjectById(projectId) : undefined
  );
  const updateProject = useProjectStore((state) => state.updateProject);
  const setProjectStatus = useProjectStore((state) => state.setProjectStatus);

  const [step, setStep] = useState<StepKey>('mission');

  const [clientName, setClientName] = useState('');
  const [address, setAddress] = useState('');

  const [hasRoof, setHasRoof] = useState(true);
  const [hasFacade, setHasFacade] = useState(false);

  const [roofSurface, setRoofSurface] = useState('');
  const [facadeSurface, setFacadeSurface] = useState('');

  const [roofMethod, setRoofMethod] = useState<'drone' | 'nettoyeur-haute-pression' | 'perche'>('drone');
  const [facadeMethod, setFacadeMethod] = useState<'drone' | 'nettoyeur-haute-pression' | 'perche'>('nettoyeur-haute-pression');

  const [estimatedHours, setEstimatedHours] = useState('4');

  const [distanceOneWayKm, setDistanceOneWayKm] = useState('15');
  const [passes, setPasses] = useState('1');
  const [tollCost, setTollCost] = useState('0');
  const [fuelPricePerL, setFuelPricePerL] = useState('1,85');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  const [roofProductsPayload, setRoofProductsPayload] = useState<ProductPayload | null>(null);
  const [facadeProductsPayload, setFacadeProductsPayload] = useState<ProductPayload | null>(null);

  const [marginPercent, setMarginPercent] = useState('30');
  const [vatPercent, setVatPercent] = useState('20');
  const [otherVariableCosts, setOtherVariableCosts] = useState('0');

  const [fixedCostItems, setFixedCostItems] = useState<FixedCostItem[]>([]);
  const [fixedCostsConfig, setFixedCostsConfig] = useState<FixedCostsConfig | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const [loadedItems, config, loadedProducts, loadedVehicles, loadedEquipment, company] = await Promise.all([
        loadFixedCostItems(),
        loadFixedCostsConfig(),
        loadProducts(),
        loadVehicles(),
        loadEquipment(),
        loadCompanyProfile(),
      ]);
      setFixedCostItems(loadedItems);
      setFixedCostsConfig(config);
      setProducts(loadedProducts);
      setVehicles(loadedVehicles);
      setSelectedVehicleId(loadedVehicles[0]?.id || '');
      setEquipment(loadedEquipment);

      if (project?.vatRate != null) {
        setVatPercent(String(project.vatRate));
      } else if (company.vatStatus === 'non-assujetti') {
        setVatPercent('0');
      } else {
        setVatPercent(String(company.defaultVatRate));
      }
    })();
  }, []);

  useEffect(() => {
    if (prefillApplied.current) return;

    if (isProjectMode && projectTotal > 0) {
      if (projectFacade > 0 && projectRoof > 0) {
        setHasRoof(true);
        setHasFacade(true);
        setRoofSurface(String(projectRoof).replace('.', ','));
        setFacadeSurface(String(projectFacade).replace('.', ','));
      } else if (projectFacade > 0) {
        setHasRoof(false);
        setHasFacade(true);
        setFacadeSurface(String(projectFacade).replace('.', ','));
      } else if (projectRoof > 0) {
        setHasRoof(true);
        setHasFacade(false);
        setRoofSurface(String(projectRoof).replace('.', ','));
      }

      prefillApplied.current = true;
      return;
    }

    const directRoof = typeof params.roofSurface === 'string' ? params.roofSurface : '';
    const directFacade = typeof params.facadeSurface === 'string' ? params.facadeSurface : '';
    const directTerrain = typeof params.terrainSurface === 'string' ? params.terrainSurface : '';
    const genericSurface = typeof params.surface === 'string' ? params.surface : '';
    const sourceType = typeof params.type === 'string' ? params.type.toLowerCase() : '';

    if (directFacade) {
      setHasRoof(false);
      setHasFacade(true);
      setFacadeSurface(String(directFacade).replace('.', ','));
      prefillApplied.current = true;
      return;
    }

    if (directRoof) {
      setHasRoof(true);
      setHasFacade(false);
      setRoofSurface(String(directRoof).replace('.', ','));
      prefillApplied.current = true;
      return;
    }

    if (directTerrain) {
      setHasRoof(true);
      setHasFacade(false);
      setRoofSurface(String(directTerrain).replace('.', ','));
      prefillApplied.current = true;
      return;
    }

    if (!genericSurface) return;

    if (sourceType.includes('facade') || sourceType.includes('façade')) {
      setHasRoof(false);
      setHasFacade(true);
      setFacadeSurface(String(genericSurface).replace('.', ','));
    } else {
      setHasRoof(true);
      setHasFacade(false);
      setRoofSurface(String(genericSurface).replace('.', ','));
    }

    prefillApplied.current = true;
  }, [params, isProjectMode, projectFacade, projectRoof, projectTotal]);

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === selectedVehicleId) || null,
    [vehicles, selectedVehicleId]
  );

  useEffect(() => {
    const ids: string[] = [];
    const normalizedRoofMethod = roofMethod === 'nettoyeur-haute-pression' ? 'karcher' : roofMethod;
    const normalizedFacadeMethod = facadeMethod === 'nettoyeur-haute-pression' ? 'karcher' : facadeMethod;

    if (hasRoof && n(roofSurface) > 0) {
      const eq = equipment.find((e: any) => e.category === normalizedRoofMethod);
      if (eq) ids.push(eq.id);
    }
    if (hasFacade && n(facadeSurface) > 0) {
      const eq = equipment.find((e: any) => e.category === normalizedFacadeMethod);
      if (eq && !ids.includes(eq.id)) ids.push(eq.id);
    }
    setSelectedEquipmentIds(ids);
  }, [equipment, hasRoof, hasFacade, roofSurface, facadeSurface, roofMethod, facadeMethod]);

  const totalSurface = (hasRoof ? n(roofSurface) : 0) + (hasFacade ? n(facadeSurface) : 0);

  const roofTimeMultiplier = roofProductsPayload?.effectiveTimeMultiplier || 1;
  const facadeTimeMultiplier = facadeProductsPayload?.effectiveTimeMultiplier || 1;

  const effectiveHours = useMemo(() => {
    const base = n(estimatedHours);
    if (hasRoof && hasFacade) return base * ((roofTimeMultiplier + facadeTimeMultiplier) / 2);
    if (hasRoof) return base * roofTimeMultiplier;
    if (hasFacade) return base * facadeTimeMultiplier;
    return base;
  }, [estimatedHours, hasRoof, hasFacade, roofTimeMultiplier, facadeTimeMultiplier]);

  const trip = useMemo(() => {
    const totalKm = n(distanceOneWayKm) * 2 * Math.max(1, n(passes));
    const travelTimeHours = totalKm / 60;

    if (!selectedVehicle) {
      return {
        totalKm,
        totalFuelLiters: 0,
        fuelCost: 0,
        leaseAllocated: 0,
        totalCost: n(tollCost),
        travelTimeHours,
      };
    }

    if ((selectedVehicle as any).type === 'particulier') {
      const ik = totalKm * ((selectedVehicle as any).mileageAllowance || 0);
      return {
        totalKm,
        totalFuelLiters: 0,
        fuelCost: 0,
        leaseAllocated: 0,
        totalCost: ik + n(tollCost),
        travelTimeHours,
      };
    }

    const totalFuelLiters = (totalKm * ((selectedVehicle as any).litersPer100 || 0)) / 100;
    const fuelCost = totalFuelLiters * n(fuelPricePerL);
    const leaseAllocated = ((selectedVehicle as any).monthlyLease || 0) / 16;

    return {
      totalKm,
      totalFuelLiters,
      fuelCost,
      leaseAllocated,
      totalCost: fuelCost + leaseAllocated + n(tollCost),
      travelTimeHours,
    };
  }, [selectedVehicle, distanceOneWayKm, passes, tollCost, fuelPricePerL]);

  const effectiveHoursWithTravel = effectiveHours + trip.travelTimeHours;

  const fixedHourly = useMemo(() => {
    if (!fixedCostsConfig) return 0;
    return getFixedCostPerHour(fixedCostItems, fixedCostsConfig);
  }, [fixedCostItems, fixedCostsConfig]);

  const fixedAllocated = fixedHourly * effectiveHoursWithTravel;

  const equipmentCost = useMemo(() => {
    return computeSelectedEquipmentCost(
      equipment,
      selectedEquipmentIds,
      effectiveHoursWithTravel,
      16,
      fixedCostsConfig?.productiveHoursPerDay || 7
    );
  }, [equipment, selectedEquipmentIds, effectiveHoursWithTravel, fixedCostsConfig]);

  const roofWaterTotal = (roofProductsPayload?.eau || 0) + (roofProductsPayload?.rinseWater || 0);
  const facadeWaterTotal = (facadeProductsPayload?.eau || 0) + (facadeProductsPayload?.rinseWater || 0);

  const productCostTotal =
    (hasRoof ? roofProductsPayload?.coutProduit || 0 : 0) +
    (hasFacade ? facadeProductsPayload?.coutProduit || 0 : 0);

  const variableTotal = productCostTotal + trip.totalCost + equipmentCost.total + n(otherVariableCosts);
  const costPrice = fixedAllocated + variableTotal;
  const margin = n(marginPercent);
  const saleHT = margin >= 100 ? costPrice : costPrice / (1 - margin / 100);
  const marginValue = saleHT - costPrice;
  const vatRate = n(vatPercent) / 100;
  const saleTTC = saleHT * (1 + vatRate);
  const htPerM2 = 
totalSurface > 0 ? saleHT / totalSurface : 0;
  const ttcPerM2 = totalSurface > 0 ? saleTTC / totalSurface : 0;

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  function goNext() {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next.key);
  }

  function goPrev() {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev.key);
  }

function handleValidatePricing() {
  if (!isProjectMode || !projectId) return;

  const roofProduct = products.find((item) => item.id === roofProductsPayload?.productId);
  const facadeProduct = products.find((item) => item.id === facadeProductsPayload?.productId);

  updateProject(projectId, {
    quoteAmount: saleHT,
    vatRate: n(vatPercent),
    pricePerM2Ht: htPerM2,
    hoursPerM2: totalSurface > 0 ? effectiveHours / totalSurface : 0,

    roofProductsSummary: hasRoof
      ? {
          productLabel: roofProduct?.name || roofProductsPayload?.treatment,
          treatment: roofProductsPayload?.treatment,
          volumeMelange: roofProductsPayload?.volumeMelange || 0,
          produitPur: roofProductsPayload?.produitPur || 0,
          eau: roofProductsPayload?.eau || 0,
          rinseWater: roofProductsPayload?.rinseWater || 0,
          coutProduit: roofProductsPayload?.coutProduit || 0,
          rinseEnabled: !!roofProductsPayload?.rinseEnabled,
          boosterVolume: roofProductsPayload?.boosterVolume || 0,
          boosterCost: roofProductsPayload?.boosterCost || 0,
          boosterPercent: roofProductsPayload?.boosterPercent || 0,
          boosterLabel: roofProductsPayload?.boosterLabel,
        }
      : null,

    facadeProductsSummary: hasFacade
      ? {
          productLabel: facadeProduct?.name || facadeProductsPayload?.treatment,
          treatment: facadeProductsPayload?.treatment,
          volumeMelange: facadeProductsPayload?.volumeMelange || 0,
          produitPur: facadeProductsPayload?.produitPur || 0,
          eau: facadeProductsPayload?.eau || 0,
          rinseWater: facadeProductsPayload?.rinseWater || 0,
          coutProduit: facadeProductsPayload?.coutProduit || 0,
          rinseEnabled: !!facadeProductsPayload?.rinseEnabled,
          boosterVolume: facadeProductsPayload?.boosterVolume || 0,
          boosterCost: facadeProductsPayload?.boosterCost || 0,
          boosterPercent: facadeProductsPayload?.boosterPercent || 0,
          boosterLabel: facadeProductsPayload?.boosterLabel, }
      : null,
  });

  setProjectStatus(projectId, 'quoted');

  router.replace({
    pathname: '/project-detail',
    params: { projectId },
  });
}

  return (
    <GlideScreen title="Calcul Prix">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isProjectMode && project ? (
          <View style={styles.projectCard}>
            <Text style={styles.projectTitle}>Chiffrage projet</Text>
            <Text style={styles.clientName}>{project.clientName}</Text>
            <Text style={styles.clientText}>{project.address}</Text>
            <Text style={styles.clientText}>
              {[project.postalCode, project.city].filter(Boolean).join(' ')}
            </Text>
          </View>
        ) : null}

        <View style={styles.stepRow}>
          {STEPS.map((item, index) => (
            <StepChip
              key={item.key}
              active={step === item.key}
              done={index < stepIndex}
              label={item.label}
              onPress={() => setStep(item.key)}
            />
          ))}
        </View>

        {step === 'mission' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Détails mission</Text>


            <Text style={styles.label}>Zones à traiter</Text>
            <View style={styles.wrap}>
              <ChoiceChip active={hasRoof} label="Toiture" onPress={() => setHasRoof((v) => !v || !hasFacade)} />
              <ChoiceChip active={hasFacade} label="Façade" onPress={() => setHasFacade((v) => !v || !hasRoof)} />
            </View>

            {hasRoof && (
              <>
                <Text style={styles.label}>Surface toiture (m²)</Text>
                <TextInput
                  style={styles.input}
                  value={roofSurface}
                  onChangeText={setRoofSurface}
                  placeholder="0"
                  placeholderTextColor="#91919A"
                  keyboardType="decimal-pad"
                />

                <Text style={styles.label}>Application toiture</Text>
                <View style={styles.wrap}>
                  <ChoiceChip active={roofMethod === 'drone'} label="Drone" onPress={() => setRoofMethod('drone')} />
                  <ChoiceChip
                    active={roofMethod === 'nettoyeur-haute-pression'}
                    label="Nettoyeur haute pression"
                    onPress={() => setRoofMethod('nettoyeur-haute-pression')}
                  />
                  <ChoiceChip
                    active={roofMethod === 'perche'}
                    label="Perche"
                    onPress={() => setRoofMethod('perche')}
                  />
                </View>
              </>
            )}

            {hasFacade && (
              <>
                <Text style={styles.label}>Surface façade (m²)</Text>
                <TextInput
                  style={styles.input}
                  value={facadeSurface}
                  onChangeText={setFacadeSurface}
                  placeholder="0"
                  placeholderTextColor="#91919A"
                  keyboardType="decimal-pad"
                />

                <Text style={styles.label}>Application façade</Text>
                <View style={styles.wrap}>
                  <ChoiceChip active={facadeMethod === 'drone'} label="Drone" onPress={() => setFacadeMethod('drone')} />
                  <ChoiceChip
                    active={facadeMethod === 'nettoyeur-haute-pression'}
                    label="Nettoyeur haute pression"
                    onPress={() => setFacadeMethod('nettoyeur-haute-pression')}
                  />
                  <ChoiceChip active={facadeMethod === 'perche'} label="Perche" onPress={() => setFacadeMethod('perche')} />
                </View>
              </>
            )}

            <Text style={styles.label}>Temps chantier estimé (h)</Text>
            <TextInput
              style={styles.input}
              value={estimatedHours}
              onChangeText={setEstimatedHours}
              placeholder="0"
              placeholderTextColor="#91919A"
              keyboardType="decimal-pad"
            />

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>Surface totale : {qty(totalSurface, 'm²')}</Text>
            </View>
          </View>
        )}

        {step === 'trajet' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Le trajet</Text>

            <Text style={styles.label}>Distance chantier (km aller simple)</Text>
            <TextInput
              style={styles.input}
              value={distanceOneWayKm}
              onChangeText={setDistanceOneWayKm}
              placeholder="0"
              placeholderTextColor="#91919A"
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Nombre de passages (1 passage = 1 aller-retour)</Text>
            <TextInput
              style={styles.input}
              value={passes}
              onChangeText={setPasses}
              placeholder="1"
              placeholderTextColor="#91919A"
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Véhicule utilisé</Text>
            <View style={styles.selectWrap}>
              {vehicles.map((item) => (
                <SelectChip
                  key={item.id}
                  active={selectedVehicleId === item.id}
                  label={(item as any).label || (item as any).name || 'Véhicule'}
                  onPress={() => setSelectedVehicleId(item.id)}
                />
              ))}
            </View>

            <Text style={styles.label}>Péage / autoroute (€ TTC)</Text>
            <TextInput
              style={styles.input}
              value={tollCost}
              onChangeText={setTollCost}
              placeholder="0"
              placeholderTextColor="#91919A"
              keyboardType="decimal-pad"
            />

            {(selectedVehicle as any)?.type === 'societe' ? (
              <>
                <Text style={styles.label}>Prix carburant (€ TTC / litre)</Text>
                <TextInput
                  style={styles.input}
                  value={fuelPricePerL}
                  onChangeText={setFuelPricePerL}
                  placeholder="0"
                  placeholderTextColor="#91919A"
                  keyboardType="decimal-pad"
                />
              </>
            ) : (
              <Text style={styles.helper}>Véhicule particulier : calcul via indemnités kilométriques.</Text>
            )}

            <View style={styles.resultBox}>
              <ResultRow label="Kilométrage total" value={qty(trip.totalKm, 'km')} />
              <ResultRow label="Temps de route estimé" value={qty(trip.travelTimeHours, 'h')} />
              {(selectedVehicle as any)?.type === 'societe' ? (
                <>
                  <ResultRow label="Carburant" value={money(trip.fuelCost)} />
                  <ResultRow label="Location / leasing affecté" value={money(trip.leaseAllocated)} />
                </>
              ) : null}
              <ResultRow label="Coût trajet" value={money(trip.totalCost)} strong />
            </View>
          </View>
        )}

        {step === 'produits' && (
          <View style={styles.column}>
            {hasRoof ? (
              <PricingProductsDilutionCard
                title="Produits toiture"
                surface={n(roofSurface)}
                products={products.map((p: any) => ({
                  id: p.id,
                  name: p.name,
                  treatment: p.treatment,
                  pricePerLitre: p.pricePerL ?? p.pricePerLiter ?? 0,
                  defaultRendement: p.defaultRendement ?? 0,
                  defaultDilution: p.defaultDilution ?? 0,
                  defaultRinseRendement: p.defaultRinseRendement,
                }))}
                onChange={setRoofProductsPayload}
              />
            ) : null}

            {hasFacade ? (
              <PricingProductsDilutionCard
                title="Produits façade"
                surface={n(facadeSurface)}
                products={products.map((p: any) => ({
                  id: p.id,
                  name: p.name,
                  treatment: p.treatment,
                  pricePerLitre: p.pricePerL ?? p.pricePerLiter ?? 0,
                  defaultRendement: p.defaultRendement ?? 0,
                  defaultDilution: p.defaultDilution ?? 0,
                  defaultRinseRendement: p.defaultRinseRendement,
                }))}
                onChange={setFacadeProductsPayload}
              />
            ) : null}
          </View>
        )}

        {step === 'vente' && (
          <View style={styles.column}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Prix de revient</Text>

              <Text style={styles.label}>Autres frais variables (€)</Text>
              <TextInput
                style={styles.input}
                value={otherVariableCosts}
                onChangeText={setOtherVariableCosts}
                placeholder="0"
                placeholderTextColor="#91919A"
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Marge souhaitée (%)</Text>
              <TextInput
                style={styles.input}
                value={marginPercent}
                onChangeText={setMarginPercent}
                placeholder="0"
                placeholderTextColor="#91919A"
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>TVA (%)</Text>
              <TextInput
                style={styles.input}
                value={vatPercent}
                onChangeText={setVatPercent}
                placeholder="20"
                placeholderTextColor="#91919A"
                keyboardType="decimal-pad"
              />

              <View style={styles.resultBox}>
                <ResultRow label="Temps chantier" value={qty(effectiveHours, 'h')} />
                <ResultRow label="Temps route" value={qty(trip.travelTimeHours, 'h')} />
                <ResultRow label="Temps total retenu" value={qty(effectiveHoursWithTravel, 'h')} strong />
                <ResultRow label="Charges fixes affectées" value={money(fixedAllocated)} />
                <ResultRow label="Matériel" value={money(equipmentCost.total)} />
                <ResultRow label="Produits" value={money(productCostTotal)} />
                <ResultRow label="Déplacement" value={money(trip.totalCost)} />
                <ResultRow label="Autres variables" value={money(n(otherVariableCosts))} />
                <ResultRow label="Prix de revient HT" value={money(costPrice)} strong />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Prix de vente</Text>
              <View style={styles.saleBox}>
                <ResultRow label="Marge valeur" value={money(marginValue)} />
                <ResultRow label="Prix de vente HT" value={money(saleHT)} strong />
                <ResultRow label="Prix de vente TTC" value={money(saleTTC)} strong />
                <ResultRow label="HT / m²" value={money(htPerM2)} />
                <ResultRow label="TTC / m²" value={money(ttcPerM2)} />
              </View>
            </View>
          </View>
        )}

        {step === 'detail' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Résumé mission</Text>
            <View style={styles.resultBox}>
              <ResultRow label="Façades" value={qty(projectFacade, 'm²')}  strong />
              <ResultRow label="Toitures" value={qty(projectRoof, 'm²')} strong />
              <ResultRow label="Surface totale" value={qty(totalSurface, 'm²')} />
              <ResultRow label="Temps chantier" value={qty(effectiveHours, 'h')} />
              <ResultRow label="Temps route" value={qty(trip.travelTimeHours, 'h')} />
              <ResultRow label="Temps total" value={qty(effectiveHoursWithTravel, 'h')} />
            </View>

            <Text style={styles.sectionTitle}>Résumé matériel</Text>
            <View style={styles.resultBox}>
              <ResultRow
                label="Matériel utilisé"
                value={equipmentCost.selected.length ? equipmentCost.selected.map((e: any) => e.label).join(', ') : '-'}
              />
              <ResultRow label="Coût matériel" value={money(equipmentCost.total)} />
            </View>

            <Text style={styles.sectionTitle}>Résumé trajet</Text>
            <View style={styles.resultBox}>
              <ResultRow label="Véhicule" value={(selectedVehicle as any)?.label || '-'} />
              <ResultRow label="Total kilométrage" value={qty(trip.totalKm, 'km')} />
              <ResultRow label="Temps de route" value={qty(trip.travelTimeHours, 'h')} />
              <ResultRow label="Total trajet" value={money(trip.totalCost)} />
            </View>

            <Text style={styles.sectionTitle}>Résumé produits</Text>
            <View style={styles.resultBox}>
              {hasRoof ? (
                <>
                  <ResultRow label="Toiture · mélange" value={qty(roofProductsPayload?.volumeMelange || 0, 'L')} />
                  <ResultRow label="Toiture · produit pur" value={qty(roofProductsPayload?.produitPur || 0, 'L')} />
                  <ResultRow label="Toiture · eau totale" value={qty(roofWaterTotal, 'L')} />
                  <ResultRow label="Toiture · rinçage" value={roofProductsPayload?.rinseEnabled ? 'Oui' : 'Non'} />
{roofProductsPayload?.boosterEnabled ? (
  <>
    <ResultRow
      label="Toiture · booster"
      value={products.find((p) => p.id === roofProductsPayload.boosterProductId)?.name || '-'}
    />
    <ResultRow
      label="Toiture · % booster"
      value={qty(roofProductsPayload.boosterPercent || 0, '%')}
    />
    <ResultRow
      label="Toiture · volume booster"
      value={qty(roofProductsPayload.boosterVolume || 0, 'L')}
    />
    <ResultRow
      label="Toiture · coût booster"
      value={money(roofProductsPayload.boosterCost || 0)}
    />
  </>
) : null}
                </>
              ) : null}
              {hasFacade ? (
                <>
                  <ResultRow label="Façade · mélange" value={qty(facadeProductsPayload?.volumeMelange || 0, 'L')} />
                  <ResultRow label="Façade · produit pur" value={qty(facadeProductsPayload?.produitPur || 0, 'L')} />
                  <ResultRow label="Façade · eau totale" value={qty(facadeWaterTotal, 'L')} />
                  <ResultRow label="Façade · rinçage" value={facadeProductsPayload?.rinseEnabled ? 'Oui' : 'Non'} />
{facadeProductsPayload?.boosterEnabled ? (
  <>
    <ResultRow
      label="Façade · booster"
      value={products.find((p) => p.id === facadeProductsPayload.boosterProductId)?.name || '-'}
    />
    <ResultRow
      label="Façade · % booster"
      value={qty(facadeProductsPayload.boosterPercent || 0, '%')}
    />
    <ResultRow
      label="Façade · volume booster"
      value={qty(facadeProductsPayload.boosterVolume || 0, 'L')}
    />
    <ResultRow
      label="Façade · coût booster"
      value={money(facadeProductsPayload.boosterCost || 0)}
    />
  </>
) : null}
                </>
              ) : null}
              <ResultRow label="Total produit HT" value={money(productCostTotal)} strong />
            </View>

            <Text style={styles.sectionTitle}>Résumé vente</Text>
            <View style={styles.saleBox}>
              <ResultRow label="Prix de revient HT" value={money(costPrice)} />
              <ResultRow label="Prix de vente HT" value={money(saleHT)} strong />
              <ResultRow label="Prix de vente TTC" value={money(saleTTC)} strong />
              <ResultRow label="HT / m²" value={money(htPerM2)} />
              <ResultRow label="TTC / m²" value={money(ttcPerM2)} />
            </View>
          </View>
        )}

        <View style={styles.footerCard}>
          <View style={styles.footerActions}>
            <Pressable
              style={[styles.button, styles.secondaryButton, stepIndex === 0 && styles.buttonDisabled]}
              onPress={goPrev}
              disabled={stepIndex === 0}
            >
              <Text style={styles.secondaryButtonText}>Retour</Text>
            </Pressable>

           {step !== 'detail' ? (
  <Pressable style={[styles.button, styles.primaryButton]} onPress={goNext}>
    <Text style={styles.primaryButtonText}>
      {step === 'vente' ? 'Voir détail' : 'Étape suivante'}
    </Text>
  </Pressable>
) : (
  <Pressable
    style={[styles.button, styles.primaryButton]}
    onPress={isProjectMode ? handleValidatePricing : () => setStep('mission')}
  >
    <Text style={styles.primaryButtonText}>
      {isProjectMode ? 'Valider le chiffrage' : 'Recommencer'}
    </Text>
  </Pressable>
)}

          </View>
        </View>
      </ScrollView>
    </GlideScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  projectCard: {
    backgroundColor: '#EFE8DB',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2D7C3',
    padding: 18,
    gap: 4,
  },
  projectTitle: { color: '#17171C', fontSize: 18, fontWeight: '800' },
  clientName: { color: '#17171C', fontSize: 16, fontWeight: '900' },
  clientText: { color: '#5A5A5E', fontSize: 14 },

  column: { gap: 14 },
  stepRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  stepChip: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#DCDCE2',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  stepChipActive: { borderColor: '#D4AF37', backgroundColor: '#F8F1DB' },
  stepChipDone: { borderColor: '#E7CF86' },
  stepChipText: { color: '#17171C', fontSize: 13, fontWeight: '800' },
  stepChipTextActive: { color: '#B38918' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4E4E8',
    padding: 18,
    gap: 10,
  },
  cardTitle: { color: '#17171C', fontSize: 18, fontWeight: '800' },
  sectionTitle: { color: '#B38918', fontSize: 16, fontWeight: '800', marginTop: 2 },
  label: { color: '#17171C', fontSize: 14, fontWeight: '700', marginTop: 2 },
  input: {
    minHeight: 46,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DCDCE2',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#17171C',
  },
  helper: { color: '#74747D', fontSize: 13 },
  wrap: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  selectWrap: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  choiceChip: {
    minHeight: 38,
    borderRadius: 999,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCDCE2',
    backgroundColor: '#FFFFFF',
  },
  choiceChipActive: { backgroundColor: '#F8F1DB', borderColor: '#D4AF37' },
  choiceChipText: { color: '#17171C', fontWeight: '800', fontSize: 13 },
  choiceChipTextActive: { color: '#B38918' },
  selectChip: {
    minHeight: 40,
    borderRadius: 14,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCDCE2',
    backgroundColor: '#FFFFFF',
    maxWidth: '100%',
  },
  selectChipActive: { borderColor: '#D4AF37', backgroundColor: '#F8F1DB' },
  selectChipText: { color: '#17171C', fontWeight: '700', fontSize: 13 },
  selectChipTextActive: { color: '#B38918' },
  infoBox: {
    minHeight: 42,
    borderRadius: 16,
    backgroundColor: '#FFF8E8',
    borderWidth: 1,
    borderColor: '#E7CF86',
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginTop: 4,
  },
  infoText: { color: '#B38918', fontWeight: '800', fontSize: 13 },
  resultBox: {
    backgroundColor: '#FAFAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4E4E8',
    padding: 12,
    gap: 2,
  },
  saleBox: {
    backgroundColor: '#FFF8E8',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E7CF86',
    padding: 12,
    gap: 2,
  },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center', paddingVertical: 5 },
  resultLabel: { color: '#17171C', fontSize: 14, flex: 1 },
  resultValue: { color: '#17171C', fontSize: 15, fontWeight: '700' },
  resultStrong: { color: '#B38918', fontWeight: '900' },
  footerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4E4E8',
    padding: 14,
  },
  footerActions: { flexDirection: 'row', gap: 12 },
  button: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  primaryButton: { backgroundColor: '#D4AF37' },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    backgroundColor: '#FFFFFF',
  },
  buttonDisabled: { opacity: 0.45 },
  primaryButtonText: { color: '#111111', fontWeight: '900', fontSize: 16 },
  secondaryButtonText: { color: '#B38918', fontWeight: '800', fontSize: 16 },
});
