import axios from 'axios';

const API_KEY = 'AIzaSyBCHTfu0xNrzk5oQ5Hpo-wquGXJdPfEDyE';
const FIREBASE_DATABASE_URL =
  'https://reactnative-e8f0a-default-rtdb.asia-southeast1.firebasedatabase.app';
const ROLE_DISPLAY_NAME_PREFIX = 'MEDICARE_ROLE:';

function isValidRole(role) {
  return role === 'doctor' || role === 'technician';
}

function roleFromDisplayName(displayName) {
  if (typeof displayName !== 'string' || !displayName.startsWith(ROLE_DISPLAY_NAME_PREFIX)) {
    return null;
  }

  const role = displayName.slice(ROLE_DISPLAY_NAME_PREFIX.length);
  return isValidRole(role) ? role : null;
}

function firebaseError(error, fallbackMessage) {
  const responseMessage = error?.response?.data?.error?.message;
  const code = typeof responseMessage === 'string'
    ? responseMessage.split(' : ')[0]
    : undefined;

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

  const friendlyError = new Error(
    (code && messages[code]) ||
      (error instanceof Error ? error.message : fallbackMessage),
  );
  friendlyError.code = code;
  return friendlyError;
}

async function authenticate(mode, email, password) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:${mode}?key=${API_KEY}`;

  try {
    const response = await axios.post(url, {
      email,
      password,
      returnSecureToken: true,
    });

    return {
      token: response.data.idToken,
      userId: response.data.localId,
      email: response.data.email || email,
      displayName: response.data.displayName || '',
    };
  } catch (error) {
    throw firebaseError(error, 'Firebase authentication failed.');
  }
}

function getUserProfileUrl(userId, token) {
  return `${FIREBASE_DATABASE_URL}/userProfiles/${encodeURIComponent(userId)}.json?auth=${encodeURIComponent(token)}`;
}

async function setAccountRole(user, role) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${API_KEY}`;

  try {
    const response = await axios.post(url, {
      idToken: user.token,
      displayName: `${ROLE_DISPLAY_NAME_PREFIX}${role}`,
      returnSecureToken: true,
    });

    return {
      ...user,
      token: response.data.idToken || user.token,
      displayName: response.data.displayName || `${ROLE_DISPLAY_NAME_PREFIX}${role}`,
    };
  } catch (error) {
    throw firebaseError(error, 'Unable to assign the account role.');
  }
}

async function readDatabaseRole(user) {
  try {
    const response = await axios.get(getUserProfileUrl(user.userId, user.token));
    return isValidRole(response.data?.role) ? response.data.role : null;
  } catch {
    return null;
  }
}

async function saveDatabaseProfile(user, role) {
  try {
    await axios.put(getUserProfileUrl(user.userId, user.token), {
      email: user.email,
      role,
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch {
    // Some projects restrict new database paths through Realtime Database rules.
    // The role remains stored in the Firebase Authentication account profile.
    return false;
  }
}

export async function createUser(email, password, role) {
  if (!isValidRole(role)) {
    throw new Error('Please select a valid account role.');
  }

  let user;
  try {
    user = await authenticate('signUp', email, password);
  } catch (error) {
    if (error?.code !== 'EMAIL_EXISTS') throw error;

    // Repair an account that Firebase Auth created during an earlier attempt
    // before its role profile could be saved.
    const existingUser = await authenticate('signInWithPassword', email, password);
    const existingRole =
      (await readDatabaseRole(existingUser)) || roleFromDisplayName(existingUser.displayName);

    if (existingRole) {
      throw new Error('This account already exists. Please sign in instead.');
    }
    user = existingUser;
  }

  const userWithRole = await setAccountRole(user, role);
  await saveDatabaseProfile(userWithRole, role);
  return { ...userWithRole, role };
}

export async function login(email, password) {
  const user = await authenticate('signInWithPassword', email, password);
  const databaseRole = await readDatabaseRole(user);
  const accountRole = roleFromDisplayName(user.displayName);
  const role = databaseRole || accountRole;

  if (!role) {
    throw new Error('This account has no assigned role. Complete account creation again to repair it.');
  }

  if (!databaseRole) {
    await saveDatabaseProfile(user, role);
  }

  return { ...user, role };
}
