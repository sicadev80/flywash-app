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
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from 'expo-router/react-navigation';
import { useProjectStore } from '../../lib/projectStore';
import { loadCompanyProfile } from '../../lib/companyStore';
import { reserveNextDevisNumber } from '../../lib/companyStore';
import { generateDevisPdf } from '../../lib/devisExport';

const fmt = (v: number) => v.toFixed(2).replace('.', ',');

export default function ProjectDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ projectId?: string }>();
  const projectId = typeof params.projectId === 'string' ? params.projectId : '';

  const foundProject = useProjectStore((state) => state.getProjectById(projectId));
  const addBuilding = useProjectStore((state) => state.addBuilding);
  const deleteProject = useProjectStore((state) => state.deleteProject);
  const getProjectTotals = useProjectStore((state) => state.getProjectTotals);
  const setProjectStatus = useProjectStore(state => state.setProjectStatus);
  const updateProject = useProjectStore((state) => state.updateProject);
  const [buildingModalVisible, setBuildingModalVisible] = useState(false);
  const [buildingName, setBuildingName] = useState('');
  const [generatingDevis, setGeneratingDevis] = useState(false);

  if (!foundProject) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerWrap}>
          <Text style={styles.title}>Projet introuvable</Text>
          <Pressable style={styles.goldButton} onPress={() => router.replace('/projects')}>
            <Text style={styles.goldButtonText}>Retour à mes projets</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Rebind to a non-optional const so TypeScript knows every handler below
  // (even nested function declarations) is dealing with a real project.
  const project = foundProject;

  const totals = getProjectTotals(project.id);

  function handleAddBuilding() {
    setBuildingName('');
    setBuildingModalVisible(true);
  }

  function handleConfirmAddBuilding() {
    addBuilding(project.id, buildingName.trim() || 'Nouveau bâtiment');
    setBuildingModalVisible(false);
    setBuildingName('');
  }

  function handleCancelAddBuilding() {
    setBuildingModalVisible(false);
    setBuildingName('');
  }

  function handleSaveProject() {
    Alert.alert('Projet enregistré', 'Le projet a bien été enregistré dans Mes projets.');
    router.replace({
      pathname: '/project-new',
      params: { reset: String(Date.now()) },
    });
  }

  function handleCancelProject() {
    Alert.alert(
      'Annuler le projet',
      'Le projet en cours sera supprimé si tu annules maintenant.',
      [
        { text: 'Retour', style: 'cancel' },
        {
          text: 'Annuler le projet',
          style: 'destructive',
          onPress: () => {
            deleteProject(project.id);
            router.replace('/');
          },
        },
      ]
    );
  }

  function handleQuoteProject() {
    if (totals.netFacadeAreaM2 <= 0 && totals.roofAreaM2 <= 0) {
      Alert.alert(
        'Projet incomplet',
        'Ajoute au moins une façade nette ou une toiture avant de chiffrer le projet.'
      );
      return;
    }

    setProjectStatus(project.id, 'quoted');

    router.push({
      pathname: '/pricing',
      params: {
        projectId: project.id,
        facadeNetM2: String(totals.netFacadeAreaM2),
        roofM2: String(totals.roofAreaM2),
        totalM2: String(totals.netFacadeAreaM2 + totals.roofAreaM2),
      },
    });
  }

  async function handleGenerateDevis() {
    if (!project.quoteAmount) {
      Alert.alert(
        'Projet non chiffré',
        'Chiffre le projet avant de générer le devis.'
      );
      return;
    }

    setGeneratingDevis(true);
    try {
      const company = await loadCompanyProfile();

      let devisNumber = project.devisNumber;
      let devisDate = project.devisDate;

      if (!devisNumber) {
        devisNumber = await reserveNextDevisNumber();
        devisDate = new Date().toISOString();
        updateProject(project.id, { devisNumber, devisDate });
      }

      await generateDevisPdf({ ...project, devisNumber, devisDate }, company);
    } catch (error) {
      Alert.alert('Erreur', "Impossible de générer le devis PDF pour le moment.");
    } finally {
      setGeneratingDevis(false);
    }
  }

