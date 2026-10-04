import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { Transaction } from '../domain/types';
import { formatPaiseToINR } from '../domain/currency';
import { getTodayISODate } from '../domain/monthUtils';

interface TransactionItemProps {
  transaction: Transaction;
  walletName?: string;
  toWalletName?: string;
  onPress?: () => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  walletName = 'Unassigned',
  toWalletName = 'Unassigned',
  onPress,
}) => {
  const { type, amount, date, description, merchant } = transaction;

  const getFormattedDate = (dateStr: string) => {
    const today = getTodayISODate();
    if (dateStr === today) return 'Today';

    const yesterdayObj = new Date();
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterday = yesterdayObj.toISOString().split('T')[0];
    if (dateStr === yesterday) return 'Yesterday';

    return dateStr;
  };

  const title = description || merchant || (type === 'INCOME' ? 'Income' : type === 'TRANSFER' ? 'Transfer' : walletName);

  let subtitle = '';
  if (type === 'INCOME') {
    subtitle = merchant ? `Source: ${merchant}` : 'Income';
  } else if (type === 'TRANSFER') {
    subtitle = `${walletName} → ${toWalletName}`;
  } else {
    subtitle = merchant ? `${walletName} • ${merchant}` : walletName;
  }

  let amountStr = '';
  let amountStyle = styles.amountExpense;
  let badgeBg = theme.colors.expenseBg;
  let badgeText = 'EXPENSE';

  if (type === 'INCOME') {
    amountStr = `+${formatPaiseToINR(amount)}`;
    amountStyle = styles.amountIncome;
    badgeBg = theme.colors.incomeBg;
    badgeText = 'INCOME';
  } else if (type === 'TRANSFER') {
    amountStr = `${formatPaiseToINR(amount)}`;
    amountStyle = styles.amountTransfer;
    badgeBg = theme.colors.transferBg;
    badgeText = 'TRANSFER';
  } else {
    amountStr = `-${formatPaiseToINR(amount)}`;
    amountStyle = styles.amountExpense;
    badgeBg = theme.colors.expenseBg;
    badgeText = walletName.toUpperCase();
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <View style={styles.leftCol}>
        <View style={[styles.typeBadge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, type === 'INCOME' ? styles.textIncome : type === 'TRANSFER' ? styles.textTransfer : styles.textExpense]}>
            {type === 'TRANSFER' ? '⇄' : type === 'INCOME' ? '+' : '—'}
          </Text>
        </View>

        <View style={styles.textGroup}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle} • {getFormattedDate(date)}
          </Text>
        </View>
      </View>

      <View style={styles.rightCol}>
        <Text style={[styles.amount, amountStyle]}>{amountStr}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xs + 2,
    borderRadius: theme.borderRadius.sm + 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  typeBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm + 2,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: theme.fontWeight.bold,
  },
  textIncome: {
    color: theme.colors.income,
  },
  textExpense: {
    color: theme.colors.expense,
  },
  textTransfer: {
    color: theme.colors.transfer,
  },
  textGroup: {
    flex: 1,
  },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  amountIncome: {
    color: theme.colors.income,
  },
  amountExpense: {
    color: theme.colors.expense,
  },
  amountTransfer: {
    color: theme.colors.transfer,
  },
});
