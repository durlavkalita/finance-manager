import { getDB } from '../db';
import { Transaction, TransactionType } from '../../domain/types';
import { getMonthKeyFromDate } from '../../domain/monthUtils';

export interface CreateTransactionParams {
  type: TransactionType;
  amount: number; // integer paise
  date: string; // ISO date YYYY-MM-DD
  wallet_id?: string | null;
  to_wallet_id?: string | null;
  description?: string;
  notes?: string;
  merchant?: string;
  payment_method?: string;
  tags?: string;
}

export class TransactionRepository {
  /**
   * Creates a new transaction.
   */
  static async createTransaction(params: CreateTransactionParams): Promise<Transaction> {
    const db = await getDB();
    const nowIso = new Date().toISOString();
    const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const monthKey = getMonthKeyFromDate(params.date);
    const amount = Math.max(1, Math.round(params.amount)); // positive integer paise

    await db.runAsync(
      `INSERT INTO transactions (
        id, type, amount, date, month_key, wallet_id, to_wallet_id,
        description, notes, merchant, payment_method, tags, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        params.type,
        amount,
        params.date,
        monthKey,
        params.wallet_id || null,
        params.to_wallet_id || null,
        params.description?.trim() || null,
        params.notes?.trim() || null,
        params.merchant?.trim() || null,
        params.payment_method?.trim() || null,
        params.tags?.trim() || null,
        nowIso,
        nowIso,
      ]
    );

    return {
      id,
      type: params.type,
      amount,
      date: params.date,
      month_key: monthKey,
      wallet_id: params.wallet_id || null,
      to_wallet_id: params.to_wallet_id || null,
      description: params.description?.trim(),
      notes: params.notes?.trim(),
      merchant: params.merchant?.trim(),
      payment_method: params.payment_method?.trim(),
      tags: params.tags?.trim(),
      created_at: nowIso,
      updated_at: nowIso,
    };
  }

  /**
   * Updates an existing transaction.
   */
  static async updateTransaction(id: string, params: Partial<CreateTransactionParams>): Promise<void> {
    const db = await getDB();
    const existing = await this.getTransactionById(id);
    if (!existing) {
      throw new Error(`Transaction ${id} not found`);
    }

    const nowIso = new Date().toISOString();
    const newDate = params.date || existing.date;
    const newMonthKey = getMonthKeyFromDate(newDate);
    const newAmount = params.amount !== undefined ? Math.max(1, Math.round(params.amount)) : existing.amount;
    const newType = params.type || existing.type;
    const newWalletId = params.wallet_id !== undefined ? params.wallet_id : existing.wallet_id;
    const newToWalletId = params.to_wallet_id !== undefined ? params.to_wallet_id : existing.to_wallet_id;
    const newDesc = params.description !== undefined ? params.description?.trim() : existing.description;
    const newNotes = params.notes !== undefined ? params.notes?.trim() : existing.notes;
    const newMerchant = params.merchant !== undefined ? params.merchant?.trim() : existing.merchant;
    const newPaymentMethod = params.payment_method !== undefined ? params.payment_method?.trim() : existing.payment_method;
    const newTags = params.tags !== undefined ? params.tags?.trim() : existing.tags;

    await db.runAsync(
      `UPDATE transactions SET
        type = ?, amount = ?, date = ?, month_key = ?, wallet_id = ?, to_wallet_id = ?,
        description = ?, notes = ?, merchant = ?, payment_method = ?, tags = ?, updated_at = ?
      WHERE id = ?;`,
      [
        newType,
        newAmount,
        newDate,
        newMonthKey,
        newWalletId || null,
        newToWalletId || null,
        newDesc || null,
        newNotes || null,
        newMerchant || null,
        newPaymentMethod || null,
        newTags || null,
        nowIso,
        id,
      ]
    );
  }

  /**
   * Deletes a transaction by ID.
   */
  static async deleteTransaction(id: string): Promise<void> {
    const db = await getDB();
    await db.runAsync('DELETE FROM transactions WHERE id = ?;', [id]);
  }

  /**
   * Fetches a transaction by ID.
   */
  static async getTransactionById(id: string): Promise<Transaction | null> {
    const db = await getDB();
    const r = await db.getFirstAsync<Transaction>('SELECT * FROM transactions WHERE id = ?;', [id]);
    return r || null;
  }

  /**
   * Fetches all transactions for a given month key ("YYYY-MM").
   */
  static async getTransactionsByMonth(monthKey: string): Promise<Transaction[]> {
    const db = await getDB();
    const rows = await db.getAllAsync<Transaction>(
      'SELECT * FROM transactions WHERE month_key = ? ORDER BY date DESC, created_at DESC;',
      [monthKey]
    );
    return rows;
  }

  /**
   * Fetches transactions for a wallet (where wallet_id = walletId or to_wallet_id = walletId).
   */
  static async getTransactionsByWallet(walletId: string, monthKey?: string): Promise<Transaction[]> {
    const db = await getDB();
    let query = 'SELECT * FROM transactions WHERE (wallet_id = ? OR to_wallet_id = ?)';
    const params: any[] = [walletId, walletId];

    if (monthKey) {
      query += ' AND month_key = ?';
      params.push(monthKey);
    }

    query += ' ORDER BY date DESC, created_at DESC;';
    const rows = await db.getAllAsync<Transaction>(query, params);
    return rows;
  }

  /**
   * Fetches transactions with flexible filtering.
   */
  static async getAllTransactions(filters?: {
    monthKey?: string;
    walletId?: string;
    type?: TransactionType;
    search?: string;
    limit?: number;
  }): Promise<Transaction[]> {
    const db = await getDB();
    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params: any[] = [];

    if (filters?.monthKey) {
      query += ' AND month_key = ?';
      params.push(filters.monthKey);
    }

    if (filters?.walletId) {
      query += ' AND (wallet_id = ? OR to_wallet_id = ?)';
      params.push(filters.walletId, filters.walletId);
    }

    if (filters?.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters?.search && filters.search.trim() !== '') {
      query += ' AND (description LIKE ? OR merchant LIKE ? OR notes LIKE ?)';
      const searchTerm = `%${filters.search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY date DESC, created_at DESC';

    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const rows = await db.getAllAsync<Transaction>(query, params);
    return rows;
  }
}
