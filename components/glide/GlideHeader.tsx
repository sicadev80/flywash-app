import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';

export default function GlideHeader({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  const navigation = useNavigation();

  function openDrawer() {
    const nav: any = navigation;
    if (nav?.openDrawer) {
      nav.openDrawer();
      return;
    }
    const parent = nav?.getParent?.();
    if (parent?.openDrawer) parent.openDrawer();
  }

  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <Pressable onPress={openDrawer} style={styles.menuButton}>
          <Ionicons name="menu" size={24} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.rightWrap}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#C79A2B',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
  },
  row: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    width: 38,
    height: 38,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  rightWrap: {
    minWidth: 38,
    alignItems: 'flex-end',
  },
});
