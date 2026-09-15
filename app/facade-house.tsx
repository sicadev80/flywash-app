
import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { deleteFacade, useFacadeHouseStore } from '../lib/facadeHouseStore';

const fmt = (v: number) => v.toFixed(2).replace('.', ',');

export default function FacadeHouseScreen() {
  const router = useRouter();
  const { facades } = useFacadeHouseStore();

  const totalGross = facades.reduce((sum, f) => sum + f.grossAreaM2, 0);
  const totalVoids = facades.reduce((sum, f) => sum + f.voidsAreaM2, 0);
  const totalNet = facades.reduce((sum, f) => sum + f.netAreaM2, 0);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable style={styles.topPill} onPress={() => router.back()}>
          <Text style={styles.topPillText}>Retour</Text>
        </Pressable>
        <Text style={styles.title}>Maison complète</Text>
        <Pressable
          style={[styles.topPill, styles.goldPill]}
          onPress={() => router.push('/facade-photo-polygon-pointing')}
        >
          <Text style={styles.goldPillText}>Ajouter</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Totaux habitation</Text>
          <Text style={styles.metric}>Façades : {facades.length}</Text>
          <Text style={styles.metric}>Surface brute : {fmt(totalGross)} m²</Text>
          <Text style={styles.metric}>Ouvrants : {fmt(totalVoids)} m²</Text>
          <Text style={styles.total}>Surface nette : {fmt(totalNet)} m²</Text>
        </View>

        {facades.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aucune façade enregistrée</Text>
            <Text style={styles.emptyText}>
              Ajoute une première façade, puis recommence pour chaque côté de la maison.
            </Text>
          </View>
        ) : null}

        {facades.map((facade, index) => (
          <View key={facade.id} style={styles.card}>
            {facade.imageUri ? (
              <Image source={{ uri: facade.imageUri }} style={styles.preview} />
            ) : null}
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>
                  {facade.name || `Façade ${index + 1}`}
                </Text>
                <Text style={styles.cardSub}>
                  Points façade : {facade.outerPolygon.length} · Ouvrants : {facade.voidPolygons.length}
                </Text>
              </View>
              <Text style={styles.badge}>{fmt(facade.netAreaM2)} m²</Text>
            </View>

            <Text style={styles.metric}>Brute : {fmt(facade.grossAreaM2)} m²</Text>
            <Text style={styles.metric}>Ouvrants : {fmt(facade.voidsAreaM2)} m²</Text>
            <Text style={styles.metric}>Nette : {fmt(facade.netAreaM2)} m²</Text>

            <View style={styles.actions}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() =>
                  router.push({
                    pathname: '/facade-photo-polygon-pointing',
                    params: { facadeId: facade.id },
                  })
                }
              >
                <Text style={styles.secondaryButtonText}>Modifier</Text>
              </Pressable>

              <Pressable
                style={styles.dangerButton}
                onPress={() => deleteFacade(facade.id)}
              >
                <Text style={styles.dangerButtonText}>Supprimer</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F3EE', // fond Glide
  },

  topBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  topPill: {
    backgroundColor: '#E7E2D9',
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 40,
    justifyContent: 'center',
  },

  topPillText: {
    color: '#1C1C1E',
    fontWeight: '800',
  },

  goldPill: {
    backgroundColor: '#D4AF37',
  },

  goldPillText: {
    color: '#111',
    fontWeight: '900',
  },

  title: {
    flex: 1,
    color: '#1C1C1E',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },

  content: {
    padding: 14,
    gap: 14,
    paddingBottom: 40,
  },

  summaryCard: {
    backgroundColor: '#EFE8DB',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2D7C3',
  },

  summaryTitle: {
    color: '#1C1C1E',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },

  metric: {
    color: '#3A3A3C',
    fontSize: 14,
  },

  total: {
    color: '#B8962E',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 6,
  },

  emptyCard: {
    backgroundColor: '#EFE8DB',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2D7C3',
  },

  emptyTitle: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '900',
  },

  emptyText: {
    color: '#5A5A5E',
    fontSize: 14,
    marginTop: 4,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2D7C3',
  },

  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  cardTitle: {
    color: '#1C1C1E',
    fontSize: 17,
    fontWeight: '900',
  },

  cardSub: {
    color: '#6C6C70',
    fontSize: 13,
    marginTop: 2,
  },

  badge: {
    backgroundColor: '#D4AF37',
    color: '#111',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontWeight: '900',
  },

  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },

  secondaryButton: {
    flex: 1,
    backgroundColor: '#E7E2D9',
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  secondaryButtonText: {
    color: '#1C1C1E',
    fontWeight: '800',
  },

  dangerButton: {
    backgroundColor: '#FCE8E8',
    borderRadius: 14,
    height: 44,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dangerButtonText: {
    color: '#C62828',
    fontWeight: '800',
  },
  preview: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 10,
  },

  goldButtonLarge: {
    marginTop: 12,
    backgroundColor: '#D4AF37',
    borderRadius: 16,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
