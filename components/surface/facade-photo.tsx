import React, { useMemo, useState } from 'react';
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
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import GlideScreen from '../../../components/glide/GlideScreen';

type Point = { x: number; y: number };

const n = (v: string) => Number(String(v || '').replace(',', '.')) || 0;
const fmt = (v: number) => v.toFixed(2).replace('.', ',');

function distance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function polygonArea(points: Point[]) {
  if (points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

function centroid(points: Point[]) {
  if (!points.length) return { x: 0, y: 0 };
  const total = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: total.x / points.length, y: total.y / points.length };
}

export default function FacadePhotoScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState('');
  const [imageBox, setImageBox] = useState({ width: 1, height: 1 });
  const [facadePoints, setFacadePoints] = useState<Point[]>([]);
  const [calibrationPoints, setCalibrationPoints] = useState<Point[]>([]);
  const [calibrationLength, setCalibrationLength] = useState('0,90');
  const [openingsArea, setOpeningsArea] = useState('0');
  const [step, setStep] = useState<'facade' | 'calibration'>('facade');

  async function pickFromCamera() {
    const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPerm.granted) {
      Alert.alert('Autorisation refusée', 'Autorise l’accès caméra pour utiliser la photo assistée.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
      setFacadePoints([]);
      setCalibrationPoints([]);
      setStep('facade');
    }
  }

  async function pickFromLibrary() {
    const mediaPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!mediaPerm.granted) {
      Alert.alert('Autorisation refusée', 'Autorise l’accès photos pour utiliser la photo assistée.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
      setFacadePoints([]);
      setCalibrationPoints([]);
      setStep('facade');
    }
  }

  function onImageLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setImageBox({ width, height });
  }

  function onImagePress(event: any) {
    const { locationX, locationY } = event.nativeEvent;
    const point = { x: locationX, y: locationY };

    if (step === 'facade') {
      setFacadePoints((prev) => (prev.length >= 4 ? prev : [...prev, point]));
      return;
    }

    setCalibrationPoints((prev) => (prev.length >= 2 ? prev : [...prev, point]));
  }

  const result = useMemo(() => {
    const pixelArea = polygonArea(facadePoints);
    if (facadePoints.length < 4 || calibrationPoints.length < 2) {
      return {
        pixelArea,
        pixelLength: 0,
        scaleMetersPerPixel: 0,
        grossSurface: 0,
        netSurface: 0,
      };
    }

    const pixelLength = distance(calibrationPoints[0], calibrationPoints[1]);
    const realLength = n(calibrationLength);

    if (pixelLength <= 0 || realLength <= 0) {
      return {
        pixelArea,
        pixelLength,
        scaleMetersPerPixel: 0,
        grossSurface: 0,
        netSurface: 0,
      };
    }

    const scaleMetersPerPixel = realLength / pixelLength;
    const grossSurface = pixelArea * scaleMetersPerPixel * scaleMetersPerPixel;
    const netSurface = Math.max(0, grossSurface - n(openingsArea));

    return {
      pixelArea,
      pixelLength,
      scaleMetersPerPixel,
      grossSurface,
      netSurface,
    };
  }, [facadePoints, calibrationPoints, calibrationLength, openingsArea]);

  function resetPoints() {
    if (step === 'facade') {
      setFacadePoints([]);
      return;
    }
    setCalibrationPoints([]);
  }

  function sendToPricing() {
    if (result.netSurface <= 0) {
      Alert.alert('Surface invalide', 'Termine la façade, la calibration puis vérifie la surface nette.');
      return;
    }

    router.push({
      pathname: '/pricing' as any,
      params: {
        facadeSurface: String(result.netSurface),
        type: 'facade-photo-v1',
      },
    });
  }

  const facadeCenter = centroid(facadePoints);

  return (
    <GlideScreen title="Façade photo assistée">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Photo</Text>
          <Text style={styles.helper}>
            V1 assistée : prends une photo la plus de face possible. Puis pose 4 points sur la façade
            et 2 points sur une distance réelle connue.
          </Text>

          <View style={styles.row}>
            <Pressable style={[styles.button, styles.primaryButton]} onPress={pickFromCamera}>
              <Text style={styles.primaryButtonText}>Prendre une photo</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.secondaryButton]} onPress={pickFromLibrary}>
              <Text style={styles.secondaryButtonText}>Choisir une photo</Text>
            </Pressable>
          </View>

          <View style={styles.statusBox}>
            <Text style={styles.statusText}>
              Étape active : {step === 'facade' ? 'Points façade (4)' : 'Calibration (2 points)'}
            </Text>
          </View>
        </View>

        {imageUri ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Zone photo</Text>
            <Text style={styles.helper}>
              Ordre conseillé façade : bas gauche → bas droit → haut droit → haut gauche
            </Text>

            <Pressable style={styles.imageWrap} onLayout={onImageLayout} onPress={onImagePress}>
              <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
              <View pointerEvents="none" style={styles.overlay}>
                {facadePoints.map((point, index) => (
                  <View
                    key={`f-${index}`}
                    style={[styles.point, styles.facadePoint, { left: point.x - 9, top: point.y - 9 }]}
                  >
                    <Text style={styles.pointText}>{index + 1}</Text>
                  </View>
                ))}

                {calibrationPoints.map((point, index) => (
                  <View
                    key={`c-${index}`}
                    style={[styles.point, styles.calibrationPoint, { left: point.x - 9, top: point.y - 9 }]}
                  >
                    <Text style={styles.pointText}>{index + 1}</Text>
                  </View>
                ))}

                {facadePoints.length === 4 ? (
                  <View
                    style={[
                      styles.centerBadge,
                      {
                        left: Math.max(8, Math.min(imageBox.width - 128, facadeCenter.x - 64)),
                        top: Math.max(8, Math.min(imageBox.height - 30, facadeCenter.y - 15)),
                      },
                    ]}
                  >
                    <Text style={styles.centerBadgeText}>Façade OK</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>

            <View style={styles.row}>
              <Pressable
                style={[styles.button, step === 'facade' ? styles.primaryButton : styles.secondaryButton]}
                onPress={() => setStep('facade')}
              >
                <Text style={step === 'facade' ? styles.primaryButtonText : styles.secondaryButtonText}>Points façade</Text>
              </Pressable>
              <Pressable
                style={[styles.button, step === 'calibration' ? styles.primaryButton : styles.secondaryButton]}
                onPress={() => setStep('calibration')}
              >
                <Text style={step === 'calibration' ? styles.primaryButtonText : styles.secondaryButtonText}>Calibration</Text>
              </Pressable>
            </View>

            <Pressable style={[styles.button, styles.secondaryButton]} onPress={resetPoints}>
              <Text style={styles.secondaryButtonText}>
                Réinitialiser {step === 'facade' ? 'les 4 points façade' : 'la calibration'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Calibration</Text>
          <Text style={styles.label}>Distance réelle connue (m)</Text>
          <TextInput
            style={styles.input}
            value={calibrationLength}
            onChangeText={setCalibrationLength}
            keyboardType="decimal-pad"
            placeholder="0,90"
            placeholderTextColor="#91919A"
          />
          <Text style={styles.helper}>
            Exemple : largeur de porte, baie, fenêtre ou mesure au télémètre.
          </Text>

          <Text style={styles.label}>Déduction ouvrants totale (m²)</Text>
          <TextInput
            style={styles.input}
            value={openingsArea}
            onChangeText={setOpeningsArea}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#91919A"
          />
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalTitle}>Résultat photo assistée</Text>
          <Text style={styles.totalLine}>Points façade : {facadePoints.length} / 4</Text>
          <Text style={styles.totalLine}>Points calibration : {calibrationPoints.length} / 2</Text>
          <Text style={styles.totalLine}>Surface brute estimée : {fmt(result.grossSurface)} m²</Text>
          <Text style={styles.totalLine}>Ouvrants déduits : {fmt(n(openingsArea))} m²</Text>
          <Text style={styles.totalStrong}>Surface nette estimée : {fmt(result.netSurface)} m²</Text>
        </View>

        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Important</Text>
          <Text style={styles.warningText}>
            V1 photo assistée = estimation terrain. Le résultat dépend de la photo, du cadrage et de la
            qualité du repère connu. Utilise le mode manuel si tu veux un contrôle complet.
          </Text>
        </View>

        <View style={styles.footerCard}>
          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.primaryButton]} onPress={sendToPricing}>
              <Text style={styles.primaryButtonText}>Envoyer vers Calcul Prix</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </GlideScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 36 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4E4E8',
    padding: 18,
    gap: 10,
  },
  cardTitle: { color: '#17171C', fontSize: 18, fontWeight: '800' },
  label: { color: '#17171C', fontSize: 14, fontWeight: '700', marginTop: 2 },
  input: {
    minHeight: 46,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DCDCE2',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    color: '#17171C',
    fontSize: 16,
  },
  helper: { color: '#74747D', fontSize: 13, lineHeight: 19 },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  button: {
    minHeight: 48,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    flexGrow: 1,
  },
  primaryButton: { backgroundColor: '#D4AF37' },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  primaryButtonText: { color: '#111111', fontWeight: '900', fontSize: 15, textAlign: 'center' },
  secondaryButtonText: { color: '#B38918', fontWeight: '800', fontSize: 15, textAlign: 'center' },
  statusBox: {
    minHeight: 42,
    borderRadius: 16,
    backgroundColor: '#FFF8E8',
    borderWidth: 1,
    borderColor: '#E7CF86',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  statusText: { color: '#B38918', fontWeight: '800', fontSize: 13 },
  imageWrap: {
    width: '100%',
    height: 360,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#F5F5F7',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  point: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  facadePoint: {
    backgroundColor: '#D4AF37',
    borderWidth: 2,
    borderColor: '#111111',
  },
  calibrationPoint: {
    backgroundColor: '#111111',
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  pointText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 9,
  },
  centerBadge: {
    position: 'absolute',
    minHeight: 30,
    minWidth: 128,
    borderRadius: 999,
    backgroundColor: 'rgba(212, 175, 55, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  centerBadgeText: { color: '#111111', fontWeight: '900' },
  totalCard: {
    backgroundColor: '#FFF8E8',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E7CF86',
    padding: 18,
    gap: 6,
  },
  totalTitle: { color: '#B38918', fontSize: 20, fontWeight: '900' },
  totalLine: { color: '#17171C', fontSize: 15, fontWeight: '700' },
  totalStrong: { color: '#B38918', fontSize: 18, fontWeight: '900', marginTop: 2 },
  warningCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4E4E8',
    padding: 18,
    gap: 6,
  },
  warningTitle: { color: '#17171C', fontSize: 16, fontWeight: '900' },
  warningText: { color: '#74747D', fontSize: 14, lineHeight: 20 },
  footerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4E4E8',
    padding: 14,
  },
  actions: { gap: 12 },
});
