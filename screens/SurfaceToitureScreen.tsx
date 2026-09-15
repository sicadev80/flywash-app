import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from "react-native";

type RoofType =
  | "flatSlope"
  | "onePane"
  | "twoPane"
  | "manual";

function toNumber(value: string): number {
  const normalized = (value || "").replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "0.00";
  return value.toFixed(digits);
}

export default function SurfaceToitureScreen() {
  const [roofType, setRoofType] = useState<RoofType>("flatSlope");

  const [surfaceAPlat, setSurfaceAPlat] = useState("");
  const [anglePente, setAnglePente] = useState("");

  const [longueur, setLongueur] = useState("");
  const [largeurAPlat, setLargeurAPlat] = useState("");

  const [longueurPan1, setLongueurPan1] = useState("");
  const [largeurPan1, setLargeurPan1] = useState("");
  const [longueurPan2, setLongueurPan2] = useState("");
  const [largeurPan2, setLargeurPan2] = useState("");

  const [surfaceManuelle, setSurfaceManuelle] = useState("");

  const results = useMemo(() => {
    const angle = toNumber(anglePente);
    const cos = Math.cos(degToRad(angle));

    let surfaceProjection = 0;
    let surfaceReelle = 0;
    let details = "";

    if (roofType === "flatSlope") {
      const surface = toNumber(surfaceAPlat);
      surfaceProjection = surface;
      surfaceReelle = surface > 0 ? and_cos(surface, cos) : 0
      details = "Surface réelle = surface à plat / cos(angle)";
    }

    if (roofType === "onePane") {
      const l = toNumber(longueur);
      const la = toNumber(largeurAPlat);
      surfaceProjection = l * la;
      surfaceReelle = surfaceProjection > 0 ? and_cos(surfaceProjection, cos) : 0
      details = "1 pan : (longueur × largeur à plat) / cos(angle)";
    }

    if (roofType === "twoPane") {
      const l1 = toNumber(longueurPan1);
      const w1 = toNumber(largeurPan1);
      const l2 = toNumber(longueurPan2);
      const w2 = toNumber(largeurPan2);

      const pan1 = l1 * w1;
      const pan2 = l2 * w2;

      surfaceProjection = pan1 + pan2;
      surfaceReelle = surfaceProjection > 0 ? and_cos(surfaceProjection, cos) : 0
      details = "2 pans : somme des projections / cos(angle)";
    }

    if (roofType === "manual") {
      surfaceProjection = toNumber(surfaceManuelle);
      surfaceReelle = surfaceProjection;
      details = "Surface manuelle directe";
    }

    return {
      surfaceProjection,
      surfaceReelle,
      details,
      angle,
    };
  }, [
    roofType,
    surfaceAPlat,
    anglePente,
    longueur,
    largeurAPlat,
    longueurPan1,
    largeurPan1,
    longueurPan2,
    largeurPan2,
    surfaceManuelle,
  ]);

  function resetForm() {
    setRoofType("flatSlope");
    setSurfaceAPlat("");
    setAnglePente("");
    setLongueur("");
    setLargeurAPlat("");
    setLongueurPan1("");
    setLargeurPan1("");
    setLongueurPan2("");
    setLargeurPan2("");
    setSurfaceManuelle("");
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Surface Toiture</Text>
      <Text style={styles.subtitle}>
        Calcul rapide de la surface réelle à traiter. Aucun enregistrement automatique.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>1. Type de toiture</Text>

        <View style={styles.choices}>
          <Choice
            active={roofType === "flatSlope"}
            label="Surface à plat + pente"
            onPress={() => setRoofType("flatSlope")}
          />
          <Choice
            active={roofType === "onePane"}
            label="Toiture 1 pan"
            onPress={() => setRoofType("onePane")}
          />
          <Choice
            active={roofType === "twoPane"}
            label="Toiture 2 pans"
            onPress={() => setRoofType("twoPane")}
          />
          <Choice
            active={roofType === "manual"}
            label="Surface manuelle"
            onPress={() => setRoofType("manual")}
          />
        </View>
      </View>

      {roofType !== "manual" ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>2. Pente</Text>
          <Text style={styles.label}>Angle de pente (°)</Text>
          <TextInput
            value={anglePente}
            onChangeText={setAnglePente}
            keyboardType="decimal-pad"
            placeholder="Ex : 25"
            placeholderTextColor="#8f8f8f"
            style={styles.input}
          />
        </View>
      ) : null}

      {roofType === "flatSlope" ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>3. Dimensions</Text>
          <Text style={styles.label}>Surface à plat (m²)</Text>
          <TextInput
            value={surfaceAPlat}
            onChangeText={setSurfaceAPlat}
            keyboardType="decimal-pad"
            placeholder="Ex : 100"
            placeholderTextColor="#8f8f8f"
            style={styles.input}
          />
        </View>
      ) : null}

      {roofType === "onePane" ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>3. Dimensions</Text>
          <Text style={styles.label}>Longueur (m)</Text>
          <TextInput
            value={longueur}
            onChangeText={setLongueur}
            keyboardType="decimal-pad"
            placeholder="Ex : 12"
            placeholderTextColor="#8f8f8f"
            style={styles.input}
          />
          <Text style={styles.label}>Largeur à plat (m)</Text>
          <TextInput
            value={largeurAPlat}
            onChangeText={setLargeurAPlat}
            keyboardType="decimal-pad"
            placeholder="Ex : 5"
            placeholderTextColor="#8f8f8f"
            style={styles.input}
          />
        </View>
      ) : null}

      {roofType === "twoPane" ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>3. Dimensions</Text>

          <Text style={styles.subSection}>Pan 1</Text>
          <Text style={styles.label}>Longueur pan 1 (m)</Text>
          <TextInput
            value={longueurPan1}
            onChangeText={setLongueurPan1}
            keyboardType="decimal-pad"
            placeholder="Ex : 12"
            placeholderTextColor="#8f8f8f"
            style={styles.input}
          />
          <Text style={styles.label}>Largeur à plat pan 1 (m)</Text>
          <TextInput
            value={largeurPan1}
            onChangeText={setLargeurPan1}
            keyboardType="decimal-pad"
            placeholder="Ex : 4"
            placeholderTextColor="#8f8f8f"
            style={styles.input}
          />

          <Text style={styles.subSection}>Pan 2</Text>
          <Text style={styles.label}>Longueur pan 2 (m)</Text>
          <TextInput
            value={longueurPan2}
            onChangeText={setLongueurPan2}
            keyboardType="decimal-pad"
            placeholder="Ex : 12"
            placeholderTextColor="#8f8f8f"
            style={styles.input}
          />
          <Text style={styles.label}>Largeur à plat pan 2 (m)</Text>
          <TextInput
            value={largeurPan2}
            onChangeText={setLargeurPan2}
            keyboardType="decimal-pad"
            placeholder="Ex : 4"
            placeholderTextColor="#8f8f8f"
            style={styles.input}
          />
        </View>
      ) : null}

      {roofType === "manual" ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>2. Surface directe</Text>
          <Text style={styles.label}>Surface réelle (m²)</Text>
          <TextInput
            value={surfaceManuelle}
            onChangeText={setSurfaceManuelle}
            keyboardType="decimal-pad"
            placeholder="Ex : 148"
            placeholderTextColor="#8f8f8f"
            style={styles.input}
          />
        </View>
      ) : null}

      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>Résultat</Text>

        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Angle</Text>
          <Text style={styles.resultValue}>{formatNumber(results.angle)} °</Text>
        </View>

        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Surface projection</Text>
          <Text style={styles.resultValue}>{formatNumber(results.surfaceProjection)} m²</Text>
        </View>

        <View style={[styles.resultRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Surface réelle</Text>
          <Text style={styles.totalValue}>{formatNumber(results.surfaceReelle)} m²</Text>
        </View>

        <View style={styles.separator} />
        <Text style={styles.helperText}>{results.details}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.button, styles.secondaryButton]} onPress={resetForm}>
          <Text style={styles.secondaryButtonText}>Réinitialiser</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function and_cos(surface: number, cos: number): number {
  if (!Number.isFinite(cos) || cos <= 0) return 0;
  return surface / cos;
}

function Choice({
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
      style={[styles.choice, active ? styles.choiceActive : null]}
    >
      <Text style={[styles.choiceText, active ? styles.choiceTextActive : null]}>
        {label}
      </Text>
    </Pressable>
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
  label: {
    color: TEXT,
    fontSize: 14,
    marginBottom: 6,
    marginTop: 8,
  },
  subSection: {
    color: GOLD,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 10,
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
  choices: {
    gap: 10,
  },
  choice: {
    backgroundColor: "#101012",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  choiceActive: {
    borderColor: GOLD,
    backgroundColor: "#1B1A12",
  },
  choiceText: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "600",
  },
  choiceTextActive: {
    color: GOLD,
  },
  resultTitle: {
    color: GOLD,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
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
  secondaryButton: {
    borderWidth: 1,
    borderColor: GOLD,
    backgroundColor: "transparent",
  },
  secondaryButtonText: {
    color: GOLD,
    fontSize: 16,
    fontWeight: "700",
  },
});
