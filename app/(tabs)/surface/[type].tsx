import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import GlideScreen from '../../../components/glide/GlideScreen';
import {
  calcFourPans,
  calcL2Pans,
  calcLMixte,
  calcStraight12Pans,
  calcThreePans,
} from '../../../lib/surfaceCalculations';
import { setPendingSurface } from '../../../lib/surfaceTransferStore';
import { roofConfigs } from '../../../components/surface/roofConfigs';

type RoofTypeV2 =
  | 'straight-1-2'
  | 'straight-2-2'
  | 'straight-2-4'
  | 'l-shape'
  | 'u-shape';

const toNum = (v: string) => Number((v || '').replace(',', '.')) || 0;

export default function SurfaceTypeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const rawType = String(params.type || 'straight-1-2');

  const type: RoofTypeV2 =
    rawType === 'straight-2-2' ||
    rawType === 'straight-2-4' ||
    rawType === 'l-shape' ||
    rawType === 'u-shape'
      ? (rawType as RoofTypeV2)
      : 'straight-1-2';

  const config = roofConfigs.find((r) => r.type === type);

  const [longueur, setLongueur] = useState('');
  const [largeur, setLargeur] = useState('');
  const [hauteur, setHauteur] = useState('');
  const [nombrePans, setNombrePans] = useState<'1' | '2'>('2');
  const [lc, setLc] = useState('');
  const [l1, setL1] = useState('');
  const [la1, setLa1] = useState('');
  const [l2, setL2] = useState('');
  const [la2, setLa2] = useState('');

  const result = useMemo(() => {
    switch (type) {
      case 'straight-1-2':
        return calcStraight12Pans(
          toNum(longueur),
          toNum(largeur),
          toNum(hauteur),
          nombrePans === '1' ? 1 : 2
        );
      case 'straight-2-2':
        return calcThreePans(toNum(longueur), toNum(largeur), toNum(lc), toNum(hauteur));
      case 'straight-2-4':
        return calcFourPans(toNum(longueur), toNum(largeur), toNum(lc), toNum(hauteur));
      case 'l-shape':
        return calcL2Pans(toNum(l1), toNum(la1), toNum(l2), toNum(la2), toNum(hauteur));
      case 'u-shape':
        return calcLMixte(toNum(l1), toNum(la1), toNum(l2), toNum(la2), toNum(hauteur), toNum(lc));
      default:
        return { surfaceTotale: 0, details: {} };
    }
  }, [type, longueur, largeur, hauteur, nombrePans, lc, l1, la1, l2, la2]);

  function resetForm() {
    setLongueur('');
    setLargeur('');
    setHauteur('');
    setNombrePans('2');
    setLc('');
    setL1('');
    setLa1('');
    setL2('');
    setLa2('');
  }

  function sendToPricing() {
    setPendingSurface({
      surface: result.surfaceTotale,
      type,
      date: new Date().toISOString(),
    });

    router.push({
      pathname: '/pricing' as any,
      params: { surface: String(result.surfaceTotale), type: String(type) },
    });
  }

  return (
    <GlideScreen title={config?.title || 'Surface toiture'}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} bounces={false}>
        <Text style={styles.subtitle}>{config?.subtitle || ''}</Text>

        {config?.image ? (
          <View style={styles.imageCard}>
            <Image source={config.image} style={styles.image} resizeMode="contain" />
          </View>
        ) : null}

        <View style={styles.card}>
          {type === 'straight-1-2' ? (
            <>
              <Field label="Longueur (m)" value={longueur} onChangeText={setLongueur} />
              <Field label="Largeur (m)" value={largeur} onChangeText={setLargeur} />
              <Field label="Hauteur (m)" value={hauteur} onChangeText={setHauteur} />

              <Text style={styles.label}>Nombre de pans</Text>
              <View style={styles.toggleRow}>
                <Pressable style={[styles.toggle, nombrePans === '1' && styles.toggleActive]} onPress={() => setNombrePans('1')}>
                  <Text style={[styles.toggleText, nombrePans === '1' && styles.toggleTextActive]}>1 pan</Text>
                </Pressable>
                <Pressable style={[styles.toggle, nombrePans === '2' && styles.toggleActive]} onPress={() => setNombrePans('2')}>
                  <Text style={[styles.toggleText, nombrePans === '2' && styles.toggleTextActive]}>2 pans</Text>
                </Pressable>
              </View>
            </>
          ) : null}

          {type === 'straight-2-2' || type === 'straight-2-4' ? (
            <>
              <Field label="Longueur L (m)" value={longueur} onChangeText={setLongueur} />
              <Field label="Largeur l (m)" value={largeur} onChangeText={setLargeur} />
              <Field label="Longueur de crête LC (m)" value={lc} onChangeText={setLc} />
              <Field label="Hauteur H (m)" value={hauteur} onChangeText={setHauteur} />
            </>
          ) : null}

          {type === 'l-shape' || type === 'u-shape' ? (
            <>
              <Field label="Longueur 1 (m)" value={l1} onChangeText={setL1} />
              <Field label="Largeur 1 (m)" value={la1} onChangeText={setLa1} />
              <Field label="Longueur 2 (m)" value={l2} onChangeText={setL2} />
              <Field label="Largeur 2 (m)" value={la2} onChangeText={setLa2} />
              <Field label="Hauteur (m)" value={hauteur} onChangeText={setHauteur} />
              {type === 'u-shape' ? <Field label="Longueur de crête LC (m)" value={lc} onChangeText={setLc} /> : null}
            </>
          ) : null}
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Résultat</Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Surface totale</Text>
            <Text style={styles.resultValue}>{result.surfaceTotale.toFixed(2)} m²</Text>
          </View>
          {Object.entries(result.details || {}).map(([key, value]) => (
            <View style={styles.resultRow} key={key}>
              <Text style={styles.resultLabel}>{key}</Text>
              <Text style={styles.resultValue}>{String(value)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footerCard}>
          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.secondaryButton]} onPress={resetForm}>
              <Text style={styles.secondaryButtonText}>Réinitialiser</Text>
            </Pressable>

            <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => router.replace('/surface/manual' as any)}>
              <Text style={styles.secondaryButtonText}>Revenir au choix du toit</Text>
            </Pressable>

            <Pressable style={[styles.button, styles.primaryButton]} onPress={sendToPricing}>
              <Text style={styles.primaryButtonText}>Envoyer vers Calcul Prix</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </GlideScreen>
  );
}

