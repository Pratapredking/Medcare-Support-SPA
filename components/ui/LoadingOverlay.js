import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../constants/styles';

function LoadingOverlay({ message }) {
  return (
    <View style={styles.rootContainer}>
      <Text style={styles.message}>{message}</Text>
      <ActivityIndicator size="large" color={Colors.primary500} />
    </View>
  );
}

export default LoadingOverlay;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.primary100,
  },
  message: {
    color: Colors.primary800,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
});
