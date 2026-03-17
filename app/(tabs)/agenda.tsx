import { StyleSheet, Text, View } from 'react-native';
import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/Card';
import { Button } from '@/components/Form';
import { Label, Muted, Subtitle, Title } from '@/components/Typography';
import { missions } from '@/data/mock';
import { colors } from '@/lib/theme';

export default function AgendaScreen() {
  return (
    <AppShell>
      <Title>Mon agenda</Title>
      <Muted>Vue planning chantier, inspirée de tes écrans Glide.</Muted>

      <Card>
        <Subtitle>Mars 2026</Subtitle>
        <View style={styles.calendarRow}>
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d) => <Text key={d} style={styles.day}>{d}</Text>)}
        </View>
        <View style={styles.calendarGrid}>
          {Array.from({ length: 31 }).map((_, i) => (
            <View key={i} style={[styles.cell, [19, 23].includes(i + 1) && styles.cellActive]}>
              <Text style={styles.cellText}>{i + 1}</Text>
            </View>
          ))}
        </View>
        <Button title="Ajouter un chantier" />
      </Card>

      <Subtitle>Prestations</Subtitle>
      {missions.map((mission) => (
        <Card key={mission.id}>
          <Label>{mission.client}</Label>
          <Muted>{mission.date}</Muted>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Surface</Text><Text style={styles.infoValue}>{mission.surface} m²</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Prestation</Text><Text style={styles.infoValue}>{mission.type}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Total TTC</Text><Text style={styles.infoValue}>{mission.totalTtc} €</Text></View>
        </Card>
      ))}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  calendarRow: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { color: colors.textMuted, width: '14%', textAlign: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  cell: { width: '13%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  cellActive: { backgroundColor: colors.gold },
  cellText: { color: colors.text, fontWeight: '700' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { color: colors.textMuted },
  infoValue: { color: colors.text, fontWeight: '700' },
});
