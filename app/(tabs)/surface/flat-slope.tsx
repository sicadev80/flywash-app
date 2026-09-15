import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { calcFlatSlope } from '../../../lib/surfaceCalculations';

export default function FlatSlopeScreen() {
  const router = useRouter();

  const [surfaceFlat, setSurfaceFlat] = useState('');
  const [angle, setAngle] = useState('');

  const result = useMemo(() => {
    const flat = Number((surfaceFlat || '').replace(',', '.'));
    const ang = Number((angle || '').replace(',', '.'));

    if (!flat || !ang) return null;

    return calcFlatSlope(flat, ang);
  }, [surfaceFlat, angle]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Surface à plat + pente</Text>

      <Text style={styles.label}>Surface à plat (m²)</Text>
      <TextInput
        style={styles.input}
        value={surfaceFlat}
        onChangeText={setSurfaceFlat}
        keyboardType="decimal-pad"
        placeholder="Ex : 100"
        placeholderTextColor="#999"
      />

      <Text style={styles.label}>Angle de pente (°)</Text>
      <TextInput
        style={styles.input}
        value={angle}
        onChangeText={setAngle}
        keyboardType="decimal-pad"
        placeholder="Ex : 30"
        placeholderTextColor="#999"
      />

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>
            Surface réelle : {result.surfaceTotale.toFixed(2)} m²
          </Text>
          <Text style={styles.resultSubtext}>
            Surface à plat : {result.details.surfaceAPlat.toFixed(2)} m²
          </Text>
          <Text style={styles.resultSubtext}>
            Angle : {result.details.angleDeg.toFixed(2)}°
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  label: {
    color: '#FFF',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#2A2A2A',
    color: '#FFF',
    padding: 12,
    borderRadius: 8,
  },
  resultBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#D4A017',
    borderRadius: 10,
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  resultSubtext: {
    fontSize: 14,
    color: '#000',
    marginTop: 2,
  },
});
