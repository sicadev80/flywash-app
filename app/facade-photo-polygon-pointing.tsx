import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useQuickMeasurementStore } from '../lib/quickMeasurementStore';
import { usePinchZoomPan } from '../hooks/usePinchZoomPan';

type Point = { x: number; y: number };
type Mode = 'facade' | 'opening' | 'scale';
type Segment = { key: string; left: number; top: number; width: number; angle: number };
type Step = 1 | 2 | 3 | 4;

const MIN_ZOOM = 0.75;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.25;

const STEP_LABELS: Record<Step, string> = {
  1: 'Photo',
  2: 'Façade',
  3: 'Ouvrants',
  4: 'Échelle',
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const formatNumber = (value: number, digits = 2) => value.toFixed(digits).replace('.', ',');

function polygonArea(points: Point[]): number {
  if (points.length < 3) return 0;

  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }

  return Math.abs(sum / 2);
}

function buildSegments(points: Point[], closePolygon = true): Segment[] {
  if (points.length < 2) return [];

  const segments: Segment[] = [];
  const segmentCount = closePolygon ? points.length - 1 : points.length - 1;

  for (let i = 0; i < segmentCount; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    segments.push({
      key: `seg-${i}`,
      left: (a.x + b.x) / 2 - length / 2,
      top: (a.y + b.y) / 2 - 1.5,
      width: length,
      angle,
    });
  }

  if (closePolygon && points.length >= 3) {
    const a = points[points.length - 1];
    const b = points[0];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    segments.push({
      key: 'seg-close',
      left: (a.x + b.x) / 2 - length / 2,
      top: (a.y + b.y) / 2 - 1.5,
      width: length,
      angle,
    });
  }

  return segments;
}

