import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import GlideScreen from '../../components/glide/GlideScreen';
import GlideAddButton from '../../components/glide/GlideAddButton';
import GlideBottomSheet from '../../components/glide/GlideBottomSheet';
import GlideCard from '../../components/glide/GlideCard';
import { loadVehicles, saveVehicles, type VehicleItem, type VehicleType } from '../../lib/vehiclesStore';

const makeId = () => `veh-${Date.now()}`;
const n = (v: string) => Number(String(v || '').replace(',', '.')) || 0;
const fmt = (v: number) => v.toFixed(2).replace('.', ',');

function Chip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function VehiclesScreen() {
  const [items, setItems] = useState<VehicleItem[]>([]);
  const [visible, setVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [label, setLabel] = useState('');
  const [type, setType] = useState<VehicleType>('societe');
  const [monthlyLease, setMonthlyLease] = useState('');
  const [litersPer100, setLitersPer100] = useState('');
  const [mileageAllowance, setMileageAllowance] = useState('');

  useEffect(() => {
    loadVehicles().then(setItems);
  }, []);

  async function persist(next: VehicleItem[]) {
    setItems(next);
    await saveVehicles(next);
  }

  function resetForm() {
    setEditingId(null);
    setLabel('');
    setType('societe');
    setMonthlyLease('');
    setLitersPer100('');
    setMileageAllowance('');
  }

  function openCreate() {
    resetForm();
    setVisible(true);
  }

  function openEdit(item: VehicleItem) {
    setEditingId(item.id);
    setLabel(item.label);
    setType(item.type);
    setMonthlyLease(item.type === 'societe' ? String(item.monthlyLease).replace('.', ',') : '');
    setLitersPer100(item.type === 'societe' ? String(item.litersPer100).replace('.', ',') : '');
    setMileageAllowance(item.type === 'particulier' ? String(item.mileageAllowance).replace('.', ',') : '');
    setVisible(true);
  }

  async function submitForm() {
    if (!label.trim()) return Alert.alert('Véhicule', 'Renseigne un nom de véhicule.');

    const payload: VehicleItem = {
      id: editingId || makeId(),
      label: label.trim(),
      type,
      monthlyLease: type === 'societe' ? n(monthlyLease) : 0,
      litersPer100: type === 'societe' ? n(litersPer100) : 0,
      mileageAllowance: type === 'particulier' ? n(mileageAllowance) : 0,
    };

    if (editingId) {
      const next = items.map((item) => (item.id === editingId ? payload : item));
      await persist(next);
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

  const countText = useMemo(() => `${items.length} véhicule(s) enregistré(s)`, [items]);

  return (
    <GlideScreen title="Mes Véhicules" right={<GlideAddButton label="ajouter" onPress={openCreate} />}>
      <ScrollView contentContainerStyle={styles.content}>
        {items.map((item) => (
          <GlideCard
            key={item.id}
            title={item.label}
            subtitle={item.type === 'societe' ? 'Véhicule société' : 'Véhicule particulier'}
          >
            <View style={styles.metaBox}>
              {item.type === 'societe' ? (
                <>
                  <Text style={styles.metaText}>Mensualité / crédit-bail : {fmt(item.monthlyLease)} €</Text>
                  <Text style={styles.metaText}>Consommation : {fmt(item.litersPer100)} L / 100 km</Text>
                </>
              ) : (
                <Text style={styles.metaText}>Frais kilométrique : {fmt(item.mileageAllowance)} € / km</Text>
              )}
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

      <GlideBottomSheet visible={visible} title={editingId ? 'Modifier le véhicule' : 'Ajouter un élément'} onClose={() => { Keyboard.dismiss(); setVisible(false); }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheet}>
          <Text style={styles.label}>Nom du véhicule</Text>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="Peugeot Expert"
            placeholderTextColor="#91919A"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />

          <Text style={styles.label}>Type</Text>
          <View style={styles.rowWrap}>
            <Chip active={type === 'societe'} label="Société" onPress={() => setType('societe')} />
            <Chip active={type === 'particulier'} label="Particulier" onPress={() => setType('particulier')} />
          </View>

          {type === 'societe' ? (
            <>
              <Text style={styles.label}>Mensualité / crédit-bail</Text>
              <TextInput
                style={styles.input}
                value={monthlyLease}
                onChangeText={setMonthlyLease}
                placeholder="0"
                placeholderTextColor="#91919A"
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />

              <Text style={styles.label}>Consommation (L/100 km)</Text>
              <TextInput
                style={styles.input}
                value={litersPer100}
                onChangeText={setLitersPer100}
                placeholder="0"
                placeholderTextColor="#91919A"
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>Frais kilométrique (€ / km)</Text>
              <TextInput
                style={styles.input}
                value={mileageAllowance}
                onChangeText={setMileageAllowance}
                placeholder="0"
                placeholderTextColor="#91919A"
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
              <Text style={styles.helper}>Inclut assurance, carburant, crédit et entretien.</Text>
            </>
          )}

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
  metaBox: { gap: 4 },
  metaText: { color: '#6F6F78', fontSize: 13 },
  helper: { color: '#6F6F78', fontSize: 13, paddingHorizontal: 2 },
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