return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.menuButton}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu" size={26} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Projet</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{project.clientName}</Text>
          <Text style={styles.text}>{project.address}</Text>
          <Text style={styles.text}>
            {[project.postalCode, project.city].filter(Boolean).join(' ')}
          </Text>
          <Text style={styles.text}>{project.phone || 'Téléphone non renseigné'}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Résumé projet</Text>
          <Text style={styles.metric}>Bâtiments : {totals.buildingCount}</Text>
          <Text style={styles.metric}>Façades : {totals.facadeCount}</Text>
          <Text style={styles.metric}>Toitures : {totals.roofCount}</Text>
          <Text style={styles.metric}>Surface façades brute : {fmt(totals.grossFacadeAreaM2)} m²</Text>
          <Text style={styles.metric}>Ouvrants : {fmt(totals.voidsAreaM2)} m²</Text>
          <Text style={styles.total}>Surface façades : {fmt(totals.netFacadeAreaM2)} m²</Text>
          <Text style={styles.total}>Surface toitures : {fmt(totals.roofAreaM2)} m²</Text>
          {!!project.quoteAmount && (
            <Text style={styles.total}>Devis HT : {fmt(project.quoteAmount)} €</Text>
          )}
        </View>

        <Pressable style={styles.goldButton} onPress={handleAddBuilding}>
          <Text style={styles.goldButtonText}>Ajouter un bâtiment</Text>
        </Pressable>

        {project.buildings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aucun bâtiment</Text>
            <Text style={styles.emptyText}>
              Ajoute un premier bâtiment pour y rattacher des façades et des toitures.
            </Text>
          </View>
        ) : null}

        {project.buildings.map((building, index) => (
          <View key={building.id} style={styles.card}>
            <Text style={styles.sectionTitle}>{building.name || `Bâtiment ${index + 1}`}</Text>

            <Text style={styles.metric}>Façades : {building.facades.length}</Text>
            <Text style={styles.metric}>Toitures : {building.roofs.length}</Text>

            <View style={styles.actionsRow}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() =>
                  router.push({
                    pathname: '/project-facade-pointing',
                    params: {
                      projectId: project.id,
                      buildingId: building.id,
                    },
                  })
                }
              >
                <Text style={styles.secondaryButtonText}>Ajouter une façade</Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={() =>
                  router.push({
                    pathname: '/project-roof-pointing',
                    params: {
                      projectId: project.id,
                      buildingId: building.id,
                    },
                  })
                }
              >
                <Text style={styles.secondaryButtonText}>Ajouter une toiture</Text>
              </Pressable>
            </View>

            {building.facades.map((facade) => (
              <View key={facade.id} style={styles.subCard}>
                <Text style={styles.subTitle}>{facade.name}</Text>
                <Text style={styles.text}>Brute : {fmt(facade.grossAreaM2)} m²</Text>
                <Text style={styles.text}>Ouvrants : {fmt(facade.voidsAreaM2)} m²</Text>
                <Text style={styles.text}>Nette : {fmt(facade.netAreaM2)} m²</Text>
              </View>
            ))}

            {building.roofs.map((roof) => (
              <View key={roof.id} style={styles.subCard}>
                <Text style={styles.subTitle}>{roof.name}</Text>
                <Text style={styles.text}>Surface : {fmt(roof.areaM2)} m²</Text>
              </View>
            ))}
          </View>
        ))}

       <View style={styles.bottomActions}>
  <Pressable style={styles.cancelButton} onPress={handleCancelProject}>
    <Text style={styles.cancelButtonText}>Annuler</Text>
  </Pressable>

  <Pressable style={styles.goldButtonFlex} onPress={handleSaveProject}>
    <Text style={styles.goldButtonText}>Enregistrer</Text>
  </Pressable>

<Pressable style={styles.quoteButtonFull} onPress={handleQuoteProject}>
  <Text style={styles.quoteButtonText}>Chiffrer le projet</Text>
</Pressable>
</View>

{!!project.quoteAmount && (
  <Pressable
    style={[styles.devisButtonFull, generatingDevis && styles.devisButtonDisabled]}
    onPress={handleGenerateDevis}
    disabled={generatingDevis}
  >
    <Text style={styles.devisButtonText}>
      {generatingDevis ? 'Génération…' : 'Générer le devis PDF'}
    </Text>
  </Pressable>
)}

      </ScrollView>

      <Modal
        visible={buildingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelAddBuilding}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nom du bâtiment</Text>

            <TextInput
              value={buildingName}
              onChangeText={setBuildingName}
              placeholder="Ex : Maison principale"
              placeholderTextColor="#8C8C93"
              style={styles.modalInput}
              autoFocus
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={handleCancelAddBuilding}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </Pressable>

              <Pressable style={styles.modalConfirmButton} onPress={handleConfirmAddBuilding}>
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
  container: { flex: 1, backgroundColor: '#F6F3EE' },
  centerWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: {
    height: 96,
    backgroundColor: '#C8A542',
    paddingTop: 42,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  content: { padding: 16, gap: 14, paddingBottom: 120 },
  title: { fontSize: 28, fontWeight: '900', color: '#1C1C1E', marginBottom: 4 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2D7C3',
    gap: 8,
  },
  subCard: {
    backgroundColor: '#F8F6F1',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2D7C3',
    gap: 4,
    marginTop: 10,
  },
  subTitle: { fontSize: 17, fontWeight: '900', color: '#1C1C1E' },
  summaryCard: {
    backgroundColor: '#EFE8DB',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2D7C3',
    gap: 8,
  },
  cardTitle: { fontSize: 22, fontWeight: '900', color: '#1C1C1E' },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1C1C1E', marginBottom: 6 },
  text: { fontSize: 15, color: '#5A5A5E' },
  metric: { fontSize: 15, color: '#3A3A3C' },
  total: { fontSize: 20, fontWeight: '900', color: '#B8962E', marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#E7E2D9',
    borderRadius: 16,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  secondaryButtonText: { color: '#1C1C1E', fontWeight: '800', fontSize: 16, textAlign: 'center' },
  goldButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goldButtonFlex: {
    flex: 1,
    backgroundColor: '#D4AF37',
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goldButtonText: { color: '#111111', fontWeight: '900', fontSize: 17 },
  quoteButtonFull: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quoteButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  devisButtonFull: {
    marginTop: 10,
    backgroundColor: '#C79A2B',
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  devisButtonDisabled: { opacity: 0.6 },
  devisButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E7E2D9',
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: { color: '#1C1C1E', fontWeight: '800', fontSize: 17 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2D7C3',
  },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#1C1C1E', marginBottom: 6 },
  emptyText: { fontSize: 15, color: '#5A5A5E' },
  bottomActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
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
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1C1C1E', marginBottom: 14 },
  modalInput: {
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
