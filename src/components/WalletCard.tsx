import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { WalletPerformance } from '../domain/types';
import { formatPaiseToINR } from '../domain/currency';

interface WalletCardProps {
  performance: WalletPerformance;
  onPress?: () => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({ performance, onPress }) => {
  const {
    walletName,
    allocatedPaise,
    spentPaise,
    effectiveAllocationPaise,
    remainingPaise,
    isOverspent,
    transfersInPaise,
    transfersOutPaise,
    isArchived,
  } = performance;

  const progressPercent =
    effectiveAllocationPaise > 0
      ? Math.min(100, Math.max(0, (spentPaise / effectiveAllocationPaise) * 100))
      : spentPaise > 0
      ? 100
      : 0;

  return (
    <TouchableOpacity
      style={[styles.card, isOverspent ? styles.cardOverspent : null]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.walletName}>{walletName}</Text>
          {isArchived ? (
            <View style={styles.archivedBadge}>
              <Text style={styles.archivedText}>Archived</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.balanceContainer}>
          <Text style={[styles.remainingAmount, isOverspent ? styles.negativeText : styles.positiveText]}>
            {formatPaiseToINR(remainingPaise)}
          </Text>
          <Text style={styles.remainingLabel}>{isOverspent ? 'overspent' : 'remaining'}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progressPercent}%`,
              backgroundColor: isOverspent ? theme.colors.expense : theme.colors.primaryBlue,
            },
          ]}
        />
      </View>

      {/* Detail row */}
      <View style={styles.footerRow}>
        <Text style={styles.spentText}>
          {formatPaiseToINR(spentPaise)} / {formatPaiseToINR(effectiveAllocationPaise)} spent
        </Text>

        {transfersInPaise > 0 || transfersOutPaise > 0 ? (
          <Text style={styles.transferInfoText}>
            {transfersInPaise > 0 ? `+${formatPaiseToINR(transfersInPaise)} tx` : ''}
            {transfersInPaise > 0 && transfersOutPaise > 0 ? ' | ' : ''}
            {transfersOutPaise > 0 ? `-${formatPaiseToINR(transfersOutPaise)} tx` : ''}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardOverspent: {
    borderColor: theme.colors.expense,
    backgroundColor: '#FFFDFD',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  archivedBadge: {
    backgroundColor: theme.colors.border,
    paddingHorizontal: theme.spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.xs,
  },
  archivedText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  remainingAmount: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  positiveText: {
    color: theme.colors.income,
  },
  negativeText: {
    color: theme.colors.expense,
  },
  remainingLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  progressTrack: {
    height: 8,
    backgroundColor: theme.colors.progressBg,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: theme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  spentText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  transferInfoText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.transfer,
    fontWeight: theme.fontWeight.medium,
  },
});
