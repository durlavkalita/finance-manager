import { getDB } from '../db';
import { Wallet, MonthlyAllocation } from '../../domain/types';
import { getPreviousMonthKey } from '../../domain/monthUtils';

export class WalletRepository {
  /**
   * Retrieves all wallets. Optionally includes archived wallets.
   */
  static async getAllWallets(includeArchived: boolean = false): Promise<Wallet[]> {
    const db = await getDB();
    const query = includeArchived
      ? 'SELECT * FROM wallets ORDER BY name ASC;'
      : 'SELECT * FROM wallets WHERE is_archived = 0 ORDER BY name ASC;';

    const rows = await db.getAllAsync<{
      id: string;
      name: string;
      is_archived: number;
      created_at: string;
      updated_at: string;
    }>(query);

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      is_archived: r.is_archived === 1,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  }

  /**
   * Retrieves a wallet by its ID.
   */
  static async getWalletById(id: string): Promise<Wallet | null> {
    const db = await getDB();
    const r = await db.getFirstAsync<{
      id: string;
      name: string;
      is_archived: number;
      created_at: string;
      updated_at: string;
    }>('SELECT * FROM wallets WHERE id = ?;', [id]);

    if (!r) return null;

    return {
      id: r.id,
      name: r.name,
      is_archived: r.is_archived === 1,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  }

  /**
   * Creates a new wallet. Optionally initializes an allocation for a specific month.
   */
  static async createWallet(name: string, monthKey?: string, allocationPaise: number = 0): Promise<Wallet> {
    const db = await getDB();
    const nowIso = new Date().toISOString();
    const id = `wallet_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await db.runAsync(
      'INSERT INTO wallets (id, name, is_archived, created_at, updated_at) VALUES (?, ?, 0, ?, ?);',
      [id, name.trim(), nowIso, nowIso]
    );

    if (monthKey) {
      const allocId = `alloc_${id}_${monthKey}`;
      await db.runAsync(
        'INSERT OR REPLACE INTO monthly_wallet_allocations (id, wallet_id, month_key, allocation_amount, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?);',
        [allocId, id, monthKey, Math.max(0, Math.round(allocationPaise)), nowIso, nowIso]
      );
    }

    return {
      id,
      name: name.trim(),
      is_archived: false,
      created_at: nowIso,
      updated_at: nowIso,
    };
  }

  /**
   * Renames a wallet. Does not alter past allocations or transaction records referencing wallet_id.
   */
  static async updateWalletName(id: string, newName: string): Promise<void> {
    const db = await getDB();
    const nowIso = new Date().toISOString();
    await db.runAsync(
      'UPDATE wallets SET name = ?, updated_at = ? WHERE id = ?;',
      [newName.trim(), nowIso, id]
    );
  }

  /**
   * Archives or unarchives a wallet.
   */
  static async archiveWallet(id: string, isArchived: boolean): Promise<void> {
    const db = await getDB();
    const nowIso = new Date().toISOString();
    await db.runAsync(
      'UPDATE wallets SET is_archived = ?, updated_at = ? WHERE id = ?;',
      [isArchived ? 1 : 0, nowIso, id]
    );
  }

  /**
   * Gets monthly allocations for a specific month key ("YYYY-MM").
   */
  static async getMonthlyAllocations(monthKey: string): Promise<MonthlyAllocation[]> {
    const db = await getDB();
    const rows = await db.getAllAsync<{
      id: string;
      wallet_id: string;
      month_key: string;
      allocation_amount: number;
      created_at: string;
      updated_at: string;
    }>('SELECT * FROM monthly_wallet_allocations WHERE month_key = ?;', [monthKey]);

    return rows.map((r) => ({
      id: r.id,
      wallet_id: r.wallet_id,
      month_key: r.month_key,
      allocation_amount: r.allocation_amount,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  }

  /**
   * Sets or updates allocation for a wallet in a specific month key.
   */
  static async setMonthlyAllocation(walletId: string, monthKey: string, amountPaise: number): Promise<void> {
    const db = await getDB();
    const nowIso = new Date().toISOString();
    const id = `alloc_${walletId}_${monthKey}`;
    const cleanAmount = Math.max(0, Math.round(amountPaise));

    await db.runAsync(
      'INSERT INTO monthly_wallet_allocations (id, wallet_id, month_key, allocation_amount, created_at, updated_at) ' +
      'VALUES (?, ?, ?, ?, ?, ?) ' +
      'ON CONFLICT(wallet_id, month_key) DO UPDATE SET allocation_amount = excluded.allocation_amount, updated_at = excluded.updated_at;',
      [id, walletId, monthKey, cleanAmount, nowIso, nowIso]
    );
  }

  /**
   * Idempotent check for a new month: ensures every active wallet has an allocation entry for `monthKey`.
   * If allocations are missing for `monthKey`, uses previous month's allocations as a baseline.
   */
  static async ensureMonthlyAllocations(monthKey: string): Promise<MonthlyAllocation[]> {
    const existing = await this.getMonthlyAllocations(monthKey);
    const wallets = await this.getAllWallets(true); // include archived if they had allocations

    const existingMap = new Map<string, MonthlyAllocation>();
    for (const alloc of existing) {
      existingMap.set(alloc.wallet_id, alloc);
    }

    const prevMonthKey = getPreviousMonthKey(monthKey);
    const prevAllocations = await this.getMonthlyAllocations(prevMonthKey);
    const prevMap = new Map<string, number>();
    for (const alloc of prevAllocations) {
      prevMap.set(alloc.wallet_id, alloc.allocation_amount);
    }

    for (const wallet of wallets) {
      if (!existingMap.has(wallet.id) && !wallet.is_archived) {
        // Carry over previous month allocation or 0
        const defaultAmount = prevMap.get(wallet.id) || 0;
        await this.setMonthlyAllocation(wallet.id, monthKey, defaultAmount);
      }
    }

    return this.getMonthlyAllocations(monthKey);
  }
}
