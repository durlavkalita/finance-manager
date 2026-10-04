import * as SQLite from 'expo-sqlite';
import { CREATE_WALLETS_TABLE, CREATE_ALLOCATIONS_TABLE, CREATE_TRANSACTIONS_TABLE, INITIAL_WALLETS } from './schema';
import { getCurrentMonthKey } from '../domain/monthUtils';

const DB_NAME = 'finance_manager.db';
let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    await initDB(dbInstance);
  }
  return dbInstance;
}

async function initDB(db: SQLite.SQLiteDatabase): Promise<void> {
  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Create tables
  await db.execAsync(CREATE_WALLETS_TABLE);
  await db.execAsync(CREATE_ALLOCATIONS_TABLE);
  await db.execAsync(CREATE_TRANSACTIONS_TABLE);

  // Check if wallets table is empty, seed initial wallets if so
  const existingWallets = await db.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM wallets;');
  if (existingWallets[0]?.count === 0) {
    const currentMonthKey = getCurrentMonthKey();
    const nowIso = new Date().toISOString();

    for (const item of INITIAL_WALLETS) {
      const walletId = `wallet_${item.name.toLowerCase()}`;
      await db.runAsync(
        'INSERT INTO wallets (id, name, is_archived, created_at, updated_at) VALUES (?, ?, 0, ?, ?);',
        [walletId, item.name, nowIso, nowIso]
      );

      const allocId = `alloc_${walletId}_${currentMonthKey}`;
      await db.runAsync(
        'INSERT INTO monthly_wallet_allocations (id, wallet_id, month_key, allocation_amount, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?);',
        [allocId, walletId, currentMonthKey, item.defaultAllocation, nowIso, nowIso]
      );
    }
  }
}
