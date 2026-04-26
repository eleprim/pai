import React, { useState, useEffect } from 'react';
import { ledgerService } from '../services/ledgerService';
import { JournalStatus, TransactionLine } from '../types';
import { CalculatorField } from './CalculatorField';
import { Plus, Trash2, Save, FileText, CheckCircle2, AlertTriangle, Paperclip, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useReporting } from '../hooks/useReporting';
import { cn } from '../lib/utils';

export function JournalEntryForm({ 
  context, 
  onSaved, 
  entryId,
  onCancel
}: { 
  context: ReturnType<typeof useReporting>, 
  onSaved: () => void,
  entryId?: string | null,
  onCancel?: () => void
}) {
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { formatCurrency } = context;
  const [entry, setEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    status: 'Draft' as JournalStatus
  });

  const [lines, setLines] = useState<Partial<TransactionLine>[]>([
    { accountId: '', debit: 0, credit: 0, memo: '' },
    { accountId: '', debit: 0, credit: 0, memo: '' }
  ]);

  useEffect(() => {
    if (entryId) {
      const fetchEntry = async () => {
        setIsLoading(true);
        try {
          const data = await ledgerService.getJournalEntryWithLines(entryId);
          if (data) {
            setEntry({
              date: data.entry.date,
              description: data.entry.description,
              reference: data.entry.reference || '',
              status: data.entry.status
            });
            setLines(data.lines.map(l => ({
              accountId: l.accountId,
              debit: l.debit,
              credit: l.credit,
              memo: l.memo
            })));
          }
        } catch (err) {
          console.error(err);
          setError("Failed to load entry data.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchEntry();
    }
  }, [entryId]);

  const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);
  const allLinesHaveAccount = lines.every(l => l.accountId && l.accountId !== '');
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001 && totalDebit > 0 && allLinesHaveAccount;

  const addLine = () => setLines([...lines, { accountId: '', debit: 0, credit: 0, memo: '' }]);
  const removeLine = (index: number) => setLines(lines.filter((_, i) => i !== index));

  const updateLine = (index: number, updates: Partial<TransactionLine>) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], ...updates };
    if (updates.debit && updates.debit > 0) newLines[index].credit = 0;
    if (updates.credit && updates.credit > 0) newLines[index].debit = 0;
    setLines(newLines);
  };

  const moveLine = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lines.length) return;
    const newLines = [...lines];
    [newLines[index], newLines[targetIndex]] = [newLines[targetIndex], newLines[index]];
    setLines(newLines);
  };

  const [error, setError] = useState<string | null>(null);

  const handleSave = async (status: JournalStatus) => {
    if (!isBalanced && status === 'Posted') return;
    setIsPosting(true);
    setError(null);
    try {
      const payloadEntry = { ...entry, status, totalDebit, totalCredit, attachments: [] };
      const payloadLines = lines.map(l => ({
        accountId: l.accountId!,
        debit: l.debit || 0,
        credit: l.credit || 0,
        memo: l.memo || ''
      }));

      if (entryId) {
        await ledgerService.updateJournalEntry(entryId, payloadEntry, payloadLines, context.accounts);
      } else {
        await ledgerService.createJournalEntry(payloadEntry, payloadLines, context.accounts);
      }
      
      if (!entryId) {
        setEntry({ date: new Date().toISOString().split('T')[0], description: '', reference: '', status: 'Draft' });
        setLines([
          { accountId: '', debit: 0, credit: 0, memo: '' },
          { accountId: '', debit: 0, credit: 0, memo: '' }
        ]);
      }
      onSaved();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save entry.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleDelete = async () => {
    if (!entryId) return;
    if (!window.confirm("Are you sure you want to delete this journal entry? This will reverse all its impact on accounts.")) return;
    
    setIsPosting(true);
    try {
      await ledgerService.deleteJournalEntry(entryId);
      onSaved();
    } catch (err: any) {
      setError(err.message || "Failed to delete entry.");
    } finally {
      setIsPosting(false);
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center text-gray-400 font-bold animate-pulse">Loading entry data...</div>;
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto px-2 pb-12">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {onCancel && (
            <button 
              onClick={onCancel}
              className="p-2 bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white rounded-full transition-all shadow-lg active:scale-90"
            >
              <X size={18} />
            </button>
          )}
          <div>
            <h2 className="text-xl font-black tracking-tight text-white">{entryId ? 'Edit Entry' : 'New Entry'}</h2>
            <p className="text-wise-green text-[10px] font-bold uppercase tracking-widest opacity-80">{entryId ? `REF: ${entryId.slice(-6).toUpperCase()}` : 'Record Transaction'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {entryId && (
             <button 
              disabled={isPosting}
              onClick={handleDelete}
              className="text-[10px] font-black text-rose-500 border border-rose-500/20 px-3 py-1.5 rounded-xl hover:bg-rose-500/10 transition-all uppercase tracking-widest bg-zinc-900"
            >
              Delete
            </button>
          )}
          <button 
            disabled={isPosting}
            onClick={() => handleSave('Draft')}
            className="text-[10px] font-black text-zinc-400 border border-white/10 px-3 py-1.5 rounded-xl hover:bg-zinc-800 transition-all uppercase tracking-widest bg-zinc-900"
          >
            Draft
          </button>
          <button 
            disabled={!isBalanced || isPosting}
            onClick={() => handleSave('Posted')}
            className={cn(
              "text-[10px] font-black px-4 py-1.5 rounded-xl transition-all uppercase tracking-widest flex items-center gap-2",
              isBalanced 
                ? "bg-wise-green text-black shadow-lg shadow-wise-green/20" 
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed border border-white/5"
            )}
          >
            <CheckCircle2 size={14} />
            {entryId ? 'Update' : 'Post'}
          </button>
        </div>
      </div>

      <div className="wise-card p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-zinc-900/50 border-white/5">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Date</label>
          <input 
            type="date"
            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-wise-green/20 transition-all text-white inverted-scheme-date-picker"
            value={entry.date}
            onChange={e => setEntry({ ...entry, date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Reference</label>
          <input 
            placeholder="INV-001"
            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-wise-green/20 transition-all font-bold text-white placeholder:text-zinc-700"
            value={entry.reference}
            onChange={e => setEntry({ ...entry, reference: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Description</label>
          <input 
            placeholder="Entry description..."
            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-wise-green/20 transition-all font-bold text-white placeholder:text-zinc-700"
            value={entry.description}
            onChange={e => setEntry({ ...entry, description: e.target.value })}
          />
        </div>
      </div>

      <div className="wise-card overflow-x-auto bg-zinc-900 shadow-2xl border-white/5">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-black/40 border-b border-white/5">
              <th className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Account & Memo</th>
              <th className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right w-[140px] min-w-[140px]">Debit</th>
              <th className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right w-[140px] min-w-[140px]">Credit</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {lines.map((line, index) => (
              <tr key={index} className="group hover:bg-white/[0.02] transition-colors">
                <td className="px-3 py-4 space-y-1">
                  <select
                    className="w-full bg-black/60 border border-white/5 hover:border-wise-green/40 focus:border-wise-green rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none transition-all appearance-none cursor-pointer"
                    value={line.accountId}
                    onChange={e => updateLine(index, { accountId: e.target.value })}
                  >
                    <option value="" className="bg-zinc-900">Choose account...</option>
                    {context.accounts.map(acc => (
                      <option key={acc.id} value={acc.id} className="bg-zinc-900">{acc.name} ({acc.code})</option>
                    ))}
                  </select>
                  <input 
                    placeholder="Memo..."
                    className="w-full bg-transparent border-none placeholder:text-zinc-600 px-4 py-1.5 text-[11px] text-zinc-400 focus:outline-none font-bold transition-all"
                    value={line.memo}
                    onChange={e => updateLine(index, { memo: e.target.value })}
                  />
                </td>
                <td className="px-3 py-4 align-top">
                  <CalculatorField 
                    value={line.debit === 0 ? '' : line.debit}
                    onValueChange={(val) => updateLine(index, { debit: val })}
                    className="text-right text-sm font-black text-wise-green bg-wise-green/10 border border-wise-green/10 rounded-xl py-3 px-4 w-full focus:ring-2 focus:ring-wise-green/20"
                    placeholder="0.00"
                  />
                </td>
                <td className="px-3 py-4 align-top">
                  <CalculatorField 
                    value={line.credit === 0 ? '' : line.credit}
                    onValueChange={(val) => updateLine(index, { credit: val })}
                    className="text-right text-sm font-black text-rose-500 bg-rose-500/10 border border-rose-500/10 rounded-xl py-3 px-4 w-full focus:ring-2 focus:ring-rose-500/20"
                    placeholder="0.00"
                  />
                </td>
                <td className="px-1.5 py-1 flex flex-col items-center gap-0.5">
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => moveLine(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-emerald-600 disabled:opacity-10"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button 
                      onClick={() => moveLine(index, 'down')}
                      disabled={index === lines.length - 1}
                      className="p-1 text-gray-400 hover:text-emerald-600 disabled:opacity-10"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  <button 
                    onClick={() => removeLine(index)}
                    className="p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-white/5 bg-black/20">
            <tr>
              <td className="px-4 py-6">
                <button 
                  onClick={addLine}
                  className="flex items-center gap-2 text-[10px] font-black text-wise-green hover:text-wise-green/80 transition-colors uppercase tracking-widest px-5 py-2.5 bg-wise-green/10 rounded-xl"
                >
                  <Plus size={14} />
                  Add Row
                </button>
              </td>
              <td className="px-4 py-6 text-right align-bottom">
                <p className="text-[9px] font-black text-zinc-500 uppercase mb-1 tracking-widest leading-none">Total Debit</p>
                <p className="text-xl font-black text-white tracking-tighter">{formatCurrency(totalDebit)}</p>
              </td>
              <td className="px-4 py-6 text-right align-bottom">
                <p className="text-[9px] font-black text-zinc-500 uppercase mb-1 tracking-widest leading-none">Total Credit</p>
                <p className="text-xl font-black text-white tracking-tighter">{formatCurrency(totalCredit)}</p>
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl text-rose-500 text-sm font-bold flex items-start gap-3 shadow-xl backdrop-blur-md">
           <AlertTriangle className="shrink-0" size={20} />
           <p>{error}</p>
        </div>
      )}

      {!isBalanced && totalDebit + totalCredit > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl text-amber-500 text-sm font-bold flex items-start gap-3 shadow-xl backdrop-blur-md">
          <AlertTriangle className="shrink-0" size={20} />
          <p>
            {allLinesHaveAccount 
              ? `Ledger Imbalance Detected: ${formatCurrency(Math.abs(totalDebit - totalCredit))} delta. Ensure dual-entry integrity.`
              : "Incomplete Register: Please assign an account to every active line node."}
          </p>
        </div>
      )}

      <div className="bg-zinc-900 border border-white/5 border-dashed p-6 rounded-[2rem] flex flex-col items-center justify-center text-zinc-500 hover:text-wise-green hover:border-wise-green/30 transition-all cursor-pointer group shadow-xl">
         <div className="h-10 w-10 bg-black/40 group-hover:bg-wise-green/10 rounded-xl flex items-center justify-center mb-2 transition-colors border border-white/5 group-hover:border-wise-green/20">
           <Paperclip size={20} />
         </div>
         <p className="text-[10px] font-black uppercase tracking-widest">Global Attachments Terminal</p>
         <p className="text-[8px] font-bold opacity-40 uppercase tracking-tighter mt-1 italic">Drag & drop audit logs or PDF vouchers</p>
      </div>
    </div>
  );
}
