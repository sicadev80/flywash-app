import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import GlideScreen from '../../components/glide/GlideScreen';
import GlideAddButton from '../../components/glide/GlideAddButton';
import GlideBottomSheet from '../../components/glide/GlideBottomSheet';
import GlideCard from '../../components/glide/GlideCard';
import {
  computePricePerL,
  loadProducts,
  resolveContainerLiters,
  saveProducts,
  type ProductApplication,
  type ProductContainerPreset,
  type ProductItem,
  type ProductTreatment,
} from '../../lib/productsStore';

const APPLICATIONS: { key: ProductApplication; label: string }[] = [
  { key: 'toiture', label: 'Toiture' },
  { key: 'facade', label: 'Façade' },
  { key: 'bardage', label: 'Bardage' },
  { key: 'panneaux-solaires', label: 'Panneaux' },
  { key: 'vitre', label: 'Vitre' },
  { key: 'multi-usages', label: 'Multi' },
];

const TREATMENTS: { key: ProductTreatment; label: string }[] = [
  { key: 'choc', label: 'Choc' },
  { key: 'action-lente', label: 'Action lente' },
  { key: 'entretien', label: 'Entretien' },
  { key: 'curatif', label: 'Curatif' },
  { key: 'degraissant', label: 'Dégraissant' },
  { key: 'booster', label: 'Booster' },
];

const CONTAINERS: { key: ProductContainerPreset; label: string }[] = [
  { key: '1', label: '1L' },
  { key: '5', label: '5L' },
  { key: '10', label: '10L' },
  { key: '20', label: '20L' },
  { key: '25', label: '25L' },
  { key: '30', label: '30L' },
  { key: 'manual', label: 'Manuel' },
];

const makeId = () => `prod-${Date.now()}`;
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

