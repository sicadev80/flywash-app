
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useProjectStore } from '../lib/projectStore';

const fmt = (v: number) => v.toFixed(2).replace('.', ',');

export default function ProjectsScreen() {
  const router = useRouter();
  const projects = useProjectStore((state) => state.projects);
  const deleteProject = useProjectStore((state) => state.deleteProject);
  const getProjectTotals = useProjectStore((state) => state.getProjectTotals);

  const activeProjects = [...projects]
    .filter((project) =>
      project.status !== 'quoted' &&
      project.status !== 'sent' &&
      project.status !== 'approved' &&
      project.status !== 'scheduled' &&
      project.status !== 'refused' &&
      project.status !== 'archived'
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable style={styles.topPill} onPress={() => router.back()}>
          <Text style={styles.topPillText}>Retour</Text>
        </Pressable>

        <Text style={styles.title}>Mes projets en cours</Text>

        <Pressable
          style={[styles.topPill, styles.goldPill]}
          onPress={() => router.push('/project-new')}
        >
          <Text style={styles.goldPillText}>Nouveau</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeProjects.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aucun projet en cours</Text>
            <Text style={styles.emptyText}>
              Crée ton premier projet pour regrouper façades, toitures et totaux chantier.
            </Text>

            <Pressable
              style={styles.goldButtonLarge}
              onPress={() => router.push('/project-new')}
            >
              <Text style={styles.goldButtonText}>Créer un projet</Text>
            </Pressable>
          </View>
        ) : null}

        {activeProjects.map((project) => {
          const totals = getProjectTotals(project.id);

          return (
            <Pressable
              key={project.id}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/project-detail',
                  params: { projectId: project.id },
                })
              }
            >
              <Text style={styles.cardTitle}>{project.clientName || 'Projet sans nom'}</Text>
              <Text style={styles.projectDate}>{formatDate(project.createdAt)}</Text>
              <Text style={styles.cardSub}>{project.address}</Text>
              <Text style={styles.cardSub}>
                {[project.postalCode, project.city].filter(Boolean).join(' ')}
              </Text>
              <Text style={styles.cardSub}>
                {project.phone || 'Téléphone non renseigné'}
              </Text>

              <View style={styles.metricsWrap}>
                <Text style={styles.metric}>Statut : {project.status || 'draft'}</Text>
                <Text style={styles.metric}>Bâtiments : {totals.buildingCount}</Text>
                <Text style={styles.metric}>Façades : {totals.facadeCount}</Text>
                <Text style={styles.metric}>Toitures : {totals.roofCount}</Text>
                <Text style={styles.total}>
                  Surface façades : {fmt(totals.netFacadeAreaM2)} m²
                </Text>
                <Text style={styles.total}>
                  Surface toitures : {fmt(totals.roofAreaM2)} m²
                </Text>
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
                  style={styles.dangerButton}
                  onPress={() => deleteProject(project.id)}
                >
                  <Text style={styles.dangerButtonText}>Supprimer</Text>
                </Pressable>
              </View>
            </Pressable>
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
  goldPill: {
    backgroundColor: '#D4AF37',
  },
  goldPillText: {
    color: '#111111',
    fontWeight: '900',
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
  goldButtonLarge: {
    marginTop: 12,
    backgroundColor: '#D4AF37',
    borderRadius: 16,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goldButtonText: {
    color: '#111111',
    fontWeight: '900',
    fontSize: 16,
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
  dangerButton: {
    flex: 1,
    backgroundColor: '#FCE8E6',
    borderRadius: 14,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#C0392B',
    fontWeight: '800',
    fontSize: 15,
  },
});
