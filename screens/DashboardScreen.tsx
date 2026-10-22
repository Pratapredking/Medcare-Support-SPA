import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, PALETTE, PageHeader } from '@/components/medical-support-ui';
import { type FaultReport, useMedicalSupport } from '@/context/medical-support';
import type { MedicalSupportStackParamList } from '@/screens/navigation-types';
import { AuthContext } from '@/store/auth-context';

function SummaryCard({ icon, count, label }: { icon: string; count: number; label: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.cardIcon}>{icon}</Text>
      <Text style={styles.count}>{count}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

function formatDate(value?: string) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function ReportDetails({ report }: { report: FaultReport }) {
  return (
    <View style={styles.flexOne}>
      <Text style={styles.itemTitle}>{report.device}</Text>
      {report.faultTitle ? <Text style={styles.faultTitle}>{report.faultTitle}</Text> : null}
      {report.description ? <Text style={styles.description}>{report.description}</Text> : null}
      <Text style={styles.smallText}>Reported {formatDate(report.createdAt)}</Text>
      {report.doctorEmail ? <Text style={styles.smallText}>Doctor: {report.doctorEmail}</Text> : null}
    </View>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MedicalSupportStackParamList>>();
  const { role, userId, email } = useContext(AuthContext);
  const {
    reports,
    reportsError,
    isLoadingReports,
    devices,
    approveFaultReport,
    refreshReports,
  } = useMedicalSupport();
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const isTechnician = role === 'technician';
  const username = email.trim().split('@')[0] || 'User';
  const roleLabel = isTechnician ? 'Technician' : 'Doctor';
  const doctorReports = reports.filter((report) => report.reportedById === userId);
  const pendingReports = reports.filter((report) => report.status === 'Pending');
  const approvedDoctorReports = doctorReports.filter((report) => report.status === 'Approved');
  const technicianApprovals = reports.filter(
    (report) => report.status === 'Approved' && report.technicianId === userId,
  );

  async function handleApprove(report: FaultReport) {
    setApprovingId(report.id);
    try {
      await approveFaultReport(report.id);
      Alert.alert('Fault approved', `${report.device} has been moved to the doctor's approved list.`);
    } catch (error) {
      Alert.alert(
        'Approval failed',
        error instanceof Error ? error.message : 'Unable to approve this fault report.',
      );
    } finally {
      setApprovingId(null);
    }
  }

  async function contactTechnician(email?: string) {
    if (!email) {
      Alert.alert('Contact unavailable', 'The technician did not provide an email address.');
      return;
    }

    const url = `mailto:${email}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open email', `Contact the technician at ${email}.`);
    }
  }

  function ReportsState({ emptyMessage }: { emptyMessage: string }) {
    if (isLoadingReports) {
      return <ActivityIndicator color={PALETTE.primary} style={styles.loader} />;
    }
    if (reportsError) {
      return (
        <View style={styles.stateBox}>
          <Text style={styles.errorText}>{reportsError}</Text>
          <Pressable onPress={() => void refreshReports()} style={styles.inlineButton}>
            <Text style={styles.inlineButtonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return <Text style={styles.emptyText}>{emptyMessage}</Text>;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <PageHeader
        title="MediCare Support"
        subtitle={`${roleLabel} / ${username}`}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.flexOne}>
            <Text style={styles.heading}>{isTechnician ? 'Technician Dashboard' : 'Doctor Dashboard'}</Text>
            <Text style={styles.subtitle}>
              {isTechnician
                ? 'Review and approve pending equipment faults'
                : 'Report faults and follow technician approvals'}
            </Text>
          </View>
          <Pressable onPress={() => void refreshReports()} style={styles.refreshButton}>
            <Text style={styles.refreshText}>Refresh</Text>
          </Pressable>
        </View>

        <View style={styles.cardGrid}>
          {isTechnician ? (
            <>
              <SummaryCard icon="!" count={pendingReports.length} label="Pending Faults" />
              <SummaryCard icon="✓" count={technicianApprovals.length} label="Approved by Me" />
            </>
          ) : (
            <>
              <SummaryCard icon="↑" count={doctorReports.length} label="Fault Reports Sent" />
              <SummaryCard icon="✓" count={approvedDoctorReports.length} label="Approved by Technician" />
              <SummaryCard
                icon="…"
                count={doctorReports.length - approvedDoctorReports.length}
                label="Awaiting Approval"
              />
              <SummaryCard icon="□" count={devices.length} label="Marketplace Devices" />
            </>
          )}
        </View>

        {isTechnician ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Pending Fault Reports</Text>
            <Text style={styles.panelHint}>
              Approving a report removes it from this queue and lets the doctor contact you.
            </Text>
            {pendingReports.length === 0 ? (
              <ReportsState emptyMessage="There are no pending fault reports." />
            ) : (
              pendingReports.map((report) => (
                <View style={styles.reportCard} key={report.id}>
                  <ReportDetails report={report} />
                  <ActionButton
                    title={approvingId === report.id ? 'Approving…' : 'Approve'}
                    disabled={approvingId !== null}
                    onPress={() => void handleApprove(report)}
                  />
                </View>
              ))
            )}
          </View>
        ) : (
          <>
            <ActionButton title="+ Report Device Fault" onPress={() => navigation.navigate('ReportFault')} />

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>My Fault Reports</Text>
              <Text style={styles.panelHint}>
                Pending reports are waiting for a technician. Contact becomes available after approval.
              </Text>
              {doctorReports.length === 0 ? (
                <ReportsState emptyMessage="You have not reported any faulty devices yet." />
              ) : (
                doctorReports.map((report) => (
                  <View style={styles.reportCard} key={report.id}>
                    <View style={styles.reportHeader}>
                      <ReportDetails report={report} />
                      <Text style={[styles.status, report.status === 'Approved' ? styles.approved : styles.pending]}>
                        {report.status}
                      </Text>
                    </View>
                    {report.status === 'Approved' ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => void contactTechnician(report.technicianEmail)}
                        style={styles.contactButton}
                      >
                        <Text style={styles.contactButtonText}>
                          Contact technician{report.technicianEmail ? ` · ${report.technicianEmail}` : ''}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))
              )}
            </View>

          </>
        )}

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Marketplace</Text>
          <Text style={styles.description}>
            Register and manage medical devices in your possession that may be offered for sale.
          </Text>
          <ActionButton title="View Marketplace Devices →" onPress={() => navigation.navigate('MyDevices')} />
          <ActionButton title="+ Add Device" onPress={() => navigation.navigate('AddDevice')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PALETTE.page },
  container: { flex: 1, backgroundColor: PALETTE.page },
  content: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: 18, paddingBottom: 36 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  heading: { color: PALETTE.heading, fontSize: 25, fontWeight: '900' },
  subtitle: { color: '#668473', marginTop: 7, marginBottom: 22 },
  refreshButton: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 9, backgroundColor: '#DDF0E4' },
  refreshText: { color: PALETTE.primary, fontSize: 12, fontWeight: '800' },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  summaryCard: { width: '48%', padding: 18, marginBottom: 12, borderRadius: 16, backgroundColor: PALETTE.white },
  cardIcon: { color: PALETTE.primary, fontSize: 25, fontWeight: '900' },
  count: { color: '#254E36', fontSize: 30, fontWeight: '900', marginTop: 12 },
  cardLabel: { color: '#627D6D', fontSize: 12, marginTop: 6 },
  panel: { padding: 18, marginTop: 18, borderRadius: 16, backgroundColor: PALETTE.white },
  panelTitle: { color: '#28573E', fontSize: 17, fontWeight: '900' },
  panelHint: { color: PALETTE.text, lineHeight: 20, marginTop: 7, marginBottom: 8 },
  reportCard: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#E6EFE8' },
  reportHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  flexOne: { flex: 1 },
  itemTitle: { color: '#244A35', fontSize: 16, fontWeight: '800' },
  faultTitle: { color: '#436854', fontSize: 14, fontWeight: '700', marginTop: 4 },
  description: { color: PALETTE.text, lineHeight: 20, marginTop: 6 },
  smallText: { color: '#708575', fontSize: 12, marginTop: 5 },
  status: { fontSize: 12, fontWeight: '800', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12 },
  approved: { color: '#1F754B', backgroundColor: '#DFF3E7' },
  pending: { color: '#93651C', backgroundColor: '#FFF2D8' },
  contactButton: { marginTop: 12, padding: 12, alignItems: 'center', borderRadius: 10, backgroundColor: '#E5F4EA' },
  contactButtonText: { color: PALETTE.primary, fontSize: 13, fontWeight: '800' },
  loader: { marginVertical: 24 },
  stateBox: { alignItems: 'center', paddingVertical: 18 },
  errorText: { color: '#A63D40', textAlign: 'center', lineHeight: 20 },
  emptyText: { color: '#708575', textAlign: 'center', paddingVertical: 24 },
  inlineButton: { marginTop: 12, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, backgroundColor: PALETTE.primary },
  inlineButtonText: { color: PALETTE.white, fontWeight: '800' },
});
