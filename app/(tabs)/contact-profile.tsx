import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import GlideScreen from '../../components/glide/GlideScreen';
import { ContactProfileFields } from '../../components/contact/ContactProfileFields';
import { loadContactProfile, saveContactProfile, type ContactProfile } from '../../lib/contactStore';

const TEXT = '#18181C';

export default function ContactProfileScreen() {
  const [profile, setProfile] = useState<ContactProfile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContactProfile().then(setProfile);
  }, []);

  if (!profile) {
    return (
      <GlideScreen title="Informations de contact">
        <View style={styles.loading}>
          <Text style={styles.text}>Chargement…</Text>
        </View>
      </GlideScreen>
    );
  }

  function update<K extends keyof ContactProfile>(key: K, value: ContactProfile[K]) {
    setProfile((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    try {
      await saveContactProfile(profile);
      Alert.alert('Informations enregistrées', 'Tes informations de contact ont bien été mises à jour.');
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer pour le moment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlideScreen title="Informations de contact">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ContactProfileFields profile={profile} onChange={update} />

        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Text>
        </Pressable>
      </ScrollView>
    </GlideScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  loading: { padding: 24 },
  text: { color: TEXT, fontSize: 15 },
  saveButton: {
    marginTop: 12,
    backgroundColor: '#111111',
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
});
