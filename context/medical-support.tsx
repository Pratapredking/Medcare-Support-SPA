import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { AuthContext } from '@/store/auth-context';
import {
  createMarketplaceDevice,
  deleteMarketplaceDevice,
  getMarketplaceDevices,
} from '@/services/firebase-marketplace';
import {
  approveFaultReport as approveFirebaseFaultReport,
  createFaultReport,
  getFaultReports,
} from '@/services/firebase-fault-reports';

export type FaultReport = {
  id: string;
  device: string;
  status: 'Approved' | 'Pending';
  faultTitle?: string;
  description?: string;
  reportedById?: string;
  doctorEmail?: string;
  technicianId?: string;
  technicianEmail?: string;
  createdAt?: string;
  approvedAt?: string;
};

export type NewFaultReport = {
  device: string;
  faultTitle: string;
  description: string;
  imageBase64: string;
  imageMimeType: string;
  imageFileName?: string;
};

export type MedicalDevice = {
  id: string;
  name: string;
  model: string;
  price: string;
  status: 'active';
  listedByRole: 'doctor' | 'technician';
  listedById?: string;
  listedByName: string;
  createdAt: string;
};

export type NewDevice = Pick<MedicalDevice, 'name' | 'model' | 'price'>;

type MedicalSupportContextValue = {
  reports: FaultReport[];
  reportsError: string | null;
  isLoadingReports: boolean;
  devices: MedicalDevice[];
  devicesError: string | null;
  isLoadingDevices: boolean;
  addFaultReport: (report: NewFaultReport) => Promise<FaultReport>;
  approveFaultReport: (reportId: string) => Promise<void>;
  refreshReports: () => Promise<void>;
  addDevice: (device: NewDevice) => Promise<MedicalDevice>;
  deleteDevice: (deviceId: string) => Promise<void>;
  refreshDevices: () => Promise<void>;
};

const MedicalSupportContext = createContext<MedicalSupportContextValue | null>(null);

export function MedicalSupportProvider({ children }: { children: ReactNode }) {
  const { token, userId, email, role } = useContext(AuthContext);
  const [reports, setReports] = useState<FaultReport[]>([]);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [devices, setDevices] = useState<MedicalDevice[]>([]);
  const [devicesError, setDevicesError] = useState<string | null>(null);
  const [isLoadingDevices, setIsLoadingDevices] = useState(true);

  const refreshDevices = useCallback(async () => {
    setDevicesError(null);
    setIsLoadingDevices(true);
    try {
      setDevices(await getMarketplaceDevices(token));
    } catch (error) {
      setDevicesError(error instanceof Error ? error.message : 'Unable to load marketplace devices.');
    } finally {
      setIsLoadingDevices(false);
    }
  }, [token]);

  const refreshReports = useCallback(async () => {
    setReportsError(null);
    setIsLoadingReports(true);
    try {
      setReports(await getFaultReports(token));
    } catch (error) {
      setReportsError(error instanceof Error ? error.message : 'Unable to load fault reports.');
    } finally {
      setIsLoadingReports(false);
    }
  }, [token]);

  useEffect(() => {
    void refreshDevices();
  }, [refreshDevices]);

  useEffect(() => {
    void refreshReports();
  }, [refreshReports]);

  const addFaultReport = useCallback(async (report: NewFaultReport) => {
    if (role !== 'doctor') {
      throw new Error('Only doctors can report faulty devices.');
    }

    const createdReport = await createFaultReport(report, token, { userId, email });
    setReports((current) => [createdReport, ...current]);
    return createdReport;
  }, [email, role, token, userId]);

  const approveFaultReport = useCallback(async (reportId: string) => {
    const approval = await approveFirebaseFaultReport(reportId, token, { userId, email });
    setReports((current) =>
      current.map((report) => (report.id === reportId ? { ...report, ...approval } : report)),
    );
  }, [email, token, userId]);

  const addDevice = useCallback(async (device: NewDevice) => {
    const listingRole = role === 'technician' ? 'technician' : 'doctor';
    const listedByName = email.trim().split('@')[0] || 'User';
    const createdDevice = await createMarketplaceDevice(device, token, {
      userId,
      name: listedByName,
      role: listingRole,
    });
    setDevices((current) => [createdDevice, ...current.filter((item) => item.id !== createdDevice.id)]);
    return createdDevice;
  }, [email, role, token, userId]);

  const deleteDevice = useCallback(async (deviceId: string) => {
    const device = devices.find((item) => item.id === deviceId);
    if (!device || device.listedById !== userId) {
      throw new Error('You can only delete device listings created by your account.');
    }

    await deleteMarketplaceDevice(deviceId, token);
    setDevices((current) => current.filter((device) => device.id !== deviceId));
  }, [devices, token, userId]);

  const value = useMemo<MedicalSupportContextValue>(
    () => ({
      reports,
      reportsError,
      isLoadingReports,
      devices,
      devicesError,
      isLoadingDevices,
      addFaultReport,
      approveFaultReport,
      refreshReports,
      addDevice,
      deleteDevice,
      refreshDevices,
    }),
    [
      addDevice,
      addFaultReport,
      approveFaultReport,
      deleteDevice,
      devices,
      devicesError,
      isLoadingDevices,
      isLoadingReports,
      refreshDevices,
      refreshReports,
      reports,
      reportsError,
    ],
  );

  return <MedicalSupportContext.Provider value={value}>{children}</MedicalSupportContext.Provider>;
}

export function useMedicalSupport() {
  const value = useContext(MedicalSupportContext);
  if (!value) {
    throw new Error('useMedicalSupport must be used inside MedicalSupportProvider');
  }
  return value;
}
