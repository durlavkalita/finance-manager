import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { formatMonthKeyDisplay, getPreviousMonthKey, getNextMonthKey } from '../domain/monthUtils';

interface MonthPickerProps {
  currentMonthKey: string;
  onMonthChange: (newMonthKey: string) => void;
}

export const MonthPicker: React.FC<MonthPickerProps> = ({ currentMonthKey, onMonthChange }) => {
  const handlePrev = () => {
    onMonthChange(getPreviousMonthKey(currentMonthKey));
  };

  const handleNext = () => {
    onMonthChange(getNextMonthKey(currentMonthKey));
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.navButton} onPress={handlePrev} activeOpacity={0.7}>
        <Text style={styles.navText}>‹</Text>
      </TouchableOpacity>

      <View style={styles.monthBox}>
        <Text style={styles.monthText}>{formatMonthKeyDisplay(currentMonthKey)}</Text>
      </View>

      <TouchableOpacity style={styles.navButton} onPress={handleNext} activeOpacity={0.7}>
        <Text style={styles.navText}>›</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs + 2,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 22,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primaryBlue,
    marginTop: -2,
  },
  monthBox: {
    alignItems: 'center',
  },
  monthText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
});
