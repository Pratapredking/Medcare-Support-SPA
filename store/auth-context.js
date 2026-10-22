import AsyncStorage from '@react-native-async-storage/async-storage';

import { createContext, useState } from 'react';

export const AuthContext = createContext({
  token: '',
  userId: '',
  email: '',
  role: 'doctor',
  isAuthenticated: false,
  authenticate: (session) => {},
  logout: () => {},
});

function AuthContextProvider({ children }) {
  const [session, setSession] = useState(null);

  function authenticate(nextSession) {
    setSession(nextSession);
    AsyncStorage.setItem('session', JSON.stringify(nextSession));
    AsyncStorage.removeItem('token');
  }

  function logout() {
    setSession(null);
    AsyncStorage.multiRemove(['session', 'token']);
  }

  const value = {
    token: session?.token || '',
    userId: session?.userId || '',
    email: session?.email || '',
    role: session?.role || 'doctor',
    isAuthenticated: !!session?.token,
    authenticate,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContextProvider;