function Field({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        placeholder="Ex : 10"
        placeholderTextColor="#91919A"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 36 },
  subtitle: { color: '#74747D', fontSize: 14, lineHeight: 20, marginBottom: 6 },
  imageCard: { backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: '#E4E4E8', padding: 18 },
  image: { width: '100%', height: 220 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: '#E4E4E8', padding: 18 },
  label: { color: '#17171C', fontSize: 14, marginBottom: 6, fontWeight: '700' },
  input: { backgroundColor: '#FFFFFF', color: '#17171C', borderWidth: 1, borderColor: '#DCDCE2', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  toggleRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  toggle: { flex: 1, borderWidth: 1, borderColor: '#DCDCE2', borderRadius: 18, paddingVertical: 14, alignItems: 'center', backgroundColor: '#FFFFFF' },
  toggleActive: { borderColor: '#D4AF37', backgroundColor: '#F8F1DB' },
  toggleText: { color: '#17171C', fontWeight: '800', fontSize: 15 },
  toggleTextActive: { color: '#B38918' },
  resultCard: { backgroundColor: '#FFF8E8', borderRadius: 24, borderWidth: 1, borderColor: '#E7CF86', padding: 18 },
  resultTitle: { color: '#B38918', fontSize: 22, fontWeight: '900', marginBottom: 12 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, gap: 12 },
  resultLabel: { color: '#17171C', fontSize: 14, flex: 1 },
  resultValue: { color: '#17171C', fontSize: 15, fontWeight: '800' },

  footerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4E4E8',
    padding: 14,
    gap: 10,
  },
  actions: {
    gap: 12,
  },
  button: {
    minHeight: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: '#D4AF37',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    backgroundColor: '#FFFFFF',
  },
  primaryButtonText: {
    color: '#111111',
    fontWeight: '900',
    fontSize: 16,
  },
  secondaryButtonText: {
    color: '#B38918',
    fontWeight: '800',
    fontSize: 16,
  },

});
