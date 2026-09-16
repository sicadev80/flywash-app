
import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useProjectStore } from '../lib/projectStore';

const fmt = (v: number) => v.toFixed(2).replace('.', ',');

function formatDate(value?: string) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('fr-FR');
}

export default function ArchiveDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ projectId?: string }>();
  const projectId = typeof params.projectId === 'string' ? params.projectId : '';

  const project = useProjectStore((state) => state.getProjectById(projectId));
  const getProjectTotals = useProjectStore((state) => state.getProjectTotals);

  if (!project) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.topBar}>
          <Pressable style={styles.topPill} onPress={() => router.back()}>
            <Text style={styles.topPillText}>Retour</Text>
          </Pressable>
          <Text style={styles.title}>Chantier archivé</Text>
          <View style={{ width: 76 }} />
        </View>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Chantier introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totals = getProjectTotals(project.id);
  const totalSurface = totals.netFacadeAreaM2 + totals.roofAreaM2;
  const roofPrep = project.roofProductsSummary;
  const facadePrep = project.facadeProductsSummary;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable style={styles.topPill} onPress={() => router.back()}>
          <Text style={styles.topPillText}>Retour</Text>
        </Pressable>
        <Text style={styles.title}>Chantier archivé</Text>
        <View style={{ width: 76 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.clientName}>{project.clientName || 'Projet sans nom'}</Text>
          <Text style={styles.text}>{project.address}</Text>
          <Text style={styles.text}>{[project.postalCode, project.city].filter(Boolean).join(' ')}</Text>
          <Text style={styles.text}>{project.phone || 'Téléphone non renseigné'}</Text>
        </View>

        <View style={styles.timelineCard}>
          <Text style={styles.timelineLine}>✓ Chantier terminé le {formatDate(project.completedAt)}</Text>
          {project.visitCompletedAt ? (
            <Text style={styles.timelineLine}>✓ Visite de suivi effectuée le {formatDate(project.visitCompletedAt)}</Text>
          ) : null}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Résumé</Text>
          <Text style={styles.metric}>Surface façades : {fmt(totals.netFacadeAreaM2)} m²</Text>
          <Text style={styles.metric}>Surface toitures : {fmt(totals.roofAreaM2)} m²</Text>
          <Text style={styles.metric}>Surface totale : {fmt(totalSurface)} m²</Text>
          <Text style={styles.total}>Montant devis : {fmt(project.quoteAmount || 0)} € HT</Text>
        </View>

        {roofPrep || facadePrep ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Produits utilisés</Text>

            {roofPrep ? (
              <View style={styles.subCard}>
                <Text style={styles.subTitle}>Toiture</Text>
                <Text style={styles.metric}>Produit : {roofPrep.productLabel || roofPrep.treatment || '-'}</Text>
                <Text style={styles.metric}>Mélange : {fmt(roofPrep.volumeMelange || 0)} L</Text>
              </View>
            ) : null}

            {facadePrep ? (
              <View style={styles.subCard}>
                <Text style={styles.subTitle}>Façade</Text>
                <Text style={styles.metric}>Produit : {facadePrep.productLabel || facadePrep.treatment || '-'}</Text>
                <Text style={styles.metric}>Mélange : {fmt(facadePrep.volumeMelange || 0)} L</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F3EE' },
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
    alignItems: 'center',
  },
  topPillText: { color: '#1C1C1E', fontWeight: '800' },
  title: { flex: 1, color: '#1C1C1E', fontSize: 18, fontWeight: '900', textAlign: 'center' },
  content: { padding: 14, gap: 14, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2D7C3',
    gap: 6,
  },
  clientName: { color: '#1C1C1E', fontSize: 20, fontWeight: '900' },
  text: { color: '#5A5A5E', fontSize: 14 },
  timelineCard: {
    backgroundColor: '#DDF5E3',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFE8CB',
    gap: 4,
  },
  timelineLine: { color: '#1F7A3D', fontSize: 14, fontWeight: '800' },
  summaryCard: {
    backgroundColor: '#EFE8DB',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2D7C3',
    gap: 6,
  },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#1C1C1E', marginBottom: 2 },
  metric: { color: '#3A3A3C', fontSize: 14 },
  total: { color: '#B8962E', fontSize: 16, fontWeight: '900', marginTop: 2 },
  subCard: {
    backgroundColor: '#F8F6F1',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2D7C3',
    gap: 2,
    marginTop: 8,
  },
  subTitle: { fontSize: 14, fontWeight: '900', color: '#1C1C1E' },
  emptyCard: { margin: 14, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: '#1C1C1E' },
});
