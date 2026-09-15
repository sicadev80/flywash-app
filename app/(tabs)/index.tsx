import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import GlideScreen from '../../components/glide/GlideScreen';

function QuickCard({
  title,
  subtitle,
  icon,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={22} color="#9B7414" />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#A0A0A8" />
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();

  return (
    <GlideScreen title="Accueil">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Fly-Wash</Text>
          <Text style={styles.heroSubtitle}>
            Accès rapide à la dilution, aux calculs de surface et au prix de revient.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Outils essentiels</Text>

        <QuickCard
          title="Dilution"
          subtitle="Préparer les mélanges et ratios"
          icon="water-outline"
          onPress={() => router.push('/dilution')}
        />
        <QuickCard
          title="Calcul surface"
          subtitle="Toiture, terrain, pente et surface réelle"
          icon="layers-outline"
          onPress={() => router.push('/surface')}
        />
        <QuickCard
          title="Calcul prix"
          subtitle="Prix de revient et prix de vente"
          icon="calculator-outline"
          onPress={() => router.push('/pricing')}
        />

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Menu latéral</Text>
          <Text style={styles.noteText}>
            Utilise le bouton hamburger en haut à gauche pour accéder à Mes charges,
            Mes véhicules, Mon matériel, Mes produits, Profil et Business.
          </Text>
        </View>
      </ScrollView>
    </GlideScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  hero: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECECEF',
    gap: 6,
  },
  heroTitle: {
    color: '#1B1B1F',
    fontSize: 24,
    fontWeight: '900',
  },
  heroSubtitle: {
    color: '#6F6F78',
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    color: '#9B7414',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingHorizontal: 2,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECECEF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F5EED7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#1B1B1F',
    fontSize: 18,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: '#6F6F78',
    fontSize: 13,
  },
  noteCard: {
    backgroundColor: '#FFF9EB',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0E0AD',
    gap: 6,
  },
  noteTitle: {
    color: '#7B5D14',
    fontSize: 17,
    fontWeight: '800',
  },
  noteText: {
    color: '#7B6A37',
    fontSize: 14,
    lineHeight: 20,
  },
});
