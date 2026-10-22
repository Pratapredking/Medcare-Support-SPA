import { useState , useContext} from 'react';
import { Alert } from 'react-native';
import AuthContent from '../components/Auth/AuthContent';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import { AuthContext } from '../store/auth-context';
import { createUser } from '../util/auth';


function SignupScreen() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

   const authCtx = useContext(AuthContext);

  async function signupHandler({ email, password, role }) {
    setIsAuthenticating(true);
     try {
      const authenticatedUser = await createUser(email, password, role);
      authCtx.authenticate(authenticatedUser);
    } catch (error) {
      Alert.alert(
        'Authentication failed',
        error instanceof Error
          ? error.message
          : 'Could not create user. Please check your input and try again.'
      );
      
    }
    setIsAuthenticating(false);
  }

  if (isAuthenticating) {
    return <LoadingOverlay message="Creating user..." />;
  }

  return <AuthContent onAuthenticate={signupHandler} />;
}

export default SignupScreen;
