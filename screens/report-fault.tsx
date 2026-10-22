
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text, TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { useMedicalSupport } from '@/context/medical-support';
import type { MedicalSupportStackParamList } from '@/screens/navigation-types';

export default function ReportFaultScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MedicalSupportStackParamList>>();
  const { addFaultReport } = useMedicalSupport();
  const [deviceName, setDeviceName] = useState('');
  const [faultTitle, setFaultTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);

  const selectImage = async (source: 'camera' | 'gallery') => {
    try {
      if (source === 'camera') {
        const permission =
          await ImagePicker.requestCameraPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            'Permission Required',
            'Please allow camera access.'
          );
          return;
        }
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      };

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets?.length) {
        setImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Image Error', 'Unable to select image.');
    }
  };

  const showImageOptions = () => {
    Alert.alert('Device Image', 'Choose image source', [
      {
        text: 'Camera',
        onPress: () => selectImage('camera')
      },
      {
        text: 'Gallery',
        onPress: () => selectImage('gallery')
      },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const notifyTechnician = async () => {
    if (
      !deviceName.trim() ||
      !faultTitle.trim() ||
      !description.trim()
    ) {
      Alert.alert(
        'Missing Information',
        'Please complete all required fields.'
      );
      return;
    }

    if (!image) {
      Alert.alert(
        'Image Required',
        'Please upload a fault image.'
      );
      return;
    }

    setLoading(true);

    try {
      if (!image.base64) {
        throw new Error('The selected image could not be prepared for upload. Please choose it again.');
      }

      const report = await addFaultReport({
        device: deviceName,
        faultTitle,
        description,
        imageBase64: image.base64,
        imageMimeType: image.mimeType || 'image/jpeg',
        imageFileName: image.fileName || undefined,
      });

      Alert.alert(
        'Report Submitted',
        `Fault report ${report.id} was sent to the technician queue.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit the fault report.';
      Alert.alert(
        'Submission Failed',
        message,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.brand}>
          ✚ MediCare Support
        </Text>
        <Text style={styles.dashboard}>
          Doctor Dashboard
        </Text>

        <Text style={styles.title}>
          Report Device Fault
        </Text>
        <Text style={styles.subtitle}>
          Enter equipment details and notify a technician.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Device Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Patient Monitor"
            value={deviceName}
            onChangeText={setDeviceName}
          />

          <Text style={styles.label}>Fault / Defect *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Display not working"
            value={faultTitle}
            onChangeText={setFaultTitle}
          />

          <Text style={styles.label}>
            Fault Description *
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the issue and symptoms..."
            multiline
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.label}>Fault Image *</Text>

          {image ? (
            <View>
              <Image
                source={{ uri: image.uri }}
                style={styles.preview}
                resizeMode="contain"
              />
              <View style={styles.imageActions}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={showImageOptions}
                >
                  <Text style={styles.secondaryText}>
                    Replace
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setImage(null)}
                >
                  <Text style={styles.secondaryText}>
                    Remove
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={showImageOptions}
            >
              <Text style={styles.uploadIcon}>📷</Text>
              <Text style={styles.uploadText}>
                Upload Device Image
              </Text>
              <Text style={styles.uploadHint}>
                Camera or Gallery
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.disabled
            ]}
            onPress={notifyTechnician}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>
                Notify Technician
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Medical Equipment Support System
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF7EE'
  },
  content: {
    padding: 20,
    paddingTop: 30
  },
  brand: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#247750'
  },
  dashboard: {
    fontSize: 12,
    color: '#668472',
    marginTop: 4
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#174F38',
    marginTop: 28
  },
  subtitle: {
    color: '#607F6E',
    marginTop: 7,
    marginBottom: 22
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    elevation: 2
  },
  label: {
    fontWeight: '600',
    color: '#294E3B',
    marginBottom: 8,
    marginTop: 12
  },
  input: {
    borderWidth: 1,
    borderColor: '#D9E8DF',
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
    color: '#243F30'
  },
  textArea: {
    height: 110,
    paddingTop: 12
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#A9D2BA',
    backgroundColor: '#F4FBF6',
    borderRadius: 12,
    padding: 28,
    alignItems: 'center'
  },
  uploadIcon: {
    fontSize: 30,
    marginBottom: 8
  },
  uploadText: {
    color: '#296C49',
    fontWeight: 'bold'
  },
  uploadHint: {
    color: '#728F7D',
    marginTop: 5,
    fontSize: 12
  },
  preview: {
    width: '100%',
    height: 190,
    borderRadius: 12,
    backgroundColor: '#F4F7F5'
  },
  imageActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#B7D5C3',
    borderRadius: 9,
    padding: 11,
    alignItems: 'center'
  },
  secondaryText: {
    color: '#277B55',
    fontWeight: '600'
  },
  submitButton: {
    backgroundColor: '#277B55',
    borderRadius: 12,
    padding: 17,
    alignItems: 'center',
    marginTop: 26
  },
  disabled: {
    opacity: 0.6
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16
  },
  footer: {
    textAlign: 'center',
    color: '#668675',
    fontSize: 12,
    marginTop: 26
  }
});
