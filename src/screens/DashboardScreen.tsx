import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { getCurrentMonthKey } from '../domain/monthUtils';
import { WalletRepository } from '../database/repositories/WalletRepository';
import { TransactionRepository } from '../database/repositories/TransactionRepository';
import { calculateWalletPerformance, calculateMonthlySummary } from '../domain/walletLogic';
import { Wallet, Transaction, WalletPerformance, MonthlySummary } from '../domain/types';

import { MonthPicker } from '../components/MonthPicker';
import { SummaryCard } from '../components/SummaryCard';
import { WalletCard } from '../components/WalletCard';
import { TransactionItem } from '../components/TransactionItem';
import { Button } from '../components/Button';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(getCurrentMonthKey());
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [performances, setPerformances] = useState<WalletPerformance[]>([]);
  const [summary, setSummary] = useState<MonthlySummary>({
    monthKey: selectedMonthKey,
    totalIncomePaise: 0,
    totalExpensesPaise: 0,
    netSavingsPaise: 0,
    totalAllocatedPaise: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      // Ensure monthly allocations exist for the selected month
      await WalletRepository.ensureMonthlyAllocations(selectedMonthKey);

      const allWallets = await WalletRepository.getAllWallets(false);
      const allocations = await WalletRepository.getMonthlyAllocations(selectedMonthKey);
      const transactions = await TransactionRepository.getTransactionsByMonth(selectedMonthKey);

      const allocMap = new Map<string, number>();
      for (const a of allocations) {
        allocMap.set(a.wallet_id, a.allocation_amount);
      }

      // Calculate performance per active wallet
      const perfList: WalletPerformance[] = allWallets.map((w) => {
        const alloc = allocMap.get(w.id) || 0;
        return calculateWalletPerformance(w, alloc, transactions, selectedMonthKey);
      });

      // Calculate monthly summary
      const monthlySum = calculateMonthlySummary(selectedMonthKey, transactions, allocMap);

      setWallets(allWallets);
      setPerformances(perfList);
      setSummary(monthlySum);
      setRecentTransactions(transactions.slice(0, 5)); // top 5 recent
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setRefreshing(false);
    }
  }, [selectedMonthKey]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const walletNameMap = new Map<string, string>();
  for (const w of wallets) {
    walletNameMap.set(w.id, w.name);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} colors={[theme.colors.primaryBlue]} />}
    >
      <MonthPicker currentMonthKey={selectedMonthKey} onMonthChange={setSelectedMonthKey} />

      <SummaryCard summary={summary} />

      {/* Quick Action Buttons */}
      <View style={styles.actionRow}>
        <Button
          title="+ Expense"
          onPress={() => navigation.navigate('TransactionForm', { type: 'EXPENSE', monthKey: selectedMonthKey })}
          variant="danger"
          size="sm"
          style={styles.actionBtn}
        />
        <Button
          title="+ Income"
          onPress={() => navigation.navigate('TransactionForm', { type: 'INCOME', monthKey: selectedMonthKey })}
          variant="primary"
          size="sm"
          style={styles.actionBtn}
        />
        <Button
          title="⇄ Transfer"
          onPress={() => navigation.navigate('TransactionForm', { type: 'TRANSFER', monthKey: selectedMonthKey })}
          variant="outline"
          size="sm"
          style={styles.actionBtn}
        />
      </View>

      {/* Wallet Status Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>YOUR WALLETS</Text>
        <Button
          title="Manage"
          onPress={() => navigation.navigate('WalletsTab')}
          variant="ghost"
          size="sm"
        />
      </View>

      {performances.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No active wallets found for this month.</Text>
        </View>
      ) : (
        performances.map((perf) => (
          <WalletCard
            key={perf.walletId}
            performance={perf}
            onPress={() => navigation.navigate('TransactionsTab', { walletId: perf.walletId, monthKey: selectedMonthKey })}
          />
        ))
      )}

      {/* Recent Transactions Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>RECENT TRANSACTIONS</Text>
        <Button
          title="See All"
          onPress={() => navigation.navigate('TransactionsTab', { monthKey: selectedMonthKey })}
          variant="ghost"
          size="sm"
        />
      </View>

      {recentTransactions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No transactions recorded in this month yet.</Text>
        </View>
      ) : (
        recentTransactions.map((tx) => (
          <TransactionItem
            key={tx.id}
            transaction={tx}
            walletName={tx.wallet_id ? walletNameMap.get(tx.wallet_id) : 'General'}
            toWalletName={tx.to_wallet_id ? walletNameMap.get(tx.to_wallet_id) : undefined}
            onPress={() => navigation.navigate('TransactionForm', { transactionId: tx.id })}
          />
        ))
      )}
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  actionBtn: {
    flex: 1,
    marginHorizontal: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
  },
  emptyCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
});
