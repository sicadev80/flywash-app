import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import GlideScreen from '../../../components/glide/GlideScreen';

const FACADE_OPTIONS = [
  {
    key: 'rectangle',
    title: 'Rectangle',
    subtitle: 'Façade simple avec largeur et hauteur.',
    image: require('../../../assets/images/facade/rectangle.png'),
    route: '/surface/facade-manual',
    params: { preset: 'rectangle' },
  },
  {
    key: 'trapeze',
    title: 'Trapèze',
    subtitle: 'Façade avec base haute, base basse et hauteur.',
    image: require('../../../assets/images/facade/trapeze.png'),
    route: '/surface/facade-manual',
    params: { preset: 'trapeze' },
  },
  {
    key: 'pignon',
    title: 'Pignon',
    subtitle: 'Mur + triangle de toiture à déduire proprement.',
    image: require('../../../assets/images/facade/pignon.png'),
    route: '/surface/facade-manual',
    params: { preset: 'pignon' },
  },
] as const;

export default function FacadeHomeScreen() {
  const router = useRouter();

  return (
    <GlideScreen title="Façades">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Choisis le mode adapté au chantier.
        </Text>

        <Pressable
          style={[styles.card, styles.photoCard]}
          onPress={() => router.push('/surface/facade-photo' as any)}
        >
          <View style={styles.photoBadge}>
            <Text style={styles.photoBadgeText}>V2</Text>
          </View>
          <Text style={styles.title}>Photo assistée</Text>
          <Text style={styles.description}>
            Prise de photo, 4 points façade + ligne de calibration pour estimer la surface.
          </Text>
        </Pressable>

        {FACADE_OPTIONS.map((item) => (
          <Pressable
            key={item.key}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: item.route as any,
                params: item.params as any,
              })
            }
          >
            <Image source={item.image} style={styles.image} resizeMode="contain" />
            <View style={styles.textBlock}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.subtitle}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </GlideScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 36 },
  subtitle: { color: '#74747D', fontSize: 15, lineHeight: 22, marginBottom: 2 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4E4E8',
    padding: 16,
    gap: 14,
  },
  photoCard: {
    borderColor: '#D4AF37',
    backgroundColor: '#FFF8E8',
  },
  photoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D4AF37',
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoBadgeText: { color: '#111111', fontWeight: '900', fontSize: 12 },
  image: {
    width: '100%',
    height: 190,
    borderRadius: 18,
    backgroundColor: '#F8F8FA',
  },
  textBlock: { gap: 6 },
  title: { color: '#17171C', fontSize: 24, fontWeight: '800' },
  description: { color: '#74747D', fontSize: 15, lineHeight: 22 },
});
