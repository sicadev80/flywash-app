import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from './theme';

export function NumberField({ label, value, onChangeText }: { label: string; value: string; onChangeText: (v: string) => void }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        keyboardType="numeric"
        value={value}
        onChangeText={onChangeText}
        placeholder="0"
        placeholderTextColor="#dbc98f"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { color: colors.text, fontWeight: '700', marginBottom: 6 },
  input: {
    backgroundColor: colors.input,
    color: colors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#8c6a0b',
  },
});
