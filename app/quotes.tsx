
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useProjectStore } from '../lib/projectStore';

const fmt = (v: number) => v.toFixed(2).replace('.', ',');

export default function QuotesScreen() {
  const router = useRouter();
  const projects = useProjectStore((state) => state.projects);
  const setProjectStatus = useProjectStore((state) => state.setProjectStatus);
  const getProjectTotals = useProjectStore((state) => state.getProjectTotals);

  const quotedProjects = [...projects]
    .filter((project) => project.status === 'quoted' || project.status === 'sent')
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

  function formatDate(value: string) {
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

  function handleApprove(projectId: string) {
    setProjectStatus(projectId, 'approved');
  }

  function handleRefuse(projectId: string) {
    setProjectStatus(projectId, 'archived');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable style={styles.topPill} onPress={() => router.back()}>
          <Text style={styles.topPillText}>Retour</Text>
        </Pressable>

        <Text style={styles.title}>Mes devis en cours</Text>

        <View style={styles.counterPill}>
          <Text style={styles.counterText}>{quotedProjects.length}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {quotedProjects.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aucun devis en cours</Text>
            <Text style={styles.emptyText}>
              Dès qu’un projet est chiffré, il apparaîtra ici avec les actions Accepter et Refuser.
            </Text>
          </View>
        ) : null}

        {quotedProjects.map((project) => {
          const totals = getProjectTotals(project.id);
          const totalSurface = totals.netFacadeAreaM2 + totals.roofAreaM2;

          return (
            <View key={project.id} style={styles.card}>
              <Text style={styles.cardTitle}>{project.clientName || 'Projet sans nom'}</Text>
              <Text style={styles.projectDate}>{formatDate(project.updatedAt)}</Text>
              <Text style={styles.cardSub}>{project.address}</Text>
              <Text style={styles.cardSub}>
                {[project.postalCode, project.city].filter(Boolean).join(' ')}
              </Text>
              <Text style={styles.cardSub}>
                {project.phone || 'Téléphone non renseigné'}
              </Text>

              <View style={styles.metricsWrap}>
                <Text style={styles.metric}>Statut : {project.status || 'quoted'}</Text>
                <Text style={styles.metric}>Façades nettes : {fmt(totals.netFacadeAreaM2)} m²</Text>
                <Text style={styles.metric}>Toitures : {fmt(totals.roofAreaM2)} m²</Text>
                <Text style={styles.total}>Surface totale : {fmt(totalSurface)} m²</Text>
                <Text style={styles.total}>Montant devis : {fmt(project.quoteAmount || 0)} € HT</Text>
              </View>

              <View style={styles.actions}>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() =>
                    router.push({
                      pathname: '/project-detail',
                      params: { projectId: project.id },
                    })
                  }
                >
                  <Text style={styles.secondaryButtonText}>Ouvrir</Text>
                </Pressable>

                <Pressable
                  style={styles.acceptButton}
                  onPress={() => handleApprove(project.id)}
                >
                  <Text style={styles.acceptButtonText}>Devis accepté</Text>
                </Pressable>
              </View>

              <Pressable
                style={styles.refuseButton}
                onPress={() => handleRefuse(project.id)}
              >
                <Text style={styles.refuseButtonText}>Devis refusé</Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F3EE',
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
    alignItems: 'center',
  },
  topPillText: {
    color: '#1C1C1E',
    fontWeight: '800',
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
  counterText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  title: {
    flex: 1,
    color: '#1C1C1E',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  projectDate: {
    fontSize: 12,
    color: '#7A7A80',
    marginTop: 4,
  },
  content: {
    padding: 14,
    gap: 14,
    paddingBottom: 40,
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
  cardTitle: {
    color: '#1C1C1E',
    fontSize: 18,
    fontWeight: '900',
  },
  cardSub: {
    color: '#5A5A5E',
    fontSize: 14,
    marginTop: 2,
  },
  metricsWrap: {
    marginTop: 12,
    gap: 4,
  },
  metric: {
    color: '#3A3A3C',
    fontSize: 14,
  },
  total: {
    color: '#B8962E',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#E7E2D9',
    borderRadius: 14,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1C1C1E',
    fontWeight: '800',
    fontSize: 15,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#DDF5E3',
    borderRadius: 14,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#1F7A3D',
    fontWeight: '800',
    fontSize: 15,
  },
  refuseButton: {
    marginTop: 10,
    backgroundColor: '#FCE8E6',
    borderRadius: 14,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refuseButtonText: {
    color: '#C0392B',
    fontWeight: '800',
    fontSize: 15,
  },
});
