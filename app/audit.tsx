import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import GlideScreen from '../components/glide/GlideScreen';
import GlideCard from '../components/glide/GlideCard';
import { runAppAudit, type AuditLine } from '../lib/appAudit';

export default function AuditScreen() {
  const [lines, setLines] = useState<AuditLine[]>([]);

  useEffect(() => {
    runAppAudit().then(setLines);
  }, []);

  return (
    <GlideScreen title="Audit">
      <ScrollView contentContainerStyle={styles.content}>
        <GlideCard title="Contrôle global" subtitle="Vérification rapide des données métier">
          {lines.map((line, index) => (
            <View key={`${line.label}-${index}`} style={styles.row}>
              <View style={[styles.badge, line.level === 'ok' ? styles.badgeOk : styles.badgeWarn]}>
                <Text style={styles.badgeText}>{line.level === 'ok' ? 'OK' : '!'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{line.label}</Text>
                <Text style={styles.detail}>{line.detail}</Text>
              </View>
            </View>
          ))}
        </GlideCard>

        <GlideCard title="Ce que fait ce patch" subtitle="Nettoyage V1">
          <Text style={styles.detail}>Normalisation des stores pour éviter les NaN, valeurs négatives et données incomplètes.</Text>
          <Text style={styles.detail}>Conservation des exports existants pour ne pas casser l'app.</Text>
          <Text style={styles.detail}>Ajout d'un écran d'audit accessible par la route /audit.</Text>
        </GlideCard>
      </ScrollView>
    </GlideScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 10 },
  badge: { width: 28, height: 28, borderRadius: 999, justifyContent: 'center', alignItems: 'center' },
  badgeOk: { backgroundColor: '#E6F5EA' },
  badgeWarn: { backgroundColor: '#FFF3D6' },
  badgeText: { color: '#222', fontWeight: '900' },
  label: { color: '#202027', fontSize: 15, fontWeight: '800' },
  detail: { color: '#6F6F78', fontSize: 13 },
});
