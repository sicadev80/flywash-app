import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import GlideScreen from '../../components/glide/GlideScreen';
import GlideCard from '../../components/glide/GlideCard';

const n = (v: string) => Number(String(v || '').replace(',', '.')) || 0;
const fmt = (v: number, d = 2) => v.toFixed(d).replace('.', ',');

export default function DilutionScreen() {
  const [surface, setSurface] = useState('');
  const [rendement, setRendement] = useState('5'); // m² par litre de mélange
  const [dilutionWaterPer1LProduct, setDilutionWaterPer1LProduct] = useState('4'); // 1L produit + X L eau
  const [useBooster, setUseBooster] = useState(false);
  const [boosterPercent, setBoosterPercent] = useState('5'); // % du volume final
  const [tankCapacity, setTankCapacity] = useState('80');

  const result = useMemo(() => {
    const s = n(surface);
    const r = n(rendement);
    const w = n(dilutionWaterPer1LProduct);
    const cap = n(tankCapacity);
    const boosterPct = useBooster ? n(boosterPercent) : 0;

    if (s <= 0 || r <= 0 || cap <= 0) return null;

    const totalFinalVolumeBase = s / r; // volume sans booster
    const totalBooster = boosterPct > 0 ? totalFinalVolumeBase * (boosterPct / 100) : 0;
    const totalFinalVolume = totalFinalVolumeBase + totalBooster;

    const fullTanks = Math.floor(totalFinalVolume / cap);
    const remainder = totalFinalVolume - fullTanks * cap;
    const tankCount = remainder > 0 ? fullTanks + 1 : fullTanks;

    function breakdownForTank(volume: number) {
      const tankBooster = boosterPct > 0 ? volume * (boosterPct / 100) : 0;
      const baseMixWithoutBooster = volume - tankBooster;
      const ratio = 1 + w;
      const product = ratio > 0 ? baseMixWithoutBooster / ratio : 0;
      const water = Math.max(baseMixWithoutBooster - product, 0);
      return { volume, product, water, booster: tankBooster };
    }

    const fullTankBreakdown = breakdownForTank(cap);
    const lastTankBreakdown = remainder > 0 ? breakdownForTank(remainder) : null;

    const totalBaseRatio = 1 + w;
    const totalProduct = totalBaseRatio > 0 ? totalFinalVolumeBase / totalBaseRatio : 0;
    const totalWater = Math.max(totalFinalVolumeBase - totalProduct, 0);

    return {
      totalFinalVolume,
      totalProduct,
      totalWater,
      totalBooster,
      tankCount,
      fullTanks,
      remainder,
      fullTankBreakdown,
      lastTankBreakdown,
    };
  }, [surface, rendement, dilutionWaterPer1LProduct, useBooster, boosterPercent, tankCapacity]);

  return (
    <GlideScreen title="Remplir ma cuve">
      <ScrollView contentContainerStyle={styles.content}>
        <GlideCard title="Paramètres" subtitle="Mode terrain cuve réelle">
          <Text style={styles.label}>Surface à traiter (m²)</Text>
          <TextInput
            style={styles.input}
            value={surface}
            onChangeText={setSurface}
            placeholder="0"
            placeholderTextColor="#91919A"
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Rendement (m² / litre de mélange)</Text>
          <TextInput
            style={styles.input}
            value={rendement}
            onChangeText={setRendement}
            placeholder="0"
            placeholderTextColor="#91919A"
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Dilution pour 1 litre de produit</Text>
          <TextInput
            style={styles.input}
            value={dilutionWaterPer1LProduct}
            onChangeText={setDilutionWaterPer1LProduct}
            placeholder="Ex: 4"
            placeholderTextColor="#91919A"
            keyboardType="decimal-pad"
          />
          <Text style={styles.helper}>Exemple : 1 L produit + 4 L eau</Text>

          <Text style={styles.label}>Contenance cuve (L)</Text>
          <TextInput
            style={styles.input}
            value={tankCapacity}
            onChangeText={setTankCapacity}
            placeholder="80"
            placeholderTextColor="#91919A"
            keyboardType="decimal-pad"
          />

          <Pressable style={styles.boosterButton} onPress={() => setUseBooster(!useBooster)}>
            <Text style={styles.boosterButtonText}>Booster : {useBooster ? 'OUI' : 'NON'}</Text>
          </Pressable>

          {useBooster ? (
            <>
              <Text style={styles.label}>Booster (% du volume final)</Text>
              <TextInput
                style={styles.input}
                value={boosterPercent}
                onChangeText={setBoosterPercent}
                placeholder="5"
                placeholderTextColor="#91919A"
                keyboardType="decimal-pad"
              />
            </>
          ) : null}
        </GlideCard>

        {result ? (
          <>
            <GlideCard title="Besoins totaux chantier" subtitle="Volume total à préparer">
              <Text style={styles.result}>Volume final total : {fmt(result.totalFinalVolume)} L</Text>
              <Text style={styles.result}>Produit total : {fmt(result.totalProduct)} L</Text>
              <Text style={styles.result}>Eau totale : {fmt(result.totalWater)} L</Text>
              {useBooster ? <Text style={styles.result}>Booster total : {fmt(result.totalBooster)} L</Text> : null}
              <Text style={styles.resultStrong}>Nombre de cuves : {result.tankCount}</Text>
            </GlideCard>

            <GlideCard title="Préparation par cuve" subtitle="Dosage sans débordement">
              <Text style={styles.sectionTitle}>Cuve pleine</Text>
              <Text style={styles.result}>Volume cuve : {fmt(result.fullTankBreakdown.volume)} L</Text>
              <Text style={styles.result}>Produit : {fmt(result.fullTankBreakdown.product)} L</Text>
              <Text style={styles.result}>Eau : {fmt(result.fullTankBreakdown.water)} L</Text>
              {useBooster ? <Text style={styles.result}>Booster : {fmt(result.fullTankBreakdown.booster)} L</Text> : null}
              <Text style={styles.resultStrong}>Nombre de cuves pleines : {result.fullTanks}</Text>

              {result.lastTankBreakdown ? (
                <>
                  <View style={styles.sep} />
                  <Text style={styles.sectionTitle}>Dernière cuve partielle</Text>
                  <Text style={styles.result}>Volume cuve : {fmt(result.lastTankBreakdown.volume)} L</Text>
                  <Text style={styles.result}>Produit : {fmt(result.lastTankBreakdown.product)} L</Text>
                  <Text style={styles.result}>Eau : {fmt(result.lastTankBreakdown.water)} L</Text>
                  {useBooster ? <Text style={styles.result}>Booster : {fmt(result.lastTankBreakdown.booster)} L</Text> : null}
                </>
              ) : null}
            </GlideCard>
          </>
        ) : null}
      </ScrollView>
    </GlideScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  label: { color: '#1B1B1F', fontSize: 14, fontWeight: '700', marginTop: 2 },
  helper: { color: '#6F6F78', fontSize: 12, marginTop: -4 },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFF',
    color: '#111111',
  },
  boosterButton: {
    marginTop: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    backgroundColor: '#E9D08C',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boosterButtonText: { fontWeight: '900', color: '#6D5315' },
  result: { fontSize: 16, fontWeight: '700', marginBottom: 5, color: '#2A2A2F' },
  resultStrong: { fontSize: 17, fontWeight: '900', marginTop: 6, color: '#7B5D14' },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: '#9B7414', marginBottom: 6 },
  sep: { height: 1, backgroundColor: '#ECECEF', marginVertical: 10 },
});
