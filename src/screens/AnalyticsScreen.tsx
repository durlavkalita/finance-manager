import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { getCurrentMonthKey } from '../domain/monthUtils';
import { WalletRepository } from '../database/repositories/WalletRepository';
import { TransactionRepository } from '../database/repositories/TransactionRepository';
import { calculateWalletPerformance, calculateMonthlySummary } from '../domain/walletLogic';
import { WalletPerformance, MonthlySummary } from '../domain/types';
import { formatPaiseToINR } from '../domain/currency';

import { MonthPicker } from '../components/MonthPicker';
import { Card } from '../components/Card';
import { SummaryCard } from '../components/SummaryCard';

export const AnalyticsScreen: React.FC = () => {
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(getCurrentMonthKey());
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [summary, setSummary] = useState<MonthlySummary>({
    monthKey: selectedMonthKey,
    totalIncomePaise: 0,
    totalExpensesPaise: 0,
    netSavingsPaise: 0,
    totalAllocatedPaise: 0,
  });
  const [performances, setPerformances] = useState<WalletPerformance[]>([]);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      await WalletRepository.ensureMonthlyAllocations(selectedMonthKey);
      const allWallets = await WalletRepository.getAllWallets(true);
      const allocations = await WalletRepository.getMonthlyAllocations(selectedMonthKey);
      const transactions = await TransactionRepository.getTransactionsByMonth(selectedMonthKey);

      const allocMap = new Map<string, number>();
      for (const a of allocations) {
        allocMap.set(a.wallet_id, a.allocation_amount);
      }

      const perfList: WalletPerformance[] = allWallets.map((w) => {
        const alloc = allocMap.get(w.id) || 0;
        return calculateWalletPerformance(w, alloc, transactions, selectedMonthKey);
      });

      const monthlySum = calculateMonthlySummary(selectedMonthKey, transactions, allocMap);

      setSummary(monthlySum);
      setPerformances(perfList);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setRefreshing(false);
    }
  }, [selectedMonthKey]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const totalSpentAllWallets = summary.totalExpensesPaise;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} colors={[theme.colors.primaryBlue]} />}
    >
      <MonthPicker currentMonthKey={selectedMonthKey} onMonthChange={setSelectedMonthKey} />

      <Text style={styles.sectionHeaderTitle}>MONTHLY OVERVIEW</Text>
      <SummaryCard summary={summary} />

      {/* Spending Breakdown by Wallet */}
      <Text style={styles.sectionHeaderTitle}>SPENDING BY WALLET</Text>
      <Card>
        {performances.length === 0 || totalSpentAllWallets === 0 ? (
          <Text style={styles.emptyText}>No spending recorded in this month.</Text>
        ) : (
          performances
            .filter((p) => p.spentPaise > 0)
            .sort((a, b) => b.spentPaise - a.spentPaise)
            .map((p) => {
              const pct = Math.round((p.spentPaise / totalSpentAllWallets) * 100);
              return (
                <View key={p.walletId} style={styles.breakdownRow}>
                  <View style={styles.breakdownLabelRow}>
                    <Text style={styles.breakdownName}>{p.walletName}</Text>
                    <Text style={styles.breakdownAmount}>
                      {formatPaiseToINR(p.spentPaise)} ({pct}%)
                    </Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct}%` }]} />
                  </View>
                </View>
              );
            })
        )}
      </Card>

      {/* Budget vs Actual Table */}
      <Text style={styles.sectionHeaderTitle}>BUDGET VS ACTUAL PERFORMANCE</Text>
      <Card style={{ paddingHorizontal: 0 }}>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 1.5 }]}>Wallet</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Budget</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Spent</Text>
          <Text style={[styles.th, { flex: 1.2, textAlign: 'right' }]}>Status</Text>
        </View>

        {performances.map((p) => (
          <View key={p.walletId} style={styles.tableRow}>
            <Text style={[styles.tdName, { flex: 1.5 }]} numberOfLines={1}>
              {p.walletName}
            </Text>
            <Text style={[styles.td, { flex: 1 }]}>{formatPaiseToINR(p.effectiveAllocationPaise)}</Text>
            <Text style={[styles.td, { flex: 1 }]}>{formatPaiseToINR(p.spentPaise)}</Text>
            <Text
              style={[
                styles.tdStatus,
                { flex: 1.2 },
                p.isOverspent ? styles.statusOverspent : styles.statusUnder,
              ]}
              numberOfLines={1}
            >
              {p.isOverspent
                ? `-${formatPaiseToINR(p.overspentPaise)}`
                : `${formatPaiseToINR(p.remainingPaise)}`}
            </Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  sectionHeaderTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingVertical: theme.spacing.sm,
  },
  breakdownRow: {
    marginBottom: theme.spacing.md,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  breakdownName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  breakdownAmount: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textMuted,
  },
  barTrack: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: theme.colors.primaryBlue,
    borderRadius: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  th: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  tdName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  td: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  tdStatus: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    textAlign: 'right',
  },
  statusOverspent: {
    color: theme.colors.expense,
  },
  statusUnder: {
    color: theme.colors.income,
  },
});
