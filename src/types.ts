export type AccountCategory = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
export type CashFlowCategory = 'Cash' | 'Operating' | 'Investing' | 'Financing' | 'None';

export interface Account {
  id: string;
  name: string;
  code: string;
  category: AccountCategory;
  cashFlowCategory: CashFlowCategory;
  subcategory?: string;
  description?: string;
  isActive: boolean;
  createdBy: string;
  order?: number;
}

export type JournalStatus = 'Draft' | 'Posted';

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  reference?: string;
  status: JournalStatus;
  attachments: string[];
  totalDebit: number;
  totalCredit: number;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
}

export interface TransactionLine {
  id: string;
  entryId: string;
  accountId: string;
  debit: number;
  credit: number;
  memo?: string;
  description?: string;
  createdAt: any;
}

export interface AppSettings {
  id: string;
  orgName: string;
  currency: string;
  logoUrl?: string;
  pinnedAccounts?: string[];
  updatedAt: any;
  updatedBy: string;
}

export interface TrialBalanceRow {
  accountId: string;
  accountName: string;
  category: AccountCategory;
  debit: number;
  credit: number;
  balance: number;
}
