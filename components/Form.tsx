import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { colors, spacing } from '@/lib/theme';

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.textMuted} style={styles.input} {...props} />
    </View>
  );
}

export function Button({ title, onPress, secondary = false }: { title: string; onPress?: () => void; secondary?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.button, secondary && styles.secondary]}>
      <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  group: { gap: 6 },
  label: { color: colors.text, fontWeight: '600' },
  input: {
    backgroundColor: colors.input,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  button: {
    backgroundColor: colors.gold,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  buttonText: { color: '#111', fontWeight: '800', fontSize: 15 },
  secondaryText: { color: colors.goldSoft },
});
