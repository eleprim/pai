import React, { useMemo } from 'react';
import { useReporting } from '../hooks/useReporting';
import { ArrowLeft, Calendar, FileText, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface LedgerDetailProps {
  accountId: string;
  onBack: () => void;
  context: ReturnType<typeof useReporting>;
  onEditEntry?: (entryId: string) => void;
}

export function LedgerDetail({ accountId, onBack, context, onEditEntry }: LedgerDetailProps) {
  
  const account = useMemo(() => 
    context.accounts.find(a => a.id === accountId),
    [context.accounts, accountId]
  );

  const ledgerEntries = useMemo(() => {
    if (!account) return [];
    
    // Get all transactions for this account, sorted by date
    const sortedTxs = [...context.transactions]
      .filter(tx => tx.accountId === accountId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let runningBalance = 0;
    return sortedTxs.map(tx => {
      if (account.category === 'Asset' || account.category === 'Expense') {
        runningBalance += (tx.debit - tx.credit);
      } else {
        runningBalance += (tx.credit - tx.debit);
      }
      return { ...tx, balance: runningBalance };
    });
  }, [context.transactions, accountId, account]);

  if (!account) {
    return (
      <div className="p-12 text-center text-gray-500">
        Account not found.
        <button onClick={onBack} className="block mx-auto mt-4 text-emerald-600 font-bold">Go Back</button>
      </div>
    );
  }

  const totalDebit = ledgerEntries.reduce((sum, tx) => sum + tx.debit, 0);
  const totalCredit = ledgerEntries.reduce((sum, tx) => sum + tx.credit, 0);
  
  const getBalanceType = (balance: number, category: string) => {
    if (balance === 0) return '';
    // For Asset/Expense: Positive balance is Debit (DR), Negative is Credit (CR)
    // For Liability/Equity/Revenue: Positive balance is Credit (CR), Negative is Debit (DR)
    const isNormalDebit = category === 'Asset' || category === 'Expense';
    if (isNormalDebit) {
      return balance > 0 ? 'DR' : 'CR';
    } else {
      return balance > 0 ? 'CR' : 'DR';
    }
  };

  const finalBalancePosition = account.category === 'Asset' || account.category === 'Expense' 
    ? totalDebit - totalCredit 
    : totalCredit - totalDebit;

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-2 pb-12 animate-in fade-in pt-8">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-[10px] font-black text-zinc-400 hover:text-white uppercase tracking-widest transition-colors"
            >
              <ArrowLeft size={16} className="text-zinc-500" />
              General Ledger
            </button>
          </div>
          <h3 className="text-2xl md:text-4xl font-black tracking-tighter text-white uppercase">{account.name}</h3>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 mt-2">
            <span>Subsidiary Ledger</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>{account.code}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span className="text-wise-green">{account.category}</span>
          </p>
        </div>
        <div className="text-left md:text-right flex flex-col items-start md:items-end">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-tight mb-1">Ending Balance</p>
          <p className="text-2xl md:text-3xl font-black text-white tracking-tighter">
            {context.formatCurrency(Math.abs(finalBalancePosition))}
          </p>
        </div>
      </header>

      <div className="rounded-[2rem] border border-white/5 overflow-hidden bg-zinc-900/50">
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin">
          <table className="w-full text-sm border-collapse min-w-[1000px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-zinc-800 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                <th className="px-8 py-5 text-left">Date</th>
                <th className="px-8 py-5 text-left">Description</th>
                <th className="px-8 py-5 text-right w-32">Debit</th>
                <th className="px-8 py-5 text-right w-32">Credit</th>
                <th className="px-8 py-5 text-right w-40">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ledgerEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center text-zinc-600 uppercase font-black text-[10px] tracking-widest bg-black/20">
                    No records found in subsidiary ledger
                  </td>
                </tr>
              ) : (
                ledgerEntries.map((tx, idx) => (
                  <tr 
                    key={tx.id || idx} 
                    onClick={() => onEditEntry?.(tx.entryId)}
                    className="hover:bg-white/5 cursor-pointer transition-colors group"
                  >
                    <td className="px-8 py-5 font-bold text-zinc-400 whitespace-nowrap">
                      {format(new Date(tx.date), 'dd MMM yy')}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-white group-hover:text-wise-green transition-colors line-clamp-1">{tx.description || 'General Transaction'}</span>
                        {tx.memo && <span className="text-[10px] text-zinc-500 uppercase font-black mt-1 truncate max-w-[250px]">{tx.memo}</span>}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right text-emerald-500 font-black tabular-nums border-l border-white/5">
                      {tx.debit > 0 ? context.formatCurrency(tx.debit) : '—'}
                    </td>
                    <td className="px-8 py-5 text-right text-red-500 font-black tabular-nums border-l border-white/5">
                      {tx.credit > 0 ? context.formatCurrency(tx.credit) : '—'}
                    </td>
                    <td className="px-8 py-5 text-right font-black text-white bg-white/[0.01] tabular-nums border-l border-white/5">
                      <div className="flex flex-col items-end">
                        <span>{context.formatCurrency(Math.abs(tx.balance))}</span>
                        <span className="text-[8px] text-zinc-600 tracking-tighter uppercase">{getBalanceType(tx.balance, account.category)}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="sticky bottom-0 bg-zinc-800 font-black text-white border-t-2 border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
              <tr>
                <td className="px-8 py-6" colSpan={2}>
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Cumulative Ledger Activity</span>
                    <span className="text-[12px] font-black text-white uppercase tracking-widest leading-none">Audit Ledger Totals</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-right w-32 border-l border-white/5 text-emerald-500 underline decoration-2 underline-offset-4 tabular-nums">
                  {context.formatCurrency(totalDebit)}
                </td>
                <td className="px-8 py-6 text-right w-32 border-l border-white/5 text-red-500 underline decoration-2 underline-offset-4 tabular-nums">
                  {context.formatCurrency(totalCredit)}
                </td>
                <td className="px-8 py-6 text-right w-40 border-l border-white/5">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1 leading-none">Final Position</p>
                  <p className="text-base font-black text-white tracking-tighter tabular-nums">
                    {context.formatCurrency(Math.abs(finalBalancePosition))}
                  </p>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
