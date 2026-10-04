export const CREATE_WALLETS_TABLE = `
CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export const CREATE_ALLOCATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS monthly_wallet_allocations (
  id TEXT PRIMARY KEY,
  wallet_id TEXT NOT NULL,
  month_key TEXT NOT NULL,
  allocation_amount INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (wallet_id) REFERENCES wallets (id) ON DELETE CASCADE,
  UNIQUE(wallet_id, month_key)
);
`;

export const CREATE_TRANSACTIONS_TABLE = `
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  date TEXT NOT NULL,
  month_key TEXT NOT NULL,
  wallet_id TEXT,
  to_wallet_id TEXT,
  description TEXT,
  notes TEXT,
  merchant TEXT,
  payment_method TEXT,
  tags TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (wallet_id) REFERENCES wallets (id),
  FOREIGN KEY (to_wallet_id) REFERENCES wallets (id)
);
`;

export const INITIAL_WALLETS = [
  { name: 'Food', defaultAllocation: 800000 }, // ₹8,000
  { name: 'Transport', defaultAllocation: 300000 }, // ₹3,000
  { name: 'Entertainment', defaultAllocation: 200000 }, // ₹2,000
  { name: 'Bills', defaultAllocation: 1500000 }, // ₹15,000
  { name: 'Shopping', defaultAllocation: 500000 }, // ₹5,000
  { name: 'Health', defaultAllocation: 200000 }, // ₹2,000
  { name: 'Education', defaultAllocation: 200000 }, // ₹2,000
  { name: 'Travel', defaultAllocation: 200000 }, // ₹2,000
  { name: 'Miscellaneous', defaultAllocation: 100000 }, // ₹1,000
];
