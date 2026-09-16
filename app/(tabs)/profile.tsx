import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlideScreen from '../../components/glide/GlideScreen';
import {
  loadCompanyProfile,
  saveCompanyProfile,
  LEGAL_STATUS_LABELS,
  type CompanyProfile,
  type LegalStatus,
  type VatStatus,
} from '../../lib/companyStore';
import {
  searchCompanies,
  computeVatNumberFromSiren,
  type CompanySearchResult,
} from '../../lib/companyLookup';

const GOLD = '#C79A2B';
const TEXT = '#18181C';
const MUTED = '#6F6F78';

const LEGAL_STATUS_OPTIONS: LegalStatus[] = [
  'auto-entrepreneur',
  'EI',
  'EURL',
  'SASU',
  'SARL',
  'SAS',
  'autre',
];

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'decimal-pad' | 'phone-pad' | 'email-address' | 'number-pad';
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9A9AA2"
        keyboardType={keyboardType || 'default'}
        autoCapitalize="none"
      />
    </View>
  );
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [saving, setSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([]);
  const [searchError, setSearchError] = useState('');
  const [searchDone, setSearchDone] = useState(false);

  useEffect(() => {
    loadCompanyProfile().then(setProfile);
  }, []);

  if (!profile) {
    return (
      <GlideScreen title="Informations de société">
        <View style={styles.loading}>
          <Text style={styles.text}>Chargement…</Text>
        </View>
      </GlideScreen>
    );
  }

  function update<K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) {
    setProfile((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSearchCompany() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError('');
    setSearchDone(false);
    try {
      const results = await searchCompanies(searchQuery);
      setSearchResults(results);
      setSearchDone(true);
    } catch {
      setSearchError("Recherche indisponible pour le moment. Vérifie ta connexion.");
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  function handleSelectCompany(result: CompanySearchResult) {
    setProfile((prev) => {
      if (!prev) return prev;
      const vatNumber = computeVatNumberFromSiren(result.siren);
      return {
        ...prev,
        companyName: result.name,
        address: result.address,
        postalCode: result.postalCode,
        city: result.city,
        siret: result.siret,
        vatNumber: vatNumber || prev.vatNumber,
      };
    });
    setSearchResults([]);
    setSearchDone(false);
    setSearchQuery('');
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    try {
      await saveCompanyProfile(profile);
      Alert.alert('Profil enregistré', 'Ces informations apparaîtront désormais sur tes devis PDF.');
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer le profil pour le moment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlideScreen title="Informations de société">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchCard}>
          <View style={styles.searchCardHeader}>
            <View style={styles.searchIconCircle}>
              <Ionicons name="search" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.searchCardHeaderText}>
              <Text style={styles.searchCardTitle}>Recherche rapide</Text>
              <Text style={styles.searchCardSubtitle}>
                Nom, adresse, SIRET et TVA remplis automatiquement
              </Text>
            </View>
          </View>

          <View style={styles.searchRow}>
            <TextInput
              style={[styles.input, styles.searchInput]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Ex : Fly-Wash"
              placeholderTextColor="#9A9AA2"
              returnKeyType="search"
              onSubmitEditing={handleSearchCompany}
            />
            <Pressable
              style={[styles.searchButton, searching && styles.saveButtonDisabled]}
              onPress={handleSearchCompany}
              disabled={searching}
            >
              <Text style={styles.searchButtonText}>{searching ? '…' : 'Chercher'}</Text>
            </Pressable>
          </View>

          {!!searchError && <Text style={styles.errorText}>{searchError}</Text>}

          {searchDone && !searching && searchResults.length === 0 && !searchError && (
            <Text style={styles.hint}>Aucun résultat. Tu peux remplir les champs manuellement ci-dessous.</Text>
          )}

          {searchResults.map((result) => (
            <Pressable
              key={result.siret}
              style={styles.resultRow}
              onPress={() => handleSelectCompany(result)}
            >
              <Text style={styles.resultName}>{result.name}</Text>
              <Text style={styles.resultDetail}>
                {result.address} — {result.postalCode} {result.city}
              </Text>
              <Text style={styles.resultDetail}>SIRET : {result.siret}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Statut juridique</Text>
        <View style={styles.chipRow}>
          {LEGAL_STATUS_OPTIONS.map((status) => (
            <Chip
              key={status}
              label={LEGAL_STATUS_LABELS[status]}
              active={profile.legalStatus === status}
              onPress={() => update('legalStatus', status)}
            />
          ))}
        </View>

        {profile.legalStatus === 'autre' && (
          <Field
            label="Précise ton statut"
            value={profile.legalStatusOther}
            onChangeText={(v) => update('legalStatusOther', v)}
            placeholder="Ex : SCOP, association..."
          />
        )}

        <Text style={styles.sectionTitle}>Entreprise</Text>
        <Field
          label="Nom / Raison sociale"
          value={profile.companyName}
          onChangeText={(v) => update('companyName', v)}
          placeholder="Fly-Wash"
        />
        <Field
          label="Adresse"
          value={profile.address}
          onChangeText={(v) => update('address', v)}
          placeholder="12 rue des Lilas"
        />
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Field
              label="Code postal"
              value={profile.postalCode}
              onChangeText={(v) => update('postalCode', v)}
              placeholder="75000"
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.rowItem}>
            <Field
              label="Ville"
              value={profile.city}
              onChangeText={(v) => update('city', v)}
              placeholder="Paris"
            />
          </View>
        </View>
        <Field
          label="Téléphone"
          value={profile.phone}
          onChangeText={(v) => update('phone', v)}
          placeholder="06 00 00 00 00"
          keyboardType="phone-pad"
        />
        <Field
          label="Email"
          value={profile.email}
          onChangeText={(v) => update('email', v)}
          placeholder="contact@flywash.fr"
          keyboardType="email-address"
        />

        <Text style={styles.sectionTitle}>Mentions légales</Text>
        <Field
          label="SIRET"
          value={profile.siret}
          onChangeText={(v) => update('siret', v)}
          placeholder="123 456 789 00012"
          keyboardType="number-pad"
        />
        <Field
          label="RCS (si applicable)"
          value={profile.rcs}
          onChangeText={(v) => update('rcs', v)}
          placeholder="Ex : RCS Paris 123 456 789"
        />

        <Text style={styles.sectionTitle}>TVA</Text>
        <View style={styles.chipRow}>
          <Chip
            label="Non assujetti (art. 293 B du CGI)"
            active={profile.vatStatus === 'non-assujetti'}
            onPress={() => update('vatStatus', 'non-assujetti' as VatStatus)}
          />
          <Chip
            label="Assujetti à la TVA"
            active={profile.vatStatus === 'assujetti'}
            onPress={() => update('vatStatus', 'assujetti' as VatStatus)}
          />
        </View>

        {profile.vatStatus === 'assujetti' && (
          <>
            <Field
              label="Numéro de TVA intracommunautaire"
              value={profile.vatNumber}
              onChangeText={(v) => update('vatNumber', v)}
              placeholder="FR00123456789"
            />
            <Field
              label="Taux de TVA par défaut (%)"
              value={String(profile.defaultVatRate)}
              onChangeText={(v) => update('defaultVatRate', Number(v.replace(',', '.')) || 0)}
              placeholder="20"
              keyboardType="decimal-pad"
            />
            <Text style={styles.hint}>
              Tu pourras choisir un taux réduit (10 %, 5,5 %...) chantier par chantier au moment du chiffrage.
            </Text>
          </>
        )}

        <Text style={styles.sectionTitle}>Devis</Text>
        <Field
          label="Durée de validité du devis (jours)"
          value={String(profile.devisValidityDays)}
          onChangeText={(v) => update('devisValidityDays', Number(v) || 1)}
          placeholder="30"
          keyboardType="number-pad"
        />

        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Text>
        </Pressable>
      </ScrollView>
    </GlideScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  loading: { padding: 24 },
  text: { color: TEXT, fontSize: 15 },
  sectionTitle: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 10,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#F1F1F4',
    borderWidth: 1,
    borderColor: '#E4E4E9',
  },
  chipActive: { backgroundColor: '#F6EFD9', borderColor: GOLD },
  chipText: { color: MUTED, fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: GOLD },
  fieldWrap: { marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12 },
  rowItem: { flex: 1 },
  label: { color: TEXT, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  input: {
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: TEXT,
  },
  hint: { color: MUTED, fontSize: 12, marginTop: -4, marginBottom: 12 },
  searchCard: {
    backgroundColor: '#FFFDF6',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: GOLD,
    padding: 16,
    marginBottom: 22,
  },
  searchCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  searchIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchCardHeaderText: { flex: 1 },
  searchCardTitle: { color: TEXT, fontSize: 16, fontWeight: '900' },
  searchCardSubtitle: { color: MUTED, fontSize: 12, marginTop: 2 },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  searchInput: { flex: 1, backgroundColor: '#FFFFFF' },
  searchButton: {
    backgroundColor: '#111111',
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  errorText: { color: '#B3261E', fontSize: 12, marginTop: 8 },
  resultRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0DFAF',
    padding: 12,
    marginTop: 8,
  },
  resultName: { color: TEXT, fontWeight: '800', fontSize: 14, marginBottom: 2 },
  resultDetail: { color: MUTED, fontSize: 12 },
  saveButton: {
    marginTop: 24,
    backgroundColor: '#111111',
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
});
