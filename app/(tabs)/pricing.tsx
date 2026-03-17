import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/Card';
import { Button, Field } from '@/components/Form';
import { Subtitle, Title, Muted } from '@/components/Typography';
import { colors } from '@/lib/theme';
import { calcMissionPricing, calcTripCost } from '@/utils/calculations';

export default function PricingScreen() {
  const [surface, setSurface] = useState('600');
  const [coutProduit, setCoutProduit] = useState('150');
  const [distance, setDistance] = useState('45');
  const [conso, setConso] = useState('7.4');
  const [prixCarburant, setPrixCarburant] = useState('1.95');
  const [peage, setPeage] = useState('0');
  const [coutMateriel, setCoutMateriel] = useState('120');
  const [chargeM2, setChargeM2] = useState('1.2');
  const [marge, setMarge] = useState('40');
  const [tva, setTva] = useState('20');

  const trip = useMemo(() => calcTripCost(Number(distance), Number(conso), Number(prixCarburant), Number(peage)), [distance, conso, prixCarburant, peage]);
  const pricing = useMemo(() => calcMissionPricing({
    surface: Number(surface),
    coutProduit: Number(coutProduit),
    coutTrip: trip.total,
    coutMateriel: Number(coutMateriel),
    chargeM2: Number(chargeM2),
    margePct: Number(marge),
    tvaPct: Number(tva),
  }), [surface, coutProduit, trip.total, coutMateriel, chargeM2, marge, tva]);

  return (
    <AppShell>
      <Title>Calcul prix mission</Title>
      <Muted>Version initiale du chiffrage mission, prête à être reliée à tes tables Supabase.</Muted>

      <Card>
        <Subtitle>1. Mission</Subtitle>
        <Field label="Surface à traiter (m²)" keyboardType="numeric" value={surface} onChangeText={setSurface} />
        <Field label="Coût produit (€)" keyboardType="numeric" value={coutProduit} onChangeText={setCoutProduit} />
        <Field label="Coût matériel / batterie (€)" keyboardType="numeric" value={coutMateriel} onChangeText={setCoutMateriel} />
      </Card>

      <Card>
        <Subtitle>2. Trajet</Subtitle>
        <Field label="Distance chantier (km)" keyboardType="numeric" value={distance} onChangeText={setDistance} />
        <Field label="Consommation véhicule (L/100)" keyboardType="numeric" value={conso} onChangeText={setConso} />
        <Field label="Prix carburant (€ / L)" keyboardType="numeric" value={prixCarburant} onChangeText={setPrixCarburant} />
        <Field label="Péage (€)" keyboardType="numeric" value={peage} onChangeText={setPeage} />
      </Card>

      <Card>
        <Subtitle>3. Charges & marge</Subtitle>
        <Field label="Charge ventilée au m² (€)" keyboardType="numeric" value={chargeM2} onChangeText={setChargeM2} />
        <Field label="Marge (%)" keyboardType="numeric" value={marge} onChangeText={setMarge} />
        <Field label="TVA (%)" keyboardType="numeric" value={tva} onChangeText={setTva} />
      </Card>

      <Card>
        <Subtitle>Résultat</Subtitle>
        {[
          ['Carburant', `${trip.carburant} €`],
          ['Trajet total', `${trip.total} €`],
          ['Charges', `${pricing.charges} €`],
          ['Prix de revient', `${pricing.revient} €`],
          ['Revient / m²', `${pricing.revientM2} €`],
          ['Vente HT / m²', `${pricing.venteHtM2} €`],
          ['Total HT', `${pricing.totalHt} €`],
          ['Total TTC', `${pricing.totalTtc} €`],
        ].map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.left}>{label}</Text>
            <Text style={styles.right}>{value}</Text>
          </View>
        ))}
        <Button title="Enregistrer la mission" />
        <Button title="Ajouter au calendrier" secondary />
      </Card>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  left: { color: colors.textMuted },
  right: { color: colors.text, fontWeight: '800' },
});
