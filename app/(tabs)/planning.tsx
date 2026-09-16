import GlideScreen from '../../components/glide/GlideScreen';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProjectStore } from '../../lib/projectStore';
import type { ProjectItem } from '../../lib/projectStore';

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

function toIsoFromFrench(dateValue: string, timeValue: string) {
  const dateMatch = dateValue.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const timeMatch = timeValue.trim().match(/^(\d{2}):(\d{2})$/);
  if (!dateMatch || !timeMatch) return null;
  const [, dd, mm, yyyy] = dateMatch;
  const [, hh, min] = timeMatch;
  const iso = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min), 0, 0);
  if (Number.isNaN(iso.getTime())) return null;
  return iso.toISOString();
}

type PlanningItem = {
  kind: 'chantier' | 'visite';
  project: ProjectItem;
  when: string;
};

export default function PlanningScreen() {
  const router = useRouter();
  const projects = useProjectStore((state) => state.projects);
  const getProjectTotals = useProjectStore((state) => state.getProjectTotals);
  const updateProject = useProjectStore((state) => state.updateProject);
  const setProjectStatus = useProjectStore((state) => state.setProjectStatus);

  const [replanModalVisible, setReplanModalVisible] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('10:00');

  const planningItems = useMemo<PlanningItem[]>(() => {
    const chantiers: PlanningItem[] = projects
      .filter((project) => project.status === 'scheduled')
      .map((project) => ({ kind: 'chantier', project, when: project.scheduledFor || project.updatedAt }));

    const visites: PlanningItem[] = projects
      .filter((project) => project.status === 'visit-scheduled')
      .map((project) => ({ kind: 'visite', project, when: project.visitScheduledFor || project.updatedAt }));

    return [...chantiers, ...visites].sort(
      (a, b) => new Date(a.when).getTime() - new Date(b.when).getTime()
    );
  }, [projects]);

  const selectedProject = projects.find((project) => project.id === selectedProjectId) || null;

  function openReplanModal(projectId: string) {
    setSelectedProjectId(projectId);
    setVisitDate('');
    setVisitTime('10:00');
    setReplanModalVisible(true);
  }

  function closeReplanModal() {
    setReplanModalVisible(false);
    setSelectedProjectId(null);
  }

  function handleConfirmReplan() {
    if (!selectedProjectId) return;
    const iso = toIsoFromFrench(visitDate, visitTime);
    if (!iso) {
      Alert.alert('Date invalide', 'Saisis une date JJ/MM/AAAA et une heure HH:MM.');
      return;
    }
    updateProject(selectedProjectId, { visitScheduledFor: iso });
    closeReplanModal();
    Alert.alert('Visite replanifiée', 'La nouvelle date a bien été enregistrée.');
  }

  function handleCompleteVisit(projectId: string) {
    Alert.alert(
      'Visite effectuée',
      'Confirmer que la visite de suivi a bien eu lieu ? Le chantier passera dans ton archive.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'default',
          onPress: () => {
            updateProject(projectId, { visitCompletedAt: new Date().toISOString() });
            setProjectStatus(projectId, 'completed');
          },
        },
      ]
    );
  }

  return (
    <GlideScreen title="Planning" style={styles.screen}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Planning</Text>
        <View style={styles.counterPill}>
          <Text style={styles.counterText}>{planningItems.length}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {planningItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Rien de planifié</Text>
            <Text style={styles.emptyText}>
              Les chantiers planifiés et les visites de suivi programmées apparaîtront ici.
            </Text>
          </View>
        ) : null}

        {planningItems.map((item) => {
          const { project } = item;
          const totals = getProjectTotals(project.id);
          const totalSurface = totals.netFacadeAreaM2 + totals.roofAreaM2;

          if (item.kind === 'chantier') {
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
                <View style={[styles.badge, styles.badgeChantier]}>
                  <Text style={[styles.badgeText, styles.badgeTextChantier]}>Chantier</Text>
                </View>
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
          }

          return (
            <View key={project.id} style={styles.card}>
              <View style={[styles.badge, styles.badgeVisite]}>
                <Text style={[styles.badgeText, styles.badgeTextVisite]}>Visite</Text>
              </View>
              <Text style={styles.visitDate}>{formatScheduled(project.visitScheduledFor)}</Text>
              <Text style={styles.cardTitle}>{project.clientName || 'Projet sans nom'}</Text>
              <Text style={styles.cardSub}>{project.address}</Text>
              <Text style={styles.cardSub}>
                {[project.postalCode, project.city].filter(Boolean).join(' ')}
              </Text>
              <Text style={styles.cardSub}>{project.phone || 'Téléphone non renseigné'}</Text>

              <View style={styles.actions}>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() =>
                    router.push({
                      pathname: '/archive-detail',
                      params: { projectId: project.id },
                    })
                  }
                >
                  <Text style={styles.secondaryButtonText}>Ouvrir</Text>
                </Pressable>

                <Pressable style={styles.replanButton} onPress={() => openReplanModal(project.id)}>
                  <Text style={styles.replanButtonText}>Replanifier</Text>
                </Pressable>
              </View>

              <Pressable style={styles.completeButton} onPress={() => handleCompleteVisit(project.id)}>
                <Text style={styles.completeButtonText}>Visite effectuée</Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={replanModalVisible} transparent animationType="fade" onRequestClose={closeReplanModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Replanifier la visite</Text>

            {selectedProject ? (
              <View style={styles.modalProjectCard}>
                <Text style={styles.modalProjectName}>{selectedProject.clientName}</Text>
                <Text style={styles.modalProjectText}>{selectedProject.address}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={visitDate}
              onChangeText={setVisitDate}
              placeholder="Ex : 12/04/2026"
              placeholderTextColor="#8C8C93"
            />

            <Text style={styles.label}>Heure</Text>
            <TextInput
              style={styles.input}
              value={visitTime}
              onChangeText={setVisitTime}
              placeholder="Ex : 10:00"
              placeholderTextColor="#8C8C93"
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={closeReplanModal}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </Pressable>

              <Pressable style={styles.modalConfirmButton} onPress={handleConfirmReplan}>
                <Text style={styles.modalConfirmText}>Valider</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 6,
  },
  badgeText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.4 },
  badgeChantier: { backgroundColor: '#F6EFD9' },
  badgeTextChantier: { color: '#B38918' },
  badgeVisite: { backgroundColor: '#DCEEF7' },
  badgeTextVisite: { color: '#1F6FA8' },
  missionDate: {
    color: '#1F7A3D',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 4,
  },
  visitDate: {
    color: '#1F6FA8',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 4,
  },
  cardTitle: { color: '#1C1C1E', fontSize: 18, fontWeight: '900' },
  cardSub: { color: '#5A5A5E', fontSize: 14 },
  metric: { color: '#3A3A3C', fontSize: 14, marginTop: 6 },
  total: { color: '#B8962E', fontSize: 15, fontWeight: '900', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#E7E2D9',
    borderRadius: 14,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#1C1C1E', fontWeight: '800', fontSize: 15 },
  replanButton: {
    flex: 1,
    backgroundColor: '#F6EFD9',
    borderRadius: 14,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  replanButtonText: { color: '#B38918', fontWeight: '800', fontSize: 15 },
  completeButton: {
    marginTop: 10,
    backgroundColor: '#DDF5E3',
    borderRadius: 14,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButtonText: { color: '#1F7A3D', fontWeight: '800', fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2D7C3',
  },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1C1C1E', marginBottom: 14 },
  modalProjectCard: { backgroundColor: '#F7F7F9', borderRadius: 14, padding: 12, marginBottom: 14 },
  modalProjectName: { fontSize: 16, fontWeight: '900', color: '#1C1C1E' },
  modalProjectText: { fontSize: 14, color: '#5A5A5E', marginTop: 2 },
  label: { color: '#1C1C1E', fontSize: 14, fontWeight: '700', marginBottom: 6, marginTop: 4 },
  input: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2D7C3',
    backgroundColor: '#F7F7F9',
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#1C1C1E',
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  modalCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E7E2D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 16, fontWeight: '800', color: '#1C1C1E' },
  modalConfirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmText: { fontSize: 16, fontWeight: '900', color: '#111111' },
});
