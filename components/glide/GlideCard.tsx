import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function GlideCard({
  title,
  subtitle,
  badge,
  onPress,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  onPress?: () => void;
  children?: React.ReactNode;
}) {
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper style={styles.card} onPress={onPress}>
      <View style={styles.top}>
        <View style={styles.textBlock}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {children}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#ECECEF',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  textBlock: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: '#1B1B1F',
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: '#6F6F78',
    fontSize: 14,
  },
  badge: {
    backgroundColor: '#F5EED7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    color: '#9B7414',
    fontSize: 12,
    fontWeight: '800',
  },
});
