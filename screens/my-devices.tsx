import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, PALETTE, PageHeader } from '@/components/medical-support-ui';
import { type MedicalDevice, useMedicalSupport } from '@/context/medical-support';
import type { MedicalSupportStackParamList } from '@/screens/navigation-types';
import { AuthContext } from '@/store/auth-context';

export default function MyDevicesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MedicalSupportStackParamList>>();
  const { userId } = useContext(AuthContext);
  const { devices, devicesError, isLoadingDevices, deleteDevice, refreshDevices } = useMedicalSupport();
  const [deletingDeviceId, setDeletingDeviceId] = useState<string | null>(null);

  const confirmDelete = (device: MedicalDevice) => {
    Alert.alert(
      'Delete listing?',
      `${device.name} will be permanently removed from the marketplace.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void handleDelete(device);
          },
        },
      ],
    );
  };

  const handleDelete = async (device: MedicalDevice) => {
    setDeletingDeviceId(device.id);
    try {
      await deleteDevice(device.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete this listing.';
      Alert.alert('Delete failed', message);
    } finally {
      setDeletingDeviceId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <PageHeader
        title="Marketplace Devices"
        subtitle={`${devices.length} shared device listings`}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingDevices}
            onRefresh={() => void refreshDevices()}
            colors={[PALETTE.primary]}
            tintColor={PALETTE.primary}
          />
        }>
        <ActionButton title="+ Add Device for Sale" onPress={() => navigation.navigate('AddDevice')} />

        {isLoadingDevices && devices.length === 0 ? (
          <View style={styles.statePanel}>
            <ActivityIndicator color={PALETTE.primary} />
            <Text style={styles.stateText}>Loading marketplace devices…</Text>
          </View>
        ) : null}

        {devicesError ? (
          <View style={styles.errorPanel}>
            <Text style={styles.errorTitle}>Could not load devices</Text>
            <Text style={styles.errorText}>{devicesError}</Text>
            <ActionButton title="Try Again" onPress={() => void refreshDevices()} />
          </View>
        ) : null}

        {!isLoadingDevices && !devicesError && devices.length === 0 ? (
          <View style={styles.statePanel}>
            <Text style={styles.emptyTitle}>No devices listed yet</Text>
            <Text style={styles.stateText}>Add the first device to the shared marketplace.</Text>
          </View>
        ) : null}

        {devices.map((device) => (
          <View key={device.id} style={styles.panel}>
            <Text style={styles.itemTitle}>{device.name}</Text>
            <Text style={styles.description}>Model: {device.model}</Text>
            <Text style={styles.listedBy}>
              Listed by: {device.listedByRole === 'technician' ? 'Technician' : 'Doctor'} / {device.listedByName}
            </Text>
            <Text style={styles.price}>₹{Number(device.price).toLocaleString('en-IN')}</Text>
            <View style={styles.listingFooter}>
              <Text style={styles.smallText}>Status: Listed</Text>
              {device.listedById === userId ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${device.name} listing`}
                  disabled={deletingDeviceId !== null}
                  onPress={() => confirmDelete(device)}
                  style={({ pressed }) => [
                    styles.deleteButton,
                    deletingDeviceId !== null && styles.deleteButtonDisabled,
                    pressed && styles.deleteButtonPressed,
                  ]}>
                  {deletingDeviceId === device.id ? (
                    <ActivityIndicator size="small" color="#b91c1c" />
                  ) : (
                    <Text style={styles.deleteButtonText}>Delete listing</Text>
                  )}
                </Pressable>
              ) : (
                <Text style={styles.sharedText}>Shared listing</Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PALETTE.page },
  container: { flex: 1 },
  content: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: 18, paddingBottom: 36 },
  statePanel: { padding: 24, marginTop: 18, borderRadius: 16, alignItems: 'center', gap: 10, backgroundColor: PALETTE.white },
  stateText: { color: PALETTE.text, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  emptyTitle: { color: PALETTE.heading, fontSize: 16, fontWeight: '800' },
  errorPanel: { padding: 18, marginTop: 18, borderRadius: 16, borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fef2f2' },
  errorTitle: { color: '#991b1b', fontSize: 15, fontWeight: '800' },
  errorText: { color: '#b91c1c', fontSize: 12, lineHeight: 18, marginTop: 6 },
  panel: { padding: 18, marginTop: 18, borderRadius: 16, backgroundColor: PALETTE.white },
  itemTitle: { color: '#244A35', fontSize: 16, fontWeight: '700' },
  description: { color: PALETTE.text, lineHeight: 22, marginTop: 8 },
  listedBy: { color: '#436854', fontSize: 13, fontWeight: '700', marginTop: 7 },
  price: { color: PALETTE.primary, fontSize: 18, fontWeight: '900', marginVertical: 8 },
  smallText: { color: '#708575', fontSize: 12 },
  listingFooter: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  deleteButton: { minHeight: 38, minWidth: 112, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#fecaca', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2' },
  deleteButtonDisabled: { opacity: 0.55 },
  deleteButtonPressed: { opacity: 0.7 },
  deleteButtonText: { color: '#b91c1c', fontSize: 12, fontWeight: '800' },
  sharedText: { color: '#708575', fontSize: 12, fontWeight: '700' },
});
