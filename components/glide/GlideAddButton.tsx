import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

export default function GlideAddButton({
  label = 'ajouter',
  onPress,
}: {
  label?: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.text}>+ {label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 38,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#C79A2B',
    fontWeight: '800',
    fontSize: 16,
  },
});
