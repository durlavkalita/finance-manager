import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { MonthlySummary } from '../domain/types';
import { formatPaiseToINR } from '../domain/currency';

interface SummaryCardProps {
  summary: MonthlySummary;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary }) => {
  const { totalIncomePaise, totalExpensesPaise, netSavingsPaise } = summary;

  return (
    <View style={styles.card}>
      <View style={styles.col}>
        <Text style={styles.label}>Income</Text>
        <Text style={[styles.amount, styles.incomeText]}>{formatPaiseToINR(totalIncomePaise)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.col}>
        <Text style={styles.label}>Expenses</Text>
        <Text style={[styles.amount, styles.expenseText]}>{formatPaiseToINR(totalExpensesPaise)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.col}>
        <Text style={styles.label}>Net</Text>
        <Text
          style={[
            styles.amount,
            netSavingsPaise >= 0 ? styles.incomeText : styles.expenseText,
          ]}
        >
          {formatPaiseToINR(netSavingsPaise)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md + 2,
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  col: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: '70%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  label: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
    textTransform: 'uppercase',
    fontWeight: theme.fontWeight.medium,
    marginBottom: 4,
  },
  amount: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  incomeText: {
    color: '#34D399',
  },
  expenseText: {
    color: '#F87171',
  },
});
