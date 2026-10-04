export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface Wallet {
  id: string;
  name: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface MonthlyAllocation {
  id: string;
  wallet_id: string;
  month_key: string; // "YYYY-MM"
  allocation_amount: number; // in integer paise
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // in integer paise (always positive integer)
  date: string; // ISO 8601 "YYYY-MM-DD" or full timestamp
  month_key: string; // "YYYY-MM"
  wallet_id?: string | null; // required for EXPENSE, source wallet for TRANSFER
  to_wallet_id?: string | null; // destination wallet for TRANSFER
  description?: string;
  notes?: string;
  merchant?: string;
  payment_method?: string;
  tags?: string;
  created_at: string;
  updated_at: string;
}

export interface WalletPerformance {
  walletId: string;
  walletName: string;
  monthKey: string;
  allocatedPaise: number;
  spentPaise: number;
  transfersInPaise: number;
  transfersOutPaise: number;
  effectiveAllocationPaise: number; // allocated + transfersIn - transfersOut
  remainingPaise: number; // effectiveAllocation - spent
  overspentPaise: number; // if remaining < 0: Math.abs(remaining), else 0
  underspentPaise: number; // if remaining > 0: remaining, else 0
  isOverspent: boolean;
  transactionCount: number;
  isArchived: boolean;
}

export interface MonthlySummary {
  monthKey: string;
  totalIncomePaise: number;
  totalExpensesPaise: number;
  netSavingsPaise: number; // totalIncome - totalExpenses
  totalAllocatedPaise: number;
}
