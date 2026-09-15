import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function SurfaceHomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Calcul de surface</Text>
      <Text style={styles.subtitle}>Choisis le mode de calcul adapté au chantier.</Text>

      <Pressable style={styles.card} onPress={() => router.push('/surface/manual' as any)}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Toitures</Text>
          <Text style={styles.cardArrow}>›</Text>
        </View>
        <Text style={styles.cardText}>
          Formes de toitures guidées avec calcul de surface.
        </Text>
      </Pressable>

      <Pressable style={styles.card} onPress={() => router.push('/surface/terrain' as any)}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Terrain</Text>
          <Text style={styles.cardArrow}>›</Text>
        </View>
        <Text style={styles.cardText}>
          Surface au sol, pente et mesure terrain.
        </Text>
      </Pressable>

      <Pressable style={styles.card} onPress={() => router.push('/surface/facade' as any)}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Façades</Text>
          <Text style={styles.cardArrow}>›</Text>
        </View>
        <Text style={styles.cardText}>
          Façade V1 terrain propre + V2 photo assistée.
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0E0E10' },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  title: { color: '#C79A2B', fontSize: 28, fontWeight: '900' },
  subtitle: { color: '#CFCFD5', fontSize: 14 },
  card: {
    backgroundColor: '#171717',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2A2A2E',
    padding: 16,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  cardArrow: { color: '#C79A2B', fontSize: 26, fontWeight: '800' },
  cardText: { color: '#B5B5BD', fontSize: 14 },
});
