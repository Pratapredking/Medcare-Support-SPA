import { View, Text, TextInput, StyleSheet } from 'react-native';

import { Colors } from '../../constants/styles';

function Input({
  label,
  keyboardType,
  secure,
  onUpdateValue,
  value,
  isInvalid,
}) {
  return (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, isInvalid && styles.labelInvalid]}>
        {label}
      </Text>
      <TextInput
        style={[styles.input, isInvalid && styles.inputInvalid]}
        autoCapitalize="none"
        keyboardType={keyboardType}
        secureTextEntry={secure}
        onChangeText={onUpdateValue}
        value={value}
      />
    </View>
  );
}

export default Input;

const styles = StyleSheet.create({
  inputContainer: {
    marginVertical: 8,
  },
  label: {
    color: Colors.primary800,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 7,
  },
  labelInvalid: {
    color: Colors.error500,
  },
  input: {
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    color: Colors.primary800,
    fontSize: 16,
  },
  inputInvalid: {
    backgroundColor: Colors.error100,
    borderColor: Colors.error500,
  },
});