function parseMeters(raw: string): number {
  const normalized = raw.replace(',', '.').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function FacadePhotoPolygonPointingScreen() {
  const router = useRouter();
  const addFacade = useQuickMeasurementStore((state) => state.addFacade);
  const facadesCount = useQuickMeasurementStore((state) => state.facades.length);

  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState(`Façade ${facadesCount + 1}`);
  const [imageUri, setImageUri] = useState('');
  const [imageVersion, setImageVersion] = useState(0);
  const [imageNatural, setImageNatural] = useState({ width: 1, height: 1 });
  const [imageBox, setImageBox] = useState({ width: 1, height: 1 });

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const [facadePoints, setFacadePoints] = useState<Point[]>([]);
  const [openingDraft, setOpeningDraft] = useState<Point[]>([]);
  const [openingPolygons, setOpeningPolygons] = useState<Point[][]>([]);
  const [scalePoints, setScalePoints] = useState<Point[]>([]);
  const [realDistanceMeters, setRealDistanceMeters] = useState('1,00');

  // Le mode de pointage découle directement de l'étape en cours : le
  // parcours est volontairement forcé (photo -> façade -> ouvrants ->
  // échelle) pour rester lisible sur le terrain, sans sélecteur de mode
  // séparé qui obligeait à comprendre l'ordre à l'avance.
  const mode: Mode = step === 3 ? 'opening' : step === 4 ? 'scale' : 'facade';

  useFocusEffect(
    useCallback(() => {
      if (!imageUri && facadePoints.length === 0 && openingDraft.length === 0 && openingPolygons.length === 0 && scalePoints.length === 0) {
        setName(`Façade ${facadesCount + 1}`);
      }
    }, [facadesCount, facadePoints.length, imageUri, openingDraft.length, openingPolygons.length, scalePoints.length])
  );

  useEffect(() => {
    if (!imageUri && facadePoints.length === 0 && openingDraft.length === 0 && openingPolygons.length === 0 && scalePoints.length === 0) {
      setName(`Façade ${facadesCount + 1}`);
    }
  }, [facadesCount, facadePoints.length, imageUri, openingDraft.length, openingPolygons.length, scalePoints.length]);
  useEffect(() => {
    if (!imageUri) return;

    Image.getSize(
      imageUri,
      (width, height) => {
        if (width <= 0 || height <= 0) return;
        setImageNatural((current) => {
          // On ne fait confiance à Image.getSize que si ImagePicker n'a
          // fourni aucune dimension exploitable : sur iOS, getSize peut
          // renvoyer la taille brute du buffer AVANT rotation EXIF, ce qui
          // inverse largeur/hauteur pour une photo prise en portrait. Avec
          // resizeMode="stretch", ça étire l'image dans un cadre à la
          // mauvaise proportion et donne un rendu flou/déformé alors que
          // la photo d'origine est nette.
          const alreadyTrusted = current.width > 1 && current.height > 1;
          return alreadyTrusted ? current : { width, height };
        });
      },
      () => {
        // Certains URI de galerie peuvent échouer ici selon la plateforme.
        // On garde alors les dimensions déjà injectées depuis l'asset ImagePicker.
      }
    );
  }, [imageUri]);


  const resetForNewImage = useCallback((payload: { uri: string; width?: number; height?: number }) => {
    const { uri, width, height } = payload;
    setImageUri(uri);
    setImageVersion((value) => value + 1);
    if ((width ?? 0) > 0 && (height ?? 0) > 0) {
      setImageNatural({ width: width as number, height: height as number });
    } else {
      setImageNatural({ width: 1, height: 1 });
    }
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setScrollEnabled(true);
    setFacadePoints([]);
    setOpeningDraft([]);
    setOpeningPolygons([]);
    setScalePoints([]);
  }, []);

  const resetForNextFacade = useCallback(() => {
    setName('');
    setImageUri('');
    setImageVersion((value) => value + 1);
    setImageNatural({ width: 1, height: 1 });
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setScrollEnabled(true);
    setFacadePoints([]);
    setOpeningDraft([]);
    setOpeningPolygons([]);
    setScalePoints([]);
    setRealDistanceMeters('1,00');
    setStep(1);
  }, []);

  const pickFromCamera = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Autorisation refusée', 'Autorise la caméra pour prendre une photo.');
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
      resetForNewImage({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      });
    }
  }, [resetForNewImage]);

  const pickFromLibrary = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Autorisation refusée', 'Autorise la photothèque pour choisir une image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      quality: 1,
      allowsEditing: false,
      // Sans ça, iOS peut renvoyer une représentation "compatible" recompressée
      // et donc plus basse résolution au lieu de l'original — d'où le flou
      // constaté sur les photos choisies dans la galerie.
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const asset = result.assets[0];
      resetForNewImage({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      });
    }
  }, [resetForNewImage]);

  const onImageLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setImageBox({ width, height });
  }, []);

  const frame = useMemo(() => {
    const boxWidth = Math.max(1, imageBox.width);
    const boxHeight = Math.max(1, imageBox.height);
    const imageWidth = Math.max(1, imageNatural.width);
    const imageHeight = Math.max(1, imageNatural.height);

    const containRatio = Math.min(boxWidth / imageWidth, boxHeight / imageHeight);
    const baseWidth = imageWidth * containRatio;
    const baseHeight = imageHeight * containRatio;
    const baseLeft = (boxWidth - baseWidth) / 2;
    const baseTop = (boxHeight - baseHeight) / 2;
    const centerX = boxWidth / 2;
    const centerY = boxHeight / 2;

    return {
      left: centerX + (baseLeft - centerX) * zoom + offset.x,
      top: centerY + (baseTop - centerY) * zoom + offset.y,
      width: baseWidth * zoom,
      height: baseHeight * zoom,
      imageWidth,
      imageHeight,
    };
  }, [imageBox.height, imageBox.width, imageNatural.height, imageNatural.width, offset.x, offset.y, zoom]);

  const canvasToImagePoint = useCallback(
    (canvasX: number, canvasY: number): Point => ({
      x: clamp(((canvasX - frame.left) / frame.width) * frame.imageWidth, 0, frame.imageWidth),
      y: clamp(((canvasY - frame.top) / frame.height) * frame.imageHeight, 0, frame.imageHeight),
    }),
    [frame]
  );

  const imageToCanvasPoint = useCallback(
    (point: Point): Point => ({
      x: frame.left + (point.x / frame.imageWidth) * frame.width,
      y: frame.top + (point.y / frame.imageHeight) * frame.height,
    }),
    [frame]
  );

  const getCrosshairImagePoint = useCallback((): Point => {
    const centerX = imageBox.width / 2;
    const centerY = imageBox.height / 2;
    return canvasToImagePoint(centerX, centerY);
  }, [canvasToImagePoint, imageBox.height, imageBox.width]);

  const zoomPanGesture = usePinchZoomPan({
    zoom,
    setZoom,
    offset,
    setOffset,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
    onGestureActiveChange: (active) => setScrollEnabled(!active),
  });

  const facadeCanvasPoints = useMemo(
    () => facadePoints.map(imageToCanvasPoint),
    [facadePoints, imageToCanvasPoint]
  );
  const openingDraftCanvasPoints = useMemo(
    () => openingDraft.map(imageToCanvasPoint),
    [openingDraft, imageToCanvasPoint]
  );
  const openingCanvasGroups = useMemo(
    () => openingPolygons.map((polygon) => polygon.map(imageToCanvasPoint)),
    [openingPolygons, imageToCanvasPoint]
  );
  const scaleCanvasPoints = useMemo(
    () => scalePoints.map(imageToCanvasPoint),
    [scalePoints, imageToCanvasPoint]
  );

  const facadeSegments = useMemo(() => buildSegments(facadeCanvasPoints, true), [facadeCanvasPoints]);
  const openingDraftSegments = useMemo(
    () => buildSegments(openingDraftCanvasPoints, true),
    [openingDraftCanvasPoints]
  );
  const openingSegmentsGroups = useMemo(
    () => openingCanvasGroups.map((polygon) => buildSegments(polygon, true)),
    [openingCanvasGroups]
  );
  const scaleSegments = useMemo(() => buildSegments(scaleCanvasPoints, false), [scaleCanvasPoints]);

  const facadeAreaPx = useMemo(() => polygonArea(facadePoints), [facadePoints]);
  const openingsAreaPx = useMemo(
    () => openingPolygons.reduce((sum, polygon) => sum + polygonArea(polygon), 0),
    [openingPolygons]
  );

  const realDistance = useMemo(() => parseMeters(realDistanceMeters), [realDistanceMeters]);
  const scaleDistancePx = useMemo(() => {
    if (scalePoints.length !== 2) return 0;
    return Math.hypot(scalePoints[1].x - scalePoints[0].x, scalePoints[1].y - scalePoints[0].y);
  }, [scalePoints]);

  const metersPerPixel = scaleDistancePx > 0 && realDistance > 0 ? realDistance / scaleDistancePx : 0;
  const squareMeterFactor = metersPerPixel > 0 ? metersPerPixel * metersPerPixel : 0;
  const grossAreaM2 = facadeAreaPx * squareMeterFactor;
  const voidsAreaM2 = openingsAreaPx * squareMeterFactor;
  const netAreaM2 = Math.max(0, grossAreaM2 - voidsAreaM2);

  const validatePoint = useCallback(() => {
    if (!imageUri) {
      Alert.alert('Photo manquante', 'Choisis ou prends une photo avant de placer des points.');
      return;
    }

    const point = getCrosshairImagePoint();

    if (mode === 'facade') {
      setFacadePoints((current) => [...current, point]);
      return;
    }

    if (mode === 'opening') {
      setOpeningDraft((current) => [...current, point]);
      return;
    }

    setScalePoints((current) => {
      if (current.length === 0) return [point];
      if (current.length === 1) return [...current, point];
      return [current[1], point];
    });
  }, [getCrosshairImagePoint, imageUri, mode]);

  const removeLastPoint = useCallback(() => {
    if (mode === 'facade') {
      setFacadePoints((current) => current.slice(0, -1));
      return;
    }

    if (mode === 'opening') {
      setOpeningDraft((current) => current.slice(0, -1));
      return;
    }

    setScalePoints((current) => current.slice(0, -1));
  }, [mode]);

  const resetCurrentMode = useCallback(() => {
    if (mode === 'facade') {
      setFacadePoints([]);
      return;
    }

    if (mode === 'opening') {
      setOpeningDraft([]);
      return;
    }

    setScalePoints([]);
  }, [mode]);

  const validateOpening = useCallback(() => {
    if (openingDraft.length < 3) {
      Alert.alert('Ouvrant incomplet', 'Il faut au moins 3 points pour valider un ouvrant.');
      return;
    }

    setOpeningPolygons((current) => [...current, openingDraft]);
    setOpeningDraft([]);
  }, [openingDraft]);

  const deleteLastOpening = useCallback(() => {
    setOpeningPolygons((current) => current.slice(0, -1));
  }, []);

  const recenterImage = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setScrollEnabled(true);
  }, []);

  const isFacadeReadyToSave =
    !!imageUri &&
    facadePoints.length >= 3 &&
    openingDraft.length === 0 &&
    scalePoints.length === 2 &&
    realDistance > 0;

  const hasUnsavedProgress =
    !!imageUri ||
    facadePoints.length > 0 ||
    openingDraft.length > 0 ||
    openingPolygons.length > 0 ||
    scalePoints.length > 0;

  const commitFacade = useCallback(() => {
    addFacade({
      id: `facade_${Date.now()}`,
      name: name.trim() || `Façade ${facadesCount + 1}`,
      imageUri,
      grossAreaM2,
      voidsAreaM2,
      netAreaM2,
      createdAt: new Date().toISOString(),
    });
  }, [addFacade, facadesCount, grossAreaM2, imageUri, name, netAreaM2, voidsAreaM2]);

  const saveFacade = useCallback(() => {
    if (!imageUri) {
      Alert.alert('Photo manquante', 'Ajoute une photo avant d’enregistrer la façade.');
      return;
    }

    if (facadePoints.length < 3) {
      Alert.alert('Façade incomplète', 'Le contour façade doit contenir au moins 3 points.');
      return;
    }

    if (openingDraft.length > 0) {
      Alert.alert('Ouvrant en cours', 'Valide ou réinitialise l’ouvrant en cours avant de sauvegarder.');
      return;
    }

    if (scalePoints.length !== 2 || realDistance <= 0) {
      Alert.alert(
        'Échelle manquante',
        'Reviens à l’étape Échelle, place 2 points sur une longueur connue, puis saisis la distance réelle.'
      );
      return;
    }

    commitFacade();
    Alert.alert('Façade enregistrée', 'La façade a bien été ajoutée à la session chantier.');
    resetForNextFacade();
  }, [commitFacade, facadePoints.length, imageUri, openingDraft.length, realDistance, resetForNextFacade, scalePoints.length]);

  const goToSession = useCallback(() => {
    if (!hasUnsavedProgress) {
      router.push('/quick-measure-session');
      return;
    }

    if (isFacadeReadyToSave) {
      Alert.alert(
        'Façade non enregistrée',
        'Cette façade n’a pas encore été ajoutée à la session. Veux-tu l’enregistrer avant de continuer ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Continuer sans enregistrer',
            style: 'destructive',
            onPress: () => router.push('/quick-measure-session'),
          },
          {
            text: 'Enregistrer et continuer',
            onPress: () => {
              commitFacade();
              router.push('/quick-measure-session');
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Relevé incomplet non enregistré',
      'Le contour façade, les ouvrants ou l’échelle sont incomplets : ce relevé sera perdu si tu continues.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Continuer sans enregistrer',
          style: 'destructive',
          onPress: () => router.push('/quick-measure-session'),
        },
      ]
    );
  }, [commitFacade, hasUnsavedProgress, isFacadeReadyToSave, router]);

  // Navigation forcée : on ne peut avancer que si l'étape en cours est
  // complète, mais on peut toujours revenir en arrière pour corriger.
  const goBack = useCallback(() => {
    if (step === 1) {
      router.back();
      return;
    }
    setStep((current) => (current - 1) as Step);
  }, [router, step]);

  const canLeavePhotoStep = !!imageUri;
  const canLeaveFacadeStep = facadePoints.length >= 3;
  const canLeaveOpeningsStep = openingDraft.length === 0;
  const canSaveFacade = scalePoints.length === 2 && realDistance > 0;

  const zoomControls = (
    <View style={styles.toolbarRow}>
      <Pressable style={styles.zoomButton} onPress={() => setZoom((value) => clamp(value - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM))}>
        <Text style={styles.zoomButtonText}>−</Text>
      </Pressable>

      <Text style={styles.zoomLabel}>{formatNumber(zoom)}x</Text>

      <Pressable style={styles.zoomButton} onPress={() => setZoom((value) => clamp(value + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM))}>
        <Text style={styles.zoomButtonText}>+</Text>
      </Pressable>

      <Pressable style={styles.actionPill} onPress={recenterImage}>
        <Text style={styles.actionPillText}>Recentrer</Text>
      </Pressable>
    </View>
  );

  const canvasBlock = (
    <View style={styles.canvasCard}>
      <View style={styles.imageWrap} onLayout={onImageLayout}>
        {imageUri ? (
          <Image
            key={`selected-image-${imageVersion}`}
            source={{ uri: imageUri }}
            style={[
              styles.image,
              {
                position: 'absolute',
                left: frame.left,
                top: frame.top,
                width: frame.width,
                height: frame.height,
              },
            ]}
            // "stretch" semble forcer iOS à décoder la photo en pleine résolution
            // puis à la sous-échantillonner naïvement au lieu de générer une
            // vignette nette à la taille d'affichage (ce que "cover" fait
            // correctement) — d'où le rendu flou du grand aperçu alors que la
            // miniature de l'étape 1 (déjà en "cover") reste nette. Le cadre est
            // déjà calculé au bon ratio (containRatio), donc "cover" ne recadre
            // ni ne déforme rien ici.
            resizeMode="cover"
          />
        ) : (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>Choisis une image pour commencer</Text>
          </View>
        )}

        {facadeSegments.map((segment) => (
          <View
            key={segment.key}
            style={[
              styles.segmentFacade,
              {
                left: segment.left,
                top: segment.top,
                width: segment.width,
                transform: [{ rotate: `${segment.angle}deg` }],
              },
            ]}
          />
        ))}

        {openingSegmentsGroups.flat().map((segment, index) => (
          <View
            key={`opening-${index}-${segment.key}`}
            style={[
              styles.segmentOpening,
              {
                left: segment.left,
                top: segment.top,
                width: segment.width,
                transform: [{ rotate: `${segment.angle}deg` }],
              },
            ]}
          />
        ))}

        {openingDraftSegments.map((segment) => (
          <View
            key={`opening-draft-${segment.key}`}
            style={[
              styles.segmentOpening,
              {
                left: segment.left,
                top: segment.top,
                width: segment.width,
                transform: [{ rotate: `${segment.angle}deg` }],
              },
            ]}
          />
        ))}

        {scaleSegments.map((segment) => (
          <View
            key={`scale-${segment.key}`}
            style={[
              styles.segmentScale,
              {
                left: segment.left,
                top: segment.top,
                width: segment.width,
                transform: [{ rotate: `${segment.angle}deg` }],
              },
            ]}
          />
        ))}

        {facadeCanvasPoints.map((point, index) => (
          <View key={`facade-point-${index}`} style={[styles.pointFacade, { left: point.x - 8, top: point.y - 8 }]}>
            <Text style={styles.pointLabel}>{index + 1}</Text>
          </View>
        ))}

        {openingCanvasGroups.flat().map((point, index) => (
          <View key={`opening-point-${index}`} style={[styles.pointOpening, { left: point.x - 5, top: point.y - 5 }]} />
        ))}

        {openingDraftCanvasPoints.map((point, index) => (
          <View key={`opening-draft-point-${index}`} style={[styles.pointOpening, { left: point.x - 5, top: point.y - 5 }]} />
        ))}

        {scaleCanvasPoints.map((point, index) => (
          <View key={`scale-point-${index}`} style={[styles.pointScale, { left: point.x - 7, top: point.y - 7 }]} />
        ))}

        <GestureDetector gesture={zoomPanGesture}>
          <View style={styles.dragCaptureLayer} />
        </GestureDetector>

        <View style={styles.crosshair} pointerEvents="none">
          <View style={styles.crosshairVertical} />
          <View style={styles.crosshairHorizontal} />
          <View style={styles.crosshairCenter} />
        </View>
      </View>

      <Pressable style={styles.addPointButton} onPress={validatePoint}>
        <Text style={styles.addPointText}>
          {mode === 'facade'
            ? 'Valider point façade'
            : mode === 'opening'
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
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <Pressable style={styles.topPill} onPress={goBack}>
            <Text style={styles.topPillText}>Retour</Text>
          </Pressable>

          <Text style={styles.title}>Mesure rapide</Text>

          <Pressable style={[styles.topPill, styles.goldPill]} onPress={goToSession}>
            <Text style={styles.goldPillText}>Session</Text>
          </Pressable>
        </View>

        <View style={styles.stepHeader}>
          <Text style={styles.stepHeaderTitle}>Étape {step}/4 — {STEP_LABELS[step]}</Text>
          {stepDots}
        </View>

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

              <Pressable style={styles.actionPillHalf} onPress={resetCurrentMode}>
                <Text style={styles.actionPillText}>Réinitialiser le contour</Text>
              </Pressable>
            </View>
            <Text style={styles.metricLine}>Points façade : {facadePoints.length}</Text>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.controlsCard}>
            <View style={styles.bottomActionsRow}>
              <Pressable style={styles.actionPillHalf} onPress={removeLastPoint}>
                <Text style={styles.actionPillText}>Retirer dernier point</Text>
              </Pressable>

              <Pressable style={styles.actionPillHalf} onPress={resetCurrentMode}>
                <Text style={styles.actionPillText}>Réinitialiser l’ouvrant en cours</Text>
              </Pressable>
            </View>

            <View style={styles.bottomActionsRow}>
              <Pressable style={styles.actionPillHalf} onPress={validateOpening}>
                <Text style={styles.actionPillText}>Valider l’ouvrant</Text>
              </Pressable>

              <Pressable style={styles.actionPillHalf} onPress={deleteLastOpening}>
                <Text style={styles.actionPillText}>Supprimer dernier ouvrant</Text>
              </Pressable>
            </View>

            <Text style={styles.metricLine}>Ouvrants validés : {openingPolygons.length}</Text>
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
                placeholder="Distance réelle en m"
                placeholderTextColor="#8C8C93"
              />

              <Pressable style={styles.actionPillHalf} onPress={removeLastPoint}>
                <Text style={styles.actionPillText}>Retirer dernier point</Text>
              </Pressable>

              <Pressable style={styles.actionPillHalf} onPress={resetCurrentMode}>
                <Text style={styles.actionPillText}>Réinitialiser l’échelle</Text>
              </Pressable>
            </View>

            <Text style={styles.metricLine}>Points échelle : {scalePoints.length}/2</Text>
            <Text style={styles.metricNet}>Surface nette estimée : {formatNumber(netAreaM2)} m²</Text>
          </View>
        ) : null}

        <View style={styles.navRow}>
          <Pressable style={styles.secondaryButtonWide} onPress={goBack}>
            <Text style={styles.secondaryButtonText}>{step === 1 ? 'Annuler' : 'Précédent'}</Text>
          </Pressable>

          {step === 1 ? (
            <Pressable
              style={[styles.goldButtonFull, !canLeavePhotoStep && styles.navButtonDisabled]}
              disabled={!canLeavePhotoStep}
              onPress={() => setStep(2)}
            >
              <Text style={styles.goldButtonText}>Suivant</Text>
            </Pressable>
          ) : null}

          {step === 2 ? (
            <Pressable
              style={[styles.goldButtonFull, !canLeaveFacadeStep && styles.navButtonDisabled]}
              disabled={!canLeaveFacadeStep}
              onPress={() => setStep(3)}
            >
              <Text style={styles.goldButtonText}>Suivant</Text>
            </Pressable>
          ) : null}

          {step === 3 ? (
            <Pressable
              style={[styles.goldButtonFull, !canLeaveOpeningsStep && styles.navButtonDisabled]}
              disabled={!canLeaveOpeningsStep}
              onPress={() => setStep(4)}
            >
              <Text style={styles.goldButtonText}>Suivant</Text>
            </Pressable>
          ) : null}

          {step === 4 ? (
            <Pressable
              style={[styles.goldButtonFull, !canSaveFacade && styles.navButtonDisabled]}
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

        <Pressable style={styles.exitLink} onPress={goToSession}>
          <Text style={styles.exitLinkText}>Terminer le relevé</Text>
        </Pressable>

        <View style={styles.metricsCard}>
          <Text style={styles.metricsTitle}>Résumé courant</Text>
          <Text style={styles.metricLine}>
            Résolution photo détectée : {Math.round(imageNatural.width)} × {Math.round(imageNatural.height)} px
          </Text>
          <Text style={styles.metricLine}>Points façade : {facadePoints.length}</Text>
          <Text style={styles.metricLine}>Ouvrants validés : {openingPolygons.length}</Text>
          <Text style={styles.metricLine}>Points échelle : {scalePoints.length}/2</Text>
          <Text style={styles.metricLine}>Surface brute : {formatNumber(grossAreaM2)} m²</Text>
          <Text style={styles.metricLine}>Ouvrants : {formatNumber(voidsAreaM2)} m²</Text>
          <Text style={styles.metricLine}>Distance réelle : {formatNumber(realDistance)} m</Text>
          <Text style={styles.metricLine}>Distance image : {Math.round(scaleDistancePx)} px</Text>
          <Text style={styles.metricNet}>Surface nette : {formatNumber(netAreaM2)} m²</Text>
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
    paddingTop: 8,
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
    gap: 10,
  },
  stepHeaderTitle: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
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
    lineHeight: 19,
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
    minWidth: 150,
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
    marginHorizontal: 14,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2D7C3',
  },
  imageWrap: {
    height: 340,
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
    paddingHorizontal: 24,
  },
  emptyText: {
    color: '#6C6C70',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  segmentFacade: {
    position: 'absolute',
    height: 3,
    backgroundColor: '#7CFF5A',
    borderRadius: 999,
  },
  segmentOpening: {
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
  pointFacade: {
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
  pointOpening: {
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
  dragCaptureLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
  },
  crosshair: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -20,
    marginTop: -20,
    width: 40,
    height: 40,
  },
  crosshairVertical: {
    position: 'absolute',
    width: 2,
    height: 40,
    backgroundColor: '#FF3B30',
    left: 19,
  },
  crosshairHorizontal: {
    position: 'absolute',
    height: 2,
    width: 40,
    backgroundColor: '#FF3B30',
    top: 19,
  },
  crosshairCenter: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    top: 16,
    left: 16,
  },
  addPointButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPointText: {
    color: '#111111',
    fontWeight: '900',
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  navRow: {
    marginHorizontal: 14,
    flexDirection: 'row',
    gap: 8,
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
  goldButtonFull: {
    flex: 1,
    backgroundColor: '#D4AF37',
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goldButtonText: {
    color: '#111111',
    fontWeight: '900',
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 12,
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
  exitLink: {
    marginTop: 14,
    marginBottom: 4,
    alignItems: 'center',
  },
  exitLinkText: {
    color: '#8C8C93',
    fontWeight: '800',
    fontSize: 14,
    textDecorationLine: 'underline',
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
