
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import GlideScreen from '../../../components/glide/GlideScreen';
import {
  deleteFacadePolygon,
  duplicateFacadePolygon,
  useFacadePolygonStore,
} from '../../../lib/facadePolygonStore';

const fmt = (v: number) => v.toFixed(2).replace('.', ',');

export default function FacadePhotoPolyScreen() {
  const router = useRouter();
  const { facades } = useFacadePolygonStore();

  const totalNet = facades.reduce((sum, item) => sum + item.netSurfaceM2, 0);
  const totalGross = facades.reduce((sum, item) => sum + item.grossSurfaceM2, 0);
  const totalVoid = facades.reduce((sum, item) => sum + item.voidSurfaceM2, 0);

  return (
    <GlideScreen title="Façades polygonales">
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>V2 PRO · Photo polygonale multi-façades</Text>
          <Text style={styles.heroText}>
            Trace le contour réel de la façade, dessine directement les vides
            sur la photo, définis une cote connue, puis additionne autant de
            façades que nécessaire pour toute l’habitation.
          </Text>

          <View style={styles.row}>
            <Pressable
              style={[styles.button, styles.primaryButton]}
              onPress={() => router.push('/facade-photo-polygon-pointing')}
            >
              <Text style={styles.primaryButtonText}>Ajouter une façade</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Synthèse habitation</Text>
          <Text style={styles.summaryLine}>Façades enregistrées : {facades.length}</Text>
          <Text style={styles.summaryLine}>Surface brute totale : {fmt(totalGross)} m²</Text>
          <Text style={styles.summaryLine}>Vides déduits : {fmt(totalVoid)} m²</Text>
          <Text style={styles.summaryStrong}>Surface nette totale : {fmt(totalNet)} m²</Text>
        </View>

        {facades.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aucune façade enregistrée</Text>
            <Text style={styles.emptyText}>
              Commence par créer une façade polygonale. Tu pourras ensuite
              dupliquer, modifier et additionner toutes les façades de la maison.
            </Text>
          </View>
        ) : null}

        {facades.map((facade, index) => (
          <View key={facade.id} style={styles.facadeCard}>
            <View style={styles.facadeHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.facadeTitle}>
                  {facade.name || `Façade ${index + 1}`}
                </Text>
                <Text style={styles.facadeSub}>
                  Contour : {facade.outerPolygon.length} points ·
                  Vides : {facade.voidPolygons.length} ·
                  Cote : {facade.scaleReference.realDistanceMeters > 0
                    ? ` ${fmt(facade.scaleReference.realDistanceMeters)} m`
                    : ' non définie'}
                </Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{fmt(facade.netSurfaceM2)} m²</Text>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <Text style={styles.metricText}>Brut : {fmt(facade.grossSurfaceM2)} m²</Text>
              <Text style={styles.metricText}>Vides : {fmt(facade.voidSurfaceM2)} m²</Text>
              <Text style={styles.metricText}>Net : {fmt(facade.netSurfaceM2)} m²</Text>
            </View>

            <View style={styles.row}>
              <Pressable
                style={[styles.button, styles.secondaryButton]}
                onPress={() =>
                  router.push({
                    pathname: '/facade-photo-polygon-pointing',
                    params: { facadeId: facade.id },
                  })
                }
              >
                <Text style={styles.secondaryButtonText}>Modifier</Text>
              </Pressable>

              <Pressable
                style={[styles.button, styles.secondaryButton]}
                onPress={() => duplicateFacadePolygon(facade.id)}
              >
                <Text style={styles.secondaryButtonText}>Dupliquer</Text>
              </Pressable>

              <Pressable
                style={[styles.button, styles.dangerButton]}
                onPress={() => deleteFacadePolygon(facade.id)}
              >
                <Text style={styles.dangerButtonText}>Supprimer</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </GlideScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4E4E8',
    padding: 18,
    gap: 10,
  },
  heroTitle: { color: '#17171C', fontSize: 20, fontWeight: '900' },
  heroText: { color: '#74747D', fontSize: 14, lineHeight: 21 },
  summaryCard: {
    backgroundColor: '#FFF8E8',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E7CF86',
    padding: 18,
    gap: 6,
  },
  summaryTitle: { color: '#B38918', fontSize: 19, fontWeight: '900' },
  summaryLine: { color: '#17171C', fontSize: 15, fontWeight: '700' },
  summaryStrong: { color: '#B38918', fontSize: 22, fontWeight: '900', marginTop: 2 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4E4E8',
    padding: 18,
    gap: 8,
  },
  emptyTitle: { color: '#17171C', fontSize: 17, fontWeight: '900' },
  emptyText: { color: '#74747D', fontSize: 14, lineHeight: 21 },
  facadeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4E4E8',
    padding: 18,
    gap: 12,
  },
  facadeHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  facadeTitle: { color: '#17171C', fontSize: 18, fontWeight: '900' },
  facadeSub: { color: '#74747D', fontSize: 13, lineHeight: 18, marginTop: 4 },
  badge: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#F8F1DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: '#B38918', fontWeight: '900', fontSize: 14 },
  metricsRow: { gap: 4 },
  metricText: { color: '#17171C', fontSize: 14, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  button: {
    minHeight: 46,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    flexGrow: 1,
  },
  primaryButton: { backgroundColor: '#D4AF37' },
  secondaryButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D4AF37' },
  dangerButton: { backgroundColor: '#FFF1F1', borderWidth: 1, borderColor: '#E38A8A' },
  primaryButtonText: { color: '#111111', fontWeight: '900', fontSize: 15 },
  secondaryButtonText: { color: '#B38918', fontWeight: '800', fontSize: 15 },
  dangerButtonText: { color: '#B24A4A', fontWeight: '800', fontSize: 15 },
});
