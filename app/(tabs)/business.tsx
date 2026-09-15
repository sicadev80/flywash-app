import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import GlideScreen from '../../components/glide/GlideScreen';
import GlideAddButton from '../../components/glide/GlideAddButton';
import GlideBottomSheet from '../../components/glide/GlideBottomSheet';
import GlideCard from '../../components/glide/GlideCard';
import { loadQuickPresets, saveQuickPresets, type QuickPreset } from '../../lib/quickPresetsStore';

const makeId = () => `preset-${Date.now()}`;
const n = (v: string) => Number(String(v || '').replace(',', '.')) || 0;
const fmt = (v: number) => v.toFixed(2).replace('.', ',');

function Chip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const EQUIPMENT_OPTIONS = [
  { key: 'drone', label: 'Drone' },
  { key: 'perche', label: 'Perche' },
  { key: 'karcher', label: 'Karcher' },
  { key: 'autre', label: 'Autre' },
];

export default function BusinessScreen() {
  const [items, setItems] = useState<QuickPreset[]>([]);
  const [visible, setVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [label, setLabel] = useState('');
  const [prestationType, setPrestationType] = useState('');
  const [suggestedEquipmentCategory, setSuggestedEquipmentCategory] = useState('drone');
  const [defaultConsumptionPerM2, setDefaultConsumptionPerM2] = useState('0,12');
  const [defaultYieldM2PerHour, setDefaultYieldM2PerHour] = useState('80');

  useEffect(() => {
    loadQuickPresets().then(setItems);
  }, []);

  async function persist(next: QuickPreset[]) {
    setItems(next);
    await saveQuickPresets(next);
  }

  function resetForm() {
    setEditingId(null);
    setLabel('');
    setPrestationType('');
    setSuggestedEquipmentCategory('drone');
    setDefaultConsumptionPerM2('0,12');
    setDefaultYieldM2PerHour('80');
  }

  function openCreate() {
    resetForm();
    setVisible(true);
  }

  function openEdit(item: QuickPreset) {
    setEditingId(item.id);
    setLabel(item.label);
    setPrestationType(item.prestationType);
    setSuggestedEquipmentCategory(item.suggestedEquipmentCategory);
    setDefaultConsumptionPerM2(String(item.defaultConsumptionPerM2).replace('.', ','));
    setDefaultYieldM2PerHour(String(item.defaultYieldM2PerHour).replace('.', ','));
    setVisible(true);
  }

  async function submitForm() {
    if (!label.trim()) return Alert.alert('Modèle chantier', 'Renseigne un nom.');
    if (!prestationType.trim()) return Alert.alert('Modèle chantier', 'Renseigne un type de prestation.');

    const payload: QuickPreset = {
      id: editingId || makeId(),
      label: label.trim(),
      prestationType: prestationType.trim(),
      suggestedEquipmentCategory,
      defaultConsumptionPerM2: n(defaultConsumptionPerM2),
      defaultYieldM2PerHour: n(defaultYieldM2PerHour),
    };

    if (editingId) {
      await persist(items.map((item) => (item.id === editingId ? payload : item)));
    } else {
      await persist([...items, payload]);
    }

    Keyboard.dismiss();
    resetForm();
    setVisible(false);
  }

  async function removeItem(id: string) {
    await persist(items.filter((item) => item.id !== id));
  }

  const helperText = useMemo(() => `${items.length} modèle(s) chantier enregistré(s)`, [items]);

  return (
    <GlideScreen title="Modèles chantier" right={<GlideAddButton label="nouveau" onPress={openCreate} />}>
      <ScrollView contentContainerStyle={styles.content}>
        <GlideCard title="Modèles chantier" subtitle="Automatiser vos chiffrages chantier">
          <Text style={styles.helper}>{helperText}</Text>
        </GlideCard>

        {items.map((item) => (
          <GlideCard
            key={item.id}
            title={item.label}
            subtitle={`${item.prestationType} · ${item.suggestedEquipmentCategory}`}
          >
            <View style={styles.metaBox}>
              <Text style={styles.metaText}>Conso : {fmt(item.defaultConsumptionPerM2)} L/m²</Text>
              <Text style={styles.metaText}>Rendement : {fmt(item.defaultYieldM2PerHour)} m²/h</Text>
            </View>
            <View style={styles.row}>
              <Pressable style={styles.secondaryButton} onPress={() => openEdit(item)}>
                <Text style={styles.secondaryText}>Modifier</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={() => removeItem(item.id)}>
                <Text style={styles.secondaryText}>Supprimer</Text>
              </Pressable>
            </View>
          </GlideCard>
        ))}
      </ScrollView>

      <GlideBottomSheet visible={visible} title={editingId ? 'Modifier le modèle' : 'Ajouter un modèle'} onClose={() => { Keyboard.dismiss(); setVisible(false); }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheet}>
          <Text style={styles.label}>Nom du modèle</Text>
          <TextInput style={styles.input} value={label} onChangeText={setLabel} placeholder="Toiture standard" placeholderTextColor="#91919A" />

          <Text style={styles.label}>Type de prestation</Text>
          <TextInput style={styles.input} value={prestationType} onChangeText={setPrestationType} placeholder="Toiture" placeholderTextColor="#91919A" />

          <Text style={styles.label}>Matériel suggéré</Text>
          <View style={styles.rowWrap}>
            {EQUIPMENT_OPTIONS.map((opt) => (
              <Chip
                key={opt.key}
                active={suggestedEquipmentCategory === opt.key}
                label={opt.label}
                onPress={() => setSuggestedEquipmentCategory(opt.key)}
              />
            ))}
          </View>

          <Text style={styles.label}>Consommation par m² (L/m²)</Text>
          <TextInput style={styles.input} value={defaultConsumptionPerM2} onChangeText={setDefaultConsumptionPerM2} placeholder="0,12" placeholderTextColor="#91919A" keyboardType="decimal-pad" />

          <Text style={styles.label}>Rendement (m²/h)</Text>
          <TextInput style={styles.input} value={defaultYieldM2PerHour} onChangeText={setDefaultYieldM2PerHour} placeholder="80" placeholderTextColor="#91919A" keyboardType="decimal-pad" />

          <Pressable style={styles.keyboardButton} onPress={Keyboard.dismiss}>
            <Text style={styles.keyboardButtonText}>Fermer le clavier</Text>
          </Pressable>

          <View style={styles.row}>
            <Pressable style={styles.secondaryButton} onPress={() => { Keyboard.dismiss(); setVisible(false); }}>
              <Text style={styles.secondaryText}>Annuler</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={submitForm}>
              <Text style={styles.primaryText}>{editingId ? 'Enregistrer' : 'Soumettre'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </GlideBottomSheet>
    </GlideScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  helper: { color: '#6F6F78', fontSize: 13 },
  metaBox: { gap: 4 },
  metaText: { color: '#6F6F78', fontSize: 13 },
  sheet: { gap: 12, paddingBottom: 10 },
  label: { color: '#202027', fontSize: 15, fontWeight: '700' },
  input: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: '#DEDDE5', backgroundColor: '#FFFFFF', paddingHorizontal: 14, fontSize: 16, color: '#111111' },
  row: { flexDirection: 'row', gap: 10 },
  rowWrap: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  secondaryButton: { flex: 1, minHeight: 46, borderRadius: 14, borderWidth: 1, borderColor: '#DFDFE6', justifyContent: 'center', alignItems: 'center' },
  secondaryText: { color: '#3B3B44', fontWeight: '800' },
  primaryButton: { flex: 1, minHeight: 46, borderRadius: 14, backgroundColor: '#E9D08C', justifyContent: 'center', alignItems: 'center' },
  primaryText: { color: '#6D5315', fontWeight: '900' },
  chip: { minHeight: 38, borderRadius: 999, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#D6C08A', backgroundColor: '#FFFFFF' },
  chipActive: { backgroundColor: '#F2E4BD' },
  chipText: { color: '#9B7414', fontWeight: '800', fontSize: 13 },
  chipTextActive: { color: '#7C5B0E' },
  keyboardButton: { minHeight: 42, borderRadius: 12, backgroundColor: '#F6F2E5', justifyContent: 'center', alignItems: 'center' },
  keyboardButtonText: { color: '#7C5B0E', fontWeight: '800' },
});
