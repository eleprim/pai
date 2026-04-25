import React, { useState, useRef } from 'react';
import { useReporting } from '../hooks/useReporting';
import { cn, getDateRangeFromPreset } from '../lib/utils';
import { FileDown, Printer, Calendar, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Reports({ context, onAccountClick }: { context: ReturnType<typeof useReporting>, onAccountClick?: (accountId: string) => void }) {
  const [reportType, setReportType] = useState<'bs' | 'is' | 'cf' | 'tb' | 'gj'>('bs');
  const { trialBalance, incomeStatement, balanceSheet, formatCurrency, filteredTransactions, accounts } = context;
  const [tbLimit, setTbLimit] = useState(20);
  const [gjLimit, setGjLimit] = useState(20);
  const scrollRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: 'bs', label: 'Balance Sheet' },
    { id: 'is', label: 'Profit & Loss' },
    { id: 'cf', label: 'Cash Flow' },
    { id: 'tb', label: 'Trial Balance' },
    { id: 'gj', label: 'General Journal' },
  ] as const;

  const currentIndex = tabs.findIndex(t => t.id === reportType);

  const setPreset = (preset: any) => {
    if (preset === 'custom') return;
    context.setDateRange(getDateRangeFromPreset(preset));
  };
  
  const formatDateLabel = (range: { start: string, end: string }) => {
    const s = new Date(range.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const e = new Date(range.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${s} — ${e}`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-2 pb-12">
      {/* Navigation and Controls */}
      <div className="bento-card p-2 md:p-3 overflow-hidden shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="relative group flex items-center w-full lg:w-auto">
            <motion.div 
              ref={scrollRef}
              className="flex gap-1 overflow-x-auto py-0.5 px-0.5 snap-x w-full md:w-auto"
            >
              {tabs.map(tab => (
                <button
                   key={tab.id}
                   onClick={() => setReportType(tab.id as any)}
                   className={cn(
                     "px-5 py-2.5 text-xs font-bold transition-all rounded-full relative whitespace-nowrap snap-center shrink-0",
                     reportType === tab.id 
                      ? "text-white" 
                      : "text-zinc-500 hover:bg-zinc-800"
                   )}
                >
                  <span className="relative z-10">{tab.label}</span>
                  {reportType === tab.id && (
                    <motion.div 
                      layoutId="activeReportTab"
                      className="absolute inset-0 bg-zinc-800 rounded-full border border-white/5"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </motion.div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-black/30 border border-white/5 rounded-[1.5rem] px-3 sm:px-4 py-2 flex-1 md:flex-none">
              <div className="flex items-center gap-2 flex-1">
                <Calendar size={14} className="text-zinc-500 shrink-0" />
                <select 
                  onChange={(e) => setPreset(e.target.value as any)}
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:outline-none cursor-pointer flex-1"
                  defaultValue="year"
                >
                  <option value="custom">Custom Range</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                  <option value="all">Full History</option>
                </select>
              </div>
              <div className="hidden sm:block w-px h-4 bg-zinc-800 mx-1" />
              <div className="h-px w-full bg-zinc-800 sm:hidden my-1" />
              <div className="flex items-center justify-between sm:justify-start gap-1.5 px-1 sm:px-0 text-white">
                <input 
                  type="date" 
                  value={context.dateRange.start} 
                  onChange={(e) => context.setDateRange({ ...context.dateRange, start: e.target.value })}
                  className="bg-transparent text-[10px] font-bold focus:outline-none w-auto sm:w-24"
                />
                <span className="text-zinc-600">—</span>
                <input 
                  type="date" 
                  value={context.dateRange.end} 
                  onChange={(e) => context.setDateRange({ ...context.dateRange, end: e.target.value })}
                  className="bg-transparent text-[10px] font-bold focus:outline-none w-auto sm:w-24"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => window.print()}
                className="p-2.5 bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white rounded-full transition-all shadow-sm"
              >
                <Printer size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={reportType}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="wise-card p-4 md:p-8 lg:p-14 min-h-[600px] border-white/5 overflow-x-auto scrollbar-thin"
        >
          {reportType === 'cf' && (
            <div className="max-w-2xl mx-auto space-y-12">
              <header className="text-center space-y-3 pb-8">
                <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{context.settings?.orgName || 'Business Entity'}</h2>
                <h3 className="text-2xl md:text-4xl font-black tracking-tighter text-white">Cash Flow Statement</h3>
                <div className="inline-flex items-center px-3 py-1 bg-zinc-900 rounded-full border border-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  {formatDateLabel(context.dateRange)}
                </div>
              </header>

              <div className="space-y-10">
                <CashFlowSection 
                  title="Operating Activities" 
                  inflow={context.cashFlowStatement.operating.inflow}
                  outflow={context.cashFlowStatement.operating.outflow}
                  net={context.cashFlowStatement.operating.net}
                  formatCurrency={formatCurrency}
                />

                <CashFlowSection 
                  title="Investing Activities" 
                  inflow={context.cashFlowStatement.investing.inflow}
                  outflow={context.cashFlowStatement.investing.outflow}
                  net={context.cashFlowStatement.investing.net}
                  formatCurrency={formatCurrency}
                />

                <CashFlowSection 
                  title="Financing Activities" 
                  inflow={context.cashFlowStatement.financing.inflow}
                  outflow={context.cashFlowStatement.financing.outflow}
                  net={context.cashFlowStatement.financing.net}
                  formatCurrency={formatCurrency}
                />

                <div className="pt-8 border-t border-white/5 space-y-4">
                  <div className="flex justify-between items-center text-zinc-500 text-xs font-bold uppercase tracking-widest">
                    <span>Opening Cash Balance</span>
                    <span className="text-white">{formatCurrency(context.cashFlowStatement.openingCash)}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-500 text-xs font-bold uppercase tracking-widest">
                    <span>Net Change in Cash</span>
                    <span className="text-white">
                      {formatCurrency(context.cashFlowStatement.netCashFlow)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
                    <div>
                       <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Ending Cash Position</p>
                       <p className="text-2xl font-black text-white tracking-tighter">
                         {formatCurrency(context.cashFlowStatement.endingCash)}
                       </p>
                    </div>
                    <div className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                      context.cashFlowStatement.netCashFlow >= 0 
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>
                      Reconciled
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(reportType === 'bs' || reportType === 'is') && (
            <div className="space-y-12">
              <header className="text-center space-y-3 pb-8">
                <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{context.settings?.orgName || 'Business Entity'}</h2>
                <h3 className="text-2xl md:text-4xl font-black tracking-tighter text-white">
                  {reportType === 'bs' ? 'Balance Sheet' : 'Profit & Loss'}
                </h3>
                <div className="inline-flex items-center px-4 py-1.5 bg-zinc-900 rounded-full border border-white/5 text-[10px] font-bold text-zinc-400">
                  {reportType === 'bs' 
                    ? `As of ${new Date(context.dateRange.end).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : formatDateLabel(context.dateRange)}
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                {/* Simplified grouping for brevity in code update */}
                {reportType === 'bs' ? (
                  <>
                    <ReportSection title="Assets" items={trialBalance.filter(r => r.category === 'Asset')} onAccountClick={onAccountClick} formatCurrency={formatCurrency} />
                    <div className="space-y-10">
                      <ReportSection title="Liabilities" items={trialBalance.filter(r => r.category === 'Liability')} onAccountClick={onAccountClick} formatCurrency={formatCurrency} />
                      <ReportSection title="Equity & Earnings" items={[
                        ...trialBalance.filter(r => r.category === 'Equity'),
                        { accountId: 'retained-earnings', accountName: 'Retained Earnings (Net Profit)', balance: context.cumulativeNetIncome, category: 'Equity' }
                      ]} onAccountClick={onAccountClick} formatCurrency={formatCurrency} />
                    </div>
                  </>
                ) : (
                  <>
                    <ReportSection title="Revenue" items={trialBalance.filter(r => r.category === 'Revenue')} onAccountClick={onAccountClick} formatCurrency={formatCurrency} variant="revenue" />
                    <ReportSection title="Expenses" items={trialBalance.filter(r => r.category === 'Expense')} onAccountClick={onAccountClick} formatCurrency={formatCurrency} variant="expense" />
                  </>
                )}
              </div>
              
              <footer className="pt-10 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">
                    {reportType === 'bs' ? 'TOTAL ASSETS' : 'GROSS REVENUE'}
                  </p>
                  <p className="text-3xl font-black tracking-tighter text-white">
                    {reportType === 'bs' ? formatCurrency(balanceSheet.assets) : formatCurrency(incomeStatement.revenue)}
                  </p>
                </div>

                {reportType === 'bs' && (
                  <div className={cn(
                    "px-4 py-2 rounded-2xl flex items-center gap-2 border",
                    balanceSheet.isBalanced ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-red-500/10 border-red-500/20 text-red-500"
                  )}>
                    <div className={cn("w-2 h-2 rounded-full", balanceSheet.isBalanced ? "bg-emerald-500" : "bg-red-500 animate-pulse")} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {balanceSheet.isBalanced ? 'Balanced' : 'Imbalance Detected'}
                    </span>
                  </div>
                )}

                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">
                    {reportType === 'bs' ? 'TOTAL L + E' : 'NET EARNINGS'}
                  </p>
                  <p className={cn(
                    "text-3xl font-black tracking-tighter",
                    reportType === 'is' 
                      ? (incomeStatement.netIncome >= 0 ? "text-emerald-500" : "text-rose-500")
                      : "text-white"
                  )}>
                    {reportType === 'bs' ? formatCurrency(balanceSheet.liabilities + balanceSheet.equity) : formatCurrency(incomeStatement.netIncome)}
                  </p>
                </div>
              </footer>
            </div>
          )}

          {reportType === 'gj' && (
            <div className="space-y-10">
               <header className="text-center space-y-3 pb-8">
                <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{context.settings?.orgName || 'Business Entity'}</h2>
                <h3 className="text-2xl md:text-4xl font-black tracking-tighter text-white">General Journal</h3>
                <div className="inline-flex items-center px-3 py-1 bg-zinc-900 rounded-full border border-white/5 text-[10px] font-bold text-zinc-400">
                  {formatDateLabel(context.dateRange)}
                </div>
              </header>

              <div className="rounded-[2rem] border border-white/5 overflow-hidden bg-zinc-900/50">
                <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
                  <table className="w-full text-xs border-collapse min-w-[700px]">
                    <thead className="sticky top-0 z-10 bg-zinc-800 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      <tr>
                        <th className="px-8 py-5 text-left border-b border-white/5 shrink-0 whitespace-nowrap">Date</th>
                        <th className="px-8 py-5 text-left border-b border-white/5">Account & Description</th>
                        <th className="px-8 py-5 text-right border-b border-white/5 w-32">Debit</th>
                        <th className="px-8 py-5 text-right border-b border-white/5 w-32">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(() => {
                        const grouped: Record<string, typeof filteredTransactions> = {};
                        filteredTransactions.forEach(tx => {
                          if (!grouped[tx.entryId]) grouped[tx.entryId] = [];
                          grouped[tx.entryId].push(tx);
                        });

                        const sortedEntries = Object.values(grouped).sort((a, b) => b[0].date.localeCompare(a[0].date));
                        
                        if (sortedEntries.length === 0) {
                          return (
                            <tr>
                              <td colSpan={4} className="px-8 py-24 text-center text-zinc-600 uppercase font-black text-[10px] tracking-widest bg-black/20">
                                No journal entries found for this period
                              </td>
                            </tr>
                          );
                        }

                        return sortedEntries.slice(0, gjLimit).map((group) => (
                          <React.Fragment key={group[0].entryId}>
                            {/* Entry Header row */}
                            <tr className="bg-white/[0.02]">
                              <td className="px-8 py-3 font-bold text-zinc-500 whitespace-nowrap align-top">
                                {new Date(group[0].date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                              <td colSpan={3} className="px-8 py-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Entry ID: {group[0].entryId.slice(0, 12)}...</span>
                                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">{group[0].description}</span>
                                </div>
                              </td>
                            </tr>
                            {/* Account Rows */}
                            {group.map((tx, txIdx) => {
                              const account = accounts.find(a => a.id === tx.accountId);
                              return (
                                <tr key={tx.id || txIdx} className="hover:bg-white/[0.01] transition-colors">
                                  <td className="px-8 py-3" />
                                  <td className="px-12 py-3">
                                    <button 
                                      onClick={() => onAccountClick?.(tx.accountId)}
                                      className={cn(
                                        "text-xs font-bold transition-colors text-left",
                                        tx.credit > 0 ? "ml-8 text-zinc-400" : "text-white"
                                      )}
                                    >
                                      {account?.name || 'Unknown Account'}
                                    </button>
                                  </td>
                                  <td className="px-8 py-3 text-right tabular-nums font-black text-emerald-500">
                                    {tx.debit > 0 ? formatCurrency(tx.debit) : ''}
                                  </td>
                                  <td className="px-8 py-3 text-right tabular-nums font-black text-rose-500">
                                    {tx.credit > 0 ? formatCurrency(tx.credit) : ''}
                                  </td>
                                </tr>
                              );
                            })}
                            {/* Bottom border for entry */}
                            <tr><td colSpan={4} className="h-4 border-b border-white/10" /></tr>
                          </React.Fragment>
                        ));
                      })()}
                    </tbody>
                    <tfoot className="sticky bottom-0 bg-zinc-800 font-black text-white border-t-2 border-white/10">
                      <tr>
                        <td className="px-8 py-6" colSpan={2}>JOURNAL TOTALS</td>
                        <td className="px-8 py-6 text-right text-emerald-500 underline decoration-2 underline-offset-4">
                          {formatCurrency(filteredTransactions.reduce((sum, r) => sum + (r.debit || 0), 0))}
                        </td>
                        <td className="px-8 py-6 text-right text-red-500 underline decoration-2 underline-offset-4">
                          {formatCurrency(filteredTransactions.reduce((sum, r) => sum + (r.credit || 0), 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {Array.from(new Set(filteredTransactions.map(tx => tx.entryId))).length > gjLimit && (
                  <div className="p-4 border-t border-white/5 text-center bg-black/20">
                    <button 
                      onClick={() => setGjLimit(prev => prev + 20)}
                      className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                    >
                      Show More Entries (+20)
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {reportType === 'tb' && (
            <div className="space-y-10">
               <header className="text-center space-y-3 pb-8">
                <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{context.settings?.orgName || 'Business Entity'}</h2>
                <h3 className="text-2xl md:text-4xl font-black tracking-tighter text-white">Trial Balance</h3>
                <div className="inline-flex items-center px-3 py-1 bg-zinc-900 rounded-full border border-white/5 text-[10px] font-bold text-zinc-400">
                  {new Date(context.dateRange.end).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </header>

              <div className="rounded-[2rem] border border-white/5 overflow-hidden bg-zinc-900/50">
                <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin">
                  <table className="w-full text-sm border-collapse min-w-[600px]">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-zinc-800 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        <th className="px-8 py-5 text-left">Account</th>
                        <th className="px-8 py-5 text-left">Category</th>
                        <th className="px-8 py-5 text-right">Debit</th>
                        <th className="px-8 py-5 text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {trialBalance.slice(0, tbLimit).map(r => (
                        <tr key={r.accountId} className="hover:bg-white/5 transition-colors group">
                          <td className="px-8 py-4 font-bold text-white hover:text-blue-400">
                            <button onClick={() => onAccountClick?.(r.accountId)} className="text-left">{r.accountName}</button>
                          </td>
                          <td className="px-8 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">{r.category}</td>
                          <td className="px-8 py-4 text-right text-emerald-500 font-black">{r.debit > 0 ? formatCurrency(r.debit) : '-'}</td>
                          <td className="px-8 py-4 text-right text-red-500 font-black">{r.credit > 0 ? formatCurrency(r.credit) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="sticky bottom-0 bg-zinc-800 font-black text-white border-t-2 border-white/10">
                      <tr>
                        <td className="px-8 py-6" colSpan={2}>LEDGER TOTALS</td>
                        <td className="px-8 py-6 text-right text-emerald-500 underline decoration-2 underline-offset-4">
                          {formatCurrency(trialBalance.reduce((sum, r) => sum + r.debit, 0))}
                        </td>
                        <td className="px-8 py-6 text-right text-red-500 underline decoration-2 underline-offset-4">
                          {formatCurrency(trialBalance.reduce((sum, r) => sum + r.credit, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {trialBalance.length > tbLimit && (
                  <div className="p-4 border-t border-white/5 text-center bg-black/20">
                    <button 
                      onClick={() => setTbLimit(prev => prev + 20)}
                      className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                    >
                      Show More Records (+20)
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ReportSection({ title, items, onAccountClick, formatCurrency, variant }: any) {
  const [limit, setLimit] = useState(20);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 py-2">
        <h4 className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.35em]">{title}</h4>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>
      <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin">
        {items.slice(0, limit).map((r: any) => (
          <div key={r.accountId} className="flex justify-between items-center group">
            <button 
              onClick={() => onAccountClick?.(r.accountId)}
              className="text-xs md:text-sm font-medium text-zinc-400 hover:text-white transition-colors text-left"
            >
              {r.accountName}
            </button>
            <span className={cn(
              "text-sm font-bold",
              variant === 'revenue' ? "text-emerald-500" : 
              variant === 'expense' ? "text-rose-500" : 
              "text-white"
            )}>
              {variant === 'expense' ? `(${formatCurrency(Math.abs(r.balance))})` : formatCurrency(r.balance)}
            </span>
          </div>
        ))}
        {items.length > limit && (
          <button 
            onClick={() => setLimit(prev => prev + 20)}
            className="text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors w-full text-center py-2 border-t border-white/5"
          >
            Load More (+20)
          </button>
        )}
        {items.length === 0 && <p className="text-[10px] font-bold text-zinc-600 uppercase italic">No entries for this section</p>}
      </div>
    </div>
  );
}

function CashFlowSection({ title, inflow, outflow, net, formatCurrency }: any) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4">
        <h4 className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em]">{title}</h4>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>
      <div className="text-sm space-y-4 font-medium">
         <div className="flex justify-between items-center text-zinc-400">
           <span>Total Inflow</span>
           <span className="font-bold text-emerald-500">{formatCurrency(inflow)}</span>
         </div>
         <div className="flex justify-between items-center text-zinc-400">
           <span>Total Outflow</span>
           <span className="font-bold text-rose-500">({formatCurrency(outflow)})</span>
         </div>
         <div className="flex justify-between font-bold pt-4 border-t border-zinc-800 text-base">
           <span className="text-white">Net Cash Position</span>
           <span className="text-white">
             {formatCurrency(net)}
           </span>
         </div>
      </div>
    </section>
  );
}
