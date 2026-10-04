import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { formatMonthKeyDisplay, getCurrentMonthKey } from '../domain/monthUtils';
import { WalletRepository } from '../database/repositories/WalletRepository';
import { Wallet } from '../domain/types';
import { formatPaiseToINR, parseINRToPaise, paiseToInputString } from '../domain/currency';

import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

export const AllocationEditorScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const monthKey: string = route.params?.monthKey || getCurrentMonthKey();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [allocationInputs, setAllocationInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, [monthKey]);

  const loadData = async () => {
    setLoading(true);
    try {
      await WalletRepository.ensureMonthlyAllocations(monthKey);
      const activeWallets = await WalletRepository.getAllWallets(false);
      const allocations = await WalletRepository.getMonthlyAllocations(monthKey);

      const allocMap = new Map<string, number>();
      for (const a of allocations) {
        allocMap.set(a.wallet_id, a.allocation_amount);
      }

      const inputState: Record<string, string> = {};
      for (const w of activeWallets) {
        const paise = allocMap.get(w.id) || 0;
        inputState[w.id] = paiseToInputString(paise);
      }

      setWallets(activeWallets);
      setAllocationInputs(inputState);
    } catch (err) {
      console.error('Failed to load allocation data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (walletId: string, val: string) => {
    setAllocationInputs((prev) => ({
      ...prev,
      [walletId]: val,
    }));
  };

  // Calculate live total sum
  let totalPaise = 0;
  for (const w of wallets) {
    const valStr = allocationInputs[w.id] || '0';
    totalPaise += parseINRToPaise(valStr);
  }

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      for (const w of wallets) {
        const valStr = allocationInputs[w.id] || '0';
        const paise = parseINRToPaise(valStr);
        await WalletRepository.setMonthlyAllocation(w.id, monthKey, paise);
      }
      Alert.alert('Success', `Updated wallet budget for ${formatMonthKeyDisplay(monthKey)}.`);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save budget allocation.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.monthTitle}>{formatMonthKeyDisplay(monthKey)} Budget</Text>
          <Text style={styles.subtitle}>Set your monthly category allocations</Text>
        </View>

        {wallets.map((w) => (
          <Card key={w.id} style={styles.walletRow}>
            <Text style={styles.walletName}>{w.name}</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencySymbol}>₹</Text>
              <Input
                value={allocationInputs[w.id] || ''}
                onChangeText={(text) => handleInputChange(w.id, text)}
                placeholder="0"
                keyboardType="numeric"
                containerStyle={styles.inputContainer}
                style={styles.inputStyle}
              />
            </View>
          </Card>
        ))}

        {/* Total Summary Footer Card */}
        <Card style={styles.totalCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Budget</Text>
            <Text style={styles.totalValue}>{formatPaiseToINR(totalPaise)}</Text>
          </View>
        </Card>

        <Button
          title="Save Budget"
          onPress={handleSaveAll}
          variant="primary"
          size="lg"
          loading={saving}
          style={styles.saveBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  monthTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  walletName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 140,
  },
  currencySymbol: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textMuted,
    marginRight: 4,
  },
  inputContainer: {
    flex: 1,
    marginBottom: 0,
  },
  inputStyle: {
    textAlign: 'right',
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.md,
  },
  totalCard: {
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textLight,
  },
  totalValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: '#34D399',
  },
  saveBtn: {
    marginTop: theme.spacing.md,
  },
});
