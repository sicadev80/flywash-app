import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlideScreen from '../../components/glide/GlideScreen';
import {
  ensureTrialStarted,
  getTrialDaysRemaining,
  isTrialExpired,
  loadSubscriptionState,
  TRIAL_DURATION_DAYS,
  type SubscriptionState,
} from '../../lib/subscriptionStore';

const GOLD = '#C79A2B';
const TEXT = '#18181C';
const MUTED = '#6F6F78';

function handleComingSoon() {
  Alert.alert(
    'Bientôt disponible',
    "Le paiement en ligne n'est pas encore activé. On te préviendra dès que cette offre sera disponible."
  );
}

function OfferCard({
  title,
  price,
  features,
  current,
  highlight,
  ctaLabel,
  onSelect,
}: {
  title: string;
  price: string;
  features: string[];
  current?: boolean;
  highlight?: boolean;
  ctaLabel?: string;
  onSelect?: () => void;
}) {
  return (
    <View style={[styles.card, highlight && styles.cardHighlight]}>
      {current && (
        <View style={styles.currentBadge}>
          <Text style={styles.currentBadgeText}>Offre actuelle</Text>
        </View>
      )}
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardPrice}>{price}</Text>
      <View style={styles.featureList}>
        {features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={18} color={GOLD} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      {!current && (
        <Pressable style={styles.ctaButton} onPress={onSelect}>
          <Text style={styles.ctaButtonText}>{ctaLabel || 'Choisir cette offre'}</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function SubscriptionScreen() {
  const [state, setState] = useState<SubscriptionState | null>(null);

  useEffect(() => {
    // Filet de sécurité pour les comptes déjà onboardés avant l'ajout de
    // cette fonctionnalité : on démarre l'essai à la première visite de cet
    // écran s'il n'a jamais été démarré (onboarding le fait normalement déjà).
    ensureTrialStarted().then(setState);
  }, []);

  if (!state) {
    return (
      <GlideScreen title="Mon offre actuelle">
        <View style={styles.loading}>
          <Text style={styles.text}>Chargement…</Text>
        </View>
      </GlideScreen>
    );
  }

  const daysRemaining = getTrialDaysRemaining(state);
  const trialExpired = isTrialExpired(state);
  const onTrial = !state.chosenPlan;

  let statusTitle = '';
  let statusSubtitle = '';
  if (onTrial) {
    statusTitle = trialExpired ? 'Essai gratuit terminé' : `Essai gratuit — il te reste ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`;
    statusSubtitle = trialExpired
      ? "Choisis une offre ci-dessous pour continuer à profiter de tous les accès pro."
      : `Tu profites de tous les accès pro pendant ${TRIAL_DURATION_DAYS} jours, sans engagement.`;
  } else {
    statusTitle = state.chosenPlan === 'pro' ? 'Offre Pro active' : 'Offre Multi-utilisateurs active';
    statusSubtitle = 'Merci pour ta confiance !';
  }

  return (
    <GlideScreen title="Mon offre actuelle">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.statusCard, trialExpired && onTrial && styles.statusCardExpired]}>
          <Ionicons
            name={trialExpired && onTrial ? 'alert-circle' : 'sparkles'}
            size={22}
            color={trialExpired && onTrial ? '#B3261E' : GOLD}
          />
          <View style={styles.statusTextWrap}>
            <Text style={styles.statusTitle}>{statusTitle}</Text>
            <Text style={styles.statusSubtitle}>{statusSubtitle}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Offres disponibles</Text>

        <OfferCard
          title="Essai gratuit"
          price={`${TRIAL_DURATION_DAYS} jours offerts`}
          features={['Tous les accès pro', 'Aucune carte bancaire requise', 'Sans engagement']}
          current={onTrial}
        />

        <OfferCard
          title="Offre Pro"
          price="Utilisateur simple"
          features={['Tous les accès pro', 'Utilisation en solo', 'Support prioritaire']}
          current={state.chosenPlan === 'pro'}
          highlight
          onSelect={handleComingSoon}
        />

        <OfferCard
          title="Offre Multi-utilisateurs"
          price="Équipe"
          features={['Tous les accès pro', 'Plusieurs comptes liés', 'Gestion d’équipe centralisée']}
          current={state.chosenPlan === 'multi-user'}
          onSelect={handleComingSoon}
        />
      </ScrollView>
    </GlideScreen>
  );
}

const styles = StyleSheet.create({
  loading: { padding: 24 },
  text: { color: TEXT, fontSize: 15 },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 12,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFDF6',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: GOLD,
    padding: 16,
  },
  statusCardExpired: {
    backgroundColor: '#FDF2F1',
    borderColor: '#B3261E',
  },
  statusTextWrap: { flex: 1 },
  statusTitle: { color: TEXT, fontSize: 16, fontWeight: '900' },
  statusSubtitle: { color: MUTED, fontSize: 13, marginTop: 2, lineHeight: 18 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4E4E9',
    padding: 18,
    marginBottom: 14,
  },
  cardHighlight: { borderColor: GOLD, borderWidth: 1.5 },
  currentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F6EFD9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  currentBadgeText: { color: GOLD, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  cardTitle: { color: TEXT, fontSize: 18, fontWeight: '900' },
  cardPrice: { color: MUTED, fontSize: 13, fontWeight: '700', marginTop: 2, marginBottom: 12 },
  featureList: { gap: 8, marginBottom: 6 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { color: TEXT, fontSize: 13, flex: 1 },
  ctaButton: {
    marginTop: 12,
    backgroundColor: '#111111',
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
});
