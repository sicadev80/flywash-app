
import React, { useMemo, useState } from 'react';
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
import { GestureDetector } from 'react-native-gesture-handler';
import { useProjectStore } from '../lib/projectStore';
import { usePinchZoomPan } from '../hooks/usePinchZoomPan';

type Point = { x: number; y: number };
type EditMode = 'outer' | 'void' | 'scale';
type Step = 1 | 2 | 3 | 4;

const STEP_LABELS: Record<Step, string> = {
  1: 'Photo',
  2: 'Façade',
  3: 'Ouvrants',
  4: 'Échelle',
};

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

  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('Nouvelle façade');
  const [imageUri, setImageUri] = useState('');
  const [imageNatural, setImageNatural] = useState({ width: 1, height: 1 });
  const [imageBox, setImageBox] = useState({ width: 1, height: 1 });

  const [outerPolygon, setOuterPolygon] = useState<Point[]>([]);
  const [voidPolygons, setVoidPolygons] = useState<Point[][]>([]);
  const [voidDraft, setVoidDraft] = useState<Point[]>([]);
  const [scalePoints, setScalePoints] = useState<Point[]>([]);
  const [realDistanceMeters, setRealDistanceMeters] = useState('1,00');

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  // Le mode de pointage découle de l'étape en cours : parcours forcé
  // photo -> façade -> ouvrants -> échelle, plus lisible sur le terrain
  // qu'un sélecteur de mode séparé.
  const editMode: EditMode = step === 3 ? 'void' : step === 4 ? 'scale' : 'outer';

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
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      applyImageSize(asset.uri, asset.width, asset.height);
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
      // Sans ça, iOS peut renvoyer une représentation "compatible" recompressée
      // et donc plus basse résolution au lieu de l'original — d'où un rendu flou
      // sur les photos choisies dans la galerie.
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      applyImageSize(asset.uri, asset.width, asset.height);
      setOffset({ x: 0, y: 0 });
      setScale(1);
    }
  }

  function applyImageSize(uri: string, assetWidth?: number, assetHeight?: number) {
    // On fait confiance en priorité aux dimensions renvoyées par
    // ImagePicker (déjà orientées comme la photo s'affiche). Sur iOS,
    // Image.getSize peut renvoyer la taille brute du buffer AVANT
    // rotation EXIF, ce qui inverse largeur/hauteur pour une photo prise
    // en portrait et fausserait le calcul des points sur la façade.
    if ((assetWidth ?? 0) > 0 && (assetHeight ?? 0) > 0) {
      setImageNatural({ width: assetWidth as number, height: assetHeight as number });
      return;
    }
    Image.getSize(uri, (w, h) => setImageNatural({ width: w, height: h }));
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
  }

  function goBack() {
    if (step === 1) {
      router.back();
      return;
    }
    setStep((current) => (current - 1) as Step);
  }

  const zoomPanGesture = usePinchZoomPan({
    zoom: scale,
    setZoom: setScale,
    offset,
    setOffset,
    minZoom: 0.5,
    maxZoom: 4,
    onGestureActiveChange: (active) => setScrollEnabled(!active),
  });

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

  const canLeavePhotoStep = !!imageUri;
  const canLeaveFacadeStep = outerPolygon.length >= 3;
  const canLeaveOpeningsStep = voidDraft.length === 0;
  const canSaveFacade = scalePoints.length === 2 && !!realDistance && realDistance > 0;

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
      Alert.alert('Échelle manquante', 'Reviens à l’étape Échelle, place 2 points sur une longueur connue de la photo, puis renseigne la distance réelle, par exemple 0,90 m.');
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

  const zoomControls = (
    <View style={styles.toolbarRow}>
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
  );

  const canvasBlock = (
    <View style={styles.canvasCard}>
      <View style={styles.imageWrap} onLayout={onImageLayout}>
        <GestureDetector gesture={zoomPanGesture}>
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
        </GestureDetector>
      </View>

      <Pressable style={styles.goldButtonFull} onPress={validatePoint}>
        <Text style={styles.goldButtonText}>
          {editMode === 'outer'
            ? 'Valider point façade'
            : editMode === 'void'
            ? 'Valider point ouvrant'
            : 'Valider point échelle'}
        </Text>
      </Pressable>
    </View>
  );

  const stepDots = (
    <View style={styles.stepDotsRow}>
      {([1, 2, 3, 4] as Step[]).map((dotStep) => (
        <View key={dotStep} style={styles.stepDotWrap}>
          <View
            style={[
              styles.stepDot,
              dotStep === step && styles.stepDotActive,
              dotStep < step && styles.stepDotDone,
            ]}
          >
            <Text
              style={[
                styles.stepDotText,
                (dotStep === step || dotStep < step) && styles.stepDotTextActive,
              ]}
            >
              {dotStep < step ? '✓' : dotStep}
            </Text>
          </View>
          <Text style={[styles.stepDotLabel, dotStep === step && styles.stepDotLabelActive]}>
            {STEP_LABELS[dotStep]}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} scrollEnabled={scrollEnabled}>
        <View style={styles.topBar}>
          <Pressable style={styles.topPill} onPress={goBack}>
            <Text style={styles.topPillText}>Retour</Text>
          </Pressable>

          <Text style={styles.title}>Façade projet</Text>

          <Pressable
            style={[styles.topPill, styles.goldPill, !canSaveFacade && styles.navButtonDisabled]}
            disabled={!canSaveFacade}
            onPress={saveFacade}
          >
            <Text style={styles.goldPillText}>Sauver</Text>
          </Pressable>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            {project?.clientName || 'Projet'} · {building?.name || 'Bâtiment'}
          </Text>
          <Text style={styles.infoText}>
            {STEP_LABELS[step]} — étape {step}/4.
          </Text>
        </View>

        <View style={styles.stepHeader}>{stepDots}</View>

        {step === 1 ? (
          <View style={styles.controlsCard}>
            <Text style={styles.stepInstructions}>
              Prends une photo sur le chantier ou choisis-en une déjà dans ton téléphone. Tu pourras
              zoomer dessus à l’étape suivante pour poser les points précisément.
            </Text>

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
            </View>

            {imageUri ? (
              <View style={styles.photoPreviewWrap}>
                <Image source={{ uri: imageUri }} style={styles.photoPreviewImage} resizeMode="cover" />
                <Text style={styles.photoPreviewLabel}>Photo sélectionnée ✓</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.controlsCard}>
            <Text style={styles.stepInstructions}>
              Déplace ou zoome la photo pour amener la croix rouge sur chaque angle de la façade, puis
              appuie sur “Valider point façade”. Il faut au moins 3 points.
            </Text>
            {zoomControls}
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.controlsCard}>
            <Text style={styles.stepInstructions}>
              Pointe le contour de chaque ouvrant à soustraire (fenêtre, porte...), au moins 3 points,
              puis valide-le. Ajoute autant d’ouvrants que nécessaire, ou passe à l’étape suivante s’il
              n’y en a pas.
            </Text>
            {zoomControls}
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.controlsCard}>
            <Text style={styles.stepInstructions}>
              Pointe 2 points sur une longueur connue de la photo (par ex. une porte), puis indique sa
              distance réelle en mètres.
            </Text>
            {zoomControls}
          </View>
        ) : null}

        {step >= 2 ? canvasBlock : null}

        {step === 2 ? (
          <View style={styles.controlsCard}>
            <View style={styles.bottomActionsRow}>
              <Pressable style={styles.actionPillHalf} onPress={removeLastPoint}>
                <Text style={styles.actionPillText}>Retirer dernier point</Text>
              </Pressable>

              <Pressable style={styles.actionPillHalf} onPress={resetCurrent}>
                <Text style={styles.actionPillText}>Réinitialiser le contour</Text>
              </Pressable>
            </View>
            <Text style={styles.metricLine}>Points façade : {outerPolygon.length}</Text>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.controlsCard}>
            <View style={styles.bottomActionsRow}>
              <Pressable style={styles.actionPillHalf} onPress={removeLastPoint}>
                <Text style={styles.actionPillText}>Retirer dernier point</Text>
              </Pressable>

              <Pressable style={styles.actionPillHalf} onPress={resetCurrent}>
                <Text style={styles.actionPillText}>Réinitialiser l’ouvrant en cours</Text>
              </Pressable>
            </View>

            <View style={styles.bottomActionsRow}>
              <Pressable style={styles.actionPillHalf} onPress={addVoidPolygon}>
                <Text style={styles.actionPillText}>Valider l’ouvrant</Text>
              </Pressable>

              {voidPolygons.length > 0 ? (
                <Pressable style={styles.actionPillHalf} onPress={deleteLastVoid}>
                  <Text style={styles.actionPillText}>Supprimer dernier ouvrant</Text>
                </Pressable>
              ) : null}
            </View>

            <Text style={styles.metricLine}>Ouvrants validés : {voidPolygons.length}</Text>
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.controlsCard}>
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

            <Text style={styles.metricLine}>Points échelle : {scalePoints.length}/2</Text>
            <Text style={styles.metricNet}>Surface nette estimée : {fmt(netAreaM2)} m²</Text>
          </View>
        ) : null}

        <View style={styles.navRow}>
          <Pressable style={styles.secondaryButtonWide} onPress={goBack}>
            <Text style={styles.secondaryButtonText}>{step === 1 ? 'Annuler' : 'Précédent'}</Text>
          </Pressable>

          {step === 1 ? (
            <Pressable
              style={[styles.goldButtonNav, !canLeavePhotoStep && styles.navButtonDisabled]}
              disabled={!canLeavePhotoStep}
              onPress={() => setStep(2)}
            >
              <Text style={styles.goldButtonText}>Suivant</Text>
            </Pressable>
          ) : null}

          {step === 2 ? (
            <Pressable
              style={[styles.goldButtonNav, !canLeaveFacadeStep && styles.navButtonDisabled]}
              disabled={!canLeaveFacadeStep}
              onPress={() => setStep(3)}
            >
              <Text style={styles.goldButtonText}>Suivant</Text>
            </Pressable>
          ) : null}

          {step === 3 ? (
            <Pressable
              style={[styles.goldButtonNav, !canLeaveOpeningsStep && styles.navButtonDisabled]}
              disabled={!canLeaveOpeningsStep}
              onPress={() => setStep(4)}
            >
              <Text style={styles.goldButtonText}>Suivant</Text>
            </Pressable>
          ) : null}

          {step === 4 ? (
            <Pressable
              style={[styles.goldButtonNav, !canSaveFacade && styles.navButtonDisabled]}
              disabled={!canSaveFacade}
              onPress={saveFacade}
            >
              <Text style={styles.goldButtonText}>Enregistrer la façade</Text>
            </Pressable>
          ) : null}
        </View>

        {step === 3 && !canLeaveOpeningsStep ? (
          <Text style={styles.hintText}>Valide ou réinitialise l’ouvrant en cours pour continuer.</Text>
        ) : null}
        {step === 4 && !canSaveFacade ? (
          <Text style={styles.hintText}>
            Place 2 points d’échelle et une distance réelle supérieure à 0 pour enregistrer.
          </Text>
        ) : null}

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
  stepHeader: {
    marginHorizontal: 14,
    marginBottom: 12,
  },
  stepDotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepDotWrap: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#E7E2D9',
    borderWidth: 1,
    borderColor: '#D9CFBC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  stepDotDone: {
    backgroundColor: '#B8962E',
    borderColor: '#B8962E',
  },
  stepDotText: {
    color: '#8C8C93',
    fontWeight: '900',
    fontSize: 12,
  },
  stepDotTextActive: {
    color: '#FFFFFF',
  },
  stepDotLabel: {
    color: '#8C8C93',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  stepDotLabelActive: {
    color: '#1C1C1E',
    fontWeight: '900',
  },
  stepInstructions: {
    color: '#5A5A5E',
    fontSize: 13,
    lineHeight: 19,
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
    marginBottom: 12,
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
  photoPreviewWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2D7C3',
  },
  photoPreviewImage: {
    width: '100%',
    height: 160,
  },
  photoPreviewLabel: {
    backgroundColor: '#FFFFFF',
    color: '#1C1C1E',
    fontWeight: '800',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 6,
  },
  canvasCard: {
    margin: 14,
    marginTop: 0,
    marginBottom: 12,
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
  navRow: {
    marginHorizontal: 14,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  goldButtonNav: {
    flex: 1,
    backgroundColor: '#D4AF37',
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  hintText: {
    marginHorizontal: 14,
    marginTop: 8,
    color: '#B8962E',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButtonWide: {
    flex: 1,
    backgroundColor: '#E7E2D9',
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: '#1C1C1E',
    fontWeight: '800',
    fontSize: 15,
    textAlign: 'center',
  },
  metricsCard: {
    marginHorizontal: 14,
    marginTop: 14,
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
