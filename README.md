# Personal Finance Management Mobile App

A production-quality, offline-first personal finance mobile application built with **React Native**, **Expo**, React Native **StyleSheet**, and **SQLite**.

The app combines a general transaction ledger with a monthly wallet budgeting system where each wallet represents an expense category with a monthly budget allocation.

---

## Key Features

1. **General Ledger**: Records Income, Expenses, and Transfers between wallets.
2. **Monthly Wallet Budgeting**: Category-based budget allocations reset each month without carrying over remaining balances or deficits.
3. **Negative Wallet Balances**: Negative balances (overspending) are natively supported and highlighted in distinct red styling as spending signals.
4. **Historical Preservation**: All historical allocations, spending, ending balances, and ledger transactions are permanently stored in SQLite for past and future trend analysis.
5. **Transfers**: Moves budget between wallets within a month without altering global Income or Expense totals.
6. **100% Offline & Local**: Built on `expo-sqlite`. No cloud backend, authentication, or external API dependencies required.

---

## Financial Architecture & Precision

- **Integer Paise Storage**: All monetary values are stored in SQLite as non-negative integer **paise** ($1\text{ INR} = 100\text{ paise}$) to avoid floating-point representation errors.
- **Deterministic Math**: Wallet calculations and summaries are computed using pure domain logic functions (`calculateWalletPerformance` and `calculateMonthlySummary`).
- **ISO Dates**: Dates are formatted as `YYYY-MM-DD` and grouped under standard `YYYY-MM` month keys.

---

## Installation & Running on Android

### Prerequisites
- Node.js (v18+)
- npm
- Expo Go app on Android device, OR Android Studio Emulator

### Setup
```bash
# Install dependencies
npm install
```

### Run on Android
```bash
# Start Expo development server for Android
npx expo start --android
```

---

## Testing

Comprehensive unit tests cover all financial business rules including wallet calculations, overspending, monthly isolation, transaction editing, wallet reassignment, and transfers.

```bash
# Run unit tests
npm test

# Run TypeScript type check
npx tsc --noEmit
```

---

## Database Schema (SQLite)

### `wallets`
| Column | Type | Description |
|---|---|---|
| `id` | TEXT PRIMARY KEY | Unique wallet identifier (e.g. `wallet_food`) |
| `name` | TEXT NOT NULL | Category name |
| `is_archived` | INTEGER DEFAULT 0 | 0 = Active, 1 = Archived |
| `created_at` | TEXT NOT NULL | ISO Timestamp |
| `updated_at` | TEXT NOT NULL | ISO Timestamp |

### `monthly_wallet_allocations`
| Column | Type | Description |
|---|---|---|
| `id` | TEXT PRIMARY KEY | Unique allocation ID |
| `wallet_id` | TEXT NOT NULL | Foreign key to `wallets.id` |
| `month_key` | TEXT NOT NULL | Month in `YYYY-MM` format |
| `allocation_amount` | INTEGER DEFAULT 0 | Allocated budget in paise |
| `created_at` | TEXT NOT NULL | ISO Timestamp |
| `updated_at` | TEXT NOT NULL | ISO Timestamp |

### `transactions`
| Column | Type | Description |
|---|---|---|
| `id` | TEXT PRIMARY KEY | Unique transaction ID |
| `type` | TEXT NOT NULL | `INCOME`, `EXPENSE`, or `TRANSFER` |
| `amount` | INTEGER NOT NULL | Amount in paise |
| `date` | TEXT NOT NULL | Date `YYYY-MM-DD` |
| `month_key` | TEXT NOT NULL | Month `YYYY-MM` |
| `wallet_id` | TEXT | Source wallet ID (for EXPENSE and TRANSFER) |
| `to_wallet_id` | TEXT | Destination wallet ID (for TRANSFER) |
| `description` | TEXT | Optional title or description |
| `merchant` | TEXT | Optional payee or merchant |
| `notes` | TEXT | Optional notes |
| `payment_method` | TEXT | Optional payment method |
| `created_at` | TEXT NOT NULL | ISO Timestamp |
| `updated_at` | TEXT NOT NULL | ISO Timestamp |

---

## Project Structure

```text
src/
├── components/
│   ├── Button.tsx           # Styled reusable button
│   ├── Card.tsx             # Card container
│   ├── Input.tsx            # Form text input
│   ├── MonthPicker.tsx      # Month navigation header
│   ├── SummaryCard.tsx      # Income / Expense / Net overview
│   ├── TransactionItem.tsx  # Ledger transaction list item
│   └── WalletCard.tsx       # Wallet budget performance card
├── database/
│   ├── db.ts                # SQLite connection & seed setup
│   ├── schema.ts            # Table DDL & initial seeds
│   └── repositories/
│       ├── WalletRepository.ts      # Wallet & Allocation CRUD
│       └── TransactionRepository.ts # Ledger Transaction CRUD
├── domain/
│   ├── currency.ts          # Paise <-> INR conversion & formatting
│   ├── monthUtils.ts        # YYYY-MM key helpers & date formatters
│   ├── types.ts             # TypeScript domain models
│   └── walletLogic.ts       # Pure financial calculation functions
├── navigation/
│   └── AppNavigator.tsx     # Bottom Tabs & Stack navigation
├── screens/
│   ├── AllocationEditorScreen.tsx # Dedicated budget allocation screen
│   ├── AnalyticsScreen.tsx        # Budget performance & breakdown
│   ├── DashboardScreen.tsx        # Home financial awareness view
│   ├── TransactionFormScreen.tsx  # Add / Edit transaction screen
│   ├── TransactionsScreen.tsx     # History & filtering ledger
│   └── WalletsScreen.tsx          # Wallet administration view
└── theme/
    └── index.ts             # React Native StyleSheet design tokens
tests/
└── walletLogic.test.ts      # Core financial business logic tests
```
