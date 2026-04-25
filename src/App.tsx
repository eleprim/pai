import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  PlusCircle, 
  BarChart3, 
  Settings,
  Menu,
  X,
  CreditCard,
  History,
  User as UserIcon
} from 'lucide-react';
import { useReporting } from './hooks/useReporting';
import { Dashboard } from './components/Dashboard';
import { ChartOfAccounts } from './components/ChartOfAccounts';
import { JournalEntryForm } from './components/JournalEntryForm';
import { Reports } from './components/Reports';
import { AuthView } from './components/AuthView';
import { UserProfile } from './components/UserProfile';
import { LedgerDetail } from './components/LedgerDetail';
import { useAuth } from './hooks/useAuth';
import { useAppearance } from './hooks/useAppearance';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'journal' | 'coa' | 'reports' | 'profile'>('dashboard');
  const [viewAccountId, setViewAccountId] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const context = useReporting();
  useAppearance();

  if (authLoading || (user && !context.settings)) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-zinc-900 border-t-white rounded-full animate-spin" />
      <span className="text-zinc-500 font-medium">Launching {context.settings?.orgName || 'Financial Ledger'}...</span>
    </div>
  );
  if (!user) return <AuthView />;

  const tabs: { id: typeof activeTab; label: string; icon: any; isMain?: boolean }[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'reports', label: 'Report', icon: BarChart3 },
    { id: 'journal', label: 'Add', icon: PlusCircle, isMain: true },
    { id: 'coa', label: 'Ledger', icon: BookOpen },
    { id: 'profile', label: 'User', icon: UserIcon },
  ];

  const navigateToLedger = (accountId: string) => {
    setViewAccountId(accountId);
  };

  const navigateToEditEntry = (entryId: string) => {
    setEditingEntryId(entryId);
    setActiveTab('journal');
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 pt-4 pb-32 min-h-0 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewAccountId ? `ledger-${viewAccountId}` : activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="max-w-7xl mx-auto w-full min-h-full"
            >
              {viewAccountId ? (
                <LedgerDetail accountId={viewAccountId} onBack={() => setViewAccountId(null)} context={context} onEditEntry={navigateToEditEntry} />
              ) : (
                <>
                  {activeTab === 'dashboard' && <Dashboard context={context} onAccountClick={navigateToLedger} onEditEntry={navigateToEditEntry} />}
                  {activeTab === 'journal' && (
                    <JournalEntryForm 
                      context={context} 
                      entryId={editingEntryId}
                      onSaved={() => {
                        context.refresh();
                        setEditingEntryId(null);
                        setActiveTab('dashboard');
                      }} 
                      onCancel={() => {
                        setEditingEntryId(null);
                        setActiveTab('dashboard');
                      }}
                    />
                  )}
                  {activeTab === 'coa' && <ChartOfAccounts context={context} onSaved={() => context.refresh()} onAccountClick={navigateToLedger} />}
                  {activeTab === 'reports' && <Reports context={context} onAccountClick={navigateToLedger} />}
                  {activeTab === 'profile' && <UserProfile context={context} />}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Modern Floating Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 z-50 flex justify-center">
        <nav className="h-16 w-full max-w-sm bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl flex items-center justify-around px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setViewAccountId(null);
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all relative group",
                tab.isMain ? "w-14" : "w-12 h-full",
                activeTab === tab.id ? "text-white" : "text-zinc-500 hover:text-zinc-400"
              )}
            >
              <div className={cn(
                "transition-all duration-300",
                tab.isMain 
                  ? "absolute -top-10 w-14 h-14 rounded-full bg-wise-green flex items-center justify-center shadow-lg shadow-wise-green/40 text-black active:scale-90" 
                  : cn("p-1.5 rounded-xl", activeTab === tab.id ? "bg-zinc-800" : "")
              )}>
                <tab.icon size={tab.isMain ? 28 : 20} className={cn(
                  "transition-all", 
                  activeTab === tab.id ? "stroke-[2.5]" : "stroke-[1.5]"
                )} />
              </div>
              {!tab.isMain && (
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-widest transition-colors",
                  activeTab === tab.id ? "text-white" : "text-zinc-600"
                )}>{tab.label}</span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
