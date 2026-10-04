import { Wallet, Transaction, WalletPerformance, MonthlySummary } from './types';

/**
 * Calculates budget performance for a specific wallet in a given month.
 * Pure function -- completely isolated to the passed parameters.
 */
export function calculateWalletPerformance(
  wallet: Wallet,
  allocationPaise: number,
  monthTransactions: Transaction[],
  monthKey: string
): WalletPerformance {
  let spentPaise = 0;
  let transfersInPaise = 0;
  let transfersOutPaise = 0;
  let transactionCount = 0;

  for (const tx of monthTransactions) {
    if (tx.month_key !== monthKey) continue;

    if (tx.type === 'EXPENSE' && tx.wallet_id === wallet.id) {
      spentPaise += tx.amount;
      transactionCount += 1;
    } else if (tx.type === 'TRANSFER') {
      if (tx.wallet_id === wallet.id) {
        transfersOutPaise += tx.amount;
        transactionCount += 1;
      }
      if (tx.to_wallet_id === wallet.id) {
        transfersInPaise += tx.amount;
        transactionCount += 1;
      }
    }
  }

  const effectiveAllocationPaise = allocationPaise + transfersInPaise - transfersOutPaise;
  const remainingPaise = effectiveAllocationPaise - spentPaise;
  const isOverspent = remainingPaise < 0;
  const overspentPaise = isOverspent ? Math.abs(remainingPaise) : 0;
  const underspentPaise = remainingPaise > 0 ? remainingPaise : 0;

  return {
    walletId: wallet.id,
    walletName: wallet.name,
    monthKey,
    allocatedPaise: allocationPaise,
    spentPaise,
    transfersInPaise,
    transfersOutPaise,
    effectiveAllocationPaise,
    remainingPaise,
    overspentPaise,
    underspentPaise,
    isOverspent,
    transactionCount,
    isArchived: wallet.is_archived,
  };
}

/**
 * Calculates overall financial summary (Total Income, Total Expenses, Net Savings) for a given month.
 * Transfers are explicitly excluded from income and expenses calculations.
 */
export function calculateMonthlySummary(
  monthKey: string,
  monthTransactions: Transaction[],
  allocationsMap: Map<string, number>
): MonthlySummary {
  let totalIncomePaise = 0;
  let totalExpensesPaise = 0;

  for (const tx of monthTransactions) {
    if (tx.month_key !== monthKey) continue;

    if (tx.type === 'INCOME') {
      totalIncomePaise += tx.amount;
    } else if (tx.type === 'EXPENSE') {
      totalExpensesPaise += tx.amount;
    }
  }

  let totalAllocatedPaise = 0;
  for (const allocation of allocationsMap.values()) {
    totalAllocatedPaise += allocation;
  }

  const netSavingsPaise = totalIncomePaise - totalExpensesPaise;

  return {
    monthKey,
    totalIncomePaise,
    totalExpensesPaise,
    netSavingsPaise,
    totalAllocatedPaise,
  };
}
