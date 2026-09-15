import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import GlideScreen from '../../components/glide/GlideScreen';
import GlideAddButton from '../../components/glide/GlideAddButton';
import GlideBottomSheet from '../../components/glide/GlideBottomSheet';
import GlideCard from '../../components/glide/GlideCard';
import {
  loadFixedCostItems,
  saveFixedCostItems,
  loadFixedCostsConfig,
  saveFixedCostsConfig,
  getYearlyFixedCosts,
  getMonthlyFixedCosts,
  getFixedCostPerDay,
  getFixedCostPerHour,
  type FixedCostItem,
  type FixedCostPeriod,
} from '../../lib/fixedCostsStore';

const makeId = () => `fc-${Date.now()}`;
const n = (v: string) => Number(String(v || '').replace(',', '.')) || 0;
const fmt = (v: number) => v.toFixed(2).replace('.', ',');

function Chip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function ChargesScreen() {
  const [items, setItems] = useState<FixedCostItem[]>([]);
  const [workingDaysPerYear, setWorkingDaysPerYear] = useState('180');
  const [productiveHoursPerDay, setProductiveHoursPerDay] = useState('7');

  const [visible, setVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<FixedCostPeriod>('monthly');

  useEffect(() => {
    (async () => {
      const [loadedItems, config] = await Promise.all([loadFixedCostItems(), loadFixedCostsConfig()]);
      setItems(loadedItems);
      setWorkingDaysPerYear(String(config.workingDaysPerYear).replace('.', ','));
      setProductiveHoursPerDay(String(config.productiveHoursPerDay).replace('.', ','));
    })();
  }, []);

  async function persistItems(next: FixedCostItem[]) {
    setItems(next);
    await saveFixedCostItems(next);
  }

  async function persistConfig(nextWorkingDays: string, nextHours: string) {
    await saveFixedCostsConfig({
      workingDaysPerYear: n(nextWorkingDays),
      productiveHoursPerDay: n(nextHours),
    });
  }

  function resetForm() {
    setEditingId(null);
    setLabel('');
    setAmount('');
    setPeriod('monthly');
  }

  function openCreate() {
    resetForm();
    setVisible(true);
  }

  function openEdit(item: FixedCostItem) {
    setEditingId(item.id);
    setLabel(item.label);
    setAmount(String(item.amount).replace('.', ','));
    setPeriod(item.period);
    setVisible(true);
  }

  async function submitForm() {
    if (!label.trim()) return Alert.alert('Charge', 'Renseigne un libellé.');
    const payload: FixedCostItem = {
      id: editingId || makeId(),
      label: label.trim(),
      amount: n(amount),
      period,
    };
    if (editingId) {
      await persistItems(items.map((item) => (item.id === editingId ? payload : item)));
    } else {
      await persistItems([...items, payload]);
    }
    Keyboard.dismiss();
    resetForm();
    setVisible(false);
  }

  async function removeItem(id: string) {
    await persistItems(items.filter((item) => item.id !== id));
  }

  const config = useMemo(
    () => ({
      workingDaysPerYear: n(workingDaysPerYear),
      productiveHoursPerDay: n(productiveHoursPerDay),
    }),
    [workingDaysPerYear, productiveHoursPerDay]
  );

  const yearly = useMemo(() => getYearlyFixedCosts(items), [items]);
  const monthly = useMemo(() => getMonthlyFixedCosts(items), [items]);
  const perDay = useMemo(() => getFixedCostPerDay(items, config), [items, config]);
  const perHour = useMemo(() => getFixedCostPerHour(items, config), [items, config]);

  return (
    <GlideScreen title="Mes charges" right={<GlideAddButton label="nouveau" onPress={openCreate} />}>
      <ScrollView contentContainerStyle={styles.content}>
        <GlideCard title="Configuration entreprise" subtitle="Base de calcul du coût fixe">
          <Text style={styles.label}>Jours travaillés par an</Text>
          <TextInput
            style={styles.input}
            value={workingDaysPerYear}
            onChangeText={(v) => {
              setWorkingDaysPerYear(v);
              persistConfig(v, productiveHoursPerDay);
            }}
            placeholder="180"
            placeholderTextColor="#91919A"
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />
          <Text style={styles.label}>Heures productives par jour</Text>
          <TextInput
            style={styles.input}
            value={productiveHoursPerDay}
            onChangeText={(v) => {
              setProductiveHoursPerDay(v);
              persistConfig(workingDaysPerYear, v);
            }}
            placeholder="7"
            placeholderTextColor="#91919A"
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />
        </GlideCard>

        <GlideCard title="Synthèse" subtitle="Charges fixes V2 pro">
          <Text style={styles.metric}>Total mensuel : {fmt(monthly)} €</Text>
          <Text style={styles.metric}>Total annuel : {fmt(yearly)} €</Text>
          <Text style={styles.metric}>Coût fixe / jour : {fmt(perDay)} €</Text>
          <Text style={styles.metric}>Coût fixe / heure : {fmt(perHour)} €</Text>
        </GlideCard>

        {items.map((item) => (
          <GlideCard
            key={item.id}
            title={item.label}
            subtitle={item.period === 'monthly' ? 'Mensuelle' : 'Annuelle'}
          >
            <View style={styles.metaBox}>
              <Text style={styles.metaText}>Montant : {fmt(item.amount)} €</Text>
              <Text style={styles.metaText}>
                Equivalent annuel : {fmt(item.period === 'monthly' ? item.amount * 12 : item.amount)} €
              </Text>
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

      <GlideBottomSheet
        visible={visible}
        title={editingId ? 'Modifier la charge' : 'Ajouter un élément'}
        onClose={() => {
          Keyboard.dismiss();
          setVisible(false);
        }}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheet}>
          <Text style={styles.label}>Libellé</Text>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="Comptable"
            placeholderTextColor="#91919A"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />

          <Text style={styles.label}>Montant</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor="#91919A"
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />

          <Text style={styles.label}>Période</Text>
          <View style={styles.rowWrap}>
            <Chip active={period == 'monthly'} label="Mensuelle" onPress={() => setPeriod('monthly')} />
            <Chip active={period == 'yearly'} label="Annuelle" onPress={() => setPeriod('yearly')} />
          </View>

          <Pressable style={styles.keyboardButton} onPress={Keyboard.dismiss}>
            <Text style={styles.keyboardButtonText}>Fermer le clavier</Text>
          </Pressable>

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
  metric: { color: '#7C5B0E', fontWeight: '800', fontSize: 15, marginBottom: 4 },
  metaBox: { gap: 4 },
  metaText: { color: '#6F6F78', fontSize: 13 },
  row: { flexDirection: 'row', gap: 10 },
  rowWrap: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  sheet: { gap: 12, paddingBottom: 20 },
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
  keyboardButton: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: '#F6F2E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardButtonText: { color: '#7C5B0E', fontWeight: '800' },
});
