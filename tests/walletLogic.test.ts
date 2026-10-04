import { describe, test, expect } from '@jest/globals';
import { calculateWalletPerformance, calculateMonthlySummary } from '../src/domain/walletLogic';
import { Wallet, Transaction } from '../src/domain/types';

describe('Domain Financial Business Logic', () => {
  const foodWallet: Wallet = {
    id: 'wallet-food',
    name: 'Food',
    is_archived: false,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
  };

  const transportWallet: Wallet = {
    id: 'wallet-transport',
    name: 'Transport',
    is_archived: false,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
  };

  const travelWallet: Wallet = {
    id: 'wallet-travel',
    name: 'Travel',
    is_archived: false,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
  };

  test('1. Basic wallet calculation: allocation ₹8,000, expense ₹2,000 -> remaining ₹6,000', () => {
    const allocationPaise = 800000; // ₹8,000
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        type: 'EXPENSE',
        amount: 200000, // ₹2,000
        date: '2026-10-05',
        month_key: '2026-10',
        wallet_id: 'wallet-food',
        created_at: '2026-10-05T00:00:00Z',
        updated_at: '2026-10-05T00:00:00Z',
      },
    ];

    const result = calculateWalletPerformance(foodWallet, allocationPaise, transactions, '2026-10');

    expect(result.allocatedPaise).toBe(800000);
    expect(result.spentPaise).toBe(200000);
    expect(result.remainingPaise).toBe(600000);
    expect(result.isOverspent).toBe(false);
    expect(result.overspentPaise).toBe(0);
    expect(result.underspentPaise).toBe(600000);
  });

  test('2. Overspending calculation: allocation ₹8,000, expense ₹9,200 -> remaining -₹1,200', () => {
    const allocationPaise = 800000; // ₹8,000
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        type: 'EXPENSE',
        amount: 920000, // ₹9,200
        date: '2026-10-10',
        month_key: '2026-10',
        wallet_id: 'wallet-food',
        created_at: '2026-10-10T00:00:00Z',
        updated_at: '2026-10-10T00:00:00Z',
      },
    ];

    const result = calculateWalletPerformance(foodWallet, allocationPaise, transactions, '2026-10');

    expect(result.spentPaise).toBe(920000);
    expect(result.remainingPaise).toBe(-120000); // -₹1,200
    expect(result.isOverspent).toBe(true);
    expect(result.overspentPaise).toBe(120000); // ₹1,200 overspent
    expect(result.underspentPaise).toBe(0);
  });

  test('3. Monthly isolation: September transactions do not affect October calculations', () => {
    const octAllocationPaise = 800000; // ₹8,000
    const allTransactions: Transaction[] = [
      {
        id: 'tx-sep',
        type: 'EXPENSE',
        amount: 920000, // ₹9,200 spent in Sept
        date: '2026-09-15',
        month_key: '2026-09',
        wallet_id: 'wallet-food',
        created_at: '2026-09-15T00:00:00Z',
        updated_at: '2026-09-15T00:00:00Z',
      },
      {
        id: 'tx-oct',
        type: 'EXPENSE',
        amount: 100000, // ₹1,000 spent in Oct
        date: '2026-10-02',
        month_key: '2026-10',
        wallet_id: 'wallet-food',
        created_at: '2026-10-02T00:00:00Z',
        updated_at: '2026-10-02T00:00:00Z',
      },
    ];

    // Historical September check
    const sepResult = calculateWalletPerformance(foodWallet, 800000, allTransactions, '2026-09');
    expect(sepResult.spentPaise).toBe(920000);
    expect(sepResult.remainingPaise).toBe(-120000);

    // Fresh October check (must start fresh without inheriting Sept negative balance)
    const octResult = calculateWalletPerformance(foodWallet, octAllocationPaise, allTransactions, '2026-10');
    expect(octResult.spentPaise).toBe(100000);
    expect(octResult.remainingPaise).toBe(700000); // ₹8,000 - ₹1,000 = ₹7,000
  });

  test('4. Transaction editing: editing expense ₹500 to ₹800 updates wallet remaining balance', () => {
    const allocationPaise = 800000; // ₹8,000
    const initialTxs: Transaction[] = [
      {
        id: 'tx-edit',
        type: 'EXPENSE',
        amount: 50000, // ₹500
        date: '2026-10-04',
        month_key: '2026-10',
        wallet_id: 'wallet-food',
        created_at: '2026-10-04T00:00:00Z',
        updated_at: '2026-10-04T00:00:00Z',
      },
    ];

    const initialResult = calculateWalletPerformance(foodWallet, allocationPaise, initialTxs, '2026-10');
    expect(initialResult.remainingPaise).toBe(750000); // ₹7,500

    // Edited transaction
    const editedTxs: Transaction[] = [
      {
        ...initialTxs[0],
        amount: 80000, // ₹800
      },
    ];

    const editedResult = calculateWalletPerformance(foodWallet, allocationPaise, editedTxs, '2026-10');
    expect(editedResult.spentPaise).toBe(80000);
    expect(editedResult.remainingPaise).toBe(720000); // ₹7,200
  });

  test('5. Wallet reassignment: Food -> Transport updates both wallets correctly', () => {
    const foodAllocation = 800000; // ₹8,000
    const transportAllocation = 300000; // ₹3,000

    const txReassigned: Transaction = {
      id: 'tx-reassign',
      type: 'EXPENSE',
      amount: 50000, // ₹500
      date: '2026-10-04',
      month_key: '2026-10',
      wallet_id: 'wallet-transport', // Reassigned from food to transport
      created_at: '2026-10-04T00:00:00Z',
      updated_at: '2026-10-04T00:00:00Z',
    };

    const foodPerf = calculateWalletPerformance(foodWallet, foodAllocation, [txReassigned], '2026-10');
    const transportPerf = calculateWalletPerformance(transportWallet, transportAllocation, [txReassigned], '2026-10');

    expect(foodPerf.spentPaise).toBe(0);
    expect(foodPerf.remainingPaise).toBe(800000);

    expect(transportPerf.spentPaise).toBe(50000);
    expect(transportPerf.remainingPaise).toBe(250000);
  });

  test('6. Transfers: Food -> Travel ₹1,000 updates both wallets without affecting Income/Expense totals', () => {
    const foodAllocation = 800000; // ₹8,000
    const travelAllocation = 200000; // ₹2,000

    const transferTx: Transaction = {
      id: 'tx-transfer',
      type: 'TRANSFER',
      amount: 100000, // ₹1,000
      date: '2026-10-05',
      month_key: '2026-10',
      wallet_id: 'wallet-food', // Source
      to_wallet_id: 'wallet-travel', // Destination
      created_at: '2026-10-05T00:00:00Z',
      updated_at: '2026-10-05T00:00:00Z',
    };

    const foodPerf = calculateWalletPerformance(foodWallet, foodAllocation, [transferTx], '2026-10');
    const travelPerf = calculateWalletPerformance(travelWallet, travelAllocation, [transferTx], '2026-10');

    // Food transferred out ₹1,000 -> effective allocation becomes ₹7,000
    expect(foodPerf.transfersOutPaise).toBe(100000);
    expect(foodPerf.effectiveAllocationPaise).toBe(700000);
    expect(foodPerf.remainingPaise).toBe(700000);

    // Travel received ₹1,000 -> effective allocation becomes ₹3,000
    expect(travelPerf.transfersInPaise).toBe(100000);
    expect(travelPerf.effectiveAllocationPaise).toBe(300000);
    expect(travelPerf.remainingPaise).toBe(300000);

    // Check monthly summary: transfer MUST NOT appear in Total Income or Total Expenses
    const summary = calculateMonthlySummary('2026-10', [transferTx], new Map());
    expect(summary.totalIncomePaise).toBe(0);
    expect(summary.totalExpensesPaise).toBe(0);
  });
});
