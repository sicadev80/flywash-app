
import React, { useMemo } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useProjectStore } from '../lib/projectStore';

const fmt = (v: number) => v.toFixed(2).replace('.', ',');

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleDateString('fr-FR');
}

export default function ArchiveScreen() {
  const router = useRouter();
  const projects = useProjectStore((state) => state.projects);
  const getProjectTotals = useProjectStore((state) => state.getProjectTotals);

  const completedProjects = useMemo(
    () =>
      [...projects]
        .filter((project) => project.status === 'completed')
        .sort(
          (a, b) => new Date(b.completedAt || b.updatedAt).getTime() - new Date(a.completedAt || a.updatedAt).getTime()
        ),
    [projects]
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable style={styles.topPill} onPress={() => router.back()}>
          <Text style={styles.topPillText}>Retour</Text>
        </Pressable>
        <Text style={styles.title}>Archive</Text>
        <View style={styles.counterPill}>
          <Text style={styles.counterText}>{completedProjects.length}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {completedProjects.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aucun chantier archivé</Text>
            <Text style={styles.emptyText}>
              Les chantiers clôturés (avec ou sans visite de suivi) apparaîtront ici.
            </Text>
          </View>
        ) : null}

        {completedProjects.map((project) => {
          const totals = getProjectTotals(project.id);
          const totalSurface = totals.netFacadeAreaM2 + totals.roofAreaM2;

          return (
            <Pressable
              key={project.id}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/archive-detail',
                  params: { projectId: project.id },
                })
              }
            >
              <Text style={styles.completedDate}>
                Chantier terminé le {formatDate(project.completedAt)}
              </Text>
              <Text style={styles.cardTitle}>{project.clientName || 'Projet sans nom'}</Text>
              <Text style={styles.cardSub}>{project.address}</Text>
              <Text style={styles.cardSub}>
                {[project.postalCode, project.city].filter(Boolean).join(' ')}
              </Text>
              <Text style={styles.metric}>Surface totale : {fmt(totalSurface)} m²</Text>
              <Text style={styles.total}>Montant devis : {fmt(project.quoteAmount || 0)} € HT</Text>

              {project.visitCompletedAt ? (
                <Text style={styles.visitInfo}>
                  Visite de suivi effectuée le {formatDate(project.visitCompletedAt)}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
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
  counterPill: {
    minWidth: 40,
    backgroundColor: '#111111',
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  title: { flex: 1, color: '#1C1C1E', fontSize: 18, fontWeight: '900', textAlign: 'center' },
  content: { padding: 14, gap: 14, paddingBottom: 40 },
  emptyCard: {
    backgroundColor: '#EFE8DB',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2D7C3',
  },
  emptyTitle: { color: '#1C1C1E', fontSize: 16, fontWeight: '900' },
  emptyText: { color: '#5A5A5E', fontSize: 14, marginTop: 4, lineHeight: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2D7C3',
    gap: 2,
  },
  completedDate: { color: '#74747D', fontSize: 12, fontWeight: '800', marginBottom: 4 },
  cardTitle: { color: '#1C1C1E', fontSize: 18, fontWeight: '900' },
  cardSub: { color: '#5A5A5E', fontSize: 14, marginTop: 2 },
  metric: { color: '#3A3A3C', fontSize: 14, marginTop: 8 },
  total: { color: '#B8962E', fontSize: 15, fontWeight: '900', marginTop: 2 },
  visitInfo: { color: '#1F7A3D', fontSize: 13, fontWeight: '700', marginTop: 8 },
});
