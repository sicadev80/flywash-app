
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProjectStore } from '../lib/projectStore';

const fmt = (v: number) => v.toFixed(2).replace('.', ',');

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

export default function ToPlanScreen() {
  const router = useRouter();
  const projects = useProjectStore((state) => state.projects);
  const setProjectStatus = useProjectStore((state) => state.setProjectStatus);
  const updateProject = useProjectStore((state) => state.updateProject);
  const getProjectTotals = useProjectStore((state) => state.getProjectTotals);

  const [planningModalVisible, setPlanningModalVisible] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('08:00');

  const planningProjects = useMemo(
    () =>
      [...projects]
        .filter((project) => project.status === 'approved')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [projects]
  );

  const selectedProject =
    planningProjects.find((project) => project.id === selectedProjectId) || null;

  function openPlanningModal(projectId: string) {
    setSelectedProjectId(projectId);
    setScheduledDate('');
    setScheduledTime('08:00');
    setPlanningModalVisible(true);
  }

  function closePlanningModal() {
    setPlanningModalVisible(false);
    setSelectedProjectId(null);
    setScheduledDate('');
    setScheduledTime('08:00');
  }

  function handleConfirmPlanning() {
    if (!selectedProjectId) return;
    const iso = toIsoFromFrench(scheduledDate, scheduledTime);
    if (!iso) {
      Alert.alert('Date invalide', 'Saisis une date JJ/MM/AAAA et une heure HH:MM.');
      return;
    }
    updateProject(selectedProjectId, { scheduledFor: iso });
    setProjectStatus(selectedProjectId, 'scheduled');
    closePlanningModal();
    Alert.alert('Chantier planifié', 'Le chantier a bien été planifié.');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable style={styles.topPill} onPress={() => router.back()}>
          <Text style={styles.topPillText}>Retour</Text>
        </Pressable>
        <Text style={styles.title}>Mes chantiers à planifier</Text>
        <View style={styles.counterPill}>
          <Text style={styles.counterText}>{planningProjects.length}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {planningProjects.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aucun chantier à planifier</Text>
            <Text style={styles.emptyText}>
              Les devis acceptés apparaîtront ici pour être transformés en missions planifiées.
            </Text>
          </View>
        ) : null}

        {planningProjects.map((project) => {
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
              <Text style={styles.cardSub}>{project.phone || 'Téléphone non renseigné'}</Text>

              <View style={styles.metricsWrap}>
                <Text style={styles.metric}>Statut : {project.status || 'approved'}</Text>
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

                <Pressable style={styles.scheduleButton} onPress={() => openPlanningModal(project.id)}>
                  <Text style={styles.scheduleButtonText}>Planifier</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={planningModalVisible} transparent animationType="fade" onRequestClose={closePlanningModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Planifier le chantier</Text>

            {selectedProject ? (
              <View style={styles.modalProjectCard}>
                <Text style={styles.modalProjectName}>{selectedProject.clientName}</Text>
                <Text style={styles.modalProjectText}>{selectedProject.address}</Text>
                <Text style={styles.modalProjectText}>
                  {[selectedProject.postalCode, selectedProject.city].filter(Boolean).join(' ')}
                </Text>
              </View>
            ) : null}

            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={scheduledDate}
              onChangeText={setScheduledDate}
              placeholder="Ex : 12/04/2026"
              placeholderTextColor="#8C8C93"
            />

            <Text style={styles.label}>Heure</Text>
            <TextInput
              style={styles.input}
              value={scheduledTime}
              onChangeText={setScheduledTime}
              placeholder="Ex : 08:00"
              placeholderTextColor="#8C8C93"
            />

            <Text style={styles.helperText}>
              Saisis la date au format JJ/MM/AAAA et l’heure au format HH:MM.
            </Text>

            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={closePlanningModal}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </Pressable>

              <Pressable style={styles.modalConfirmButton} onPress={handleConfirmPlanning}>
                <Text style={styles.modalConfirmText}>Valider</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  projectDate: { fontSize: 12, color: '#7A7A80', marginTop: 4 },
  content: { padding: 14, gap: 14, paddingBottom: 40 },
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
  },
  cardTitle: { color: '#1C1C1E', fontSize: 18, fontWeight: '900' },
  cardSub: { color: '#5A5A5E', fontSize: 14, marginTop: 2 },
  metricsWrap: { marginTop: 12, gap: 4 },
  metric: { color: '#3A3A3C', fontSize: 14 },
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
  scheduleButton: {
    flex: 1,
    backgroundColor: '#DDF5E3',
    borderRadius: 14,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleButtonText: { color: '#1F7A3D', fontWeight: '800', fontSize: 15 },
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
  helperText: { color: '#6C6C70', fontSize: 13, lineHeight: 18, marginTop: 10 },
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
