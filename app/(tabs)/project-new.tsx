import React, { useEffect, useState } from 'react';
import GlideScreen from '../../components/glide/GlideScreen';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useProjectStore } from '../../lib/projectStore';
import { useQuickMeasurementStore } from '../../lib/quickMeasurementStore';

export default function ProjectNewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ reset?: string; fromQuickMeasure?: string }>();
  const createProject = useProjectStore((state) => state.createProject);
  const addBuilding = useProjectStore((state) => state.addBuilding);
  const addFacadeToBuilding = useProjectStore((state) => state.addFacadeToBuilding);
  const setProjectStatus = useProjectStore((state) => state.setProjectStatus);

  const quickFacades = useQuickMeasurementStore((state) => state.facades);
  const resetQuickMeasurement = useQuickMeasurementStore((state) => state.reset);
  const fromQuickMeasure = params.fromQuickMeasure === '1' && quickFacades.length > 0;

  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    setClientName('');
    setPhone('');
    setAddress('');
    setPostalCode('');
    setCity('');
  }, [params.reset]);

  function handleCreateProject() {
    if (!clientName.trim() || !address.trim()) {
      Alert.alert(
        'Champs obligatoires',
        'Le nom du client et l’adresse sont obligatoires.'
      );
      return;
    }

    const projectId = createProject({
      clientName,
      phone,
      address,
      postalCode,
      city,
    });

    if (fromQuickMeasure) {
      const buildingId = addBuilding(projectId, 'Bâtiment 1');
      quickFacades.forEach((facade) => {
        addFacadeToBuilding(projectId, buildingId, {
          name: facade.name,
          grossAreaM2: facade.grossAreaM2,
          voidsAreaM2: facade.voidsAreaM2,
          netAreaM2: facade.netAreaM2,
          imageUri: facade.imageUri,
        });
      });
      setProjectStatus(projectId, 'measured');
      resetQuickMeasurement();
    }

    router.push({
      pathname: '/project-detail',
      params: { projectId },
    });
  }

  return (
    <GlideScreen title="Nouveau projet" style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Nouveau projet</Text>

        {fromQuickMeasure ? (
          <View style={styles.quickBanner}>
            <Text style={styles.quickBannerText}>
              {quickFacades.length} façade{quickFacades.length > 1 ? 's' : ''} du relevé rapide{' '}
              {quickFacades.length > 1 ? 'seront ajoutées' : 'sera ajoutée'} à ce projet une fois
              créé.
            </Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.label}>Nom / Prénom client</Text>
          <TextInput
            style={styles.input}
            value={clientName}
            onChangeText={setClientName}
            placeholder="Jean Dupont"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Téléphone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="06 00 00 00 00"
            keyboardType="phone-pad"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Adresse</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="12 rue des Lilas"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Code postal</Text>
          <TextInput
            style={styles.input}
            value={postalCode}
            onChangeText={setPostalCode}
            placeholder="75000"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Ville</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="Paris"
            placeholderTextColor="#999"
          />
        </View>

        <Pressable style={styles.button} onPress={handleCreateProject}>
          <Text style={styles.buttonText}>Créer le projet</Text>
        </Pressable>
      </ScrollView>
    </GlideScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F3EE',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 16,
    color: '#1A1A1A',
  },
  quickBanner: {
    backgroundColor: '#EFE8DB',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2D7C3',
  },
  quickBannerText: {
    color: '#7B5D14',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2D7C3',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
    color: '#444',
  },
  input: {
    backgroundColor: '#F7F7F9',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1A1A1A',
  },
  button: {
    backgroundColor: '#D4AF37',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#111111',
    fontWeight: '800',
    fontSize: 16,
  },
});
