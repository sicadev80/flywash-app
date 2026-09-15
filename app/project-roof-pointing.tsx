import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import type { Region } from 'react-native-maps';
import GlideScreen from '../components/glide/GlideScreen';
import { TerrainMap } from '../components/surface/TerrainMap';
import { polygonAreaSquareMeters, type LatLng } from '../lib/polygonArea';
import { calcFlatSlope } from '../lib/surfaceCalculations';
import { getPendingTerrainState, setPendingTerrainState } from '../lib/terrainStateStore';
import { useProjectStore } from '../lib/projectStore';

const DEFAULT_REGION: Region = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const QUICK_ANGLES = ['15', '25', '35', '45'];

export default function ProjectRoofPointingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    measuredAngle?: string;
    projectId?: string;
    buildingId?: string;
  }>();

  const projectId = typeof params.projectId === 'string' ? params.projectId : '';
  const buildingId = typeof params.buildingId === 'string' ? params.buildingId : '';

  const addRoofToBuilding = useProjectStore((s) => s.addRoofToBuilding);
  const getProjectById = useProjectStore((s) => s.getProjectById);

  const saved = getPendingTerrainState();
  const project = getProjectById(projectId);
  const building = project?.buildings.find((b) => b.id === buildingId);

  const [region, setRegion] = useState<Region>(saved?.region || DEFAULT_REGION);
  const [points, setPoints] = useState<LatLng[]>(saved?.points || []);
  const [angle, setAngle] = useState(saved?.angle || '');
  const [roofName, setRoofName] = useState('Toiture principale');
  const [closed, setClosed] = useState(saved?.closed || false);
  const [baseLayer, setBaseLayer] = useState<'standard' | 'satellite' | 'hybrid'>('satellite');
  const [showIgnOrtho, setShowIgnOrtho] = useState(false);
  const [showCadastre, setShowCadastre] = useState(false);
  const [mapResetKey, setMapResetKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function initLocation() {
      if (saved?.region) return;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const position = await Location.getCurrentPositionAsync({});
        if (!active) return;

        setRegion({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.0008,
          longitudeDelta: 0.0008,
        });
      } catch {}
    }

    initLocation();

    return () => {
      active = false;
    };
  }, [saved?.region]);

  useEffect(() => {
    setPendingTerrainState({ points, closed, angle, region });
  }, [points, closed, angle, region]);

  useEffect(() => {
    if (typeof params.measuredAngle === 'string' && params.measuredAngle) {
      setAngle(params.measuredAngle);
    }
  }, [params.measuredAngle]);

  const surfaceAPlat = useMemo(() => {
    if (points.length < 3) return 0;
    return polygonAreaSquareMeters(points);
  }, [points]);

  const result = useMemo(() => {
    const angleNum = Number((angle || '').replace(',', '.')) || 0;
    if (!surfaceAPlat || !angleNum) return null;
    return calcFlatSlope(surfaceAPlat, angleNum);
  }, [surfaceAPlat, angle]);

  async function addPointAtCenter() {
    if (closed) return;

    setPoints((prev) => [
      ...prev,
      { latitude: region.latitude, longitude: region.longitude },
    ]);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  }

  function dragPoint(index: number, point: LatLng) {
    setPoints((prev) => prev.map((p, i) => (i === index ? point : p)));
  }

  async function undoLastPoint() {
    if (closed) {
      setClosed(false);
      return;
    }

    setPoints((prev) => prev.slice(0, -1));

    try {
      await Haptics.selectionAsync();
    } catch {}
  }

  function clearPolygon() {
    setPoints([]);
    setClosed(false);
    setAngle('');
    setMapResetKey((v) => v + 1);
    setPendingTerrainState({ points: [], closed: false, angle: '', region });
  }

  async function closePolygon() {
    if (points.length < 3) {
      Alert.alert('Polygone incomplet', 'Ajoute au moins 3 points.');
      return;
    }

    setClosed(true);

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  }

  function zoomIn() {
    setRegion((prev) => ({
      ...prev,
      latitudeDelta: Math.max(prev.latitudeDelta / 2, 0.000001),
      longitudeDelta: Math.max(prev.longitudeDelta / 2, 0.000001),
    }));
  }

  function zoomOut() {
    setRegion((prev) => ({
      ...prev,
      latitudeDelta: Math.min(prev.latitudeDelta * 2, 1),
      longitudeDelta: Math.min(prev.longitudeDelta * 2, 1),
    }));
  }

  function fitPolygon() {
    if (points.length === 0) return;

    const lats = points.map((p) => p.latitude);
    const lngs = points.map((p) => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDelta = Math.max((maxLat - minLat) * 1.8, 0.00008);
    const lngDelta = Math.max((maxLng - minLng) * 1.8, 0.00008);

    setRegion({
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    });
  }

  function goMeasureAngle() {
    setPendingTerrainState({ points, closed, angle, region });
    router.push('/inclinometer');
  }

  function saveRoofToProject() {
    if (!projectId || !buildingId) {
      Alert.alert('Projet manquant', 'Projet ou bâtiment cible introuvable.');
      return;
    }

    if (!closed || points.length < 3) {
      Alert.alert('Polygone incomplet', 'Ferme le polygone avant d’enregistrer la toiture.');
      return;
    }

    if (!result || !result.surfaceTotale) {
      Alert.alert('Pente manquante', 'Renseigne un angle de pente valide pour calculer la surface réelle.');
      return;
    }

    addRoofToBuilding(projectId, buildingId, {
      name: roofName.trim() || 'Toiture',
      areaM2: result.surfaceTotale,
    });

    router.replace({
      pathname: '/project-detail',
      params: { projectId },
    });
  }

  return (
    <GlideScreen title="Toiture projet">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.projectCard}>
          <Text style={styles.projectTitle}>
            {project?.clientName || 'Projet'} · {building?.name || 'Bâtiment'}
          </Text>
          <Text style={styles.subtitle}>
            Trace la toiture sur la carte, ferme le contour, puis renseigne l’angle de pente.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Nom de la toiture</Text>
          <TextInput
            style={styles.input}
            value={roofName}
            onChangeText={setRoofName}
            placeholder="Ex : Toiture principale"
            placeholderTextColor="#91919A"
          />
        </View>

        <View style={styles.toggleWrap}>
          <Toggle active={baseLayer === 'satellite'} label="Satellite" onPress={() => setBaseLayer('satellite')} />
          <Toggle active={baseLayer === 'standard'} label="Plan" onPress={() => setBaseLayer('standard')} />
          <Toggle active={showIgnOrtho} label="IGN ortho" onPress={() => setShowIgnOrtho((v) => !v)} />
          <Toggle active={showCadastre} label="Cadastre" onPress={() => setShowCadastre((v) => !v)} />
        </View>

        <View style={styles.mapCard}>
          <TerrainMap
            region={region}
            onRegionChangeComplete={setRegion}
            points={points}
            onDragPoint={dragPoint}
            closed={closed}
            baseLayer={baseLayer}
            showIgnOrtho={showIgnOrtho}
            showCadastre={showCadastre}
            mapKey={`${mapResetKey}-${showIgnOrtho}-${showCadastre}`}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onFitPolygon={fitPolygon}
          />
        </View>

        <View style={styles.inlineActions}>
          <Pressable style={[styles.actionButton, styles.primaryAction]} onPress={addPointAtCenter}>
            <Text style={styles.primaryActionText}>+ Point</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, styles.secondaryAction]} onPress={undoLastPoint}>
            <Text style={styles.secondaryActionText}>{closed ? 'Rouvrir Tracer' : 'Annuler'}</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, styles.secondaryAction]} onPress={closePolygon}>
            <Text style={styles.secondaryActionText}>Fermer Tracer</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, styles.secondaryAction]} onPress={clearPolygon}>
            <Text style={styles.secondaryActionText}>Effacer</Text>
          </Pressable>
        </View>

        <View style={styles.resultCard}>
          <Row label="Points" value={String(points.length)} />
          <Row label="Contour" value={closed ? 'Validé' : 'Ouvert'} />
          <Row label="Surface à plat" value={`${surfaceAPlat.toFixed(2)} m²`} />
          <Row label="Surface réelle" value={result ? `${result.surfaceTotale.toFixed(2)} m²` : '-'} highlight />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pente</Text>
          <Text style={styles.label}>Angle de pente (°)</Text>
          <TextInput
            style={styles.input}
            value={angle}
            onChangeText={setAngle}
            keyboardType="decimal-pad"
            placeholder="Ex : 30"
            placeholderTextColor="#91919A"
          />

          <View style={styles.quickAngles}>
            {QUICK_ANGLES.map((quick) => (
              <Pressable key={quick} style={[styles.quickAngleButton, angle === quick && styles.quickAngleButtonActive]} onPress={() => setAngle(quick)}>
                <Text style={[styles.quickAngleText, angle === quick && styles.quickAngleTextActive]}>{quick}°</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={[styles.button, styles.secondaryButton]} onPress={goMeasureAngle}>
            <Text style={styles.secondaryButtonText}>Mesurer avec l’inclinomètre</Text>
          </Pressable>
        </View>

        <Pressable style={[styles.button, styles.primaryButton]} onPress={saveRoofToProject}>
          <Text style={styles.primaryButtonText}>Sauver la toiture</Text>
        </Pressable>
      </ScrollView>
    </GlideScreen>
  );
}

function Toggle({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.toggle, active && styles.toggleActive]} onPress={onPress}>
      <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Row({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.highlightValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  projectCard: { backgroundColor: '#FFF8E8', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: '#E7CF86', gap: 6 },
  projectTitle: { color: '#17171C', fontSize: 18, fontWeight: '900' },
  subtitle: { color: '#74747D', fontSize: 14, lineHeight: 20 },
  toggleWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toggle: { borderWidth: 1, borderColor: '#DCDCE2', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFFFFF' },
  toggleActive: { borderColor: '#D4AF37', backgroundColor: '#F8F1DB' },
  toggleText: { color: '#17171C', fontWeight: '700', fontSize: 13 },
  toggleTextActive: { color: '#B38918' },
  mapCard: { backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: '#E4E4E8', padding: 10, overflow: 'hidden' },
  inlineActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionButton: { minHeight: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 14, minWidth: '47%', flexGrow: 1 },
  primaryAction: { backgroundColor: '#D4AF37' },
  secondaryAction: { borderWidth: 1, borderColor: '#D4AF37', backgroundColor: '#FFFFFF' },
  primaryActionText: { color: '#111111', fontWeight: '900', fontSize: 16 },
  secondaryActionText: { color: '#B38918', fontWeight: '800', fontSize: 14 },
  resultCard: { backgroundColor: '#FFF8E8', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: '#E7CF86', gap: 8 },
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E4E8', borderRadius: 24, padding: 18, gap: 10 },
  cardTitle: { color: '#B38918', fontSize: 18, fontWeight: '800' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
  rowLabel: { color: '#17171C', fontSize: 14 },
  rowValue: { color: '#17171C', fontSize: 15, fontWeight: '700' },
  highlightValue: { color: '#B38918', fontSize: 18, fontWeight: '900' },
  label: { color: '#17171C', fontSize: 14, marginTop: 4, fontWeight: '700' },
  input: { backgroundColor: '#FFFFFF', color: '#17171C', borderWidth: 1, borderColor: '#DCDCE2', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  quickAngles: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  quickAngleButton: { borderWidth: 1, borderColor: '#DCDCE2', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFFFFF' },
  quickAngleButtonActive: { borderColor: '#D4AF37', backgroundColor: '#F8F1DB' },
  quickAngleText: { color: '#17171C', fontWeight: '700' },
  quickAngleTextActive: { color: '#B38918' },
  button: { minHeight: 54, borderRadius: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18 },
  primaryButton: { backgroundColor: '#D4AF37' },
  primaryButtonText: { color: '#111111', fontWeight: '900', fontSize: 16 },
  secondaryButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D4AF37' },
  secondaryButtonText: { color: '#B38918', fontWeight: '800', fontSize: 15 },
});
