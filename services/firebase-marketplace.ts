import type { MedicalDevice, NewDevice } from '@/context/medical-support';

const FIREBASE_DATABASE_URL =
  'https://reactnative-e8f0a-default-rtdb.asia-southeast1.firebasedatabase.app';
const MARKETPLACE_DEVICES_URL = `${FIREBASE_DATABASE_URL}/marketplace/devices.json`;

function getAuthenticatedUrl(url: string, idToken: string) {
  if (!idToken) {
    throw new Error('Your session is unavailable. Please log out and sign in again.');
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}auth=${encodeURIComponent(idToken)}`;
}

type FirebaseDeviceRecord = {
  name: string;
  model: string;
  price: number;
  status: 'active';
  listedByRole: 'doctor' | 'technician';
  listedById: string;
  listedByName: string;
  createdAt: string;
};

type MarketplaceLister = {
  userId: string;
  name: string;
  role: 'doctor' | 'technician';
};

async function getFirebaseError(response: Response) {
  const body = await response.text();
  if (!body) return `Firebase request failed (${response.status}).`;

  try {
    const parsed = JSON.parse(body) as { error?: string };
    if (response.status === 401 && parsed.error?.toLowerCase() === 'permission denied') {
      return 'Your account does not have permission to manage marketplace devices. Please sign in again or contact the administrator.';
    }

    return parsed.error ?? body;
  } catch {
    return body;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseDevice(id: string, value: unknown): MedicalDevice | null {
  if (!isObject(value)) return null;

  const { name, model, price, createdAt } = value;
  if (typeof name !== 'string' || typeof model !== 'string') return null;
  if (typeof price !== 'number' && typeof price !== 'string') return null;

  return {
    id,
    name,
    model,
    price: String(price),
    status: 'active',
    listedByRole: value.listedByRole === 'technician' ? 'technician' : 'doctor',
    listedById: typeof value.listedById === 'string' ? value.listedById : undefined,
    listedByName:
      typeof value.listedByName === 'string' && value.listedByName.trim()
        ? value.listedByName
        : 'Unknown user',
    createdAt: typeof createdAt === 'string' ? createdAt : '',
  };
}

export async function getMarketplaceDevices(idToken: string, signal?: AbortSignal): Promise<MedicalDevice[]> {
  const response = await fetch(getAuthenticatedUrl(MARKETPLACE_DEVICES_URL, idToken), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    throw new Error(await getFirebaseError(response));
  }

  const payload: unknown = await response.json();
  if (payload === null) return [];
  if (!isObject(payload)) throw new Error('Firebase returned an unexpected marketplace response.');

  return Object.entries(payload)
    .map(([id, value]) => parseDevice(id, value))
    .filter((device): device is MedicalDevice => device !== null)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function createMarketplaceDevice(
  device: NewDevice,
  idToken: string,
  lister: MarketplaceLister,
): Promise<MedicalDevice> {
  const record: FirebaseDeviceRecord = {
    name: device.name.trim(),
    model: device.model.trim(),
    price: Number(device.price),
    status: 'active',
    listedByRole: lister.role,
    listedById: lister.userId,
    listedByName: lister.name,
    createdAt: new Date().toISOString(),
  };

  const response = await fetch(getAuthenticatedUrl(MARKETPLACE_DEVICES_URL, idToken), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    throw new Error(await getFirebaseError(response));
  }

  const payload: unknown = await response.json();
  if (!isObject(payload) || typeof payload.name !== 'string') {
    throw new Error('Firebase did not return an ID for the new device.');
  }

  return {
    id: payload.name,
    name: record.name,
    model: record.model,
    price: String(record.price),
    status: record.status,
    listedByRole: record.listedByRole,
    listedById: record.listedById,
    listedByName: record.listedByName,
    createdAt: record.createdAt,
  };
}

export async function deleteMarketplaceDevice(deviceId: string, idToken: string): Promise<void> {
  const response = await fetch(
    getAuthenticatedUrl(
      `${FIREBASE_DATABASE_URL}/marketplace/devices/${encodeURIComponent(deviceId)}.json`,
      idToken,
    ),
    {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    },
  );

  if (!response.ok) {
    throw new Error(await getFirebaseError(response));
  }
}
