import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export const PALETTE = {
  page: '#EAF7EE',
  primary: '#277B55',
  heading: '#204E36',
  text: '#657F6F',
  border: '#D6E5DB',
  white: '#FFFFFF',
};

export function ActionButton({
  title,
  onPress,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, disabled && styles.disabled, pressed && styles.pressed]}>
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

export function PageHeader({
  title,
  subtitle,
  onBack,
  trailing,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerSide}>
        {onBack ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.headerCopy}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={[styles.headerSide, styles.trailing]}>{trailing}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    marginTop: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.primary,
  },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.55 },
  buttonText: { color: PALETTE.white, fontSize: 15, fontWeight: '800' },
  header: {
    minHeight: 66,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
    backgroundColor: PALETTE.white,
  },
  headerSide: { width: 54, alignItems: 'flex-start' },
  trailing: { alignItems: 'flex-end' },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { color: PALETTE.heading, fontSize: 34, lineHeight: 38 },
  headerCopy: { flex: 1, alignItems: 'center' },
  headerTitle: { color: PALETTE.heading, fontSize: 16, fontWeight: '900' },
  headerSubtitle: { color: PALETTE.text, fontSize: 10, marginTop: 3 },
});
