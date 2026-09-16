import GlideScreen from '../components/glide/GlideScreen';
import React, { useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useProjectStore } from '../lib/projectStore';

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

function isoToFrenchDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = String(date.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

function isoToFrenchTime(value?: string) {
  if (!value) return '08:00';
  const date = new Date(value);
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

export default function MissionDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ projectId?: string }>();
  const projectId = typeof params.projectId === 'string' ? params.projectId : '';

  const foundProject = useProjectStore((state) => state.getProjectById(projectId));
  const updateProject = useProjectStore((state) => state.updateProject);
  const setProjectStatus = useProjectStore((state) => state.setProjectStatus);
  const getProjectTotals = useProjectStore((state) => state.getProjectTotals);

  const [replanModalVisible, setReplanModalVisible] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(isoToFrenchDate(foundProject?.scheduledFor));
  const [scheduledTime, setScheduledTime] = useState(isoToFrenchTime(foundProject?.scheduledFor));

  const [visitModalVisible, setVisitModalVisible] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('10:00');

  if (!foundProject) {
    return (
      <GlideScreen title="Mission" style={styles.screen}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Mission introuvable</Text>
        </View>
      </GlideScreen>
    );
  }

  // Rebind to a non-optional const so TypeScript knows every handler below
  // (even nested function declarations) is dealing with a real project.
  const project = foundProject;

  const totals = getProjectTotals(project.id);
  const totalSurface = totals.netFacadeAreaM2 + totals.roofAreaM2;

  function handleOpenReplan() {
    setScheduledDate(isoToFrenchDate(project.scheduledFor));
    setScheduledTime(isoToFrenchTime(project.scheduledFor));
    setReplanModalVisible(true);
  }

  function handleConfirmReplan() {
    const iso = toIsoFromFrench(scheduledDate, scheduledTime);
    if (!iso) {
      Alert.alert('Date invalide', 'Saisis une date JJ/MM/AAAA et une heure HH:MM.');
      return;
    }
    updateProject(project.id, { scheduledFor: iso });
    setReplanModalVisible(false);
    Alert.alert('Mission replanifiée', 'La nouvelle date a bien été enregistrée.');
  }

  function handleFinishMission() {
    Alert.alert(
      'Fin de chantier',
      'Confirmer la clôture de cette mission ?',
      [
        { text: 'Retour', style: 'cancel' },
        {
          text: 'Clôturer',
          style: 'default',
          onPress: () => {
            setVisitDate('');
            setVisitTime('10:00');
            setVisitModalVisible(true);
          },
        },
      ]
    );
  }

  function handleSkipVisit() {
    updateProject(project.id, { completedAt: new Date().toISOString() });
    setProjectStatus(project.id, 'completed');
    setVisitModalVisible(false);
    router.replace('/archive');
  }

  function handleConfirmVisit() {
    const iso = toIsoFromFrench(visitDate, visitTime);
    if (!iso) {
      Alert.alert('Date invalide', 'Saisis une date JJ/MM/AAAA et une heure HH:MM.');
      return;
    }
    updateProject(project.id, { completedAt: new Date().toISOString(), visitScheduledFor: iso });
    setProjectStatus(project.id, 'visit-scheduled');
    setVisitModalVisible(false);
    router.replace('/planning');
  }

  const roofPrep = project.roofProductsSummary;
  const facadePrep = project.facadeProductsSummary;

  return (
    <GlideScreen title="Mission">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <Text style={styles.missionDate}>{formatScheduled(project.scheduledFor)}</Text>
          <Text style={styles.clientName}>{project.clientName}</Text>
          <Text style={styles.clientText}>{project.address}</Text>
          <Text style={styles.clientText}>
            {[project.postalCode, project.city].filter(Boolean).join(' ')}
          </Text>
          <Text style={styles.clientText}>{project.phone || 'Téléphone non renseigné'}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Surfaces à traiter</Text>
          <Text style={styles.metric}>Façades nettes : {fmt(totals.netFacadeAreaM2)} m²</Text>
          <Text style={styles.metric}>Toitures : {fmt(totals.roofAreaM2)} m²</Text>
          <Text style={styles.total}>Surface totale : {fmt(totalSurface)} m²</Text>
          <Text style={styles.total}>Montant devis : {fmt(project.quoteAmount || 0)} € HT</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Préparation produits</Text>

          {roofPrep ? (
            <View style={styles.subCard}>
              <Text style={styles.subTitle}>Toiture</Text>
              <Text style={styles.metric}>Produit : {roofPrep.productLabel || roofPrep.treatment || '-'}</Text>
              <Text style={styles.metric}>Mélange : {fmt(roofPrep.volumeMelange || 0)} L</Text>
              <Text style={styles.metric}>Produit pur : {fmt(roofPrep.produitPur || 0)} L</Text>
{roofPrep.boosterVolume ? (
  <Text style={styles.metric}>
    Booster : {roofPrep.boosterLabel || '-' } ({roofPrep.boosterPercent || 0}%)
  </Text>
) : null}
{roofPrep.boosterVolume ? ( 
  <Text style={styles.metric}>
    Booster : {fmt(roofPrep.boosterVolume)} L
  </Text>
) : null}

<Text style={styles.metric}>
  Total cuve : {fmt((roofPrep.volumeMelange || 0) + (roofPrep.boosterVolume || 0))} L
</Text>
              <Text style={styles.metric}>Eau : {fmt(roofPrep.eau || 0)} L</Text>
              <Text style={styles.metric}>Rinçage : {roofPrep.rinseEnabled ? 'Oui' : 'Non'}</Text>
              <Text style={styles.metric}>Eau rinçage : {fmt(roofPrep.rinseWater || 0)} L</Text>
          </View>
          ) : null}

          {facadePrep ? (
            <View style={styles.subCard}>
              <Text style={styles.subTitle}>Façade</Text>
              <Text style={styles.metric}>Produit : {facadePrep.productLabel || facadePrep.treatment || '-'}</Text>
              <Text style={styles.metric}>Mélange : {fmt(facadePrep.volumeMelange || 0)} L</Text>
              <Text style={styles.metric}>Produit pur : {fmt(facadePrep.produitPur || 0)} L</Text>
{facadePrep.boosterVolume ? (
  <Text style={styles.metric}>
    Booster : {facadePrep.boosterLabel || '-'} ({facadePrep.boosterPercent || 0}%)
  </Text>
) : null}
{facadePrep.boosterVolume ? (
  <Text style={styles.metric}>
    Booster : {fmt(facadePrep.boosterVolume)} L
  </Text>
) : null}
<Text style={styles.metric}>
  Total cuve : {fmt((facadePrep.volumeMelange || 0) + (facadePrep.boosterVolume || 0))} L
</Text>       
        
              <Text style={styles.metric}>Eau : {fmt(facadePrep.eau || 0)} L</Text>
              <Text style={styles.metric}>Rinçage : {facadePrep.rinseEnabled ? 'Oui' : 'Non'}</Text>
              <Text style={styles.metric}>Eau rinçage : {fmt(facadePrep.rinseWater || 0)} L</Text>
            </View>
          ) : null}

          {!roofPrep && !facadePrep ? (
            <Text style={styles.helperText}>
              Les volumes produits seront visibles ici dès qu’ils seront enregistrés depuis l’écran de chiffrage.
            </Text>
          ) : null}
        </View>

        <View style={styles.actionsWrap}>
          <Pressable style={styles.secondaryButton} onPress={handleOpenReplan}>
            <Text style={styles.secondaryButtonText}>Replanifier</Text>
          </Pressable>

          <Pressable style={styles.primaryButton} onPress={handleFinishMission}>
            <Text style={styles.primaryButtonText}>Fin de chantier</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={replanModalVisible} transparent animationType="fade" onRequestClose={() => setReplanModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Replanifier</Text>

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

            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={() => setReplanModalVisible(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </Pressable>

              <Pressable style={styles.modalConfirmButton} onPress={handleConfirmReplan}>
                <Text style={styles.modalConfirmText}>Valider</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={visitModalVisible} transparent animationType="fade" onRequestClose={() => setVisitModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Visite de suivi</Text>
            <Text style={styles.helperText}>
              Tu peux programmer une visite pour contrôler le résultat dans le temps, ou archiver directement ce chantier.
            </Text>

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
              <Pressable style={styles.modalCancelButton} onPress={handleSkipVisit}>
                <Text style={styles.modalCancelText}>Archiver sans visite</Text>
              </Pressable>

              <Pressable style={styles.modalConfirmButton} onPress={handleConfirmVisit}>
                <Text style={styles.modalConfirmText}>Programmer la visite</Text>
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
  content: { padding: 14, gap: 14, paddingBottom: 40 },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2D7C3',
  },
  missionDate: { color: '#1F7A3D', fontSize: 15, fontWeight: '900', marginBottom: 6 },
  clientName: { color: '#1C1C1E', fontSize: 22, fontWeight: '900' },
  clientText: { color: '#5A5A5E', fontSize: 15, marginTop: 2 },
  summaryCard: {
    backgroundColor: '#EFE8DB',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2D7C3',
    gap: 6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2D7C3',
    gap: 10,
  },
  subCard: {
    backgroundColor: '#F8F6F1',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2D7C3',
    gap: 4,
  },
  subTitle: { fontSize: 17, fontWeight: '900', color: '#1C1C1E' },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1C1C1E' },
  metric: { color: '#3A3A3C', fontSize: 14 },
  total: { color: '#B8962E', fontSize: 15, fontWeight: '900' },
  helperText: { color: '#6C6C70', fontSize: 14, lineHeight: 20 },
  actionsWrap: { flexDirection: 'row', gap: 10 },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#E7E2D9',
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#1C1C1E', fontWeight: '800', fontSize: 16 },
  primaryButton: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  emptyCard: { margin: 24, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#1C1C1E' },
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
