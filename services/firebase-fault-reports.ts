import type { FaultReport, NewFaultReport } from '@/context/medical-support';

const FIREBASE_BASE_URL =
  'https://reactnative-e8f0a-default-rtdb.asia-southeast1.firebasedatabase.app';

type UserIdentity = {
  userId: string;
  email: string;
};

type FirebaseFaultReportRecord = {
  device: string;
  faultTitle: string;
  description: string;
  image?: {
    data: string;
    mimeType: string;
    fileName: string;
  };
  status: 'Pending' | 'Approved' | 'Accepted';
  reportedByRole: 'doctor';
  reportedById: string;
  doctorEmail: string;
  technicianId?: string;
  technicianEmail?: string;
  createdAt: string;
  approvedAt?: string;
};

function getAuthenticatedUrl(path: string, idToken: string) {
  if (!idToken) {
    throw new Error('Your session is unavailable. Please log out and sign in again.');
  }

  return `${FIREBASE_BASE_URL}/${path}.json?auth=${encodeURIComponent(idToken)}`;
}

async function getFirebaseError(response: Response) {
  const body = await response.text();
  if (!body) return `Firebase request failed (${response.status}).`;

  try {
    const parsed = JSON.parse(body) as { error?: string };
    if (response.status === 401 && parsed.error?.toLowerCase() === 'permission denied') {
      return 'Your account does not have permission to access fault reports. Please sign in again or contact the administrator.';
    }

    return parsed.error ?? body;
  } catch {
    return body;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mapFaultReport(id: string, value: unknown): FaultReport | null {
  if (!isObject(value) || typeof value.device !== 'string') return null;

  return {
    id,
    device: value.device,
    faultTitle: typeof value.faultTitle === 'string' ? value.faultTitle : undefined,
    description: typeof value.description === 'string' ? value.description : undefined,
    status: value.status === 'Approved' || value.status === 'Accepted' ? 'Approved' : 'Pending',
    reportedById: typeof value.reportedById === 'string' ? value.reportedById : undefined,
    doctorEmail: typeof value.doctorEmail === 'string' ? value.doctorEmail : undefined,
    technicianId: typeof value.technicianId === 'string' ? value.technicianId : undefined,
    technicianEmail: typeof value.technicianEmail === 'string' ? value.technicianEmail : undefined,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : undefined,
    approvedAt: typeof value.approvedAt === 'string' ? value.approvedAt : undefined,
  };
}

export async function getFaultReports(idToken: string): Promise<FaultReport[]> {
  const response = await fetch(getAuthenticatedUrl('faultReports', idToken));
  if (!response.ok) throw new Error(await getFirebaseError(response));

  const payload: unknown = await response.json();
  if (payload === null) return [];
  if (!isObject(payload)) throw new Error('Firebase returned an invalid fault report list.');

  return Object.entries(payload)
    .map(([id, value]) => mapFaultReport(id, value))
    .filter((report): report is FaultReport => report !== null)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

export async function createFaultReport(
  report: NewFaultReport,
  idToken: string,
  doctor: UserIdentity,
): Promise<FaultReport> {
  const record: FirebaseFaultReportRecord = {
    device: report.device.trim(),
    faultTitle: report.faultTitle.trim(),
    description: report.description.trim(),
    image: {
      data: report.imageBase64,
      mimeType: report.imageMimeType,
      fileName: report.imageFileName || 'fault.jpg',
    },
    status: 'Pending',
    reportedByRole: 'doctor',
    reportedById: doctor.userId,
    doctorEmail: doctor.email,
    createdAt: new Date().toISOString(),
  };

  const response = await fetch(getAuthenticatedUrl('faultReports', idToken), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(record),
  });

  if (!response.ok) throw new Error(await getFirebaseError(response));

  const payload: unknown = await response.json();
  if (!isObject(payload) || typeof payload.name !== 'string') {
    throw new Error('Firebase did not return an ID for the fault report.');
  }

  return mapFaultReport(payload.name, record) as FaultReport;
}

export async function approveFaultReport(
  reportId: string,
  idToken: string,
  technician: UserIdentity,
): Promise<Pick<FaultReport, 'status' | 'technicianId' | 'technicianEmail' | 'approvedAt'>> {
  const approval = {
    status: 'Approved' as const,
    technicianId: technician.userId,
    technicianEmail: technician.email,
    approvedAt: new Date().toISOString(),
  };

  const response = await fetch(
    getAuthenticatedUrl(`faultReports/${encodeURIComponent(reportId)}`, idToken),
    {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(approval),
    },
  );

  if (!response.ok) throw new Error(await getFirebaseError(response));
  return approval;
}
