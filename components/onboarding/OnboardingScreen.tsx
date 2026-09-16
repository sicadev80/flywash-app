import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContactProfileFields } from '../contact/ContactProfileFields';
import {
  DEFAULT_CONTACT_PROFILE,
  isContactProfileComplete,
  saveContactProfile,
  type ContactProfile,
} from '../../lib/contactStore';
import { ensureTrialStarted } from '../../lib/subscriptionStore';

const GOLD = '#C79A2B';
const TEXT = '#18181C';
const MUTED = '#6F6F78';

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [profile, setProfile] = useState<ContactProfile>(DEFAULT_CONTACT_PROFILE);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof ContactProfile>(key: K, value: ContactProfile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  async function handleContinue() {
    if (!isContactProfileComplete(profile)) {
      Alert.alert(
        'Informations incomplètes',
        'Renseigne au moins ton prénom, ton nom et ton email pour continuer.'
      );
      return;
    }

    setSaving(true);
    try {
      await saveContactProfile(profile);
      // Le compteur d'essai gratuit de 30 jours démarre dès que le contact
      // termine sa configuration initiale.
      await ensureTrialStarted();
      onComplete();
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer tes informations pour le moment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>FW</Text>
            </View>
            <Text style={styles.title}>Bienvenue sur Fly-Wash</Text>
            <Text style={styles.subtitle}>
              Avant de démarrer, renseigne tes informations de contact. Tu pourras les modifier à
              tout moment depuis le menu.
            </Text>
          </View>

          <ContactProfileFields profile={profile} onChange={update} />

          <Pressable
            style={[styles.continueButton, saving && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={saving}
          >
            <Text style={styles.continueButtonText}>{saving ? 'Enregistrement…' : 'Continuer'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F3EE' },
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 28, gap: 10 },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoText: { color: '#111111', fontSize: 20, fontWeight: '900' },
  title: { color: TEXT, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: MUTED, fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 8 },
  continueButton: {
    marginTop: 12,
    backgroundColor: '#111111',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonDisabled: { opacity: 0.6 },
  continueButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
});
