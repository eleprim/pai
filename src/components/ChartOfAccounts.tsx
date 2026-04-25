import React, { useState } from 'react';
import { ledgerService } from '../services/ledgerService';
import { Account, AccountCategory, CashFlowCategory } from '../types';
import { Plus, Trash2, Edit2, X, BookOpen, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useReporting } from '../hooks/useReporting';
import { cn } from '../lib/utils';

const CATEGORIES: AccountCategory[] = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];

export function ChartOfAccounts({ context, onSaved, onAccountClick }: { context: ReturnType<typeof useReporting>, onSaved: () => void, onAccountClick?: (accountId: string) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<AccountCategory | 'All'>('All');
  const [newAcc, setNewAcc] = useState({
    name: '',
    code: '',
    category: 'Asset' as AccountCategory,
    cashFlowCategory: 'Operating' as CashFlowCategory,
    description: ''
  });

  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (accountId: string) => {
    setError(null);
    try {
      await ledgerService.deleteAccount(accountId);
      setDeletingId(null);
      onSaved();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to delete account. It may be referenced by transactions.");
      setDeletingId(null);
    }
  };

  const handleEdit = (acc: Account) => {
    setEditingId(acc.id);
    setNewAcc({
      name: acc.name,
      code: acc.code,
      category: acc.category,
      cashFlowCategory: acc.cashFlowCategory || 'Operating',
      description: acc.description || ''
    });
    setIsAdding(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await ledgerService.updateAccount(editingId, newAcc);
      } else {
        await ledgerService.createAccount(newAcc);
      }
      setIsAdding(false);
      setEditingId(null);
      setNewAcc({ name: '', code: '', category: 'Asset', cashFlowCategory: 'Operating', description: '' });
      onSaved();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save account.");
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewAcc({ name: '', code: '', category: 'Asset', cashFlowCategory: 'Operating', description: '' });
    setError(null);
  };

  const filteredAccounts = (activeCategory === 'All' 
    ? context.accounts 
    : context.accounts.filter(a => a.category === activeCategory)
  ).sort((a, b) => a.code.localeCompare(b.code));

  return (
    <div className="flex flex-col h-full bg-zinc-950 animate-in fade-in max-w-4xl mx-auto border-x border-white/5 relative overflow-hidden">
      {/* Header Section */}
      <div className="shrink-0 px-8 py-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-20">
        <div>
          <h2 className="text-xl font-black tracking-tighter text-white uppercase">General Ledger</h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-1 italic">Chartered Systems Accounts</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-wise-green text-black rounded-xl text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-wise-green/10"
        >
          <Plus size={16} />
          Create Account
        </button>
      </div>

      {/* Category Filter */}
      <div className="shrink-0 px-8 py-4 border-b border-white/5 bg-zinc-900/30 overflow-x-auto flex gap-2">
        {['All', ...CATEGORIES].map(c => (
          <button
            key={c}
            onClick={() => setActiveCategory(c as any)}
            className={cn(
              "px-5 py-2 rounded-xl text-[10px] font-black transition-all border shrink-0 uppercase tracking-widest",
              activeCategory === c 
                ? "bg-white text-black border-white" 
                : "bg-black/50 text-zinc-500 border-white/5 hover:border-white/20"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Form / Account List Scrollable Area */}
      <div className="flex-1 overflow-auto pb-24">
        {isAdding && (
          <div className="mx-8 mt-6">
            <div className="bento-card p-8 animate-in fade-in slide-in-from-top-2 border-white/10 bg-zinc-900">
              <form onSubmit={handleSave} className="space-y-6">
                <header className="flex justify-between items-center mb-2">
                   <h3 className="text-xl font-black text-white">{editingId ? 'Modify Ledger' : 'Initialize Account'}</h3>
                   <button type="button" onClick={handleCancel} className="text-zinc-500 hover:text-white group transition-colors">
                      <X size={20} className="group-hover:rotate-90 transition-transform" />
                   </button>
                </header>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Chart Code</label>
                    <input 
                      required 
                      placeholder="e.g. 1010"
                      className="w-full bg-black border border-white/5 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 font-bold text-white placeholder:text-zinc-800"
                      value={newAcc.code}
                      onChange={e => setNewAcc({ ...newAcc, code: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Account Identity</label>
                    <input 
                      required 
                      placeholder="e.g. Cash Reserve"
                      className="w-full bg-black border border-white/5 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 font-bold text-white placeholder:text-zinc-800"
                      value={newAcc.name}
                      onChange={e => setNewAcc({ ...newAcc, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Classification</label>
                    <select 
                      className="w-full bg-black border border-white/5 rounded-xl px-4 py-3.5 text-sm focus:outline-none font-black text-white cursor-pointer appearance-none"
                      value={newAcc.category}
                      onChange={e => setNewAcc({ ...newAcc, category: e.target.value as AccountCategory })}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Flow Attribution</label>
                    <select 
                      className="w-full bg-black border border-white/5 rounded-xl px-4 py-3.5 text-sm focus:outline-none font-black text-white cursor-pointer appearance-none"
                      value={newAcc.cashFlowCategory}
                      onChange={e => setNewAcc({ ...newAcc, cashFlowCategory: e.target.value as CashFlowCategory })}
                    >
                      {['Cash', 'Operating', 'Investing', 'Financing', 'None'].map(c => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
                    </select>
                  </div>
                </div>
                {error && <p className="text-red-500 text-[11px] font-black uppercase tracking-widest px-1">{error}</p>}
                <button type="submit" className="w-full btn-wise-primary py-4 justify-center text-[11px] font-black tracking-[0.2em] uppercase shadow-lg shadow-blue-500/10 rounded-xl">
                   {editingId ? 'Update System Account' : 'Commit Ledger Account'}
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="mt-4 overflow-auto hover-scrollbar">
          <table className="w-full text-xs border-collapse min-w-[650px]">
            <thead className="sticky top-0 bg-zinc-900 text-zinc-500 z-10 border-b border-white/5">
              <tr>
                <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Codex</th>
                <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-widest">Account & Type</th>
                <th className="px-4 py-4 text-right text-[10px] font-black uppercase tracking-widest w-28">Debit</th>
                <th className="px-4 py-4 text-right text-[10px] font-black uppercase tracking-widest w-28">Credit</th>
                <th className="px-4 py-4 text-right text-[10px] font-black uppercase tracking-widest w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-zinc-950">
              {filteredAccounts.map((acc) => {
                const tbRow = context.trialBalance.find(r => r.accountId === acc.id);
                return (
                  <tr 
                    key={acc.id} 
                    onClick={() => onAccountClick?.(acc.id)}
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-5 align-top">
                       <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-black border border-white/5 text-[10px] font-black text-zinc-500 group-hover:text-wise-green group-hover:border-wise-green/30 transition-all">
                        {acc.code}
                       </span>
                    </td>
                    <td className="px-4 py-5 align-top uppercase">
                       <div className="flex flex-col">
                         <span className="text-[12px] font-bold text-white mb-1 group-hover:text-wise-green transition-colors">{acc.name}</span>
                         <span className="text-[8px] font-black text-zinc-600 tracking-widest">
                           {acc.category} <span className="mx-1.5 opacity-20">•</span> {acc.cashFlowCategory || 'General'}
                         </span>
                       </div>
                    </td>
                    <td className="px-4 py-5 text-right tabular-nums align-top text-emerald-500 font-bold w-28">
                       {tbRow?.debit ? context.formatCurrency(tbRow.debit) : '—'}
                    </td>
                    <td className="px-4 py-5 text-right tabular-nums align-top text-rose-500 font-bold w-28">
                       {tbRow?.credit ? context.formatCurrency(tbRow.credit) : '—'}
                    </td>
                    <td className="px-4 py-5 text-right align-top w-24" onClick={e => e.stopPropagation()}>
                       {deletingId === acc.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleDelete(acc.id)} className="text-[9px] font-black text-red-500 hover:text-red-400 transition-colors">DESTROY</button>
                          <button onClick={() => setDeletingId(null)} className="text-zinc-600 hover:text-white p-1"><X size={14} /></button>
                        </div>
                       ) : (
                        <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                          <button onClick={() => handleEdit(acc)} className="p-2 text-zinc-500 hover:text-wise-green transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => setDeletingId(acc.id)} className="p-2 text-zinc-500 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                        </div>
                       )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="sticky bottom-0 z-10 bg-zinc-900 border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
              <tr>
                <td className="px-4 py-6" colSpan={2}>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1 text-left">System Trial Balance</span>
                    <span className="text-[11px] font-black text-white uppercase tracking-widest text-left">Chartered Grand Totals</span>
                  </div>
                </td>
                <td className="px-4 py-6 text-right w-28 border-l border-white/5">
                  <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest mb-1">Debit</p>
                  <p className="text-[11px] font-black text-emerald-500">
                    {context.formatCurrency(context.trialBalance.reduce((sum, r) => sum + r.debit, 0))}
                  </p>
                </td>
                <td className="px-4 py-6 text-right w-28 border-l border-white/5">
                  <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest mb-1">Credit</p>
                  <p className="text-[11px] font-black text-rose-500">
                    {context.formatCurrency(context.trialBalance.reduce((sum, r) => sum + r.credit, 0))}
                  </p>
                </td>
                <td className="px-4 py-6 w-24"></td>
              </tr>
            </tfoot>
          </table>
          
          {filteredAccounts.length === 0 && (
            <div className="px-8 py-24 text-center bg-black/20 border-b border-white/5">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">No matching accounts found in register</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

