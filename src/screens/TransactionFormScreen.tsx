import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { TransactionType, Wallet } from '../domain/types';
import { WalletRepository } from '../database/repositories/WalletRepository';
import { TransactionRepository } from '../database/repositories/TransactionRepository';
import { parseINRToPaise, paiseToInputString } from '../domain/currency';
import { getTodayISODate, isValidISODate, getMonthKeyFromDate } from '../domain/monthUtils';

import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export const TransactionFormScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const transactionId: string | undefined = route.params?.transactionId;
  const initialType: TransactionType = route.params?.type || 'EXPENSE';
  const initialMonthKey: string = route.params?.monthKey;

  const [type, setType] = useState<TransactionType>(initialType);
  const [amountInput, setAmountInput] = useState<string>('');
  const [dateInput, setDateInput] = useState<string>(getTodayISODate());
  const [walletId, setWalletId] = useState<string>('');
  const [toWalletId, setToWalletId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    loadWalletsAndTransaction();
  }, [transactionId]);

  const loadWalletsAndTransaction = async () => {
    setLoading(true);
    try {
      const allWallets = await WalletRepository.getAllWallets(true); // include archived so past tx display correctly
      const activeWallets = allWallets.filter((w) => !w.is_archived);
      setWallets(allWallets);

      if (activeWallets.length > 0) {
        setWalletId(activeWallets[0].id);
        if (activeWallets.length > 1) {
          setToWalletId(activeWallets[1].id);
        }
      }

      if (transactionId) {
        const tx = await TransactionRepository.getTransactionById(transactionId);
        if (tx) {
          setType(tx.type);
          setAmountInput(paiseToInputString(tx.amount));
          setDateInput(tx.date);
          if (tx.wallet_id) setWalletId(tx.wallet_id);
          if (tx.to_wallet_id) setToWalletId(tx.to_wallet_id);
          if (tx.description) setDescription(tx.description);
          if (tx.merchant) setMerchant(tx.merchant);
          if (tx.notes) setNotes(tx.notes);
          if (tx.payment_method) setPaymentMethod(tx.payment_method);
        }
      }
    } catch (err) {
      console.error('Error initializing form:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const paise = parseINRToPaise(amountInput);
    if (paise <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid positive amount.');
      return;
    }

    if (!isValidISODate(dateInput)) {
      Alert.alert('Validation Error', 'Please enter a valid date in YYYY-MM-DD format.');
      return;
    }

    if (type === 'EXPENSE' && !walletId) {
      Alert.alert('Validation Error', 'Please select a wallet for this expense.');
      return;
    }

    if (type === 'TRANSFER') {
      if (!walletId || !toWalletId) {
        Alert.alert('Validation Error', 'Please select both source and destination wallets.');
        return;
      }
      if (walletId === toWalletId) {
        Alert.alert('Validation Error', 'Source and destination wallets cannot be the same.');
        return;
      }
    }

    setSaving(true);
    try {
      if (transactionId) {
        await TransactionRepository.updateTransaction(transactionId, {
          type,
          amount: paise,
          date: dateInput,
          wallet_id: type === 'INCOME' ? null : walletId,
          to_wallet_id: type === 'TRANSFER' ? toWalletId : null,
          description,
          merchant,
          notes,
          payment_method: paymentMethod,
        });
        Alert.alert('Success', 'Transaction updated.');
      } else {
        await TransactionRepository.createTransaction({
          type,
          amount: paise,
          date: dateInput,
          wallet_id: type === 'INCOME' ? null : walletId,
          to_wallet_id: type === 'TRANSFER' ? toWalletId : null,
          description,
          merchant,
          notes,
          payment_method: paymentMethod,
        });
        Alert.alert('Success', 'Transaction recorded.');
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save transaction.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!transactionId) return;
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await TransactionRepository.deleteTransaction(transactionId);
            navigation.goBack();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete transaction.');
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Type Selector Tabs */}
        {!transactionId ? (
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, type === 'EXPENSE' ? styles.tabActiveExpense : null]}
              onPress={() => setType('EXPENSE')}
            >
              <Text style={[styles.tabText, type === 'EXPENSE' ? styles.tabTextActive : null]}>
                Expense
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, type === 'INCOME' ? styles.tabActiveIncome : null]}
              onPress={() => setType('INCOME')}
            >
              <Text style={[styles.tabText, type === 'INCOME' ? styles.tabTextActive : null]}>
                Income
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, type === 'TRANSFER' ? styles.tabActiveTransfer : null]}
              onPress={() => setType('TRANSFER')}
            >
              <Text style={[styles.tabText, type === 'TRANSFER' ? styles.tabTextActive : null]}>
                Transfer
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Card style={styles.formCard}>
          {/* Amount Input */}
          <Input
            label="Amount (₹) *"
            placeholder="0"
            keyboardType="numeric"
            value={amountInput}
            onChangeText={setAmountInput}
            style={styles.amountInput}
          />

          {/* Date Input */}
          <Input
            label="Date (YYYY-MM-DD) *"
            placeholder={getTodayISODate()}
            value={dateInput}
            onChangeText={setDateInput}
          />

          {/* Wallet Picker for Expense */}
          {type === 'EXPENSE' ? (
            <View style={styles.pickerSection}>
              <Text style={styles.pickerLabel}>Wallet / Category *</Text>
              <View style={styles.pickerGrid}>
                {wallets.filter((w) => !w.is_archived).map((w) => (
                  <TouchableOpacity
                    key={w.id}
                    style={[styles.pickerChip, walletId === w.id ? styles.pickerChipActive : null]}
                    onPress={() => setWalletId(w.id)}
                  >
                    <Text style={[styles.chipText, walletId === w.id ? styles.chipTextActive : null]}>
                      {w.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          {/* Source & Target Wallet Pickers for Transfer */}
          {type === 'TRANSFER' ? (
            <>
              <View style={styles.pickerSection}>
                <Text style={styles.pickerLabel}>From Wallet *</Text>
                <View style={styles.pickerGrid}>
                  {wallets.filter((w) => !w.is_archived).map((w) => (
                    <TouchableOpacity
                      key={w.id}
                      style={[styles.pickerChip, walletId === w.id ? styles.pickerChipActiveTransfer : null]}
                      onPress={() => setWalletId(w.id)}
                    >
                      <Text style={[styles.chipText, walletId === w.id ? styles.chipTextActive : null]}>
                        {w.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.pickerSection}>
                <Text style={styles.pickerLabel}>To Wallet *</Text>
                <View style={styles.pickerGrid}>
                  {wallets.filter((w) => !w.is_archived).map((w) => (
                    <TouchableOpacity
                      key={w.id}
                      style={[styles.pickerChip, toWalletId === w.id ? styles.pickerChipActiveTransfer : null]}
                      onPress={() => setToWalletId(w.id)}
                    >
                      <Text style={[styles.chipText, toWalletId === w.id ? styles.chipTextActive : null]}>
                        {w.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          ) : null}

          {/* Description */}
          <Input
            label={type === 'INCOME' ? 'Source / Title' : 'Title / Description'}
            placeholder={type === 'EXPENSE' ? 'e.g. Restaurant dinner' : type === 'INCOME' ? 'e.g. Monthly Salary' : 'Budget adjustment'}
            value={description}
            onChangeText={setDescription}
          />

          {/* Merchant / Payee (Optional for Expense) */}
          {type === 'EXPENSE' ? (
            <Input
              label="Merchant / Payee (Optional)"
              placeholder="e.g. Swiggy, Uber, Supermarket"
              value={merchant}
              onChangeText={setMerchant}
            />
          ) : null}

          {/* Payment Method (Optional) */}
          {type !== 'TRANSFER' ? (
            <Input
              label="Payment Method (Optional)"
              placeholder="e.g. UPI, Credit Card, Cash"
              value={paymentMethod}
              onChangeText={setPaymentMethod}
            />
          ) : null}

          {/* Notes (Optional) */}
          <Input
            label="Notes (Optional)"
            placeholder="Add optional notes..."
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />
        </Card>

        {/* Buttons */}
        <Button
          title={transactionId ? 'Update Transaction' : 'Save Transaction'}
          onPress={handleSave}
          variant="primary"
          size="lg"
          loading={saving}
          style={styles.saveBtn}
        />

        {transactionId ? (
          <Button
            title="Delete Transaction"
            onPress={handleDelete}
            variant="danger"
            size="md"
            style={styles.deleteBtn}
          />
        ) : null}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 4,
    marginBottom: theme.spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  tabActiveExpense: {
    backgroundColor: theme.colors.expense,
  },
  tabActiveIncome: {
    backgroundColor: theme.colors.income,
  },
  tabActiveTransfer: {
    backgroundColor: theme.colors.transfer,
  },
  tabText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textMuted,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  formCard: {
    backgroundColor: theme.colors.card,
  },
  amountInput: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primaryBlue,
  },
  pickerSection: {
    marginBottom: theme.spacing.md,
  },
  pickerLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  pickerChip: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm + 2,
    paddingHorizontal: theme.spacing.sm + 4,
    paddingVertical: theme.spacing.xs + 2,
    margin: 4,
  },
  pickerChipActive: {
    backgroundColor: theme.colors.primaryBlue,
    borderColor: theme.colors.primaryBlue,
  },
  pickerChipActiveTransfer: {
    backgroundColor: theme.colors.transfer,
    borderColor: theme.colors.transfer,
  },
  chipText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  saveBtn: {
    marginTop: theme.spacing.sm,
  },
  deleteBtn: {
    marginTop: theme.spacing.md,
  },
});
