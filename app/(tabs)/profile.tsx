import { StyleSheet, Text, View } from 'react-native';
import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/Card';
import { Button } from '@/components/Form';
import { Label, Muted, Subtitle, Title } from '@/components/Typography';
import { charges, equipments, products, providers, vehicles } from '@/data/mock';
import { colors } from '@/lib/theme';

export default function ProfileScreen() {
  const totalCharges = charges.reduce((sum, item) => sum + item.montantMois, 0);

  return (
    <AppShell>
      <Title>Profil & ressources</Title>
      <Muted>Zone de gestion de l’entreprise, des produits, des véhicules et du réseau prestataires.</Muted>

      <Card>
        <Subtitle>Profil société</Subtitle>
        <Label>FLY-WASH</Label>
        <Muted>Nettoyage technique de surfaces par drone</Muted>
        <Text style={styles.meta}>SIRET • TVA • adresse • téléphone • site web</Text>
        <Button title="Modifier le profil" secondary />
      </Card>

      <Card>
        <Subtitle>Mon matériel</Subtitle>
        {equipments.map((item) => (
          <View key={item.id} style={styles.row}><Text style={styles.main}>{item.label}</Text><Text style={styles.side}>{item.coutHoraire} €/h</Text></View>
        ))}
      </Card>

      <Card>
        <Subtitle>Mes véhicules</Subtitle>
        {vehicles.map((item) => (
          <View key={item.id} style={styles.row}><Text style={styles.main}>{item.label}</Text><Text style={styles.side}>{item.conso} L/100</Text></View>
        ))}
      </Card>

      <Card>
        <Subtitle>Mes produits</Subtitle>
        {products.map((item) => (
          <View key={item.id} style={styles.productCard}>
            <Text style={styles.main}>{item.nom}</Text>
            <Muted>{item.type} • {item.prixHtLitre} €/L</Muted>
            <Text style={styles.surfaceTag}>{item.surfaces.join(' • ')}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Subtitle>Mes charges</Subtitle>
        <Label>{totalCharges.toLocaleString('fr-FR')} € / mois</Label>
        {charges.map((item) => (
          <View key={item.id} style={styles.row}><Text style={styles.main}>{item.label}</Text><Text style={styles.side}>{item.montantMois} €</Text></View>
        ))}
      </Card>

      <Card>
        <Subtitle>Trouver un prestataire</Subtitle>
        {providers.map((item) => (
          <View key={item.id} style={styles.productCard}>
            <Text style={styles.main}>{item.societe}</Text>
            <Muted>{item.slogan}</Muted>
            <Text style={styles.surfaceTag}>Département {item.departement}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Subtitle>Offre actuelle</Subtitle>
        <Label>Essai gratuit</Label>
        <Muted>Début : 17/03/2026 • Fin : 31/03/2026 • 14 jours restants</Muted>
        <Button title="Passer en premium" />
      </Card>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  meta: { color: colors.textMuted },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  main: { color: colors.text, fontWeight: '700' },
  side: { color: colors.goldSoft, fontWeight: '700' },
  productCard: { gap: 4, paddingVertical: 6 },
  surfaceTag: { color: colors.goldSoft },
});
