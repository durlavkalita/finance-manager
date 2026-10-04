import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { getCurrentMonthKey } from '../domain/monthUtils';
import { WalletRepository } from '../database/repositories/WalletRepository';
import { TransactionRepository } from '../database/repositories/TransactionRepository';
import { calculateWalletPerformance } from '../domain/walletLogic';
import { Wallet, WalletPerformance } from '../domain/types';
import { formatPaiseToINR, parseINRToPaise } from '../domain/currency';

import { MonthPicker } from '../components/MonthPicker';
import { WalletCard } from '../components/WalletCard';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';

export const WalletsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(getCurrentMonthKey());
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showArchived, setShowArchived] = useState<boolean>(false);

  const [activePerformances, setActivePerformances] = useState<WalletPerformance[]>([]);
  const [archivedPerformances, setArchivedPerformances] = useState<WalletPerformance[]>([]);
  const [totalAllocated, setTotalAllocated] = useState<number>(0);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newWalletName, setNewWalletName] = useState<string>('');
  const [newWalletAlloc, setNewWalletAlloc] = useState<string>('');

  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editWalletName, setEditWalletName] = useState<string>('');

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      await WalletRepository.ensureMonthlyAllocations(selectedMonthKey);

      const allWallets = await WalletRepository.getAllWallets(true);
      const allocations = await WalletRepository.getMonthlyAllocations(selectedMonthKey);
      const transactions = await TransactionRepository.getTransactionsByMonth(selectedMonthKey);

      const allocMap = new Map<string, number>();
      let sumAlloc = 0;
      for (const a of allocations) {
        allocMap.set(a.wallet_id, a.allocation_amount);
        sumAlloc += a.allocation_amount;
      }

      setTotalAllocated(sumAlloc);

      const activePerfs: WalletPerformance[] = [];
      const archivedPerfs: WalletPerformance[] = [];

      for (const w of allWallets) {
        const alloc = allocMap.get(w.id) || 0;
        const perf = calculateWalletPerformance(w, alloc, transactions, selectedMonthKey);
        if (w.is_archived) {
          archivedPerfs.push(perf);
        } else {
          activePerfs.push(perf);
        }
      }

      setActivePerformances(activePerfs);
      setArchivedPerformances(archivedPerfs);
    } catch (err) {
      console.error('Error loading wallets screen:', err);
    } finally {
      setRefreshing(false);
    }
  }, [selectedMonthKey]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleCreateWallet = async () => {
    if (!newWalletName.trim()) {
      Alert.alert('Validation Error', 'Please enter a wallet name.');
      return;
    }
    try {
      const allocPaise = parseINRToPaise(newWalletAlloc);
      await WalletRepository.createWallet(newWalletName, selectedMonthKey, allocPaise);
      setNewWalletName('');
      setNewWalletAlloc('');
      setIsAddModalOpen(false);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create wallet.');
    }
  };

  const handleOpenEdit = async (perf: WalletPerformance) => {
    const w = await WalletRepository.getWalletById(perf.walletId);
    if (w) {
      setSelectedWallet(w);
      setEditWalletName(w.name);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveRename = async () => {
    if (!selectedWallet || !editWalletName.trim()) return;
    try {
      await WalletRepository.updateWalletName(selectedWallet.id, editWalletName);
      setIsEditModalOpen(false);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to rename wallet.');
    }
  };

  const handleToggleArchive = async () => {
    if (!selectedWallet) return;
    try {
      const targetState = !selectedWallet.is_archived;
      await WalletRepository.archiveWallet(selectedWallet.id, targetState);
      setIsEditModalOpen(false);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update wallet status.');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} colors={[theme.colors.primaryBlue]} />}
    >
      <MonthPicker currentMonthKey={selectedMonthKey} onMonthChange={setSelectedMonthKey} />

      {/* Budget Summary Card */}
      <Card style={styles.summaryBox}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>Total Monthly Budget</Text>
            <Text style={styles.summaryValue}>{formatPaiseToINR(totalAllocated)}</Text>
          </View>
          <Button
            title="Edit Budget"
            onPress={() => navigation.navigate('AllocationEditor', { monthKey: selectedMonthKey })}
            variant="primary"
            size="sm"
          />
        </View>
      </Card>

      <View style={styles.actionHeader}>
        <Text style={styles.sectionTitle}>ACTIVE WALLETS ({activePerformances.length})</Text>
        <Button
          title="+ Add Wallet"
          onPress={() => setIsAddModalOpen(true)}
          variant="outline"
          size="sm"
        />
      </View>

      {activePerformances.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No active wallets. Tap "+ Add Wallet" to create one.</Text>
        </Card>
      ) : (
        activePerformances.map((perf) => (
          <WalletCard
            key={perf.walletId}
            performance={perf}
            onPress={() => handleOpenEdit(perf)}
          />
        ))
      )}

      {/* Archived Wallets Section */}
      {archivedPerformances.length > 0 ? (
        <View style={styles.archivedSection}>
          <Button
            title={showArchived ? `Hide Archived (${archivedPerformances.length})` : `Show Archived (${archivedPerformances.length})`}
            onPress={() => setShowArchived(!showArchived)}
            variant="ghost"
            size="sm"
            style={styles.archiveToggle}
          />

          {showArchived
            ? archivedPerformances.map((perf) => (
                <WalletCard
                  key={perf.walletId}
                  performance={perf}
                  onPress={() => handleOpenEdit(perf)}
                />
              ))
            : null}
        </View>
      ) : null}

      {/* Add Wallet Modal */}
      <Modal visible={isAddModalOpen} transparent animationType="fade" onRequestClose={() => setIsAddModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create New Wallet</Text>
            <Input
              label="Wallet Name"
              placeholder="e.g. Subscriptions, Gifts, Travel"
              value={newWalletName}
              onChangeText={setNewWalletName}
            />
            <Input
              label={`Allocation for ${selectedMonthKey} (₹ optional)`}
              placeholder="e.g. 5000"
              keyboardType="decimal-pad"
              value={newWalletAlloc}
              onChangeText={setNewWalletAlloc}
            />
            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                onPress={() => setIsAddModalOpen(false)}
                variant="outline"
                style={styles.modalBtn}
              />
              <Button
                title="Save Wallet"
                onPress={handleCreateWallet}
                variant="primary"
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit/Archive Wallet Modal */}
      <Modal visible={isEditModalOpen} transparent animationType="fade" onRequestClose={() => setIsEditModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Manage Wallet</Text>
            <Input
              label="Wallet Name"
              value={editWalletName}
              onChangeText={setEditWalletName}
            />
            <View style={styles.modalBtnRow}>
              <Button
                title={selectedWallet?.is_archived ? 'Unarchive' : 'Archive'}
                onPress={handleToggleArchive}
                variant="danger"
                style={styles.modalBtn}
              />
              <Button
                title="Rename"
                onPress={handleSaveRename}
                variant="primary"
                style={styles.modalBtn}
              />
            </View>
            <Button
              title="Close"
              onPress={() => setIsEditModalOpen(false)}
              variant="ghost"
              size="sm"
              style={{ marginTop: theme.spacing.sm }}
            />
          </View>
        </View>
      </Modal>
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
  summaryBox: {
    backgroundColor: theme.colors.card,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: theme.fontWeight.medium,
  },
  summaryValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primaryBlue,
    marginTop: 2,
  },
  actionHeader: {
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
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  archivedSection: {
    marginTop: theme.spacing.md,
  },
  archiveToggle: {
    alignSelf: 'center',
    marginBottom: theme.spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  modalCard: {
    width: '100%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    elevation: 5,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  modalBtn: {
    flex: 1,
    marginHorizontal: 4,
  },
});
