import React from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import { theme } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({ label, error, containerStyle, style, ...rest }) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={theme.colors.textLight}
        {...rest}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm + 2,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  inputError: {
    borderColor: theme.colors.expense,
  },
  errorText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.expense,
    marginTop: theme.spacing.xs,
  },
});
