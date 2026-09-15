import React from 'react';
import { SafeAreaView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import GlideHeader from './GlideHeader';

export default function GlideScreen({
  title,
  right,
  style,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  return (
    <SafeAreaView style={[styles.screen, style]}>
      <GlideHeader title={title} right={right} />
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F5F7' },
  content: { flex: 1 },
});
