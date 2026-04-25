import React from 'react';
import { useReporting } from '../hooks/useReporting';
import { cn, getDateRangeFromPreset } from '../lib/utils';
import { 
  TrendingUp, 
  ArrowUpRight, 
  TrendingDown, 
  ShieldCheck, 
  AlertCircle, 
  PieChart as PieChartIcon, 
  BarChart3, 
  Calendar,
  Search,
  Bell,
  User,
  ArrowRight,
  Filter,
  Plus,
  X,
  Check,
  PlusCircle,
  MoreVertical,
  MinusCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area,
  XAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { AnimatePresence, motion } from 'motion/react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function Dashboard({ 
  context, 
  onAccountClick,
  onEditEntry
}: { 
  context: ReturnType<typeof useReporting>, 
  onAccountClick?: (accountId: string) => void,
  onEditEntry?: (entryId: string) => void
}) {
  const { balanceSheet, incomeStatement, loading, filteredTransactions, accounts, trialBalance, formatCurrency, settings, updateSettings } = context;
  const [isSelectingAccount, setIsSelectingAccount] = React.useState(false);
  const [activeCategoryIndex, setActiveCategoryIndex] = React.useState(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const categories = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];
  const activeCategory = categories[activeCategoryIndex];

  const categoryDistributionData = React.useMemo(() => {
    const data = trialBalance.filter(row => row.category === activeCategory);
    const total = data.reduce((sum, row) => sum + Math.abs(row.balance), 0);
    
    return data.map((row, idx) => ({
      name: row.accountName,
      value: Math.abs(row.balance),
      percentage: total > 0 ? (Math.abs(row.balance) / total * 100).toFixed(0) : 0,
      color: COLORS[idx % COLORS.length]
    })).sort((a, b) => b.value - a.value);
  }, [trialBalance, activeCategory]);

  const pinnedAccountIds = settings?.pinnedAccounts || [];
  const pinnedAccounts = trialBalance.filter(row => pinnedAccountIds.includes(row.accountId));

  const togglePinAccount = async (accountId: string) => {
    const isPinned = pinnedAccountIds.includes(accountId);
    let newPinned;
    if (isPinned) {
      newPinned = pinnedAccountIds.filter(id => id !== accountId);
    } else {
      newPinned = [...pinnedAccountIds, accountId];
    }
    await updateSettings({ pinnedAccounts: newPinned });
  };


  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredTransactions]);

  const handlePresetChange = (preset: any) => {
    if (preset === 'custom') return;
    context.setDateRange(getDateRangeFromPreset(preset));
  };

  const [performanceTarget, setPerformanceTarget] = React.useState<'revenue' | 'expenses' | string>('revenue');

  // Process data for charts
  const performanceData = React.useMemo(() => {
    const days: Record<string, { date: string, value: number }> = {};
    
    // Sort transactions by date to handle the flow correctly
    const sortedTxs = [...filteredTransactions].sort((a, b) => a.date.localeCompare(b.date));
    
    sortedTxs.forEach(tx => {
      const dateKey = tx.date;
      if (!days[dateKey]) {
        days[dateKey] = { 
          date: new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), 
          value: 0
        };
      }
      
      const account = accounts.find(a => a.id === tx.accountId);
      if (performanceTarget === 'revenue') {
        if (account?.category === 'Revenue') days[dateKey].value += (tx.credit - tx.debit);
      } else if (performanceTarget === 'expenses') {
        if (account?.category === 'Expense') days[dateKey].value += (tx.debit - tx.credit);
      } else {
        // Track specific account
        if (tx.accountId === performanceTarget) {
          days[dateKey].value += (tx.debit || tx.credit); // Just absolute movement for visibility? Or net? 
          // Let's do absolute movement for individual accounts to show "activity"
        }
      }
    });

    const result = Object.entries(days)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([_, val]) => val);
      
    // If only one day of data, add a zero-baseline point for visual "flow"
    if (result.length === 1) {
      if (sortedTxs.length > 0) {
        const firstDate = new Date(sortedTxs[0].date);
        const prevDate = new Date(firstDate);
        prevDate.setDate(prevDate.getDate() - 1);
        return [
          { date: prevDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), value: 0 },
          ...result
        ];
      }
      return result;
    }
    
    return result;
  }, [filteredTransactions, performanceTarget, accounts]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-zinc-500 font-medium animate-pulse">Syncing your ledger...</p>
    </div>
  );

  const activePerformanceLabel = performanceTarget === 'revenue' ? 'Revenue flow' : 
                               performanceTarget === 'expenses' ? 'Expense flow' : 
                               accounts.find(a => a.id === performanceTarget)?.name || 'Account Flow';

  return (
    <div className="max-w-md mx-auto space-y-6 pb-24 md:max-w-4xl px-4">
      {/* App Header */}
      <header className="flex items-center justify-between py-8">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-wise-green rounded-full shadow-[0_0_15px_var(--color-primary)]" />
          <h1 className="text-xl font-black text-white tracking-tighter">
            {settings?.orgName || 'Business Ledger'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
           <button className="w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
             <Bell size={20} />
           </button>
        </div>
      </header>

      {/* Main Stats Bento Grid */}
      <section className="grid grid-cols-1 gap-4">
        {/* Total Assets - Featured Card (Huge) */}
        <div className="bg-wise-green rounded-[2.5rem] p-8 text-black relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/40 rounded-full -mr-24 -mt-24 blur-3xl group-hover:scale-125 transition-transform duration-700" />
          <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-black/5 backdrop-blur-md flex items-center justify-center shadow-inner text-black">
                <TrendingUp size={24} />
              </div>
              <button 
                onClick={() => setIsSelectingAccount(true)}
                className="w-10 h-10 rounded-full bg-black/5 backdrop-blur-sm flex items-center justify-center hover:bg-black/10 transition-colors"
                title="Add account card"
              >
                <Plus size={20} />
              </button>
            </div>
            <div>
              <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Global Assets</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter mt-1">
                {formatCurrency(balanceSheet.assets)}
              </h2>
            </div>
          </div>
        </div>

        {/* Dynamic Pinned Account Cards - Small Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {pinnedAccounts.map((row) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              key={row.accountId}
              className="bento-card relative group aspect-square flex flex-col justify-between p-5 bg-zinc-900 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5)] border-white/5 hover:border-wise-green/20 transition-all overflow-hidden"
            >
              {/* Asymmetric Design Element */}
              <div className="absolute -top-3 -left-3 w-12 h-12 bg-wise-green/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
              
              {/* Large Background Icon */}
              <div className="absolute -right-4 -bottom-4 text-white/[0.03] rotate-12 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-0">
                {row.category === 'Asset' ? <TrendingUp size={120} /> : 
                 row.category === 'Liability' ? <TrendingDown size={120} /> :
                 <PieChartIcon size={120} />}
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  togglePinAccount(row.accountId);
                }}
                className="absolute top-4 right-4 p-2 text-wise-green hover:brightness-125 transition-all z-20 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 shadow-xl opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
              >
                <MinusCircle size={16} />
              </button>
              
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center border shadow-inner relative z-10",
                row.category === 'Asset' ? "bg-wise-green/10 border-wise-green/10 text-wise-green" :
                row.category === 'Liability' ? "bg-rose-500/10 border-rose-500/10 text-rose-500" :
                row.category === 'Equity' ? "bg-indigo-500/10 border-indigo-500/10 text-indigo-500" :
                row.category === 'Revenue' ? "bg-emerald-500/10 border-emerald-500/10 text-emerald-500" :
                "bg-zinc-800 border-white/5 text-zinc-400"
              )}>
                {row.category === 'Asset' ? <TrendingUp size={18} /> : 
                 row.category === 'Liability' ? <TrendingDown size={18} /> :
                 row.category === 'Revenue' ? <PieChartIcon size={18} /> :
                 <BarChart3 size={18} />}
              </div>
  
              <div className="relative z-10">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1 truncate mix-blend-screen">{row.accountName}</p>
                <h3 className="text-lg font-black text-white truncate tracking-tighter">{formatCurrency(row.balance)}</h3>
              </div>
            </motion.div>
          ))}

          <div 
            onClick={() => setIsSelectingAccount(true)}
            className="bento-card border-dashed border-white/10 bg-black/20 flex flex-col items-center justify-center gap-3 text-zinc-600 hover:text-wise-green hover:border-wise-green/30 transition-all cursor-pointer aspect-square"
          >
            <PlusCircle size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest text-center">Pin Account</span>
          </div>
        </section>

        {/* Revenue & Ledger Health (Full Width below pinned) */}
        <section className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bento-card flex flex-col justify-between p-5 md:col-span-1">
             <p className="text-[10px] font-bold text-wise-green uppercase tracking-widest mb-1">Net Earnings</p>
             <h3 className="text-xl font-black text-white">{formatCurrency(incomeStatement.netIncome)}</h3>
             <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-wise-green shadow-[0_0_10px_var(--color-primary)]" style={{ width: `${Math.min(100, (incomeStatement.netIncome / (Math.max(1, incomeStatement.revenue))) * 100)}%` }} />
             </div>
          </div>

          <div className={cn(
            "md:col-span-2 p-5 rounded-[2.5rem] border transition-all flex items-center justify-between",
            balanceSheet.isBalanced 
              ? "bg-wise-green/10 border-wise-green/20 text-wise-green" 
              : "bg-red-500/10 border-red-500/20 text-red-500"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                balanceSheet.isBalanced ? "bg-wise-green/20" : "bg-red-500/20"
              )}>
                {balanceSheet.isBalanced ? <ShieldCheck size={24} /> : <AlertCircle size={24} />}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest">
                  {balanceSheet.isBalanced ? "Ledger Integrity Verified" : "Data Inconsistency Detected"}
                </p>
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">System Health Audit</p>
              </div>
            </div>
            <div className={cn(
               "w-5 h-5 rounded-full border-4 border-black",
               balanceSheet.isBalanced ? "bg-wise-green shadow-[0_0_10px_var(--color-primary)]" : "bg-red-500"
            )} />
          </div>
        </section>
      </section>

      {/* Analytics Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Performance Tracking</h3>
          <div className="flex gap-2">
            <select 
              value={performanceTarget}
              onChange={(e) => setPerformanceTarget(e.target.value)}
              className="bg-zinc-900 border border-white/5 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-wise-green focus:ring-0 cursor-pointer"
            >
              <option value="revenue">Global Revenue</option>
              <option value="expenses">Global Expenses</option>
              {trialBalance.filter(row => row.category === 'Revenue' || row.category === 'Expense').map(acc => (
                <option key={acc.accountId} value={acc.accountId}>{acc.accountName}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="bento-card h-64 p-0 pt-8 overflow-hidden relative">
          <div className="absolute top-4 left-6 z-10 flex items-center gap-2">
            <motion.div 
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1.5 h-1.5 rounded-full bg-wise-green shadow-[0_0_8px_var(--color-primary)]" 
            />
            <span className="text-[10px] font-black text-wise-green bg-wise-green/10 px-2 py-1 rounded-md uppercase tracking-widest">{activePerformanceLabel}</span>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                hide 
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="var(--color-primary)" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorFlow)" 
                animationDuration={2000}
                dot={{ r: 4, fill: 'var(--color-primary)', strokeWidth: 0 }}
                activeDot={{ r: 8, fill: '#fff', stroke: 'var(--color-primary)', strokeWidth: 4 }}
              />
              <Tooltip 
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '10px', padding: '12px' }}
                itemStyle={{ color: 'var(--color-primary)', fontWeight: '900' }}
                labelStyle={{ color: '#fff', marginBottom: '4px', opacity: 0.5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution Swipable Card - Medium Card (Moved under flow graph) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bento-card relative overflow-hidden bg-zinc-900 border-white/5 shadow-2xl flex flex-col group/dist min-h-[350px]">
            <div className="p-6 flex justify-between items-center relative z-10">
              <div>
                <p className="text-[10px] font-black text-wise-green uppercase tracking-widest leading-none mb-1">{activeCategory} Distribution</p>
                <h4 className="text-xs font-black text-white uppercase tracking-widest">Resource Allocation</h4>
              </div>
              <div className="flex gap-1.5">
                <button 
                  onClick={() => setActiveCategoryIndex(prev => prev === 0 ? categories.length - 1 : prev - 1)}
                  className="w-8 h-8 rounded-full bg-black/40 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-90"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                   onClick={() => setActiveCategoryIndex(prev => prev === categories.length - 1 ? 0 : prev + 1)}
                   className="w-8 h-8 rounded-full bg-black/40 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-90"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-24 h-24 rounded-full bg-black/40 border border-white/5 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                   <p className="text-[8px] font-black text-zinc-600 uppercase">Weight</p>
                   <p className="text-[11px] font-black text-white">{activeCategory.slice(0, 3).toUpperCase()}</p>
                </div>
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeCategory}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="w-full h-[220px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryDistributionData.length > 0 ? categoryDistributionData : [{ name: 'Empty', value: 1, color: '#27272a' }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {(categoryDistributionData.length > 0 ? categoryDistributionData : [{ name: 'Empty', value: 1, color: '#27272a' }]).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-black/90 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-2xl">
                                {payload[0].name}: {payload[0].payload.percentage}%
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="px-6 pb-6 overflow-hidden mt-auto">
               <div className="flex gap-4 overflow-x-auto py-1 no-scrollbar">
                 {categoryDistributionData.map((item, idx) => (
                   <div key={idx} className="flex items-center gap-2 shrink-0">
                      <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: item.color, color: item.color }} />
                      <span className="text-[9px] font-black text-zinc-400 uppercase whitespace-nowrap">{item.name}</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
          
          <div className="hidden md:flex bento-card border-none bg-transparent items-center justify-center text-zinc-800 text-[10px] font-black uppercase tracking-[0.3em] rotate-90 opacity-20 pointer-events-none">
             Global Distribution Matrix System
          </div>
        </div>
      </section>

      {/* Period Coverage Controls - Mobile Optimized */}
      <section className="bento-card overflow-hidden">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="text-zinc-500" size={16} />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Reporting Period</span>
            </div>
            <select 
              onChange={(e) => handlePresetChange(e.target.value)}
              className="bg-transparent border-none text-[10px] font-black text-wise-green uppercase tracking-widest focus:ring-0 cursor-pointer"
              defaultValue="all"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">Full History</option>
            </select>
          </div>
          <div className="flex items-center justify-between gap-4">
             <div className="flex-1 bg-black/30 rounded-xl p-2 border border-white/5 text-center">
               <p className="text-[8px] text-zinc-500 uppercase font-black mb-1 leading-none">From</p>
               <input 
                type="date"
                value={context.dateRange.start}
                onChange={(e) => context.setDateRange({ ...context.dateRange, start: e.target.value })}
                className="bg-transparent text-white text-[11px] font-bold w-full text-center focus:outline-none"
               />
             </div>
             <ArrowRight size={14} className="text-zinc-700 shrink-0" />
             <div className="flex-1 bg-black/30 rounded-xl p-2 border border-white/5 text-center">
               <p className="text-[8px] text-zinc-500 uppercase font-black mb-1 leading-none">To</p>
               <input 
                type="date"
                value={context.dateRange.end}
                onChange={(e) => context.setDateRange({ ...context.dateRange, end: e.target.value })}
                className="bg-transparent text-white text-[11px] font-bold w-full text-center focus:outline-none"
               />
             </div>
          </div>
        </div>
      </section>

      <section className="space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-4 bg-zinc-800 rounded-full" />
             <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">
               Live Ledger Stream
             </h3>
          </div>
        </div>

        <div className="relative group/activity">
          <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-l from-wise-bg to-transparent z-10 pointer-events-none group-hover/activity:opacity-0 transition-opacity" />
          
          <div className="flex gap-4 overflow-x-auto pb-6 px-1 scroll-smooth">
          {(() => {
              const grouped: Record<string, typeof context.transactions> = {};
              context.filteredTransactions.forEach(tx => {
                if (!grouped[tx.entryId]) grouped[tx.entryId] = [];
                grouped[tx.entryId].push(tx);
              });
              
              let sortedEntries = Object.values(grouped).sort((a, b) => {
                const dateCompare = b[0].date.localeCompare(a[0].date);
                if (dateCompare !== 0) return dateCompare;
                const aTime = a[0].createdAt?.seconds || 0;
                const bTime = b[0].createdAt?.seconds || 0;
                return bTime - aTime;
              });

              const visibleEntries = sortedEntries;

              if (visibleEntries.length === 0) {
                return (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full bento-card py-10 text-center bg-zinc-900/40 border-white/10 shadow-xl backdrop-blur-md shrink-0"
                  >
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                       No recent transactions
                    </p>
                  </motion.div>
                );
              }

              return visibleEntries.map((group, idx) => {
                const totalDebit = group.reduce((sum, tx) => sum + (tx.debit || 0), 0);
                const involvedAccounts = group.map(tx => accounts.find(a => a.id === tx.accountId)).filter(a => !!a);
                const uniqueAccounts = [...new Set(involvedAccounts.map(a => a!.name))];
                
                return (
                  <motion.div 
                    key={group[0].entryId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => onEditEntry?.(group[0].entryId)}
                    className="shrink-0 w-64 bento-card bg-zinc-900 border-white/5 p-5 hover:border-wise-green/20 transition-all cursor-pointer group/card active:scale-[0.98]"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-10 h-10 rounded-2xl bg-black/40 flex items-center justify-center text-zinc-600 group-hover/card:text-wise-green transition-colors border border-white/5">
                         <ArrowUpRight size={18} />
                      </div>
                      <span className="text-[8px] font-black text-zinc-700 bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-widest">{new Date(group[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-tight truncate mb-1 group-hover/card:text-wise-green transition-colors">{group[0].description || 'Ledger Entry'}</h4>
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest truncate">{uniqueAccounts.join(' + ')}</p>
                      </div>
                      
                      <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                        <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Debit Control</p>
                        <p className="text-sm font-black text-white">{formatCurrency(totalDebit)}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              });
          })()}
          </div>
        </div>
      </section>
      {/* Selection Modal */}
      <AnimatePresence>
        {isSelectingAccount && (
          <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSelectingAccount(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-white">Select Dashboard Cards</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Audit Pillars & Registers</p>
                </div>
                <button onClick={() => setIsSelectingAccount(false)} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-200">
                  <X size={20} />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
              {trialBalance.filter(row => row.category === 'Asset' || row.category === 'Liability').map(row => (
                  <button
                    key={row.accountId}
                    onClick={() => {
                      togglePinAccount(row.accountId);
                      setIsSelectingAccount(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-5 rounded-[2rem] transition-all border",
                      pinnedAccountIds.includes(row.accountId)
                        ? "bg-wise-green border-wise-green text-black shadow-lg shadow-wise-green/20"
                        : "bg-zinc-800/60 border-white/10 text-zinc-300 hover:bg-zinc-800 hover:border-white/20"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs",
                        pinnedAccountIds.includes(row.accountId) ? "bg-white/20" : "bg-black/40"
                      )}>
                        {row.accountName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold">{row.accountName}</p>
                        <p className={cn("text-[9px] uppercase font-black tracking-widest", pinnedAccountIds.includes(row.accountId) ? "text-blue-100" : "text-zinc-500")}>
                          {row.category} • {formatCurrency(row.balance)}
                        </p>
                      </div>
                    </div>
                    {pinnedAccountIds.includes(row.accountId) && <Check size={20} />}
                  </button>
                ))}
              </div>
              <div className="p-6 bg-black/40">
                <button 
                  onClick={() => setIsSelectingAccount(false)}
                  className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl active:scale-95 transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Empty space for bottom floating feel */}
      <div className="h-12" />
    </div>
  );
}