export default function ProductsScreen() {
  const [items, setItems] = useState<ProductItem[]>([]);
  const [visible, setVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [supplier, setSupplier] = useState('');
  const [name, setName] = useState('');
  const [applications, setApplications] = useState<ProductApplication[]>(['toiture']);
  const [treatment, setTreatment] = useState<ProductTreatment>('choc');
  const [containerPreset, setContainerPreset] = useState<ProductContainerPreset>('20');
  const [manualContainerLiters, setManualContainerLiters] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');

  useEffect(() => {
    loadProducts().then(setItems);
  }, []);

  async function persist(next: ProductItem[]) {
    setItems(next);
    await saveProducts(next);
  }

  function resetForm() {
    setEditingId(null);
    setSupplier('');
    setName('');
    setApplications(['toiture']);
    setTreatment('choc');
    setContainerPreset('20');
    setManualContainerLiters('');
    setPurchasePrice('');
  }

  function openCreate() {
    resetForm();
    setVisible(true);
  }

  function openEdit(item: ProductItem) {
    setEditingId(item.id);
    setSupplier(item.supplier);
    setName(item.name);
    setApplications(item.applications.length ? item.applications : ['multi-usages']);
    setTreatment(item.treatment);
    setContainerPreset(item.containerPreset);
    setManualContainerLiters(
      item.containerPreset === 'manual' ? String(item.manualContainerLiters).replace('.', ',') : ''
    );
    setPurchasePrice(String(item.purchasePrice).replace('.', ','));
    setVisible(true);
  }

  function toggleApplication(app: ProductApplication) {
    setApplications((prev) => {
      if (prev.includes(app)) {
        const next = prev.filter((v) => v !== app);
        return next.length ? next : ['multi-usages'];
      }
      return [...prev.filter((v) => v !== 'multi-usages'), app];
    });
  }

  async function submitForm() {
    if (!name.trim()) return Alert.alert('Produit', 'Renseigne un nom de produit.');

    const payload: ProductItem = {
      id: editingId || makeId(),
      supplier: supplier.trim(),
      name: name.trim(),
      applications: applications.length ? applications : ['multi-usages'],
      treatment,
      containerPreset,
      manualContainerLiters: n(manualContainerLiters),
      purchasePrice: n(purchasePrice),
      pricePerL: computePricePerL(n(purchasePrice), containerPreset, n(manualContainerLiters)),
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

  const helperText = useMemo(() => `${items.length} produit(s) enregistré(s)`, [items]);

  return (
    <GlideScreen title="Mes Produits" right={<GlideAddButton label="nouveau" onPress={openCreate} />}>
      <ScrollView contentContainerStyle={styles.content}>
        <GlideCard title="Catalogue produits" subtitle="Création, modification, suppression">
          <Text style={styles.helper}>{helperText}</Text>
        </GlideCard>

        {items.map((item) => (
          <GlideCard
            key={item.id}
            title={item.name}
            subtitle={`${item.supplier || 'Sans fournisseur'} · ${item.applications.join(', ')} · ${item.treatment}`}
          >
            <View style={styles.metaBox}>
              <Text style={styles.metaText}>
                Contenance : {fmt(resolveContainerLiters(item.containerPreset, item.manualContainerLiters))} L
              </Text>
              <Text style={styles.metaText}>Prix achat : {fmt(item.purchasePrice)} €</Text>
              <Text style={styles.metaText}>Prix/L : {fmt(item.pricePerL)} €</Text>
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
        title={editingId ? 'Modifier le produit' : 'Ajouter un produit'}
        onClose={() => {
          Keyboard.dismiss();
          setVisible(false);
        }}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheet}>
          <Text style={styles.label}>Fournisseur</Text>
          <TextInput
            style={styles.input}
            value={supplier}
            onChangeText={setSupplier}
            placeholder="Fournisseur"
            placeholderTextColor="#91919A"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />

          <Text style={styles.label}>Nom</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nom produit"
            placeholderTextColor="#91919A"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />

          <Text style={styles.label}>Applications</Text>
          <View style={styles.chipWrap}>
            {APPLICATIONS.map((item) => (
              <Chip
                key={item.key}
                active={applications.includes(item.key)}
                label={item.label}
                onPress={() => toggleApplication(item.key)}
              />
            ))}
          </View>

          <Text style={styles.label}>Traitement</Text>
          <View style={styles.chipWrap}>
            {TREATMENTS.map((item) => (
              <Chip
                key={item.key}
                active={treatment === item.key}
                label={item.label}
                onPress={() => setTreatment(item.key)}
              />
            ))}
          </View>

          <Text style={styles.label}>Contenance</Text>
          <View style={styles.chipWrap}>
            {CONTAINERS.map((item) => (
              <Chip
                key={item.key}
                active={containerPreset === item.key}
                label={item.label}
                onPress={() => setContainerPreset(item.key)}
              />
            ))}
          </View>

          {containerPreset === 'manual' ? (
            <>
              <Text style={styles.label}>Contenance manuelle (L)</Text>
              <TextInput
                style={styles.input}
                value={manualContainerLiters}
                onChangeText={setManualContainerLiters}
                placeholder="0"
                placeholderTextColor="#91919A"
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </>
          ) : null}

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

          <Pressable style={styles.keyboardButton} onPress={Keyboard.dismiss}>
            <Text style={styles.keyboardButtonText}>Fermer le clavier</Text>
          </Pressable>

          <View style={styles.previewBox}>
            <Text style={styles.previewText}>
              Prix/L auto : {fmt(computePricePerL(n(purchasePrice), containerPreset, n(manualContainerLiters)))} €
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
  helper: { color: '#6F6F78', fontSize: 13 },
  metaBox: { gap: 4 },
  metaText: { color: '#6F6F78', fontSize: 13 },
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
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
  previewBox: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: '#F7F2E3',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  previewText: { color: '#7C5B0E', fontWeight: '800' },
  keyboardButton: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: '#F6F2E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardButtonText: { color: '#7C5B0E', fontWeight: '800' },
});
