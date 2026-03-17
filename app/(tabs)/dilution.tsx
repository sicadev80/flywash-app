import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/Card';
import { Button, Field } from '@/components/Form';
import { Label, Muted, Subtitle, Title } from '@/components/Typography';
import { products } from '@/data/mock';
import { colors } from '@/lib/theme';
import { calcDilution } from '@/utils/calculations';

export default function DilutionScreen() {
  const selectedProduct = products[0];
  const [surface, setSurface] = useState('600');
  const [rendement, setRendement] = useState(String(selectedProduct.rendement));
  const [dilution, setDilution] = useState(String(selectedProduct.dilution));
  const [prix, setPrix] = useState(String(selectedProduct.prixHtLitre));

  const results = useMemo(
    () => calcDilution(Number(surface), Number(rendement), Number(dilution), Number(prix)),
    [surface, rendement, dilution, prix],
  );

  return (
    <AppShell>
      <Title>Dilution flash</Title>
      <Muted>Le module prioritaire pour le terrain. Résultat immédiat pour préparer la cuve.</Muted>

      <Card>
        <Subtitle>Produit sélectionné</Subtitle>
        <Label>{selectedProduct.nom}</Label>
        <Muted>{selectedProduct.type} • {selectedProduct.fournisseur}</Muted>
      </Card>

      <Card>
        <Field label="Surface à traiter (m²)" keyboardType="numeric" value={surface} onChangeText={setSurface} />
        <Field label="Rendement (m²/L)" keyboardType="numeric" value={rendement} onChangeText={setRendement} />
        <Field label="Dilution (1L produit + X L eau)" keyboardType="numeric" value={dilution} onChangeText={setDilution} />
        <Field label="Prix produit HT / litre" keyboardType="numeric" value={prix} onChangeText={setPrix} />
        <View style={styles.quickRow}>
          {['50', '100', '500', '1000'].map((s) => (
            <Text key={s} onPress={() => setSurface(s)} style={styles.quickBtn}>+{s} m²</Text>
          ))}
        </View>
      </Card>

      <Card>
        <Subtitle>Résultat</Subtitle>
        <View style={styles.resultRow}><Text style={styles.resultLabel}>Produit fini total</Text><Text style={styles.resultValue}>{results.produitFini} L</Text></View>
        <View style={styles.resultRow}><Text style={styles.resultLabel}>Produit pur</Text><Text style={styles.resultValue}>{results.produitPur} L</Text></View>
        <View style={styles.resultRow}><Text style={styles.resultLabel}>Eau</Text><Text style={styles.resultValue}>{results.eau} L</Text></View>
        <View style={styles.resultRow}><Text style={styles.resultLabel}>Coût produit</Text><Text style={styles.resultValue}>{results.coutTotal} €</Text></View>
        <View style={styles.resultRow}><Text style={styles.resultLabel}>Coût / m²</Text><Text style={styles.resultValue}>{results.coutM2} €</Text></View>
        <Button title="Enregistrer le calcul" />
        <Button title="Envoyer vers calcul prix" secondary />
      </Card>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  quickBtn: {
    color: colors.goldSoft,
    borderColor: colors.gold,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  resultLabel: { color: colors.textMuted, fontSize: 15 },
  resultValue: { color: colors.text, fontSize: 18, fontWeight: '800' },
});
