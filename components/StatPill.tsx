import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/lib/theme';

export function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: '#111111',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    minWidth: 110,
    gap: 6,
  },
  label: { color: colors.textMuted, fontSize: 12 },
  value: { color: colors.goldSoft, fontSize: 18, fontWeight: '700' },
});
