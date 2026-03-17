import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/Card';
import { Button, Field } from '@/components/Form';
import { Label, Muted, Subtitle, Title } from '@/components/Typography';
import { colors } from '@/lib/theme';
import { calcRoofFlatWithSlope } from '@/utils/calculations';

export default function SurfaceScreen() {
  const [typeToiture] = useState('Surface à plat + pente');
  const [surfaceAPlat, setSurfaceAPlat] = useState('100');
  const [angle, setAngle] = useState('25');
  const [longueur, setLongueur] = useState('');
  const [largeur, setLargeur] = useState('');

  const result = useMemo(() => calcRoofFlatWithSlope(Number(surfaceAPlat), Number(angle)), [surfaceAPlat, angle]);

  return (
    <AppShell>
      <Title>Surface toiture</Title>
      <Muted>Calcul rapide inspiré de ton app Glide, avec ouverture vers un futur module de mesure d’angle par capteurs.</Muted>

      <Card>
        <Subtitle>Type de toiture</Subtitle>
        <Label>{typeToiture}</Label>
        <Muted>Autres variantes à brancher : 1 pan, 2 pans, 3 pans, 4 pans, L, U, formes complexes.</Muted>
      </Card>

      <Card>
        <Field label="Surface à plat (m²)" keyboardType="numeric" value={surfaceAPlat} onChangeText={setSurfaceAPlat} />
        <Field label="Angle de pente (°)" keyboardType="numeric" value={angle} onChangeText={setAngle} />
        <Field label="Longueur (optionnel)" keyboardType="numeric" value={longueur} onChangeText={setLongueur} />
        <Field label="Largeur (optionnel)" keyboardType="numeric" value={largeur} onChangeText={setLargeur} />
        <Button title="Mesurer la pente avec le téléphone" secondary />
      </Card>

      <Card>
        <Subtitle>Résultat</Subtitle>
        <View style={styles.row}><Text style={styles.label}>Surface réelle</Text><Text style={styles.value}>{result} m²</Text></View>
        <View style={styles.row}><Text style={styles.label}>Formule</Text><Text style={styles.formula}>Surface à plat / cos(angle)</Text></View>
        <Button title="Envoyer vers dilution flash" />
      </Card>

      <Card>
        <Subtitle>Mode terrain visé</Subtitle>
        <Muted>À connecter ensuite : capteurs du téléphone pour l’angle, tracé toiture sur carte, import photo drone ou orthomosaïque.</Muted>
      </Card>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  label: { color: colors.textMuted },
  value: { color: colors.goldSoft, fontSize: 24, fontWeight: '800' },
  formula: { color: colors.text, fontWeight: '700' },
});
