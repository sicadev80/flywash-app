import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/Card';
import { Title, Subtitle, Muted, Label } from '@/components/Typography';
import { StatPill } from '@/components/StatPill';
import { colors } from '@/lib/theme';
import { missions } from '@/data/mock';

const shortcuts = [
  { href: '/(tabs)/dilution', title: 'Dilution flash', subtitle: 'Produit pur, eau, coût/m²' },
  { href: '/(tabs)/pricing', title: 'Calcul prix mission', subtitle: 'Revient, marge, TTC' },
  { href: '/(tabs)/surface', title: 'Surface toiture', subtitle: 'Calcul sur le terrain' },
  { href: '/(tabs)/agenda', title: 'Mon agenda', subtitle: 'Chantiers et suivi' },
  { href: '/(tabs)/profile', title: 'Ressources', subtitle: 'Produits, charges, matériel' },
];

export default function HomeScreen() {
  return (
    <AppShell>
      <Title>FLY-WASH</Title>
      <Muted>Application métier de calcul, dilution et rentabilité pour le nettoyage de surface.</Muted>

      <Card>
        <Subtitle>Vue rapide</Subtitle>
        <View style={styles.row}>
          <StatPill label="Missions" value="2" />
          <StatPill label="Surface mois" value="3 320 m²" />
          <StatPill label="CA prévu" value="8 560 €" />
        </View>
      </Card>

      <Card>
        <Subtitle>Priorité terrain</Subtitle>
        <Link href="/(tabs)/dilution" asChild>
          <Text style={styles.heroButton}>Préparer ma cuve</Text>
        </Link>
        <Muted>Accès direct au calcul de dilution flash, pensé pour un usage rapide sur chantier.</Muted>
      </Card>

      <Subtitle>Modules</Subtitle>
      {shortcuts.map((item) => (
        <Link key={item.title} href={item.href as any} asChild>
          <View style={styles.shortcut}>
            <Label>{item.title}</Label>
            <Muted>{item.subtitle}</Muted>
          </View>
        </Link>
      ))}

      <Subtitle>Prochains chantiers</Subtitle>
      {missions.map((mission) => (
        <Card key={mission.id}>
          <Label>{mission.client}</Label>
          <Muted>{mission.date} • {mission.type} • {mission.surface} m²</Muted>
          <Text style={styles.amount}>{mission.totalTtc.toLocaleString('fr-FR')} € TTC</Text>
        </Card>
      ))}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  heroButton: {
    backgroundColor: colors.gold,
    color: '#111',
    textAlign: 'center',
    fontWeight: '800',
    paddingVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 6,
  },
  shortcut: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 4,
  },
  amount: { color: colors.goldSoft, fontWeight: '800', fontSize: 18 },
});
