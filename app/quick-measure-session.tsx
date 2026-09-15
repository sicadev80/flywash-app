import React from 'react';
import { Alert, Image, Pressable,Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuickMeasurementStore } from '../lib/quickMeasurementStore';
import { exportPdf } from '../lib/pdfExport';
import { StatusBar } from 'expo-status-bar';
const fmt = (v: number) => v.toFixed(2).replace('.', ',');

export default function QuickMeasureSessionScreen() {
  const router = useRouter();
  const facades = useQuickMeasurementStore((s) => s.facades);
  const removeFacade = useQuickMeasurementStore((s) => s.removeFacade);
  const reset = useQuickMeasurementStore((s) => s.reset);

  const totalNetArea = facades.reduce((sum, item) => sum + item.netAreaM2, 0);

  return (
<>
<StatusBar style="dark" />
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable style={styles.topPill} onPress={() => router.back()}>
            <Text style={styles.topPillText}>Retour</Text>
          </Pressable>

          <Text style={styles.title}>Relevé chantier</Text>

          <Pressable
            style={[styles.topPill, styles.goldPill]}
            onPress={() => router.push('/facade-photo-polygon-pointing')}
          >
            <Text style={styles.goldPillText}>Ajouter</Text>
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Résumé</Text>
          <Text style={styles.summaryText}>Façades enregistrées : {facades.length}</Text>
          <Text style={styles.summaryText}>Surface totale nette : {fmt(totalNetArea)} m²</Text>
        </View>

        {facades.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aucune façade enregistrée</Text>
            <Text style={styles.emptyText}>
              Retourne sur l’écran de mesure pour ajouter une première façade.
            </Text>

            <Pressable
              style={styles.goldButton}
              onPress={() => router.push('/facade-photo-polygon-pointing')}
            >
              <Text style={styles.goldButtonText}>Mesurer une façade</Text>
            </Pressable>
          </View>
        ) : (
          facades.map((facade, index) => (
            <View key={facade.id} style={styles.card}>
              {facade.imageUri ? (
                <Image source={{ uri: facade.imageUri }} style={styles.image} />
              ) : null}

              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>
                  {index + 1}. {facade.name}
                </Text>

                <Text style={styles.metric}>Surface brute : {fmt(facade.grossAreaM2)} m²</Text>
                <Text style={styles.metric}>Ouvrants : {fmt(facade.voidsAreaM2)} m²</Text>
                <Text style={styles.metricStrong}>Surface nette : {fmt(facade.netAreaM2)} m²</Text>

                <View style={styles.cardActions}>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => removeFacade(facade.id)}
                  >
                    <Text style={styles.secondaryButtonText}>Supprimer</Text>
                  </Pressable>
                </View>
              </View>
            </View>

          ))
        )}

        {facades.length > 0 ? (
          <>
            <Pressable
              style={styles.secondaryWideButton}
              onPress={() => router.push('/facade-photo-polygon-pointing')}
            >
              <Text style={styles.secondaryWideButtonText}>Ajouter une autre façade</Text>
            </Pressable>

           <Pressable
  style={styles.goldWideButton}
  onPress={async () => {
    try {
      await exportPdf(facades);
    } catch (error) {
      Alert.alert(
        'Export impossible',
        error instanceof Error ? error.message : 'Une erreur est survenue.'
      );
    }
  }}
>
  <Text style={styles.goldWideButtonText}>Exporter le dossier PDF</Text>
</Pressable>

            <Pressable style={styles.resetButton} onPress={reset}>
              <Text style={styles.resetButtonText}>Réinitialiser le relevé</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </View>
</> 
 );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F3EE',
   paddingTop: Platform.OS ==='ios' ? 28 : 0,  
},
  content: {
    paddingBottom: 32,
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
  summaryCard: {
    marginHorizontal: 14,
    marginBottom: 12,
    backgroundColor: '#EFE8DB',
    borderRadius: 20,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2D7C3',
  },
  summaryTitle: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '900',
  },
  summaryText: {
    color: '#3A3A3C',
    fontSize: 15,
  },
  emptyCard: {
    marginHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2D7C3',
  },
  emptyTitle: {
    color: '#1C1C1E',
    fontSize: 17,
    fontWeight: '900',
  },
  emptyText: {
    color: '#5A5A5E',
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    marginHorizontal: 14,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2D7C3',
  },
  image: {
    width: '100%',
    height: 190,
    backgroundColor: '#F1F1F1',
  },
  cardBody: {
    padding: 14,
    gap: 6,
  },
  cardTitle: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  metric: {
    color: '#3A3A3C',
    fontSize: 15,
  },
  metricStrong: {
    color: '#B8962E',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  secondaryButton: {
    backgroundColor: '#E7E2D9',
    borderRadius: 14,
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1C1C1E',
    fontWeight: '800',
  },
  goldButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  goldButtonText: {
    color: '#111111',
    fontWeight: '900',
    fontSize: 16,
  },
  secondaryWideButton: {
    marginHorizontal: 14,
    marginTop: 4,
    backgroundColor: '#E7E2D9',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryWideButtonText: {
    color: '#1C1C1E',
    fontWeight: '800',
    fontSize: 16,
  },
  goldWideButton: {
    marginHorizontal: 14,
    marginTop: 10,
    backgroundColor: '#D4AF37',
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goldWideButtonText: {
    color: '#111111',
    fontWeight: '900',
    fontSize: 17,
  },
  resetButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#B00020',
    fontWeight: '800',
  },
});
