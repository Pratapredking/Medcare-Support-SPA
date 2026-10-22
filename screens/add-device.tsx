import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, PALETTE, PageHeader } from '@/components/medical-support-ui';
import { useMedicalSupport } from '@/context/medical-support';
import type { MedicalSupportStackParamList } from '@/screens/navigation-types';

export default function AddDeviceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MedicalSupportStackParamList>>();
  const { addDevice } = useMedicalSupport();
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [price, setPrice] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const saveDevice = async () => {
    if (!name.trim() || !model.trim() || !Number.isFinite(Number(price)) || Number(price) <= 0) {
      Alert.alert('Validation', 'Enter valid device details and price.');
      return;
    }

    setSaveError(null);
    setIsSaving(true);
    try {
      await addDevice({ name: name.trim(), model: model.trim(), price });
      navigation.replace('MyDevices');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to list this device.';
      setSaveError(message);
      Alert.alert('Listing failed', message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <PageHeader title="Add Device" subtitle="Register marketplace inventory" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={styles.flexOne} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Device details</Text>
          <Text style={styles.subtitle}>Register a medical device in your possession.</Text>

          <View style={styles.panel}>
            <Text style={styles.fieldLabel}>Device Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. ECG Monitor"
              placeholderTextColor="#8BA092"
            />

            <Text style={styles.fieldLabel}>Model Number *</Text>
            <TextInput
              style={styles.input}
              value={model}
              onChangeText={setModel}
              placeholder="e.g. ECG-1200"
              placeholderTextColor="#8BA092"
            />

            <Text style={styles.fieldLabel}>Selling Price (₹) *</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholder="e.g. 25000"
              placeholderTextColor="#8BA092"
            />

            {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
            <ActionButton
              title={isSaving ? 'Listing device…' : 'List Device in Marketplace'}
              onPress={() => void saveDevice()}
              disabled={isSaving}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PALETTE.page },
  flexOne: { flex: 1 },
  container: { flex: 1 },
  content: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: 18, paddingBottom: 36 },
  heading: { color: PALETTE.heading, fontSize: 24, fontWeight: '900' },
  subtitle: { color: PALETTE.text, marginTop: 7, marginBottom: 4 },
  panel: { padding: 18, marginTop: 18, borderRadius: 16, backgroundColor: PALETTE.white },
  fieldLabel: { color: '#294E3B', fontWeight: '700', marginBottom: 8 },
  input: { minHeight: 48, paddingHorizontal: 13, marginBottom: 17, borderWidth: 1, borderColor: PALETTE.border, borderRadius: 10, color: '#243F30' },
  errorText: { color: '#b91c1c', fontSize: 12, lineHeight: 18 },
});
