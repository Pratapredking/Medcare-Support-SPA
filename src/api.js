const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
const DATABASE_URL = import.meta.env.VITE_FIREBASE_DATABASE_URL?.replace(/\/$/, '');
const ROLE_PREFIX = 'MEDICARE_ROLE:';

function requireFirebaseConfig() {
  const missing = [];
  if (!API_KEY) missing.push('VITE_FIREBASE_API_KEY');
  if (!DATABASE_URL) missing.push('VITE_FIREBASE_DATABASE_URL');
  if (missing.length) {
    throw new Error(`Missing Firebase configuration: ${missing.join(', ')}. Add it to your .env file and restart the development server.`);
  }
}

function friendlyAuthError(payload, fallback) {
  const raw = payload?.error?.message;
  const code = typeof raw === 'string' ? raw.split(' : ')[0] : '';
  const messages = {
    EMAIL_EXISTS: 'An account with this email already exists.',
    EMAIL_NOT_FOUND: 'No account was found for this email address.',
    INVALID_LOGIN_CREDENTIALS: 'The email address or password is incorrect.',
    INVALID_PASSWORD: 'The email address or password is incorrect.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    WEAK_PASSWORD: 'Use a stronger password with at least six characters.',
    USER_DISABLED: 'This account has been disabled.',
    TOO_MANY_ATTEMPTS_TRY_LATER: 'Too many attempts. Please wait and try again.',
  };
  return new Error(messages[code] || raw || fallback);
}

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw friendlyAuthError(payload, `Request failed (${response.status}).`);
  return payload;
}

async function authenticate(mode, email, password) {
  requireFirebaseConfig();
  const payload = await jsonRequest(`https://identitytoolkit.googleapis.com/v1/accounts:${mode}?key=${API_KEY}`, {
    method: 'POST', body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  return { token: payload.idToken, userId: payload.localId, email: payload.email || email, displayName: payload.displayName || '' };
}

function isRole(role) { return role === 'doctor' || role === 'technician'; }
function profileUrl(user) {
  requireFirebaseConfig();
  return `${DATABASE_URL}/userProfiles/${encodeURIComponent(user.userId)}.json?auth=${encodeURIComponent(user.token)}`;
}
function roleFromName(name) {
  if (!name?.startsWith(ROLE_PREFIX)) return null;
  const role = name.slice(ROLE_PREFIX.length);
  return isRole(role) ? role : null;
}

async function readRole(user) {
  try {
    const profile = await jsonRequest(profileUrl(user));
    return isRole(profile?.role) ? profile.role : null;
  } catch { return null; }
}

async function saveProfile(user, role) {
  try {
    await jsonRequest(profileUrl(user), {
      method: 'PUT', body: JSON.stringify({ email: user.email, role, createdAt: new Date().toISOString() }),
    });
  } catch { /* Role is also stored on the Firebase account. */ }
}

export async function login(email, password) {
  const user = await authenticate('signInWithPassword', email, password);
  const role = (await readRole(user)) || roleFromName(user.displayName);
  if (!role) throw new Error('This account has no assigned role. Complete account creation again to repair it.');
  await saveProfile(user, role);
  return { ...user, role };
}

export async function createUser(email, password, role) {
  if (!isRole(role)) throw new Error('Please select a valid account role.');
  const user = await authenticate('signUp', email, password);
  const updated = await jsonRequest(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${API_KEY}`, {
    method: 'POST', body: JSON.stringify({ idToken: user.token, displayName: `${ROLE_PREFIX}${role}`, returnSecureToken: true }),
  });
  const session = { ...user, token: updated.idToken || user.token, displayName: updated.displayName, role };
  await saveProfile(session, role);
  return session;
}

function authed(path, token) {
  requireFirebaseConfig();
  if (!token) throw new Error('Your session is unavailable. Please sign in again.');
  return `${DATABASE_URL}/${path}.json?auth=${encodeURIComponent(token)}`;
}

function records(payload) { return payload && typeof payload === 'object' ? Object.entries(payload) : []; }

export async function getReports(token) {
  const payload = await jsonRequest(authed('faultReports', token));
  return records(payload).map(([id, item]) => ({
    id, device: item.device, faultTitle: item.faultTitle || '', description: item.description || '',
    status: item.status === 'Approved' || item.status === 'Accepted' ? 'Approved' : 'Pending',
    reportedById: item.reportedById, doctorEmail: item.doctorEmail,
    technicianId: item.technicianId, technicianEmail: item.technicianEmail,
    createdAt: item.createdAt, approvedAt: item.approvedAt,
  })).filter((item) => item.device).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function addReport(report, token, user) {
  const record = {
    device: report.device.trim(), faultTitle: report.faultTitle.trim(), description: report.description.trim(),
    image: { data: report.imageBase64, mimeType: report.imageMimeType, fileName: report.imageFileName || 'fault.jpg' },
    status: 'Pending', reportedByRole: 'doctor', reportedById: user.userId,
    doctorEmail: user.email, createdAt: new Date().toISOString(),
  };
  const payload = await jsonRequest(authed('faultReports', token), { method: 'POST', body: JSON.stringify(record) });
  return { id: payload.name, ...record };
}

export async function approveReport(id, token, user) {
  const approval = { status: 'Approved', technicianId: user.userId, technicianEmail: user.email, approvedAt: new Date().toISOString() };
  await jsonRequest(authed(`faultReports/${encodeURIComponent(id)}`, token), { method: 'PATCH', body: JSON.stringify(approval) });
  return approval;
}

export async function getDevices(token) {
  const payload = await jsonRequest(authed('marketplace/devices', token));
  return records(payload).map(([id, item]) => ({ id, ...item, price: String(item.price) }))
    .filter((item) => item.name && item.model)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function addDevice(device, token, user) {
  const record = {
    name: device.name.trim(), model: device.model.trim(), price: Number(device.price), status: 'active',
    listedByRole: user.role, listedById: user.userId,
    listedByName: user.email.split('@')[0] || 'User', createdAt: new Date().toISOString(),
  };
  const payload = await jsonRequest(authed('marketplace/devices', token), { method: 'POST', body: JSON.stringify(record) });
  return { id: payload.name, ...record, price: String(record.price) };
}

export async function deleteDevice(id, token) {
  await jsonRequest(authed(`marketplace/devices/${encodeURIComponent(id)}`, token), { method: 'DELETE' });
}
