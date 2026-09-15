import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  title: string;
  subtitle: string;
};

export default function PlaceholderScreen({ title, subtitle }: Props) {
  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const GOLD = "#D4AF37";
const BG = "#0F0F10";
const CARD = "#18181B";
const TEXT = "#F5F5F5";
const MUTED = "#B0B0B0";
const BORDER = "#2A2A2E";

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
    padding: 18,
    justifyContent: "center",
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 18,
  },
  title: {
    color: GOLD,
    fontSize: 24,
    fontWeight: "900",
  },
  subtitle: {
    color: MUTED,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
});
