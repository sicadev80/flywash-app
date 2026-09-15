import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import GlideHeader from './GlideHeader';

export default function GlideScreen({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <SafeAreaView style={styles.screen}>
      <GlideHeader title={title} right={right} />
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F5F7' },
  content: { flex: 1 },
});
