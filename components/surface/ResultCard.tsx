import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

export function ResultCard({ total, details }: { total: number; details: Array<{ label: string; value: number; unit?: string }> }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Surface totale</Text>
      <View style={styles.totalBox}>
        <Text style={styles.total}>{total.toFixed(2)} m²</Text>
      </View>
      {details.map((item) => (
        <View key={item.label} style={styles.row}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.value}>{item.value.toFixed(2)} {item.unit ?? 'm²'}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
  },
  title: { color: colors.white, fontWeight: '800', fontSize: 20, marginBottom: 12 },
  totalBox: { backgroundColor: colors.white, borderRadius: 10, padding: 12, marginBottom: 12 },
  total: { fontWeight: '800', fontSize: 24, color: '#1b1b1b' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, gap: 12 },
  label: { color: colors.textSoft, flex: 1 },
  value: { color: colors.white, fontWeight: '700' },
});
