import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

export function Actions({ onCalculate, onSendPrice, canSend = false, sendLabel = 'Envoyer vers Calcul Prix' }: { onCalculate?: () => void; onSendPrice?: () => void; canSend?: boolean; sendLabel?: string }) {
  return (
    <View style={styles.wrap}>
      {onCalculate ? (
        <Pressable style={styles.primary} onPress={onCalculate}>
          <Text style={styles.primaryText}>Calculer</Text>
        </Pressable>
      ) : null}
      {onSendPrice ? (
        <Pressable style={[styles.secondary, !canSend && styles.disabled]} onPress={onSendPrice} disabled={!canSend}>
          <Text style={styles.secondaryText}>{sendLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, marginTop: 8 },
  primary: { backgroundColor: colors.gold, padding: 14, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: colors.white, fontWeight: '800' },
  secondary: { backgroundColor: '#fff2c7', padding: 14, borderRadius: 12, alignItems: 'center' },
  secondaryText: { color: '#563e00', fontWeight: '800' },
  disabled: { opacity: 0.5 },
});
