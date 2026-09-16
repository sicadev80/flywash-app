import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Civility, ContactProfile } from '../../lib/contactStore';

const GOLD = '#C79A2B';
const TEXT = '#18181C';
const MUTED = '#6F6F78';

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
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
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
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
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
        autoCapitalize={autoCapitalize ?? (keyboardType === 'email-address' ? 'none' : 'words')}
      />
    </View>
  );
}

const CIVILITY_OPTIONS: Civility[] = ['M', 'Mme'];
const CIVILITY_LABELS: Record<Civility, string> = { M: 'M.', Mme: 'Mme' };

function digitsOnly(text: string): string {
  return text.replace(/\D/g, '').slice(0, 8);
}

function formatDateDigits(digits: string): string {
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// Un clavier numérique n'a pas de touche "/", donc on l'insère
// automatiquement au fil de la saisie (JJ, puis JJ/MM, puis JJ/MM/AAAA).
// Si l'utilisateur s'arrête à 6 chiffres (JJMMAA), on complète l'année sur 4
// chiffres à la sortie du champ : AA <= les 2 derniers chiffres de l'année en
// cours devient 20AA, sinon 19AA (28101984 -> reste tel quel, 281084 ->
// 28/10/1984, 281010 -> 28/10/2010). On n'étend jamais l'année PENDANT la
// saisie, sinon impossible de continuer à taper une année sur 4 chiffres.
function expandTwoDigitYear(yy: number): number {
  const currentYearYY = new Date().getFullYear() % 100;
  return yy <= currentYearYY ? 2000 + yy : 1900 + yy;
}

function expandBirthDateOnBlur(value: string): string {
  const digits = digitsOnly(value);
  if (digits.length !== 6) return value;
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = expandTwoDigitYear(Number(digits.slice(4, 6)));
  return `${dd}/${mm}/${yyyy}`;
}

function BirthDateField({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (v: string) => void;
}) {
  function handleChangeText(text: string) {
    onChangeText(formatDateDigits(digitsOnly(text)));
  }

  function handleBlur() {
    const expanded = expandBirthDateOnBlur(value);
    if (expanded !== value) onChangeText(expanded);
  }

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>Date de naissance</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={handleChangeText}
        onBlur={handleBlur}
        placeholder="JJ/MM/AAAA"
        placeholderTextColor="#9A9AA2"
        keyboardType="number-pad"
        maxLength={10}
      />
    </View>
  );
}

export function ContactProfileFields({
  profile,
  onChange,
}: {
  profile: ContactProfile;
  onChange: <K extends keyof ContactProfile>(key: K, value: ContactProfile[K]) => void;
}) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Civilité</Text>
      <View style={styles.chipRow}>
        {CIVILITY_OPTIONS.map((option) => (
          <Chip
            key={option}
            label={CIVILITY_LABELS[option]}
            active={profile.civility === option}
            onPress={() => onChange('civility', option)}
          />
        ))}
      </View>

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <Field
            label="Prénom"
            value={profile.firstName}
            onChangeText={(v) => onChange('firstName', v)}
            placeholder="Jonathan"
          />
        </View>
        <View style={styles.rowItem}>
          <Field
            label="Nom"
            value={profile.lastName}
            onChangeText={(v) => onChange('lastName', v)}
            placeholder="Lahaye"
          />
        </View>
      </View>

      <BirthDateField value={profile.birthDate} onChangeText={(v) => onChange('birthDate', v)} />

      <Field
        label="Email"
        value={profile.email}
        onChangeText={(v) => onChange('email', v)}
        placeholder="toi@exemple.fr"
        keyboardType="email-address"
      />

      <Field
        label="Téléphone"
        value={profile.phone}
        onChangeText={(v) => onChange('phone', v)}
        placeholder="06 00 00 00 00"
        keyboardType="phone-pad"
        autoCapitalize="none"
      />

      <Field
        label="Fonction dans l'entreprise"
        value={profile.roleInCompany}
        onChangeText={(v) => onChange('roleInCompany', v)}
        placeholder="Gérant, technicien..."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
    marginBottom: 10,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 18,
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
});
