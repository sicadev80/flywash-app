import GlideScreen from '../../components/glide/GlideScreen';
import React, { useMemo } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useProjectStore } from '../../lib/projectStore';

const fmt = (v: number) => v.toFixed(2).replace('.', ',');

function formatScheduled(value?: string) {
  if (!value) return 'Non planifié';
  const date = new Date(value);
  return (
    date.toLocaleDateString('fr-FR') +
    ' • ' +
    date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  );
}

export default function PlanningScreen() {
  const router = useRouter();
  const projects = useProjectStore((state) => state.projects);
  const getProjectTotals = useProjectStore((state) => state.getProjectTotals);

  const scheduledProjects = useMemo(
    () =>
      [...projects]
        .filter((project) => project.status === 'scheduled')
        .sort(
          (a, b) =>
            new Date(a.scheduledFor || a.updatedAt).getTime() -
            new Date(b.scheduledFor || b.updatedAt).getTime()
        ),
    [projects]
  );

  return (
    <GlideScreen style={styles.screen}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Planning</Text>
        <View style={styles.counterPill}>
          <Text style={styles.counterText}>{scheduledProjects.length}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {scheduledProjects.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aucune mission planifiée</Text>
            <Text style={styles.emptyText}>
              Les chantiers planifiés apparaîtront ici pour un accès rapide.
            </Text>
          </View>
        ) : null}

        {scheduledProjects.map((project) => {
          const totals = getProjectTotals(project.id);
          const totalSurface = totals.netFacadeAreaM2 + totals.roofAreaM2;

          return (
            <Pressable
              key={project.id}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/mission-detail',
                  params: { projectId: project.id },
                })
              }
            >
              <Text style={styles.missionDate}>{formatScheduled(project.scheduledFor)}</Text>
              <Text style={styles.cardTitle}>{project.clientName || 'Projet sans nom'}</Text>
              <Text style={styles.cardSub}>{project.address}</Text>
              <Text style={styles.cardSub}>
                {[project.postalCode, project.city].filter(Boolean).join(' ')}
              </Text>
              <Text style={styles.metric}>Téléphone : {project.phone || 'Non renseigné'}</Text>
              <Text style={styles.total}>Surface totale : {fmt(totalSurface)} m²</Text>
              <Text style={styles.total}>Montant devis : {fmt(project.quoteAmount || 0)} € HT</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </GlideScreen>
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
  title: { flex: 1, color: '#1C1C1E', fontSize: 22, fontWeight: '900' },
  content: { padding: 14, gap: 14, paddingBottom: 110 },
  emptyCard: {
    backgroundColor: '#EFE8DB',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2D7C3',
  },
  emptyTitle: { color: '#1C1C1E', fontSize: 16, fontWeight: '900' },
  emptyText: { color: '#5A5A5E', fontSize: 14, marginTop: 4 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2D7C3',
    gap: 4,
  },
  missionDate: {
    color: '#1F7A3D',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 4,
  },
  cardTitle: { color: '#1C1C1E', fontSize: 18, fontWeight: '900' },
  cardSub: { color: '#5A5A5E', fontSize: 14 },
  metric: { color: '#3A3A3C', fontSize: 14, marginTop: 6 },
  total: { color: '#B8962E', fontSize: 15, fontWeight: '900', marginTop: 2 },
});
