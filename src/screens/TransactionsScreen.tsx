import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../theme';
import { getCurrentMonthKey } from '../domain/monthUtils';
import { TransactionRepository } from '../database/repositories/TransactionRepository';
import { WalletRepository } from '../database/repositories/WalletRepository';
import { Transaction, TransactionType, Wallet } from '../domain/types';

import { MonthPicker } from '../components/MonthPicker';
import { TransactionItem } from '../components/TransactionItem';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export const TransactionsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(route.params?.monthKey || getCurrentMonthKey());
  const [selectedType, setSelectedType] = useState<TransactionType | 'ALL'>('ALL');
  const [selectedWalletId, setSelectedWalletId] = useState<string>(route.params?.walletId || 'ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const allWallets = await WalletRepository.getAllWallets(true);
      setWallets(allWallets);

      const filterType = selectedType === 'ALL' ? undefined : selectedType;
      const filterWallet = selectedWalletId === 'ALL' ? undefined : selectedWalletId;

      const list = await TransactionRepository.getAllTransactions({
        monthKey: selectedMonthKey,
        type: filterType,
        walletId: filterWallet,
        search: searchQuery,
      });

      setTransactions(list);
    } catch (err) {
      console.error('Error loading transaction history:', err);
    } finally {
      setRefreshing(false);
    }
  }, [selectedMonthKey, selectedType, selectedWalletId, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const walletMap = new Map<string, string>();
  for (const w of wallets) {
    walletMap.set(w.id, w.name);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} colors={[theme.colors.primaryBlue]} />}
    >
      <MonthPicker currentMonthKey={selectedMonthKey} onMonthChange={setSelectedMonthKey} />

      {/* Search Input */}
      <Input
        placeholder="Search transactions by title or merchant..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        containerStyle={styles.searchContainer}
      />

      {/* Type Filters */}
      <View style={styles.filterRow}>
        {(['ALL', 'EXPENSE', 'INCOME', 'TRANSFER'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.filterChip, selectedType === t ? styles.filterChipActive : null]}
            onPress={() => setSelectedType(t)}
          >
            <Text style={[styles.filterText, selectedType === t ? styles.filterTextActive : null]}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Wallet Filters Scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletScroll}>
        <TouchableOpacity
          style={[styles.walletChip, selectedWalletId === 'ALL' ? styles.walletChipActive : null]}
          onPress={() => setSelectedWalletId('ALL')}
        >
          <Text style={[styles.walletChipText, selectedWalletId === 'ALL' ? styles.walletChipTextActive : null]}>
            All Wallets
          </Text>
        </TouchableOpacity>

        {wallets.filter(w => !w.is_archived).map((w) => (
          <TouchableOpacity
            key={w.id}
            style={[styles.walletChip, selectedWalletId === w.id ? styles.walletChipActive : null]}
            onPress={() => setSelectedWalletId(w.id)}
          >
            <Text style={[styles.walletChipText, selectedWalletId === w.id ? styles.walletChipTextActive : null]}>
              {w.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Header with Count & Add Button */}
      <View style={styles.listHeader}>
        <Text style={styles.countText}>{transactions.length} Transactions</Text>
        <Button
          title="+ Add Transaction"
          onPress={() => navigation.navigate('TransactionForm', { monthKey: selectedMonthKey })}
          variant="primary"
          size="sm"
        />
      </View>

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No matching transactions found.</Text>
        </Card>
      ) : (
        transactions.map((tx) => (
          <TransactionItem
            key={tx.id}
            transaction={tx}
            walletName={tx.wallet_id ? walletMap.get(tx.wallet_id) : 'General'}
            toWalletName={tx.to_wallet_id ? walletMap.get(tx.to_wallet_id) : undefined}
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
  searchContainer: {
    marginBottom: theme.spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.sm + 4,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textMuted,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  walletScroll: {
    marginBottom: theme.spacing.md,
  },
  walletChip: {
    paddingHorizontal: theme.spacing.sm + 4,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 6,
  },
  walletChipActive: {
    backgroundColor: theme.colors.primaryBlue,
    borderColor: theme.colors.primaryBlue,
  },
  walletChipText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  walletChipTextActive: {
    color: '#FFFFFF',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  countText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textMuted,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
});
