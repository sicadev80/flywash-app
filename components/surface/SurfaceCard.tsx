import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

type Props = {
  title: string;
  subtitle: string;
  image: any;
  onPress: () => void;
};

export function SurfaceCard({ title, subtitle, image, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image source={image} style={styles.image} resizeMode="contain" />
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  image: {
    width: '100%',
    height: 120,
  },
  textWrap: {
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
});
