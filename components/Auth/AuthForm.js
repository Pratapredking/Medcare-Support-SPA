import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '../ui/Button';
import Input from './Input';

function AuthForm({ isLogin, onSubmit, credentialsInvalid }) {
  const [enteredEmail, setEnteredEmail] = useState('');
  const [enteredConfirmEmail, setEnteredConfirmEmail] = useState('');
  const [enteredPassword, setEnteredPassword] = useState('');
  const [enteredConfirmPassword, setEnteredConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('doctor');

  const {
    email: emailIsInvalid,
    confirmEmail: emailsDontMatch,
    password: passwordIsInvalid,
    confirmPassword: passwordsDontMatch,
  } = credentialsInvalid;

  function updateInputValueHandler(inputType, enteredValue) {
    switch (inputType) {
      case 'email':
        setEnteredEmail(enteredValue);
        break;
      case 'confirmEmail':
        setEnteredConfirmEmail(enteredValue);
        break;
      case 'password':
        setEnteredPassword(enteredValue);
        break;
      case 'confirmPassword':
        setEnteredConfirmPassword(enteredValue);
        break;
    }
  }

  function submitHandler() {
    onSubmit({
      email: enteredEmail,
      confirmEmail: enteredConfirmEmail,
      password: enteredPassword,
      confirmPassword: enteredConfirmPassword,
      ...(!isLogin && { role: selectedRole }),
    });
  }

  return (
    <View style={styles.form}>
      <View>
        <Input
          label="Email Address"
          onUpdateValue={updateInputValueHandler.bind(this, 'email')}
          value={enteredEmail}
          keyboardType="email-address"
          isInvalid={emailIsInvalid}
        />
        {!isLogin && (
          <Input
            label="Confirm Email Address"
            onUpdateValue={updateInputValueHandler.bind(this, 'confirmEmail')}
            value={enteredConfirmEmail}
            keyboardType="email-address"
            isInvalid={emailsDontMatch}
          />
        )}
        <Input
          label="Password"
          onUpdateValue={updateInputValueHandler.bind(this, 'password')}
          secure
          value={enteredPassword}
          isInvalid={passwordIsInvalid}
        />
        {!isLogin && (
          <Input
            label="Confirm Password"
            onUpdateValue={updateInputValueHandler.bind(
              this,
              'confirmPassword'
            )}
            secure
            value={enteredConfirmPassword}
            isInvalid={passwordsDontMatch}
          />
        )}
        {!isLogin && (
          <>
            <Text style={styles.roleLabel}>Account role</Text>
            <View style={styles.roleOptions}>
              {['doctor', 'technician'].map((role) => {
                const selected = selectedRole === role;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={role}
                    onPress={() => setSelectedRole(role)}
                    style={[styles.roleOption, selected && styles.roleOptionSelected]}
                  >
                    <Text style={[styles.roleText, selected && styles.roleTextSelected]}>
                      {role === 'doctor' ? 'Doctor' : 'Technician'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
        <View style={styles.buttons}>
          <Button onPress={submitHandler}>
            {isLogin ? 'Log In' : 'Sign Up'}
          </Button>
        </View>
      </View>
    </View>
  );
}

export default AuthForm;

const styles = StyleSheet.create({
  roleLabel: {
    color: '#174F38',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 7,
  },
  roleOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  roleOption: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D6E5DB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  roleOptionSelected: {
    borderColor: '#277B55',
    backgroundColor: '#EAF7EE',
  },
  roleText: {
    color: '#657F6F',
    fontWeight: '700',
  },
  roleTextSelected: {
    color: '#277B55',
  },
  buttons: {
    marginTop: 12,
  },
});
