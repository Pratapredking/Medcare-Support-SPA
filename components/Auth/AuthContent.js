import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import FlatButton from '../ui/FlatButton';
import AuthForm from './AuthForm';
import { Colors } from '../../constants/styles';

function AuthContent({ isLogin, onAuthenticate }) {
  const navigation = useNavigation();

  const [credentialsInvalid, setCredentialsInvalid] = useState({
    email: false,
    password: false,
    confirmEmail: false,
    confirmPassword: false,
  });

  function switchAuthModeHandler() {
       if (isLogin) {
      navigation.replace('Signup');
    } else {
      navigation.replace('Login');
    }
  }

  function submitHandler(credentials) {
    let { email, confirmEmail, password, confirmPassword, role } = credentials;

    email = email.trim();
    password = password.trim();

    const emailIsValid = email.includes('@');
    const passwordIsValid = password.length > 6;
    const emailsAreEqual = email === confirmEmail;
    const passwordsAreEqual = password === confirmPassword;

    if (
      !emailIsValid ||
      !passwordIsValid ||
      (!isLogin && (!emailsAreEqual || !passwordsAreEqual))
    ) {
      Alert.alert('Invalid input', 'Please check your entered credentials.');
      setCredentialsInvalid({
        email: !emailIsValid,
        confirmEmail: !emailIsValid || !emailsAreEqual,
        password: !passwordIsValid,
        confirmPassword: !passwordIsValid || !passwordsAreEqual,
      });
      return;
    }
    onAuthenticate({ email, password, ...(!isLogin && { role }) });
  }

  return (
    <View style={styles.authContent}>
      <Text style={styles.eyebrow}>MEDICAL SUPPORT</Text>
      <Text style={styles.title}>{isLogin ? 'Welcome back' : 'Create your account'}</Text>
      <Text style={styles.subtitle}>
        {isLogin ? 'Sign in to access your assigned workspace.' : 'Enter your details and choose your role.'}
      </Text>
      <AuthForm
        isLogin={isLogin}
        onSubmit={submitHandler}
        credentialsInvalid={credentialsInvalid}
      />
      <View style={styles.buttons}>
        <FlatButton onPress={switchAuthModeHandler}>
          {isLogin ? 'Create a new user' : 'Log in instead'}
        </FlatButton>
      </View>
    </View>
  );
}

export default AuthContent;

const styles = StyleSheet.create({
  authContent: {
    marginTop: 64,
    marginHorizontal: 24,
    padding: 22,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    elevation: 3,
    shadowColor: Colors.primary800,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  eyebrow: {
    color: Colors.primary500,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  title: {
    color: Colors.primary800,
    fontSize: 27,
    fontWeight: '900',
    marginTop: 5,
  },
  subtitle: {
    color: Colors.text,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 12,
  },
  buttons: {
    marginTop: 10,
  },
});
