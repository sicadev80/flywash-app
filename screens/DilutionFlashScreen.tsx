import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Switch,
  Pressable,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { getProducts } from "../services/products";
import type { Product } from "../types/product";

type Props = {
  onSendToPricing?: (payload: {
    surface: number;
    productId: string;
    productName: string;
    rendement: number;
    dilution: number;
    prixProduitLitre: number;
    produitFini: number;
    produitPur: number;
    eau: number;
    boosterEnabled: boolean;
    boosterProductId: string;
    boosterProductName: string;
    boosterPercent: number;
    boosterLitres: number;
    cuveTotale: number;
    coutProduitPrincipal: number;
    coutBooster: number;
    coutTotal: number;
    coutM2: number;
  }) => void;
};

function toNumber(value: string): number {
  const normalized = (value || "").replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "0.00";
  return value.toFixed(digits);
}

export default function DilutionFlashScreen({ onSendToPricing }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedBoosterId, setSelectedBoosterId] = useState("");

  const [surface, setSurface] = useState("");
  const [rendement, setRendement] = useState("");
  const [dilution, setDilution] = useState("");
  const [prixProduitLitre, setPrixProduitLitre] = useState("");

  const [boosterEnabled, setBoosterEnabled] = useState(false);
  const [boosterPercent, setBoosterPercent] = useState("");
  const [prixBoosterLitre, setPrixBoosterLitre] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      try {
        const data = await getProducts();
        if (mounted) {
          setProducts(data);
        }
      } catch (error) {
        console.error("Erreur chargement produits:", error);
      } finally {
        if (mounted) {
          setLoadingProducts(false);
        }
      }
    }

    loadProducts();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) || null,
    [products, selectedProductId]
  );

  const selectedBooster = useMemo(
    () => products.find((p) => p.id === selectedBoosterId) || null,
    [products, selectedBoosterId]
  );

  useEffect(() => {
    if (!selectedProduct) return;

    if (selectedProduct.rendement_m2_l != null) {
      setRendement(String(selectedProduct.rendement_m2_l));
    }
    if (selectedProduct.dilution != null) {
      setDilution(String(selectedProduct.dilution));
    }
    if (selectedProduct.prix_ht_litre != null) {
      setPrixProduitLitre(String(selectedProduct.prix_ht_litre));
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (!selectedBooster) return;

    if (selectedBooster.prix_ht_litre != null) {
      setPrixBoosterLitre(String(selectedBooster.prix_ht_litre));
    }
  }, [selectedBooster]);

  const surfaceNum = toNumber(surface);
  const rendementNum = toNumber(rendement);
  const dilutionNum = toNumber(dilution);
  const prixProduitLitreNum = toNumber(prixProduitLitre);
  const boosterPercentNum = toNumber(boosterPercent);
  const prixBoosterLitreNum = toNumber(prixBoosterLitre);

  const results = useMemo(() => {
    const produitFini = surfaceNum > 0 && rendementNum > 0 ? surfaceNum / rendementNum : 0;
    const litresParLitrePur = 1 + dilutionNum;
    const produitPur =
      produitFini > 0 && litresParLitrePur > 0 ? produitFini / litresParLitrePur : 0;
    const eau = produitFini - produitPur;

    const boosterLitres =
      boosterEnabled && boosterPercentNum > 0 ? produitFini * (boosterPercentNum / 100) : 0;

    const cuveTotale = produitFini + boosterLitres;

    const coutProduitPrincipal = produitPur * prixProduitLitreNum;
    const coutBooster = boosterLitres * prixBoosterLitreNum;
    const coutTotal = coutProduitPrincipal + coutBooster;
    const coutM2 = surfaceNum > 0 ? coutTotal / surfaceNum : 0;

    return {
      produitFini,
      produitPur,
      eau,
      boosterLitres,
      cuveTotale,
      coutProduitPrincipal,
      coutBooster,
      coutTotal,
      coutM2,
    };
  }, [
    surfaceNum,
    rendementNum,
    dilutionNum,
    boosterEnabled,
    boosterPercentNum,
    prixProduitLitreNum,
    prixBoosterLitreNum,
  ]);

  function resetForm() {
    setSelectedProductId("");
    setSelectedBoosterId("");
    setSurface("");
    setRendement("");
    setDilution("");
    setPrixProduitLitre("");
    setBoosterEnabled(false);
    setBoosterPercent("");
    setPrixBoosterLitre("");
  }

  function handleSendToPricing() {
    if (!onSendToPricing) return;

    onSendToPricing({
      surface: surfaceNum,
      productId: selectedProductId,
      productName: selectedProduct?.nom ?? "",
      rendement: rendementNum,
      dilution: dilutionNum,
      prixProduitLitre: prixProduitLitreNum,
      produitFini: results.produitFini,
      produitPur: results.produitPur,
      eau: results.eau,
      boosterEnabled,
      boosterProductId: selectedBoosterId,
      boosterProductName: selectedBooster?.nom ?? "",
      boosterPercent: boosterPercentNum,
      boosterLitres: results.boosterLitres,
      cuveTotale: results.cuveTotale,
      coutProduitPrincipal: results.coutProduitPrincipal,
      coutBooster: results.coutBooster,
      coutTotal: results.coutTotal,
      coutM2: results.coutM2,
    });
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Dilution Flash</Text>
      <Text style={styles.subtitle}>
        Calcul instantané. Aucun enregistrement tant que tu n'envoies pas vers le calcul prix.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>1. Surface</Text>
        <Text style={styles.label}>Surface à traiter (m²)</Text>
        <TextInput
          value={surface}
          onChangeText={setSurface}
          keyboardType="decimal-pad"
          placeholder="Ex : 250"
          placeholderTextColor="#8f8f8f"
          style={styles.input}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>2. Produit principal</Text>
        <Text style={styles.label}>Produit</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={selectedProductId}
            onValueChange={(value) => setSelectedProductId(String(value))}
            dropdownIconColor="#d4af37"
            style={styles.picker}
          >
            <Picker.Item label={loadingProducts ? "Chargement..." : "Choisir un produit"} value="" />
            {products.map((product) => (
              <Picker.Item key={product.id} label={product.nom} value={product.id} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Rendement (m²/L)</Text>
        <TextInput
          value={rendement}
          onChangeText={setRendement}
          keyboardType="decimal-pad"
          placeholder="Ex : 4"
          placeholderTextColor="#8f8f8f"
          style={styles.input}
        />

        <Text style={styles.label}>Dilution (1L produit + X L eau)</Text>
        <TextInput
          value={dilution}
          onChangeText={setDilution}
          keyboardType="decimal-pad"
          placeholder="Ex : 5"
          placeholderTextColor="#8f8f8f"
          style={styles.input}
        />

        <Text style={styles.label}>Prix produit principal HT / litre (€)</Text>
        <TextInput
          value={prixProduitLitre}
          onChangeText={setPrixProduitLitre}
          keyboardType="decimal-pad"
          placeholder="Ex : 7.5"
          placeholderTextColor="#8f8f8f"
          style={styles.input}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>3. Booster</Text>
          <Switch
            value={boosterEnabled}
            onValueChange={setBoosterEnabled}
            trackColor={{ false: "#444", true: "#d4af37" }}
            thumbColor={boosterEnabled ? "#111" : "#f4f3f4"}
          />
        </View>

        {boosterEnabled ? (
          <>
            <Text style={styles.label}>Produit booster</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={selectedBoosterId}
                onValueChange={(value) => setSelectedBoosterId(String(value))}
                dropdownIconColor="#d4af37"
                style={styles.picker}
              >
                <Picker.Item label="Choisir un booster" value="" />
                {products.map((product) => (
                  <Picker.Item key={product.id} label={product.nom} value={product.id} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Pourcentage ajouté au produit fini (%)</Text>
            <TextInput
              value={boosterPercent}
              onChangeText={setBoosterPercent}
              keyboardType="decimal-pad"
              placeholder="Ex : 10"
              placeholderTextColor="#8f8f8f"
              style={styles.input}
            />

            <Text style={styles.label}>Prix booster HT / litre (€)</Text>
            <TextInput
              value={prixBoosterLitre}
              onChangeText={setPrixBoosterLitre}
              keyboardType="decimal-pad"
              placeholder="Ex : 9.8"
              placeholderTextColor="#8f8f8f"
              style={styles.input}
            />
          </>
        ) : (
          <Text style={styles.helperText}>
            Le booster est calculé comme un produit séparé ajouté en % du produit fini.
          </Text>
        )}
      </View>

      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>Résultat</Text>

        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Produit fini</Text>
          <Text style={styles.resultValue}>{formatNumber(results.produitFini)} L</Text>
        </View>

        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Produit pur</Text>
          <Text style={styles.resultValue}>{formatNumber(results.produitPur)} L</Text>
        </View>

        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Eau</Text>
          <Text style={styles.resultValue}>{formatNumber(results.eau)} L</Text>
        </View>

        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Booster</Text>
          <Text style={styles.resultValue}>{formatNumber(results.boosterLitres)} L</Text>
        </View>

        <View style={[styles.resultRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Cuve totale</Text>
          <Text style={styles.totalValue}>{formatNumber(results.cuveTotale)} L</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Coût produit principal</Text>
          <Text style={styles.resultValue}>{formatNumber(results.coutProduitPrincipal)} €</Text>
        </View>

        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Coût booster</Text>
          <Text style={styles.resultValue}>{formatNumber(results.coutBooster)} €</Text>
        </View>

        <View style={[styles.resultRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Coût total</Text>
          <Text style={styles.totalValue}>{formatNumber(results.coutTotal)} €</Text>
        </View>

        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Coût HT / m²</Text>
          <Text style={styles.resultValue}>{formatNumber(results.coutM2, 3)} €</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.button, styles.secondaryButton]} onPress={resetForm}>
          <Text style={styles.secondaryButtonText}>Réinitialiser</Text>
        </Pressable>

        <Pressable style={[styles.button, styles.primaryButton]} onPress={handleSendToPricing}>
          <Text style={styles.primaryButtonText}>Envoyer vers calcul prix</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const GOLD = "#D4AF37";
const BG = "#0F0F10";
const CARD = "#18181B";
const BORDER = "#2A2A2E";
const TEXT = "#F5F5F5";
const MUTED = "#B0B0B0";

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
    gap: 16,
  },
  title: {
    color: GOLD,
    fontSize: 30,
    fontWeight: "800",
    marginTop: 8,
  },
  subtitle: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  resultCard: {
    backgroundColor: "#121214",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: GOLD,
  },
  cardTitle: {
    color: GOLD,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  resultTitle: {
    color: GOLD,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
  },
  label: {
    color: TEXT,
    fontSize: 14,
    marginBottom: 6,
    marginTop: 8,
  },
  helperText: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    backgroundColor: "#101012",
    color: TEXT,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  pickerWrap: {
    backgroundColor: "#101012",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    overflow: "hidden",
  },
  picker: {
    color: TEXT,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
  },
  resultLabel: {
    color: TEXT,
    fontSize: 15,
  },
  resultValue: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "700",
  },
  totalRow: {
    marginTop: 2,
  },
  totalLabel: {
    color: GOLD,
    fontSize: 16,
    fontWeight: "800",
  },
  totalValue: {
    color: GOLD,
    fontSize: 18,
    fontWeight: "900",
  },
  separator: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 8,
  },
  actions: {
    gap: 12,
    marginTop: 4,
  },
  button: {
    minHeight: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: GOLD,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: GOLD,
    backgroundColor: "transparent",
  },
  primaryButtonText: {
    color: "#111",
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButtonText: {
    color: GOLD,
    fontSize: 16,
    fontWeight: "700",
  },
});
