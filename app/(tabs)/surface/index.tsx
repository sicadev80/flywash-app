import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import GlideScreen from '../../../components/glide/GlideScreen';

export default function SurfaceHomeScreen() {
  const router = useRouter();

  return (
    <GlideScreen title="Calcul de surface">
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Pressable style={styles.card} onPress={() => router.push('/surface/manual' as any)}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Mesure Toiture manuelle</Text>
            <Text style={styles.cardArrow}>›</Text>
          </View>
          <Text style={styles.cardText}>
            Formes de toitures guidées avec calcul automatisée des surfaces.
          </Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => router.push('/surface/terrain' as any)}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Mesure Toiture Par Satellite</Text>
            <Text style={styles.cardArrow}>›</Text>
          </View>
          <Text style={styles.cardText}>
            Tracer un polygône, mesurer l'angle de la pente à l'aide de votre téléphone.
          </Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => router.push('../facade-photo-polygon-pointing' as any)}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Mesure des Façades</Text>
            <Text style={styles.cardArrow}>›</Text>
          </View>
          <Text style={styles.cardText}>
            Prendre une photo de la facade, tracer le polygone, tracer les ouvrants à déduire...
          </Text>
        </Pressable>
      </ScrollView>
    </GlideScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 36,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4E4E8',
    padding: 18,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#17171C',
    fontSize: 18,
    fontWeight: '800',
  },
  cardArrow: {
    color: '#B38918',
    fontSize: 30,
    lineHeight: 30,
    fontWeight: '900',
  },
  cardText: {
    color: '#74747D',
    fontSize: 14,
    lineHeight: 20,
  },
});
