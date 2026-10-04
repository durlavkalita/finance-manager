import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { theme } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  disabled = false,
  loading = false,
}) => {
  const getContainerStyle = () => {
    const baseStyle = [styles.button, styles[`btn_${size}`]];
    if (disabled) return [...baseStyle, styles.btn_disabled];

    switch (variant) {
      case 'secondary':
        return [...baseStyle, styles.btn_secondary];
      case 'danger':
        return [...baseStyle, styles.btn_danger];
      case 'outline':
        return [...baseStyle, styles.btn_outline];
      case 'ghost':
        return [...baseStyle, styles.btn_ghost];
      case 'primary':
      default:
        return [...baseStyle, styles.btn_primary];
    }
  };

  const getTextStyle = () => {
    const baseText = [styles.text, styles[`text_${size}`]];
    if (disabled) return [...baseText, styles.text_disabled];

    switch (variant) {
      case 'secondary':
        return [...baseText, styles.text_secondary];
      case 'danger':
        return [...baseText, styles.text_danger];
      case 'outline':
        return [...baseText, styles.text_outline];
      case 'ghost':
        return [...baseText, styles.text_ghost];
      case 'primary':
      default:
        return [...baseText, styles.text_primary];
    }
  };

  return (
    <TouchableOpacity
      style={[getContainerStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? theme.colors.primaryBlue : '#FFF'} />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btn_sm: {
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.sm + 4,
  },
  btn_md: {
    paddingVertical: theme.spacing.sm + 4,
    paddingHorizontal: theme.spacing.md,
  },
  btn_lg: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  btn_primary: {
    backgroundColor: theme.colors.primaryBlue,
  },
  btn_secondary: {
    backgroundColor: theme.colors.primary,
  },
  btn_danger: {
    backgroundColor: theme.colors.expense,
  },
  btn_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
  },
  btn_ghost: {
    backgroundColor: 'transparent',
  },
  btn_disabled: {
    backgroundColor: theme.colors.border,
  },
  text: {
    fontWeight: theme.fontWeight.semibold,
  },
  text_sm: {
    fontSize: theme.fontSize.sm,
  },
  text_md: {
    fontSize: theme.fontSize.md,
  },
  text_lg: {
    fontSize: theme.fontSize.lg,
  },
  text_primary: {
    color: '#FFFFFF',
  },
  text_secondary: {
    color: '#FFFFFF',
  },
  text_danger: {
    color: '#FFFFFF',
  },
  text_outline: {
    color: theme.colors.text,
  },
  text_ghost: {
    color: theme.colors.primaryBlue,
  },
  text_disabled: {
    color: theme.colors.textLight,
  },
});
