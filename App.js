import { useContext, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './screens/LoginScreen';  
import SignupScreen from './screens/SignupScreen';
import DashboardScreen from './screens/DashboardScreen';
import AddDeviceScreen from './screens/add-device';
import MyDevicesScreen from './screens/my-devices';
import ReportFaultScreen from './screens/report-fault';
import { Colors } from './constants/styles';
import IconButton from './components/ui/IconButton';
import LoadingOverlay from './components/ui/LoadingOverlay';
import { MedicalSupportProvider } from './context/medical-support';

import AuthContextProvider, { AuthContext } from './store/auth-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary500 },
        headerTintColor: 'white',
        contentStyle: { backgroundColor: Colors.primary100 },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

function AuthenticatedStack() {
  const authCtx = useContext(AuthContext);
  const isDoctor = authCtx.role === 'doctor';

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary500 },
        headerTintColor: 'white',
        contentStyle: { backgroundColor: Colors.primary100 },
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{
          title: 'Medical Support',
          headerRight: ({ tintColor }) => (
            <IconButton
              icon="exit"
              color={tintColor}
              size={24}
              onPress={authCtx.logout}
            />
          ),
        }} 
        />
      <Stack.Screen name="MyDevices" component={MyDevicesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AddDevice" component={AddDeviceScreen} options={{ headerShown: false }} />
      {isDoctor && (
        <Stack.Screen name="ReportFault" component={ReportFaultScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}

function Navigation() {
  const authCtx = useContext(AuthContext);
  return (
 
      <NavigationContainer>
         {!authCtx.isAuthenticated && <AuthStack />}
         {authCtx.isAuthenticated && (
           <MedicalSupportProvider>
             <AuthenticatedStack />
           </MedicalSupportProvider>
         )}
      </NavigationContainer>
    
  )
}

function Root() {
  const [isTryingLogin, setIsTryingLogin] = useState(true);

  const authCtx = useContext(AuthContext);

  useEffect(() => {
    async function fetchToken() {
      const storedSession = await AsyncStorage.getItem('session');
      const legacyToken = await AsyncStorage.getItem('token');

      if (storedSession) {
        try {
          const parsedSession = JSON.parse(storedSession);
          if (parsedSession?.token) {
            authCtx.authenticate(parsedSession);
          }
        } catch {
          await AsyncStorage.removeItem('session');
        }
      } else if (legacyToken) {
        authCtx.authenticate({ token: legacyToken, userId: '', email: '', role: 'doctor' });
      }

      setIsTryingLogin(false);
    }

    fetchToken();
  }, []);

  if (isTryingLogin) {
    return <LoadingOverlay message="Restoring your session..." />;
  }

  return <Navigation />;
}

export default function App() {
  return (
    <>
      <StatusBar style="light" />

     <AuthContextProvider>
        <Root />
      </AuthContextProvider>
    </>
  );
}
