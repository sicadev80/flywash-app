import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import GlideScreen from '../../../components/glide/GlideScreen';
import { roofConfigs } from '../../../components/surface/roofConfigs';

export default function SurfaceManualScreen() {
  const router = useRouter();

  return (
    <GlideScreen title="Mode Manuel Toiture">
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Text style={styles.subtitle}>Choisis la configuration qui ressemble à ton toit.</Text>

        {roofConfigs.map((config) => (
          <Pressable
            key={config.type}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: '/surface/[type]' as any,
                params: { type: config.type },
              })
            }
          >
            {config.image ? (
              <View style={styles.imageWrap}>
                <Image source={config.image} style={styles.image} resizeMode="contain" />
              </View>
            ) : null}

            <Text style={styles.cardTitle}>{config.title}</Text>
            <Text style={styles.cardText}>{config.subtitle}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </GlideScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 36,
  },
  subtitle: {
    color: '#74747D',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4E4E8',
    padding: 18,
    gap: 10,
  },
  imageWrap: {
    backgroundColor: '#F7F7FA',
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  image: {
    width: '100%',
    height: 190,
  },
  cardTitle: {
    color: '#17171C',
    fontSize: 18,
    fontWeight: '800',
  },
  cardText: {
    color: '#74747D',
    fontSize: 14,
    lineHeight: 20,
  },
});
