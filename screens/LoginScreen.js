import { useState, useContext } from 'react';

import { Alert } from 'react-native';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import { login } from '../util/auth';
import AuthContent from '../components/Auth/AuthContent';
import { AuthContext } from '../store/auth-context';

function LoginScreen() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

   const authCtx = useContext(AuthContext);
  
  async function loginHandler({ email, password }) {
    setIsAuthenticating(true);
     try {
      const authenticatedUser = await login(email, password);
      authCtx.authenticate(authenticatedUser);
    } catch (error) {
      Alert.alert(
        'Authentication failed!',
        error instanceof Error
          ? error.message
          : 'Could not log you in. Please check your credentials or try again later!'
      );
      
    }
    setIsAuthenticating(false);
  }

   if (isAuthenticating) {
    return <LoadingOverlay message="Logging you in..." />;
  }

   return <AuthContent isLogin onAuthenticate={loginHandler} />;
}

export default LoginScreen;
