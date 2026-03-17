import { PropsWithChildren } from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { colors } from '@/lib/theme';

export function Title({ children, style, ...props }: PropsWithChildren<TextProps>) {
  return <Text style={[styles.title, style]} {...props}>{children}</Text>;
}

export function Subtitle({ children, style, ...props }: PropsWithChildren<TextProps>) {
  return <Text style={[styles.subtitle, style]} {...props}>{children}</Text>;
}

export function Label({ children, style, ...props }: PropsWithChildren<TextProps>) {
  return <Text style={[styles.label, style]} {...props}>{children}</Text>;
}

export function Muted({ children, style, ...props }: PropsWithChildren<TextProps>) {
  return <Text style={[styles.muted, style]} {...props}>{children}</Text>;
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.goldSoft, fontSize: 18, fontWeight: '700' },
  label: { color: colors.text, fontSize: 15, fontWeight: '600' },
  muted: { color: colors.textMuted, fontSize: 14 },
});
