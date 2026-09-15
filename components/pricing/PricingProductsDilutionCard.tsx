import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { computeDilutionNeed } from '../../lib/pricingProductDilution';

export type PricingProductOption = {
  id: string;
  name: string;
  treatment: 'choc' | 'action-lente' | 'degraissant' | string;
  pricePerLitre: number;
  defaultRendement?: number;
  defaultDilution?: number;
  defaultRinseRendement?: number;
};

type Props = {
  title: string;
  surface: number;
  onChange?: (payload: {
    treatment: string;
    productId: string;
    rendement: number;
    dilution: number;
    rinseEnabled: boolean;
    rinseRendement: number;
    volumeMelange: number;
    produitPur: number;
    eau: number;
    coutProduit: number;
    rinseWater: number;
    effectiveTimeMultiplier: number;
  }) => void;
  products: PricingProductOption[];
};

const n = (v: string) => Number(String(v || '').replace(',', '.')) || 0;
const fmt = (v: number, unit = '') => `${v.toFixed(2).replace('.', ',')}${unit ? ` ${unit}` : ''}`;
const money = (v: number) => `${v.toFixed(2).replace('.', ',')} €`;

function Chip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function PricingProductsDilutionCard({ title, surface, products, onChange }: Props) {
  const [treatment, setTreatment] = useState<'choc' | 'action-lente' | 'degraissant'>('choc');
  const [productId, setProductId] = useState('');
  const [treatmentMenuOpen, setTreatmentMenuOpen] = useState(false);
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const [rendement, setRendement] = useState('5');
  const [dilution, setDilution] = useState('4');
  const [rinseEnabled, setRinseEnabled] = useState(false);
  const [rinseMode, setRinseMode] = useState<'auto' | 'manual'>('auto');
  const [rinseRendement, setRinseRendement] = useState('3');
  const lastAutoProductId = useRef<string>('');
  const [boosterEnabled, setBoosterEnabled] = useState(false);
  const [boosterProductId, setBoosterProductId] = useState('');
  const [boosterPercent, setBoosterPercent] = useState('5');
  const filteredProducts = useMemo(
    () => products.filter((p) => p.treatment === treatment),
    [products, treatment]
  );
  
  const boosterProducts = useMemo(
  () =>
    products.filter(
      (p) =>
        p.name?.toLowerCase().includes('booster') ||
        p.treatment?.toLowerCase().includes('booster')
    ),
  [products]
);
  
  const selectedProduct = useMemo(
    () => filteredProducts.find((p) => p.id === productId) || null,
    [filteredProducts, productId]
  );

  function getAutoRinseRendement(product?: PricingProductOption | null) {
    const baseRendement = product?.defaultRendement ?? n(rendement) ?? 5;
    const autoRinse = product?.defaultRinseRendement ?? Math.max(baseRendement / 2, 1);
    return String(autoRinse).replace('.', ',');
  }

  function activateAutoRinse(product?: PricingProductOption | null) {
    setRinseMode('auto');
    setRinseRendement(getAutoRinseRendement(product));
  }

  useEffect(() => {
    if (filteredProducts.length === 0) {
      if (productId !== '') setProductId('');
      return;
    }

    const stillExists = filteredProducts.some((p) => p.id === productId);
    const next = stillExists ? filteredProducts.find((p) => p.id === productId)! : filteredProducts[0];

    if (next.id !== productId) {
      setProductId(next.id);
    }

    if (!stillExists || lastAutoProductId.current !== next.id) {
      const nextRendement = String(next.defaultRendement ?? 5).replace('.', ',');
      const nextDilution = String(next.defaultDilution ?? 4).replace('.', ',');
      setRendement((prev) => (prev === nextRendement ? prev : nextRendement));
      setDilution((prev) => (prev === nextDilution ? prev : nextDilution));
      if (rinseMode === 'auto') {
        setRinseRendement((prev) => {
          const val = getAutoRinseRendement(next);
          return prev === val ? prev : val;
        });
      }
      lastAutoProductId.current = next.id;
    }
  }, [filteredProducts, productId, rinseMode])

  const result = useMemo(() => {
    return computeDilutionNeed({
      surface,
      rendementM2PerLitreMelange: n(rendement),
      dilutionWaterPer1LProduct: n(dilution),
      pricePerLitreProduct: selectedProduct?.pricePerLitre || 0,
      rinseEnabled,
      rinseTimeMultiplier: 2,
      rinseRendementM2PerLitreWater: rinseEnabled ? n(rinseRendement) : 0,
    });
}, [
  surface,
  rendement,
  dilution,
  selectedProduct?.id,
  selectedProduct?.pricePerLitre,
  rinseEnabled,
  rinseRendement,
]);

const boosterItem = boosterProducts.find((p) => p.id === boosterProductId);
const boosterRate = n(boosterPercent);

const boosterVolume = boosterEnabled ? (result.volumeMelange * boosterRate) / 100 : 0;
const boosterCost = boosterEnabled ? boosterVolume * (boosterItem?.pricePerLitre || 0) : 0;
const totalCuveAvecBooster = result.volumeMelange + boosterVolume;

  const payload = useMemo(
  () => ({
    treatment,
    productId,
    rendement: n(rendement),
    dilution: n(dilution),
    rinseEnabled,
    rinseRendement: n(rinseRendement),
    ...result,
    coutProduit: result.coutProduit + boosterCost,
    boosterLabel: boosterItem?.name,
    boosterEnabled,
    boosterProductId,
    boosterPercent: boosterRate,
    boosterVolume,
    boosterCost,
  }),
  [
    treatment,
    productId,
    rendement,
    dilution,
    rinseEnabled,
    rinseRendement,
    result.volumeMelange,
    result.produitPur,
    result.eau,
    result.coutProduit,
    result.rinseWater,
    result.effectiveTimeMultiplier,
    boosterEnabled,
    boosterProductId,
    boosterRate,
    boosterVolume,
    boosterCost,
  ]
);

useEffect(() => {
  onChange?.(payload);
}, [payload, onChange]);

  function selectProduct(item: PricingProductOption) {
    setProductId(item.id);
    const nextRendement = String(item.defaultRendement ?? 5).replace('.', ',');
    const nextDilution = String(item.defaultDilution ?? 4).replace('.', ',');
    setRendement(nextRendement);
    setDilution(nextDilution);
    if (rinseMode === 'auto') {
      setRinseRendement(getAutoRinseRendement(item));
    }
    lastAutoProductId.current = item.id;
  }
useEffect(() => {
  if (!filteredProducts.length) {
    setProductId('');
    return;
  }

  const stillExists = filteredProducts.some((item) => item.id === productId);

  if (!stillExists) {
    const first = filteredProducts[0];
    if (first) {
      selectProduct(first);
    }
  }
}, [treatment, filteredProducts]);


  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

<Text style={styles.label}>Type de traitement</Text>

<Pressable
  style={styles.dropdownButton}
  onPress={() => {
    setTreatmentMenuOpen((v) => !v);
    setProductMenuOpen(false);
  }}
>
  <Text style={styles.dropdownButtonText}>
    {treatment === 'choc'
      ? 'Choc'
      : treatment === 'action-lente'
      ? 'Action lente'
      : treatment === 'degraissant'
      ? 'Dégraissant'
      : 'Choisir un traitement'}
  </Text>
</Pressable>

{treatmentMenuOpen ? (
  <View style={styles.dropdownMenu}>
    <Pressable
      style={styles.dropdownItem}
      onPress={() => {
        setTreatment('choc');
        setTreatmentMenuOpen(false);
      }}
    >
      <Text style={styles.dropdownItemText}>Choc</Text>
    </Pressable>

    <Pressable
      style={styles.dropdownItem}
      onPress={() => {
        setTreatment('action-lente');
        setTreatmentMenuOpen(false);
      }}
    >
      <Text style={styles.dropdownItemText}>Action lente</Text>
    </Pressable>

    <Pressable
      style={styles.dropdownItem}
      onPress={() => {
        setTreatment('degraissant');
        setTreatmentMenuOpen(false);
      }}
    >
      <Text style={styles.dropdownItemText}>Dégraissant</Text>
    </Pressable>
  </View>
) : null}

<Text style={styles.label}>Produit</Text>

<Pressable
  style={styles.dropdownButton}
  onPress={() => {
    setProductMenuOpen((v) => !v);
    setTreatmentMenuOpen(false);
  }}
>
  <Text style={styles.dropdownButtonText}>
    {selectedProduct?.name || 'Choisir un produit'}
  </Text>
</Pressable>

{productMenuOpen ? (
  <View style={styles.dropdownMenu}>
    {filteredProducts.length ? (
      filteredProducts.map((item) => (
        <Pressable
          key={item.id}
          style={styles.dropdownItem}
          onPress={() => {
            selectProduct(item);
            setProductMenuOpen(false);
          }}
        >
          <Text style={styles.dropdownItemText}>{item.name}</Text>
        </Pressable>
      ))
    ) : (
      <Text style={styles.helper}>Aucun produit pour ce traitement.</Text>
    )}
  </View>
) : null}

{!filteredProducts.length ? (
  <Text style={styles.helper}>Aucun produit pour ce traitement.</Text>
) : null}

        <Text style={styles.label}>Ajouter booster</Text>
      <View style={styles.wrap}>
           <Chip active={!boosterEnabled} label="Non" onPress={() => setBoosterEnabled(false)} />
           <Chip active={boosterEnabled} label="Oui" onPress={() => setBoosterEnabled(true)} />
      </View>

{boosterEnabled && (
  <>
    <Text style={styles.label}>Booster</Text>
    <View style={styles.wrap}>
      {boosterProducts.length ? (
        boosterProducts.map((item) => (
          <Chip
            key={item.id}
            active={boosterProductId === item.id}
            label={item.name}
            onPress={() => setBoosterProductId(item.id)}
          />
        ))
      ) : (
        <Text style={styles.helper}>Aucun booster disponible.</Text>
      )}
    </View>

    <Text style={styles.label}>% booster</Text>
    <TextInput
      style={styles.input}
      value={boosterPercent}
      onChangeText={setBoosterPercent}
      keyboardType="decimal-pad"
      placeholder="5"
      placeholderTextColor="#91919A"
    />
  </>
)}

      <Text style={styles.label}>Rendement traitement (m² / litre de mélange)</Text>
      <TextInput
        style={styles.input}
        value={rendement}
        onChangeText={setRendement}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor="#91919A"
      />

      <Text style={styles.label}>Dilution pour 1 L de produit pur</Text>
      <TextInput
        style={styles.input}
        value={dilution}
        onChangeText={setDilution}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor="#91919A"
      />
      <Text style={styles.helper}>Exemple : 1 L produit + 4 L eau</Text>

      <Text style={styles.label}>Rinçage</Text>
      <View style={styles.wrap}>
        <Chip active={!rinseEnabled} label="Non" onPress={() => setRinseEnabled(false)} />
        <Chip active={rinseEnabled} label="Oui" onPress={() => setRinseEnabled(true)} />
      </View>

      {rinseEnabled ? (
        <>
          <Text style={styles.label}>Rendement rinçage (m² / litre d’eau)</Text>
          <View style={styles.wrap}>
            <Chip active={rinseMode === 'auto'} label="Auto" onPress={() => activateAutoRinse(selectedProduct)} />
            <Chip active={rinseMode === 'manual'} label="Saisie manuelle" onPress={() => setRinseMode('manual')} />
          </View>
          <TextInput
            style={styles.input}
            value={rinseRendement}
            onChangeText={(v) => {
              setRinseMode('manual');
              setRinseRendement(v);
            }}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#91919A"
          />
          <Text style={styles.helper}>
            Le rinçage est souvent plus abondant. Tu peux garder la valeur auto ou saisir ton rendement réel.
          </Text>
        </>
      ) : null}

      <View style={styles.resultBox}>
        <Text style={styles.resultLine}>Surface : {fmt(surface, 'm²')}</Text>
        <Text style={styles.resultLine}>Produit pur : {fmt(result.produitPur, 'L')}</Text>
        <Text style={styles.resultLine}>Eau traitement : {fmt(result.eau, 'L')}</Text>        
        <Text style={styles.resultLine}>Mélange traitement : {fmt(result.volumeMelange, 'L')}</Text>
        <Text style={styles.resultLine}>Booster : {fmt(boosterVolume || 0, 'L')}</Text>
        <Text style={styles.resultLine}>Volume total cuve : {fmt(totalCuveAvecBooster, 'L')}</Text>
        {rinseEnabled ? <Text style={styles.resultLine}>Eau rinçage : {fmt(result.rinseWater, 'L')}</Text> : null}
        <Text style={styles.resultStrong}>Coût produit : {money(result.coutProduit + boosterCost)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4E4E8',
    padding: 18,
    gap: 10,
  },
  title: { color: '#17171C', fontSize: 18, fontWeight: '800' },
  label: { color: '#17171C', fontSize: 14, fontWeight: '700', marginTop: 2 },
  input: {
    minHeight: 46,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DCDCE2',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    color: '#17171C',
    fontSize: 16,
  },
dropdownButton: {
  minHeight: 48,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#DCDCE2',
  backgroundColor: '#FFFFFF',
  justifyContent: 'center',
  paddingHorizontal: 14,
},

dropdownButtonText: {
  color: '#17171C',
  fontSize: 16,
  fontWeight: '600',
},

dropdownMenu: {
  marginTop: 8,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#DCDCE2',
  backgroundColor: '#FFFFFF',
  overflow: 'hidden',
},

dropdownItem: {
  minHeight: 46,
  justifyContent: 'center',
  paddingHorizontal: 14,
  borderBottomWidth: 1,
  borderBottomColor: '#EFEFF3',
},

dropdownItemText: {
  color: '#17171C',
  fontSize: 15,
  fontWeight: '600',
},

  wrap: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    minHeight: 38,
    borderRadius: 999,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCDCE2',
    backgroundColor: '#FFFFFF',
  },
  chipActive: { backgroundColor: '#F8F1DB', borderColor: '#D4AF37' },
  chipText: { color: '#17171C', fontWeight: '800', fontSize: 13 },
  chipTextActive: { color: '#B38918' },
  helper: { color: '#74747D', fontSize: 13 },
  resultBox: {
    marginTop: 6,
    backgroundColor: '#FFF8E8',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E7CF86',
    padding: 12,
    gap: 4,
  },
  resultLine: { color: '#17171C', fontSize: 14, fontWeight: '700' },
  resultStrong: { color: '#B38918', fontSize: 16, fontWeight: '900' },
});
