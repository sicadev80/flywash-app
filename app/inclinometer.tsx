import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { DeviceMotion } from 'expo-sensors';

export default function InclinometerScreen() {
  const router = useRouter();
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    DeviceMotion.setUpdateInterval(200);

    const sub = DeviceMotion.addListener((data) => {
      if (!data.rotation) return;
      const beta = data.rotation.beta ?? 0;
      const deg = Math.abs((beta * 180) / Math.PI);
      setAngle(deg);
    });

    return () => {
      sub.remove();
    };
  }, []);

  function sendAngle() {
    router.replace({
      pathname: '/surface/terrain',
      params: { measuredAngle: String(angle.toFixed(2)) },
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rapporteur</Text>

      <Text style={styles.help}>
        Pose le téléphone sur le pan, puis valide la mesure.
      </Text>

      <Text style={styles.angle}>{angle.toFixed(1)}°</Text>

      <Text style={styles.percent}>
        {(Math.tan((angle * Math.PI) / 180) * 100).toFixed(1)} %
      </Text>

      <Pressable style={styles.button} onPress={sendAngle}>
        <Text style={styles.buttonText}>Utiliser cet angle</Text>
      </Pressable>

      <Pressable style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>Retour</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F10',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 20,
  },
  title: {
    color: '#D4AF37',
    fontSize: 28,
    fontWeight: '800',
  },
  help: {
    color: '#B0B0B0',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  angle: {
    color: '#FFFFFF',
    fontSize: 60,
    fontWeight: '900',
  },
  percent: {
    color: '#D4AF37',
    fontSize: 24,
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 220,
    alignItems: 'center',
  },
  buttonText: {
    color: '#111111',
    fontWeight: '800',
    fontSize: 16,
  },
  back: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backText: {
    color: '#D4AF37',
    fontWeight: '700',
  },
});
