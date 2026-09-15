
import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  LayoutChangeEvent,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useProjectStore } from '../lib/projectStore';

type Point = { x: number; y: number };
type EditMode = 'outer' | 'void' | 'scale';

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const fmt = (v: number, digits = 2) => v.toFixed(digits).replace('.', ',');

function polygonArea(points: Point[]) {
  if (points.length < 3) return 0;

  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum / 2);
}

function makeSegments(points: Point[]) {
  if (points.length < 2) return [];

  const result: Array<{
    key: string;
    left: number;
    top: number;
    width: number;
    angle: number;
  }> = [];

  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    result.push({
      key: `seg-${i}`,
      left: (a.x + b.x) / 2 - length / 2,
      top: (a.y + b.y) / 2 - 1.5,
      width: length,
      angle,
    });
  }

  if (points.length >= 3) {
    const a = points[points.length - 1];
    const b = points[0];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    result.push({
      key: 'seg-close',
      left: (a.x + b.x) / 2 - length / 2,
      top: (a.y + b.y) / 2 - 1.5,
      width: length,
      angle,
    });
  }

  return result;
}

export default function ProjectFacadePointingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const addFacadeToBuilding = useProjectStore((s) => s.addFacadeToBuilding);
  const getProjectById = useProjectStore((s) => s.getProjectById);

  const projectId = typeof params.projectId === 'string' ? params.projectId : '';
  const buildingId = typeof params.buildingId === 'string' ? params.buildingId : '';
  const project = getProjectById(projectId);
  const building = project?.buildings.find((b) => b.id === buildingId);

  const [name, setName] = useState('Nouvelle façade');
  const [imageUri, setImageUri] = useState('');
  const [imageNatural, setImageNatural] = useState({ width: 1, height: 1 });
  const [imageBox, setImageBox] = useState({ width: 1, height: 1 });

  const [editMode, setEditMode] = useState<EditMode>('outer');
  const [outerPolygon, setOuterPolygon] = useState<Point[]>([]);
  const [voidPolygons, setVoidPolygons] = useState<Point[][]>([]);
  const [voidDraft, setVoidDraft] = useState<Point[]>([]);
  const [scalePoints, setScalePoints] = useState<Point[]>([]);
  const [realDistanceMeters, setRealDistanceMeters] = useState('1,00');

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const gestureStartRef = useRef({ x: 0, y: 0 });

  async function pickFromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Autorisation refusée', 'Autorise l’accès caméra.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'] as any,
      quality: 1,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      Image.getSize(uri, (w, h) => setImageNatural({ width: w, height: h }));
      setOffset({ x: 0, y: 0 });
      setScale(1);
    }
  }

  async function pickFromLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Autorisation refusée', 'Autorise l’accès photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      quality: 1,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      Image.getSize(uri, (w, h) => setImageNatural({ width: w, height: h }));
      setOffset({ x: 0, y: 0 });
      setScale(1);
    }
  }

  function onImageLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setImageBox({ width, height });
  }

  function getFrame() {
    const boxW = Math.max(1, imageBox.width);
    const boxH = Math.max(1, imageBox.height);
    const imgW = Math.max(1, imageNatural.width);
    const imgH = Math.max(1, imageNatural.height);

    const contain = Math.min(boxW / imgW, boxH / imgH);
    const baseW = imgW * contain;
    const baseH = imgH * contain;
    const baseLeft = (boxW - baseW) / 2;
    const baseTop = (boxH - baseH) / 2;
    const cx = boxW / 2;
    const cy = boxH / 2;

    return {
      left: cx + (baseLeft - cx) * scale + offset.x,
      top: cy + (baseTop - cy) * scale + offset.y,
      width: baseW * scale,
      height: baseH * scale,
      imgW,
      imgH,
    };
  }

  function getPoint(): Point {
    const frame = getFrame();
    const cx = imageBox.width / 2;
    const cy = imageBox.height / 2;

    return {
      x: clamp(((cx - frame.left) / frame.width) * frame.imgW, 0, frame.imgW),
      y: clamp(((cy - frame.top) / frame.height) * frame.imgH, 0, frame.imgH),
    };
  }

  function toCanvas(p: Point): Point {
    const f = getFrame();
    return {
      x: f.left + (p.x / f.imgW) * f.width,
      y: f.top + (p.y / f.imgH) * f.height,
    };
  }

  function validatePoint() {
    if (!imageUri) {
      Alert.alert('Photo manquante', 'Choisis ou prends une photo avant de pointer.');
      return;
    }

    const point = getPoint();

    if (editMode === 'outer') {
      setOuterPolygon((prev) => [...prev, point]);
      return;
    }

    if (editMode === 'void') {
      setVoidDraft((prev) => [...prev, point]);
      return;
    }

    setScalePoints((prev) => {
      if (prev.length >= 2) return [prev[0], point];
      return [...prev, point];
    });
  }

  function removeLastPoint() {
    if (editMode === 'outer') {
      setOuterPolygon((prev) => prev.slice(0, -1));
      return;
    }
    if (editMode === 'void') {
      setVoidDraft((prev) => prev.slice(0, -1));
      return;
    }
    setScalePoints((prev) => prev.slice(0, -1));
  }

  function resetCurrent() {
    if (editMode === 'outer') {
      setOuterPolygon([]);
      return;
    }
    if (editMode === 'void') {
      setVoidDraft([]);
      return;
    }
    setScalePoints([]);
  }

  function addVoidPolygon() {
    if (voidDraft.length < 3) {
      Alert.alert('Vide incomplet', 'Il faut au moins 3 points pour un ouvrant.');
      return;
    }
    setVoidPolygons((prev) => [...prev, voidDraft]);
    setVoidDraft([]);
  }

  function deleteLastVoid() {
    setVoidPolygons((prev) => prev.slice(0, -1));
  }

  function recenter() {
    setOffset({ x: 0, y: 0 });
    setScale(1);
    gestureStartRef.current = { x: 0, y: 0 };
  }

  function onMove(e: any) {
    const { translationX, translationY } = e.nativeEvent;
    setOffset({
      x: gestureStartRef.current.x + translationX,
      y: gestureStartRef.current.y + translationY,
    });
  }

  function onState(e: any) {
    if (e.nativeEvent.state === State.BEGAN) {
      gestureStartRef.current = offset;
    }
  }

  const outerCanvas = useMemo(
    () => outerPolygon.map(toCanvas),
    [outerPolygon, offset, scale, imageBox, imageNatural]
  );
  const voidDraftCanvas = useMemo(
    () => voidDraft.map(toCanvas),
    [voidDraft, offset, scale, imageBox, imageNatural]
  );
  const voidCanvasGroups = useMemo(
    () => voidPolygons.map((poly) => poly.map(toCanvas)),
    [voidPolygons, offset, scale, imageBox, imageNatural]
  );
  const scaleCanvas = useMemo(
    () => scalePoints.map(toCanvas),
    [scalePoints, offset, scale, imageBox, imageNatural]
  );

  const outerSegments = useMemo(() => makeSegments(outerCanvas), [outerCanvas]);
  const voidDraftSegments = useMemo(() => makeSegments(voidDraftCanvas), [voidDraftCanvas]);
  const voidSegmentsGroups = useMemo(
    () => voidCanvasGroups.map((poly) => makeSegments(poly)),
    [voidCanvasGroups]
  );
  const scaleSegments = useMemo(() => makeSegments(scaleCanvas), [scaleCanvas]);

  const outerAreaPx = useMemo(() => polygonArea(outerPolygon), [outerPolygon]);
  const voidsAreaPx = useMemo(
    () => voidPolygons.reduce((sum, poly) => sum + polygonArea(poly), 0),
    [voidPolygons]
  );

  const realDistance = Number(realDistanceMeters.replace(',', '.'));
  const pxDistance =
    scalePoints.length === 2
      ? Math.hypot(
          scalePoints[1].x - scalePoints[0].x,
          scalePoints[1].y - scalePoints[0].y
        )
      : 0;

  const metersPerPixel = pxDistance > 0 && realDistance > 0 ? realDistance / pxDistance : 0;
  const m2Factor = metersPerPixel > 0 ? metersPerPixel * metersPerPixel : 0;
  const grossAreaM2 = outerAreaPx * m2Factor;
  const voidsAreaM2 = voidsAreaPx * m2Factor;
  const netAreaM2 = Math.max(0, grossAreaM2 - voidsAreaM2);

  function saveFacade() {
    if (!projectId || !buildingId) {
      Alert.alert('Projet manquant', 'Projet ou bâtiment cible introuvable.');
      return;
    }
    if (!imageUri) {
      Alert.alert('Photo manquante', 'Ajoute une photo avant d’enregistrer.');
      return;
    }
    if (outerPolygon.length < 3) {
      Alert.alert('Contour incomplet', 'Le contour façade doit avoir au moins 3 points.');
      return;
    }
    if (voidDraft.length > 0) {
      Alert.alert('Vide non fermé', 'Ferme le vide en cours avant d’enregistrer.');
      return;
    }
    if (scalePoints.length !== 2 || !realDistance || realDistance <= 0) {
      Alert.alert('Échelle manquante', 'Passe en mode Échelle, place 2 points sur une longueur connue de la photo, puis renseigne la distance réelle, par exemple 0,90 m.');
      return;
    }

    addFacadeToBuilding(projectId, buildingId, {
      name: name.trim() || 'Façade',
      imageUri,
      grossAreaM2,
      voidsAreaM2,
      netAreaM2,
    });

    router.replace({
      pathname: '/project-detail',
      params: { projectId },
    });
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable style={styles.topPill} onPress={() => router.back()}>
            <Text style={styles.topPillText}>Retour</Text>
          </Pressable>

          <Text style={styles.title}>Façade projet</Text>

          <Pressable style={[styles.topPill, styles.goldPill]} onPress={saveFacade}>
            <Text style={styles.goldPillText}>Sauver</Text>
          </Pressable>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            {project?.clientName || 'Projet'} · {building?.name || 'Bâtiment'}
          </Text>
          <Text style={styles.infoText}>
            Pointez la façade complète, puis les ouvrants, puis la cote réelle.
          </Text>
        </View>

        <View style={styles.controlsCard}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nom façade"
            placeholderTextColor="#8C8C93"
            style={styles.input}
          />

          <View style={styles.toolbarRow}>
            <Pressable style={styles.actionPill} onPress={pickFromCamera}>
              <Text style={styles.actionPillText}>📷 Prendre une photo</Text>
            </Pressable>

            <Pressable style={styles.actionPill} onPress={pickFromLibrary}>
              <Text style={styles.actionPillText}>Ouvrir galerie</Text>
            </Pressable>

            <Pressable style={styles.zoomButton} onPress={() => setScale((v) => clamp(v - 0.25, 0.5, 4))}>
              <Text style={styles.zoomButtonText}>−</Text>
            </Pressable>

            <Text style={styles.zoomLabel}>{fmt(scale)}x</Text>

            <Pressable style={styles.zoomButton} onPress={() => setScale((v) => clamp(v + 0.25, 0.5, 4))}>
              <Text style={styles.zoomButtonText}>+</Text>
            </Pressable>

            <Pressable style={styles.actionPill} onPress={recenter}>
              <Text style={styles.actionPillText}>Recentrer</Text>
            </Pressable>
          </View>

          <View style={styles.modeRow}>
            <Pressable
              style={[styles.modeButton, editMode === 'outer' && styles.modeButtonActive]}
              onPress={() => setEditMode('outer')}
            >
              <Text style={[styles.modeText, editMode === 'outer' && styles.modeTextActive]}>
                Façade
              </Text>
            </Pressable>

            <Pressable
              style={[styles.modeButton, editMode === 'void' && styles.modeButtonActive]}
              onPress={() => setEditMode('void')}
            >
              <Text style={[styles.modeText, editMode === 'void' && styles.modeTextActive]}>
                Ouvrants
              </Text>
            </Pressable>

            <Pressable
              style={[styles.modeButton, editMode === 'scale' && styles.modeButtonActive]}
              onPress={() => setEditMode('scale')}
            >
              <Text style={[styles.modeText, editMode === 'scale' && styles.modeTextActive]}>
                Échelle
              </Text>
            </Pressable>
          </View>

          <View style={styles.bottomActionsRow}>
            <TextInput
              value={realDistanceMeters}
              onChangeText={setRealDistanceMeters}
              keyboardType="decimal-pad"
              style={[styles.input, styles.scaleInput]}
              placeholder="Ex : 0,90 m"
              placeholderTextColor="#8C8C93"
            />

            <Pressable style={styles.actionPillHalf} onPress={removeLastPoint}>
              <Text style={styles.actionPillText}>Retirer</Text>
            </Pressable>

            <Pressable style={styles.actionPillHalf} onPress={resetCurrent}>
              <Text style={styles.actionPillText}>Réinit.</Text>
            </Pressable>
          </View>

          <Text style={styles.scaleHelpText}>
            En mode Échelle, place 2 points sur une longueur connue puis saisis la distance réelle, par exemple 0,90 m.
          </Text>

          {editMode === 'void' ? (
            <View style={styles.bottomActionsRow}>
              <Pressable style={styles.actionPillHalf} onPress={addVoidPolygon}>
                <Text style={styles.actionPillText}>Valider vide</Text>
              </Pressable>

              {voidPolygons.length > 0 ? (
                <Pressable style={styles.actionPillHalf} onPress={deleteLastVoid}>
                  <Text style={styles.actionPillText}>Suppr. vide</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.canvasCard}>
          <View style={styles.imageWrap} onLayout={onImageLayout}>
            <PanGestureHandler onGestureEvent={onMove} onHandlerStateChange={onState}>
              <View style={{ flex: 1 }}>
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={[
                      styles.image,
                      {
                        transform: [
                          { translateX: offset.x },
                          { translateY: offset.y },
                          { scale },
                        ],
                      },
                    ]}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.emptyWrap}>
                    <Text style={styles.emptyText}>Choisis une image pour commencer</Text>
                  </View>
                )}
              </View>
            </PanGestureHandler>

            {outerSegments.map((s) => (
              <View
                key={s.key}
                style={[
                  styles.segment,
                  {
                    left: s.left,
                    top: s.top,
                    width: s.width,
                    transform: [{ rotate: `${s.angle}deg` }],
                  },
                ]}
              />
            ))}

            {voidSegmentsGroups.flat().map((s) => (
              <View
                key={`void-${s.key}-${s.left}-${s.top}`}
                style={[
                  styles.segmentVoid,
                  {
                    left: s.left,
                    top: s.top,
                    width: s.width,
                    transform: [{ rotate: `${s.angle}deg` }],
                  },
                ]}
              />
            ))}

            {voidDraftSegments.map((s) => (
              <View
                key={`draft-${s.key}`}
                style={[
                  styles.segmentVoid,
                  {
                    left: s.left,
                    top: s.top,
                    width: s.width,
                    transform: [{ rotate: `${s.angle}deg` }],
                  },
                ]}
              />
            ))}

            {scaleSegments.map((s) => (
              <View
                key={`scale-${s.key}`}
                style={[
                  styles.segmentScale,
                  {
                    left: s.left,
                    top: s.top,
                    width: s.width,
                    transform: [{ rotate: `${s.angle}deg` }],
                  },
                ]}
              />
            ))}

            {outerCanvas.map((p, i) => (
              <View key={`outer-${i}`} style={[styles.pointOuter, { left: p.x - 8, top: p.y - 8 }]}>
                <Text style={styles.pointLabel}>{i + 1}</Text>
              </View>
            ))}

            {voidCanvasGroups.flat().map((p, i) => (
              <View key={`void-${i}`} style={[styles.pointVoid, { left: p.x - 5, top: p.y - 5 }]} />
            ))}

            {voidDraftCanvas.map((p, i) => (
              <View key={`draft-${i}`} style={[styles.pointVoid, { left: p.x - 5, top: p.y - 5 }]} />
            ))}

            {scaleCanvas.map((p, i) => (
              <View key={`scale-${i}`} style={[styles.pointScale, { left: p.x - 7, top: p.y - 7 }]} />
            ))}

            <View
              style={{
                position: 'absolute',
                left: imageBox.width / 2 - 20,
                top: imageBox.height / 2 - 20,
                width: 40,
                height: 40,
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  width: 2,
                  height: 40,
                  backgroundColor: '#FF3B30',
                  left: 19,
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  height: 2,
                  width: 40,
                  backgroundColor: '#FF3B30',
                  top: 19,
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#FF3B30',
                  borderWidth: 2,
                  borderColor: '#FFFFFF',
                  top: 16,
                  left: 16,
                }}
              />
            </View>
          </View>

         <Pressable style={styles.goldButtonFull} onPress={validatePoint}>
  <Text style={styles.goldButtonText}>Valider point</Text>
</Pressable>
        </View>



        <View style={styles.metricsCard}>
          <Text style={styles.metricsTitle}>Résultats façade</Text>
          <Text style={styles.metricLine}>Surface brute : {fmt(grossAreaM2)} m²</Text>
          <Text style={styles.metricLine}>Ouvrants : {fmt(voidsAreaM2)} m²</Text>
          <Text style={styles.metricNet}>Surface nette : {fmt(netAreaM2)} m²</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F3EE',
  },
  content: {
    paddingBottom: 34,
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
  infoCard: {
    marginHorizontal: 14,
    backgroundColor: '#EFE8DB',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2D7C3',
  },
  infoTitle: {
    color: '#1C1C1E',
    fontWeight: '900',
    fontSize: 15,
    marginBottom: 4,
  },
  infoText: {
    color: '#5A5A5E',
    fontSize: 13,
  },
  controlsCard: {
    marginHorizontal: 14,
    backgroundColor: '#EFE8DB',
    borderRadius: 20,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2D7C3',
  },
  toolbarRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  bottomActionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  scaleHelpText: {
    color: '#6C6C70',
    fontSize: 13,
    lineHeight: 18,
    marginTop: -2,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2D7C3',
    borderRadius: 14,
    color: '#1C1C1E',
    paddingHorizontal: 12,
    height: 48,
    flex: 1,
    fontSize: 16,
  },
  scaleInput: {
    minWidth: 120,
  },
  actionPill: {
    backgroundColor: '#E7E2D9',
    borderRadius: 16,
    minHeight: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionPillHalf: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#E7E2D9',
    borderRadius: 16,
    minHeight: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionPillText: {
    color: '#1C1C1E',
    fontWeight: '800',
    fontSize: 14,
    textAlign: 'center',
  },
  zoomButton: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2D7C3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomButtonText: {
    color: '#111111',
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 28,
  },
  zoomLabel: {
    color: '#1C1C1E',
    fontWeight: '800',
    minWidth: 72,
    textAlign: 'center',
    fontSize: 18,
  },
  modeButton: {
    flex: 1,
    minWidth: 90,
    backgroundColor: '#E7E2D9',
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#D4AF37',
  },
  modeText: {
    color: '#1C1C1E',
    fontWeight: '800',
    fontSize: 15,
  },
  modeTextActive: {
    color: '#111111',
    fontWeight: '900',
  },
  canvasCard: {
    margin: 14,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2D7C3',
  },
  imageWrap: {
    height: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2D7C3',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#6C6C70',
    fontSize: 15,
    fontWeight: '700',
  },
  segment: {
    position: 'absolute',
    height: 3,
    backgroundColor: '#7CFF5A',
    borderRadius: 999,
  },
  segmentVoid: {
    position: 'absolute',
    height: 3,
    backgroundColor: '#6EE7FF',
    borderRadius: 999,
  },
  segmentScale: {
    position: 'absolute',
    height: 3,
    backgroundColor: '#FFD84D',
    borderRadius: 999,
  },
  pointOuter: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: '#F6FF47',
    borderWidth: 2,
    borderColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#111111',
  },
  pointVoid: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#6EE7FF',
    borderWidth: 1,
    borderColor: '#111111',
  },
  pointScale: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: '#FFD84D',
    borderWidth: 2,
    borderColor: '#111111',
  },
  goldButtonFull: {
    backgroundColor: '#D4AF37',
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goldButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  goldButtonText: {
    color: '#111111',
    fontWeight: '900',
    fontSize: 18,
  },
  metricsCard: {
    marginHorizontal: 14,
    marginBottom: 14,
    backgroundColor: '#EFE8DB',
    borderRadius: 20,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2D7C3',
  },
  metricsTitle: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '900',
  },
  metricLine: {
    color: '#3A3A3C',
    fontSize: 16,
  },
  metricNet: {
    color: '#B8962E',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
  },
});
