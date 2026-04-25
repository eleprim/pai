import { useState, useEffect, useMemo } from 'react';
import { ledgerService } from '../services/ledgerService';
import { Account, TransactionLine, TrialBalanceRow, AccountCategory, AppSettings } from '../types';
import { useAuth } from './useAuth';

export function useReporting() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<(TransactionLine & { category: string, date: string })[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [dateRange, setDateRange] = useState({
    start: '1900-01-01',
    end: '2099-12-31'
  });
  const [loading, setLoading] = useState(true);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => tx.date >= dateRange.start && tx.date <= dateRange.end);
  }, [transactions, dateRange]);

  const snapshotTransactions = useMemo(() => {
    return transactions.filter(tx => tx.date <= dateRange.end);
  }, [transactions, dateRange.end]);

  const refresh = async (start = dateRange.start, end = dateRange.end) => {
    setLoading(true);
    try {
      let accs = await ledgerService.getAccounts();
      
      // Auto-initialize if no accounts exist
      if (accs.length === 0) {
        await ledgerService.initializeDefaultAccounts();
        accs = await ledgerService.getAccounts();
      }

      const txs = await ledgerService.getTransactions(start, end);
      const sett = await ledgerService.getSettings();
      
      setAccounts(accs);
      setTransactions(txs);
      setSettings(sett);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<Omit<AppSettings, 'id' | 'updatedAt' | 'updatedBy'>>) => {
     try {
       await ledgerService.updateSettings(updates);
       await refresh();
     } catch (err) {
       console.error(err);
       throw err;
     }
  };

  useEffect(() => {
    if (user) {
      refresh();
    } else {
      setAccounts([]);
      setTransactions([]);
      setLoading(false);
    }
  }, [user, dateRange.start, dateRange.end]);

  const trialBalance = useMemo(() => {
    const accMap = new Map<string, TrialBalanceRow>();
    
    accounts.forEach(acc => {
      accMap.set(acc.id, {
        accountId: acc.id,
        accountName: acc.name,
        category: acc.category,
        debit: 0,
        credit: 0,
        balance: 0
      });
    });

    snapshotTransactions.forEach(tx => {
      const row = accMap.get(tx.accountId);
      if (row) {
        row.debit += tx.debit;
        row.credit += tx.credit;
      }
    });

    return Array.from(accMap.values()).map(row => {
      // Natural balances
      if (row.category === 'Asset' || row.category === 'Expense') {
        row.balance = row.debit - row.credit;
      } else {
        row.balance = row.credit - row.debit;
      }
      return row;
    });
  }, [accounts, snapshotTransactions]);

  const incomeStatement = useMemo(() => {
    // Income statement MUST only reflect the specific period range
    const periodTrialBalance = accounts.map(acc => {
      const txs = filteredTransactions.filter(t => t.accountId === acc.id);
      const debit = txs.reduce((sum, t) => sum + t.debit, 0);
      const credit = txs.reduce((sum, t) => sum + t.credit, 0);
      let balance = 0;
      if (acc.category === 'Asset' || acc.category === 'Expense') {
        balance = debit - credit;
      } else {
        balance = credit - debit;
      }
      return { category: acc.category, balance };
    });

    const revenue = periodTrialBalance.filter(r => r.category === 'Revenue').reduce((sum, r) => sum + r.balance, 0);
    const expenses = periodTrialBalance.filter(r => r.category === 'Expense').reduce((sum, r) => sum + r.balance, 0);
    return {
      revenue,
      expenses,
      netIncome: revenue - expenses
    };
  }, [accounts, filteredTransactions]);

  const cumulativeNetIncome = useMemo(() => {
    const revenue = trialBalance.filter(r => r.category === 'Revenue').reduce((sum, r) => sum + r.balance, 0);
    const expenses = trialBalance.filter(r => r.category === 'Expense').reduce((sum, r) => sum + r.balance, 0);
    return revenue - expenses;
  }, [trialBalance]);

  const balanceSheet = useMemo(() => {
    const assets = trialBalance.filter(r => r.category === 'Asset').reduce((sum, r) => sum + r.balance, 0);
    const liabilities = trialBalance.filter(r => r.category === 'Liability').reduce((sum, r) => sum + r.balance, 0);
    const equityBase = trialBalance.filter(r => r.category === 'Equity').reduce((sum, r) => sum + r.balance, 0);
    
    // Net Income rolls into Retained Earnings (Equity)
    const totalEquity = equityBase + cumulativeNetIncome;

    return {
      assets,
      liabilities,
      equity: totalEquity,
      isBalanced: Math.abs(assets - (liabilities + totalEquity)) < 0.01
    };
  }, [trialBalance, cumulativeNetIncome]);

  const cashFlowStatement = useMemo(() => {
    const cashAccountIds = new Set(
      accounts
        .filter(a => 
          a.cashFlowCategory === 'Cash' || 
          (a.category === 'Asset' && (
            a.name.toLowerCase().includes('cash') || 
            a.name.toLowerCase().includes('bank') || 
            a.name.toLowerCase().includes('wallet')
          ))
        )
        .map(a => a.id)
    );

    // Calculate opening balance of all cash accounts
    const openingCash = snapshotTransactions
      .filter(tx => tx.date < dateRange.start && cashAccountIds.has(tx.accountId))
      .reduce((sum, tx) => sum + (tx.debit - tx.credit), 0);

    // Total net movement in cash ledger for the selected period
    const totalNetCashMovement = filteredTransactions
      .filter(tx => cashAccountIds.has(tx.accountId))
      .reduce((sum, tx) => sum + (tx.debit - tx.credit), 0);

    const result = {
      operating: { inflow: 0, outflow: 0, net: 0 },
      investing: { inflow: 0, outflow: 0, net: 0 },
      financing: { inflow: 0, outflow: 0, net: 0 },
      netCashFlow: totalNetCashMovement,
      openingCash,
      endingCash: openingCash + totalNetCashMovement
    };

    // Group transactions by entryId to analyze full journal entries
    const entries = new Map<string, (TransactionLine & { category: string, date: string })[]>();
    filteredTransactions.forEach(tx => {
      if (!entries.has(tx.entryId)) entries.set(tx.entryId, []);
      entries.get(tx.entryId)!.push(tx);
    });

    entries.forEach((lines) => {
      // Net impact on cash for this entry
      const cashLines = lines.filter(l => cashAccountIds.has(l.accountId));
      if (cashLines.length === 0) return; 

      const cashImpact = cashLines.reduce((sum, l) => sum + (l.debit - l.credit), 0);
      if (Math.abs(cashImpact) < 0.01) return; // Skip internal transfers

      // Attribute the flow to the contra-accounts (non-cash accounts)
      const nonCashLines = lines.filter(l => !cashAccountIds.has(l.accountId));
      const totalNonCashAbs = nonCashLines.reduce((sum, l) => sum + Math.abs(l.debit - l.credit), 0);

      if (totalNonCashAbs > 0) {
        nonCashLines.forEach(l => {
          const weight = Math.abs(l.debit - l.credit) / totalNonCashAbs;
          const portion = cashImpact * weight;
          const acc = accounts.find(a => a.id === l.accountId);
          if (!acc) return;

          // DETERMINING CATEGORY WITH SMART DEFAULTS
          let category = acc.cashFlowCategory;
          
          if (!category || category === 'None' || category === 'Cash') {
            if (acc.category === 'Revenue' || acc.category === 'Expense') category = 'Operating';
            else if (acc.category === 'Liability' || acc.category === 'Equity') category = 'Financing';
            else if (acc.category === 'Asset') category = 'Investing';
            else category = 'Operating';
          }

          if (category === 'Operating') {
            if (portion > 0) result.operating.inflow += portion;
            else result.operating.outflow += Math.abs(portion);
          } else if (category === 'Investing') {
            if (portion > 0) result.investing.inflow += portion;
            else result.investing.outflow += Math.abs(portion);
          } else if (category === 'Financing') {
            if (portion > 0) result.financing.inflow += portion;
            else result.financing.outflow += Math.abs(portion);
          }
        });
      } else {
         // Fallback for entries with only cash accounts (unusual but possible in manual entry)
         if (cashImpact > 0) result.operating.inflow += cashImpact;
         else result.operating.outflow += Math.abs(cashImpact);
      }
    });

    result.operating.net = result.operating.inflow - result.operating.outflow;
    result.investing.net = result.investing.inflow - result.investing.outflow;
    result.financing.net = result.financing.inflow - result.financing.outflow;

    // Ensure the buckets sum exactly to the net movement calculated from the ledger
    const bucketSum = result.operating.net + result.investing.net + result.financing.net;
    const discrepancy = totalNetCashMovement - bucketSum;
    
    // Adjust operating to swallow any rounding or classification discrepancy
    if (Math.abs(discrepancy) > 0.001) {
      result.operating.net += discrepancy;
      if (discrepancy > 0) result.operating.inflow += discrepancy;
      else result.operating.outflow += Math.abs(discrepancy);
    }

    return result;
  }, [accounts, filteredTransactions, snapshotTransactions, dateRange]);

  return {
    accounts,
    transactions,
    trialBalance,
    incomeStatement,
    cumulativeNetIncome,
    balanceSheet,
    cashFlowStatement,
    settings,
    updateSettings,
    dateRange,
    setDateRange,
    filteredTransactions,
    loading,
    refresh,
    formatCurrency: (amount: number) => {
      try {
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: settings?.currency || 'USD',
          minimumFractionDigits: 2
        }).format(amount);
      } catch (e) {
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD',
          minimumFractionDigits: 2
        }).format(amount);
      }
    }
  };
}
