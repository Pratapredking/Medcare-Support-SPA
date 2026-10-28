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

function isRole(role) { return role === 'doctor' || role === 'technician' || role === 'admin'; }
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

async function saveProfile(user, role, isNew = false) {
  const profile = {
    email: user.email,
    role,
    updatedAt: new Date().toISOString(),
    ...(isNew ? { createdAt: new Date().toISOString() } : {}),
    ...(isNew && role === 'doctor' ? {
      displayName: user.email.split('@')[0] || 'Doctor',
      doctorCode: `D${user.userId.slice(0, 5).toUpperCase()}`,
      specialty: 'General Medicine',
    } : {}),
  };
  await jsonRequest(profileUrl(user), { method: 'PATCH', body: JSON.stringify(profile) });
}

export async function login(email, password) {
  const user = await authenticate('signInWithPassword', email, password);
  const role = (await readRole(user)) || roleFromName(user.displayName);
  if (!role) throw new Error('This account has no assigned role. Complete account creation again to repair it.');
  try { await saveProfile(user, role); } catch { /* Existing accounts can still sign in if profile refresh is denied. */ }
  return { ...user, role };
}

export async function createUser(email, password, role) {
  if (!isRole(role)) throw new Error('Please select a valid account role.');
  const user = await authenticate('signUp', email, password);
  const updated = await jsonRequest(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${API_KEY}`, {
    method: 'POST', body: JSON.stringify({ idToken: user.token, displayName: `${ROLE_PREFIX}${role}`, returnSecureToken: true }),
  });
  const session = { ...user, token: updated.idToken || user.token, displayName: updated.displayName, role };
  await saveProfile(session, role, true);
  return session;
}

function authed(path, token) {
  requireFirebaseConfig();
  if (!token) throw new Error('Your session is unavailable. Please sign in again.');
  return `${DATABASE_URL}/${path}.json?auth=${encodeURIComponent(token)}`;
}

function records(payload) { return payload && typeof payload === 'object' ? Object.entries(payload) : []; }

export async function getDoctors(token) {
  const payload = await jsonRequest(authed('userProfiles', token));
  return records(payload)
    .filter(([, profile]) => profile?.role === 'doctor')
    .map(([id, profile]) => ({
      id,
      code: profile.doctorCode || `D${id.slice(0, 5).toUpperCase()}`,
      name: profile.displayName || profile.email?.split('@')[0] || 'Doctor',
      email: profile.email || '',
      specialty: profile.specialty || 'General Medicine',
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getHospitals(token) {
  const payload = await jsonRequest(authed('hospitals', token));
  return records(payload)
    .map(([id, hospital]) => ({
      id,
      name: hospital.name || '',
      city: hospital.city || hospital.address || '',
      specialization: hospital.specialization || '',
      address: hospital.address || '',
      active: hospital.active !== false,
      createdAt: hospital.createdAt || '',
      seedVersion: Number(hospital.seedVersion || 0),
    }))
    .filter((hospital) => hospital.name)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getDoctorHospitalContext(token, doctorId) {
  const mapping = await jsonRequest(authed(`doctorHospitalMappings/${encodeURIComponent(doctorId)}`, token));
  const hospitalIds = Array.isArray(mapping?.hospitalIds) ? mapping.hospitalIds.filter(Boolean) : [];
  if (!hospitalIds.length) return { hospitals: [], primaryId: '' };
  const directory = await getHospitals(token);
  const hospitals = hospitalIds
    .map((id) => directory.find((hospital) => hospital.id === id))
    .filter((hospital) => hospital?.active);
  const primaryId = hospitals.some((hospital) => hospital.id === mapping?.primaryId)
    ? mapping.primaryId
    : (hospitals[0]?.id || '');
  return { hospitals, primaryId };
}

export async function initializeHospitals(token, user, hospitals) {
  if (user.role !== 'admin') throw new Error('Only administrators can initialize hospital records.');
  const payload = await jsonRequest(authed('hospitals', token));
  const now = new Date().toISOString();
  await Promise.all(hospitals.map(async (hospital) => {
    const existing = payload?.[hospital.id] || {};
    const isCurrent = Number(existing.seedVersion || 0) >= Number(hospital.seedVersion || 1)
      && existing.specialization && existing.address;
    if (isCurrent) return;
    const record = {
      ...existing,
      name: hospital.name,
      city: hospital.city,
      specialization: hospital.specialization,
      address: hospital.address,
      active: true,
      seedVersion: Number(hospital.seedVersion || 1),
      createdAt: existing.createdAt || now,
      createdBy: existing.createdBy || user.userId,
      updatedAt: now,
      updatedBy: user.userId,
    };
    await jsonRequest(authed(`hospitals/${encodeURIComponent(hospital.id)}`, token), {
      method: 'PUT', body: JSON.stringify(record),
    });
  }));
  return getHospitals(token);
}

export async function addHospital(hospital, token, user) {
  if (user.role !== 'admin') throw new Error('Only administrators can create hospital records.');
  const name = hospital.name?.trim();
  const specialization = hospital.specialization?.trim();
  const address = hospital.address?.trim();
  if (!name || !specialization || !address) throw new Error('Hospital name, specialization, and address are required.');
  const now = new Date().toISOString();
  const record = {
    name,
    specialization,
    address,
    active: true,
    createdAt: now,
    createdBy: user.userId,
    updatedAt: now,
    updatedBy: user.userId,
  };
  const payload = await jsonRequest(authed('hospitals', token), {
    method: 'POST', body: JSON.stringify(record),
  });
  return { id: payload.name, ...record, city: address };
}

export async function getDoctorHospitalMappings(token) {
  const payload = await jsonRequest(authed('doctorHospitalMappings', token));
  return Object.fromEntries(records(payload).map(([doctorId, mapping]) => [doctorId, {
    hospitalIds: Array.isArray(mapping?.hospitalIds) ? mapping.hospitalIds.filter(Boolean) : [],
    primaryId: mapping?.primaryId || '',
    updatedAt: mapping?.updatedAt || '',
    updatedBy: mapping?.updatedBy || '',
  }]));
}

export async function saveDoctorHospitalMapping(doctorId, mapping, token, user) {
  if (user.role !== 'admin') throw new Error('Only administrators can update hospital assignments.');
  const hospitalIds = [...new Set(mapping.hospitalIds)].filter(Boolean);
  const primaryId = hospitalIds.includes(mapping.primaryId) ? mapping.primaryId : (hospitalIds[0] || '');
  const record = {
    hospitalIds,
    primaryId,
    updatedAt: new Date().toISOString(),
    updatedBy: user.userId,
  };
  if (!hospitalIds.length) {
    await jsonRequest(authed(`doctorHospitalMappings/${encodeURIComponent(doctorId)}`, token), { method: 'DELETE' });
    return record;
  }
  await jsonRequest(authed(`doctorHospitalMappings/${encodeURIComponent(doctorId)}`, token), {
    method: 'PUT', body: JSON.stringify(record),
  });
  return record;
}

export async function getMedicalEquipment(token) {
  const payload = await jsonRequest(authed('medicalEquipment', token));
  return records(payload)
    .map(([id, item]) => ({ id, ...item, sNo: Number(item.sNo || 0), quantity: Number(item.quantity || 0) }))
    .filter((item) => item.equipmentName)
    .sort((a, b) => {
      if (a.sNo && b.sNo) return a.sNo - b.sNo;
      if (a.sNo) return -1;
      if (b.sNo) return 1;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
}

function equipmentCatalogRecord(entry) {
  return {
    equipmentName: entry.equipmentName,
    ...(entry.hospitalId && entry.hospitalName ? { hospitalId: entry.hospitalId, hospitalName: entry.hospitalName } : {}),
    location: entry.location,
    department: entry.department,
    model: entry.model,
    status: entry.status,
  };
}

async function saveEquipmentCatalogEntry(id, entry, token) {
  await jsonRequest(authed(`medicalEquipmentCatalog/${encodeURIComponent(id)}`, token), {
    method: 'PUT', body: JSON.stringify(equipmentCatalogRecord(entry)),
  });
}

export async function getMedicalEquipmentCatalog(token, hospitalId = '') {
  const catalogUrl = authed('medicalEquipmentCatalog', token);
  let payload;
  if (hospitalId) {
    const query = `&orderBy=${encodeURIComponent('"hospitalId"')}&equalTo=${encodeURIComponent(JSON.stringify(hospitalId))}`;
    try {
      payload = await jsonRequest(`${catalogUrl}${query}`);
    } catch {
      // Firebase returns HTTP 400 until a newly added .indexOn rule is deployed.
      // The fallback keeps the hospital workspace functional during that rollout.
      payload = await jsonRequest(catalogUrl);
    }
  } else {
    payload = await jsonRequest(catalogUrl);
  }
  return records(payload)
    .map(([id, item]) => ({ id, ...item }))
    .filter((item) => item.equipmentName && (!hospitalId || item.hospitalId === hospitalId))
    .sort((a, b) => a.equipmentName.localeCompare(b.equipmentName));
}

export async function syncMedicalEquipmentCatalog(token, user, entries) {
  if (user.role !== 'admin') throw new Error('Only administrators can synchronize equipment records.');
  await Promise.all(entries.map((entry) => saveEquipmentCatalogEntry(entry.id, entry, token)));
}

export async function initializeMedicalEquipment(token, user, seed) {
  if (user.role !== 'admin') throw new Error('Only administrators can initialize equipment records.');
  const seedId = seed.id || 'seed-medical-equipment';
  const path = `medicalEquipment/${encodeURIComponent(seedId)}`;
  const existing = await jsonRequest(authed(path, token));
  if (Number(existing?.seedVersion || 0) >= Number(seed.seedVersion || 1)
      && existing?.hospitalId && existing?.hospitalName) {
    await saveEquipmentCatalogEntry(seedId, existing, token);
    return existing;
  }
  const record = {
    ...(seed.sNo ? { sNo: Number(seed.sNo) } : {}),
    hospitalId: seed.hospitalId,
    hospitalName: seed.hospitalName,
    location: seed.location,
    plotNo: seed.plotNo,
    department: seed.department,
    type: seed.type,
    equipmentName: seed.equipmentName,
    make: seed.make,
    model: seed.model,
    serialNo: seed.serialNo,
    doi: String(seed.doi),
    quantity: Number(seed.quantity),
    ppmDoneOn: seed.ppmDoneOn,
    ppmDueOn: seed.ppmDueOn,
    status: seed.status,
    remarks: seed.remarks || '',
    seedVersion: Number(seed.seedVersion || 1),
    createdBy: existing?.createdBy || user.userId,
    createdByRole: 'admin',
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await jsonRequest(authed(path, token), { method: 'PUT', body: JSON.stringify(record) });
  await saveEquipmentCatalogEntry(seedId, record, token);
  return { id: seedId, ...record };
}

export async function initializeMedicalEquipmentSeeds(token, user, seeds) {
  if (user.role !== 'admin') throw new Error('Only administrators can initialize equipment records.');
  return Promise.all(seeds.map((seed) => initializeMedicalEquipment(token, user, seed)));
}

export async function addMedicalEquipment(entry, token, user) {
  if (user.role !== 'admin') {
    throw new Error('Only administrators can create equipment records.');
  }
  const hospitalId = entry.hospitalId?.trim();
  if (!hospitalId) throw new Error('Select a hospital for this equipment record.');
  const hospital = await jsonRequest(authed(`hospitals/${encodeURIComponent(hospitalId)}`, token));
  if (!hospital?.name || hospital.active === false) throw new Error('The selected hospital is no longer available. Refresh the form and select another hospital.');
  const record = {
    hospitalId,
    hospitalName: hospital.name,
    location: entry.location.trim(),
    plotNo: entry.plotNo.trim(),
    department: entry.department.trim(),
    type: entry.type.trim(),
    equipmentName: entry.equipmentName.trim(),
    make: entry.make.trim(),
    model: entry.model.trim(),
    serialNo: entry.serialNo.trim(),
    doi: String(entry.doi).trim(),
    quantity: Number(entry.quantity),
    ppmDoneOn: entry.ppmDoneOn,
    ppmDueOn: entry.ppmDueOn,
    status: entry.status,
    remarks: entry.remarks.trim(),
    createdBy: user.userId,
    createdByRole: user.role,
    createdAt: new Date().toISOString(),
  };
  const payload = await jsonRequest(authed('medicalEquipment', token), {
    method: 'POST', body: JSON.stringify(record),
  });
  await saveEquipmentCatalogEntry(payload.name, record, token);
  return { id: payload.name, ...record };
}

export async function getReports(token) {
  const payload = await jsonRequest(authed('faultReports', token));
  return records(payload).map(([id, item]) => ({
    id, equipmentId: item.equipmentId || '', hospitalId: item.hospitalId || '', hospitalName: item.hospitalName || '',
    device: item.device, faultTitle: item.faultTitle || '', description: item.description || '',
    status: item.status === 'Approved' || item.status === 'Accepted' ? 'Approved' : 'Pending',
    reportedById: item.reportedById, doctorEmail: item.doctorEmail,
    technicianId: item.technicianId, technicianEmail: item.technicianEmail,
    createdAt: item.createdAt, approvedAt: item.approvedAt,
  })).filter((item) => item.device).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function addReport(report, token, user) {
  if (user.role !== 'doctor') throw new Error('Only doctors can submit equipment fault reports.');
  const hospitalId = report.hospitalId?.trim();
  if (!hospitalId) throw new Error('Select an assigned hospital workspace before reporting a fault.');
  const mapping = await jsonRequest(authed(`doctorHospitalMappings/${encodeURIComponent(user.userId)}`, token));
  const assignedHospitalIds = Array.isArray(mapping?.hospitalIds) ? mapping.hospitalIds.filter(Boolean) : [];
  if (!assignedHospitalIds.includes(hospitalId)) throw new Error('This hospital is not assigned to your doctor account.');
  const [hospital, equipment] = await Promise.all([
    jsonRequest(authed(`hospitals/${encodeURIComponent(hospitalId)}`, token)),
    jsonRequest(authed(`medicalEquipmentCatalog/${encodeURIComponent(report.equipmentId)}`, token)),
  ]);
  if (!hospital?.name || hospital.active === false) throw new Error('The selected hospital workspace is no longer available.');
  if (!equipment?.equipmentName || equipment.hospitalId !== hospitalId) throw new Error('The selected equipment does not belong to this hospital workspace.');
  const record = {
    hospitalId,
    hospitalName: hospital.name,
    equipmentId: report.equipmentId,
    device: equipment.equipmentName,
    faultTitle: report.faultTitle.trim(),
    description: report.description.trim(),
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
