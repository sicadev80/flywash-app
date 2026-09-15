import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import GlideScreen from '../../components/glide/GlideScreen';
import GlideAddButton from '../../components/glide/GlideAddButton';
import GlideBottomSheet from '../../components/glide/GlideBottomSheet';
import GlideCard from '../../components/glide/GlideCard';
import {
  loadEquipment,
  saveEquipment,
  getEquipmentMonthlyCost,
  getEquipmentDailyCost,
  getEquipmentHourlyCost,
  type EquipmentCategory,
  type EquipmentItem,
} from '../../lib/equipmentStore';

const makeId = () => `eq-${Date.now()}`;
const n = (v: string) => Number(String(v || '').replace(',', '.')) || 0;
const fmt = (v: number) => v.toFixed(2).replace('.', ',');

function Chip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const CATEGORIES: { key: EquipmentCategory; label: string }[] = [
  { key: 'drone', label: 'Drone' },
  { key: 'perche', label: 'Perche' },
  { key: 'karcher', label: 'Karcher' },
  { key: 'autre', label: 'Autre' },
];

export default function EquipmentScreen() {
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [visible, setVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [category, setCategory] = useState<EquipmentCategory>('drone');
  const [label, setLabel] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [amortizationMonths, setAmortizationMonths] = useState('36');
  const [monthlyMaintenance, setMonthlyMaintenance] = useState('');

  useEffect(() => {
    loadEquipment().then(setItems);
  }, []);

  async function persist(next: EquipmentItem[]) {
    setItems(next);
    await saveEquipment(next);
  }

  function resetForm() {
    setEditingId(null);
    setCategory('drone');
    setLabel('');
    setPurchasePrice('');
    setAmortizationMonths('36');
    setMonthlyMaintenance('');
  }

  function openCreate() {
    resetForm();
    setVisible(true);
  }

  function openEdit(item: EquipmentItem) {
    setEditingId(item.id);
    setCategory(item.category);
    setLabel(item.label);
    setPurchasePrice(String(item.purchasePrice).replace('.', ','));
    setAmortizationMonths(String(item.amortizationMonths).replace('.', ','));
    setMonthlyMaintenance(String(item.monthlyMaintenance).replace('.', ','));
    setVisible(true);
  }

  async function submitForm() {
    if (!label.trim()) return Alert.alert('Matériel', 'Renseigne un nom de matériel.');

    const payload: EquipmentItem = {
      id: editingId || makeId(),
      category,
      label: label.trim(),
      pricingMode: 'achat',
      purchasePrice: n(purchasePrice),
      amortizationMonths: n(amortizationMonths),
      monthlyMaintenance: n(monthlyMaintenance),
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

  const countText = useMemo(() => `${items.length} matériel(s) enregistré(s)`, [items]);

  return (
    <GlideScreen title="Mon Matériel" right={<GlideAddButton label="nouveau" onPress={openCreate} />}>
      <ScrollView contentContainerStyle={styles.content}>
        {items.map((item) => (
          <GlideCard key={item.id} title={item.label} subtitle={item.category}>
            <View style={styles.metaBox}>
              <Text style={styles.metaText}>Achat : {fmt(item.purchasePrice)} €</Text>
              <Text style={styles.metaText}>Amortissement : {item.amortizationMonths} mois</Text>
              <Text style={styles.metaText}>Entretien mensuel : {fmt(item.monthlyMaintenance)} €</Text>
              <Text style={styles.metaText}>Coût / mois : {fmt(getEquipmentMonthlyCost(item))} €</Text>
              <Text style={styles.metaText}>Coût / jour : {fmt(getEquipmentDailyCost(item))} €</Text>
              <Text style={styles.metaText}>Coût / heure : {fmt(getEquipmentHourlyCost(item))} €</Text>
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
        <Text style={styles.helper}>{countText}</Text>
      </ScrollView>

      <GlideBottomSheet
        visible={visible}
        title={editingId ? 'Modifier le matériel' : 'Ajouter un élément'}
        onClose={() => {
          Keyboard.dismiss();
          setVisible(false);
        }}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheet}>
          <Text style={styles.label}>Catégorie</Text>
          <View style={styles.rowWrap}>
            {CATEGORIES.map((item) => (
              <Chip
                key={item.key}
                active={category === item.key}
                label={item.label}
                onPress={() => setCategory(item.key)}
              />
            ))}
          </View>

          <Text style={styles.label}>Nom du matériel</Text>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="Matrice 300"
            placeholderTextColor="#91919A"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />

          <Text style={styles.label}>Prix d'achat</Text>
          <TextInput
            style={styles.input}
            value={purchasePrice}
            onChangeText={setPurchasePrice}
            placeholder="0"
            placeholderTextColor="#91919A"
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />

          <Text style={styles.label}>Durée d'amortissement (mois)</Text>
          <TextInput
            style={styles.input}
            value={amortizationMonths}
            onChangeText={setAmortizationMonths}
            placeholder="36"
            placeholderTextColor="#91919A"
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />

          <Text style={styles.label}>Entretien mensuel</Text>
          <TextInput
            style={styles.input}
            value={monthlyMaintenance}
            onChangeText={setMonthlyMaintenance}
            placeholder="0"
            placeholderTextColor="#91919A"
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />

          <Pressable style={styles.keyboardButton} onPress={Keyboard.dismiss}>
            <Text style={styles.keyboardButtonText}>Fermer le clavier</Text>
          </Pressable>

          <View style={styles.previewBox}>
            <Text style={styles.previewText}>
              Coût / mois : {fmt((n(purchasePrice) / (n(amortizationMonths) || 1)) + n(monthlyMaintenance))} €
            </Text>
          </View>

          <View style={styles.row}>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => {
                Keyboard.dismiss();
                setVisible(false);
              }}
            >
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
  metaBox: { gap: 4 },
  metaText: { color: '#6F6F78', fontSize: 13 },
  helper: { color: '#6F6F78', fontSize: 13, paddingHorizontal: 2 },
  sheet: { gap: 12, paddingBottom: 20 },
  label: { color: '#202027', fontSize: 15, fontWeight: '700' },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DEDDE5',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#111111',
  },
  row: { flexDirection: 'row', gap: 10 },
  rowWrap: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  secondaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DFDFE6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryText: { color: '#3B3B44', fontWeight: '800' },
  primaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: '#E9D08C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryText: { color: '#6D5315', fontWeight: '900' },
  chip: {
    minHeight: 38,
    borderRadius: 999,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D6C08A',
    backgroundColor: '#FFFFFF',
  },
  chipActive: { backgroundColor: '#F2E4BD' },
  chipText: { color: '#9B7414', fontWeight: '800', fontSize: 13 },
  chipTextActive: { color: '#7C5B0E' },
  keyboardButton: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: '#F6F2E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardButtonText: { color: '#7C5B0E', fontWeight: '800' },
  previewBox: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: '#F7F2E3',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  previewText: { color: '#7C5B0E', fontWeight: '800' },
});
