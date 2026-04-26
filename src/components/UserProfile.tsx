import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, 
  User, 
  Mail, 
  ShieldCheck, 
  Calendar, 
  Info, 
  Building2, 
  Palette, 
  Settings, 
  Save, 
  Check, 
  Grid,
  Type,
  Image as ImageIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { useReporting } from '../hooks/useReporting';
import { useAppearance, FontStyle, Density } from '../hooks/useAppearance';
import { cn } from '../lib/utils';

const COLORS = [
  { name: 'Eleprim', value: '#c3f027' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
];

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar ($)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'GBP', name: 'British Pound (£)' },
  { code: 'JPY', name: 'Japanese Yen (¥)' },
  { code: 'PHP', name: 'Philippine Peso (₱)' },
  { code: 'AUD', name: 'Australian Dollar (A$)' },
  { code: 'CAD', name: 'Canadian Dollar (C$)' },
  { code: 'CNY', name: 'Chinese Yuan (¥)' },
  { code: 'INR', name: 'Indian Rupee (₹)' },
];

export function UserProfile({ context }: { context: ReturnType<typeof useReporting> }) {
  const { user } = useAuth();
  const { settings: appearance, setSettings } = useAppearance();
  const { settings: appSettings, updateSettings } = context;
  const [orgName, setOrgName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'user' | 'enterprise' | 'about'>('user');
  const [aboutSlideIndex, setAboutSlideIndex] = useState(0);

  useEffect(() => {
    if (appSettings) {
      setOrgName(appSettings.orgName || '');
      setLogoUrl(appSettings.logoUrl || '');
    }
  }, [appSettings]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateSettings({ orgName, logoUrl, currency: appSettings?.currency });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCurrency = async (currency: string) => {
    setIsSaving(true);
    try {
      await updateSettings({ currency });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 pb-12 pt-8">
      <header className="flex flex-col items-center gap-6 text-center">
        <div className="relative group">
          <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || 'User'} 
              className="w-28 h-28 rounded-[2.5rem] border-2 border-white/10 shadow-2xl relative z-10"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-28 h-28 rounded-[2.5rem] bg-zinc-900 flex items-center justify-center border-2 border-white/10 shadow-2xl relative z-10">
              <User size={48} className="text-zinc-700" />
            </div>
          )}
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-black border-4 border-black rounded-full shadow-lg flex items-center justify-center z-20 overflow-hidden group-hover:scale-110 transition-transform">
             <div className="w-full h-full bg-wise-green flex items-center justify-center text-black">
                <ShieldCheck size={18} />
             </div>
          </div>
        </div>
        <div className="space-y-1 relative z-10">
          <h2 className="text-3xl font-black text-white tracking-tighter">{user.displayName || 'Financial Member'}</h2>
          <p className="text-zinc-500 text-[10px] uppercase tracking-[0.25em] font-black">Authorized Identity</p>
        </div>
      </header>

      {/* Sub Navigation */}
      <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-white/5">
        <button 
          onClick={() => setActiveSubTab('user')}
          className={cn(
            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            activeSubTab === 'user' ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"
          )}
        >
          User Info
        </button>
        <button 
          onClick={() => setActiveSubTab('enterprise')}
          className={cn(
            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            activeSubTab === 'enterprise' ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"
          )}
        >
          Enterprise Info
        </button>
        <button 
          onClick={() => setActiveSubTab('about')}
          className={cn(
            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            activeSubTab === 'about' ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"
          )}
        >
          About Info
        </button>
      </div>

      <div className="min-h-[400px]">
        {activeSubTab === 'user' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bento-card p-6 bg-zinc-900 border-white/5 flex flex-col gap-4">
                <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-zinc-500 border border-white/5">
                  <Mail size={18} />
                </div>
                <div>
                   <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Email Identity</p>
                   <p className="text-sm font-black text-white truncate">{user.email || 'N/A'}</p>
                </div>
              </div>

              <div className="bento-card p-6 bg-zinc-900 border-white/5 flex flex-col gap-4">
                <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-zinc-500 border border-white/5">
                  <Calendar size={18} />
                </div>
                <div>
                   <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Last Sync</p>
                   <p className="text-sm font-black text-white">{user.metadata.lastSignInTime ? format(new Date(user.metadata.lastSignInTime), 'MMM d, yyyy') : 'Live'}</p>
                </div>
              </div>

              <div className="bento-card p-6 bg-zinc-900 border-white/5 flex flex-col gap-4 col-span-1 md:col-span-2">
                <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-wise-green border border-white/5">
                  <ShieldCheck size={18} />
                </div>
                <div className="flex justify-between items-end">
                   <div>
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Security Node</p>
                      <p className="text-sm font-black text-white capitalize">{user.providerData[0]?.providerId.split('.')[0] || 'Primary'}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-wise-green/40 uppercase tracking-widest">Encrypted Auth</p>
                   </div>
                </div>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 py-4 bg-zinc-800 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 rounded-2xl border border-white/5 hover:border-red-500/20 transition-all font-black uppercase tracking-widest text-[10px]"
            >
              <LogOut size={16} />
              Terminate Session
            </button>

            <div className="bg-wise-green/5 border border-wise-green/10 p-6 rounded-[2.5rem] flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-wise-green/10 flex items-center justify-center text-wise-green border border-wise-green/20 shrink-0">
                <Info size={28} />
              </div>
              <div className="flex-1">
                <h4 className="text-[10px] font-black text-wise-green uppercase tracking-[0.1em]">Ledger Protection</h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed font-medium mt-1">Access is restricted to your verified account via biometrically-secured cloud identity.</p>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'enterprise' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <section className="bento-card divide-y divide-white/5 overflow-hidden shadow-2xl border-white/5 bg-zinc-900/50">
              {/* Enterprise Settings Section */}
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 size={20} className="text-wise-green" />
                    <h3 className="text-sm font-black uppercase tracking-tight text-white">Enterprise Profile</h3>
                  </div>
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSaving || (orgName === appSettings?.orgName && logoUrl === appSettings?.logoUrl)}
                    className="bg-wise-green text-black h-10 px-4 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30"
                  >
                    <Save size={14} />
                    {isSaving ? 'Sync' : 'Apply'}
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2 text-left">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Ledger Entity</label>
                    <input 
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:ring-1 focus:ring-wise-green/20 transition-all text-white"
                    />
                  </div>
                  
                  <div className="space-y-2 text-left">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Valuation Currency</label>
                    <select 
                      value={appSettings?.currency || 'USD'}
                      onChange={(e) => handleUpdateCurrency(e.target.value)}
                      className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:ring-1 focus:ring-wise-green/20 transition-all text-white"
                    >
                      {CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Preferences Section */}
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <Palette size={20} className="text-wise-green" />
                  <h3 className="text-sm font-black uppercase tracking-tight text-white">Interface Customization</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Accent Theme</label>
                    <div className="grid grid-cols-4 gap-2">
                       {COLORS.slice(0, 8).map((c) => (
                         <button
                           key={c.value}
                           onClick={() => setSettings({ ...appearance, primaryColor: c.value })}
                           className={cn(
                             "w-full aspect-square rounded-lg border-2 transition-all flex items-center justify-center",
                             appearance.primaryColor === c.value ? "border-white" : "border-transparent opacity-40"
                           )}
                           style={{ backgroundColor: c.value }}
                         />
                       ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Typography</label>
                    <div className="space-y-2">
                        {(['sans', 'mono'] as FontStyle[]).map((f) => (
                          <button
                            key={f}
                            onClick={() => setSettings({ ...appearance, font: f })}
                            className={cn(
                              "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest",
                              appearance.font === f ? "bg-white text-black" : "bg-black/40 border-white/5 text-zinc-500"
                            )}
                          >
                            {f}
                            {appearance.font === f && <Check size={12} />}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Layout Density */}
              <div className="p-8 space-y-4">
                <div className="flex items-center gap-3">
                  <Grid size={20} className="text-wise-green" />
                  <h3 className="text-sm font-black uppercase tracking-tight text-white">Enterprise Density</h3>
                </div>
                <div className="flex gap-2">
                  {(['comfortable', 'compact'] as Density[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setSettings({ ...appearance, density: d })}
                      className={cn(
                        "flex-1 py-4 px-4 rounded-2xl border transition-all text-left",
                        appearance.density === d ? "bg-white text-black" : "bg-black border-white/5 text-zinc-500"
                      )}
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest">{d}</p>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

         {activeSubTab === 'about' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 py-4">
            {/* 1. Static Brand Card */}
            <div className="bg-black border border-white/10 rounded-[3rem] p-8 shadow-2xl">
              <div className="flex flex-col items-center gap-8 py-4">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-white tracking-widest uppercase">ELS</h3>
                  <p className="text-[12px] font-black text-zinc-500 uppercase tracking-[0.2em]">Eleprim Ledger System</p>
                </div>
                
                <div className="relative group">
                  <div className="w-56 h-28 bg-zinc-900 border border-white/5 rounded-[2.5rem] flex items-center justify-center gap-6 p-6 relative z-10 shadow-inner">
                    <div className="relative w-10 h-10 flex flex-col gap-1.5 transform rotate-[-15deg]">
                      <div className="w-10 h-2 bg-white rounded-sm transform skew-x-[-30deg]" />
                      <div className="w-8 h-2 bg-white rounded-sm transform skew-x-[-30deg] translate-x-1" />
                      <div className="w-5 h-2 bg-white rounded-sm transform skew-x-[-30deg] translate-x-2" />
                    </div>
                    <span className="text-3xl font-light text-white tracking-tight font-sans">eleprim</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Swipable Area for remaining cards */}
            <div className="relative flex flex-col items-center gap-6">
              <div className="w-full overflow-hidden">
                <motion.div 
                  drag="x"
                  dragConstraints={{ left: -960, right: 0 }}
                  onDragEnd={(_, info) => {
                    const threshold = 100;
                    if (info.offset.x < -threshold && aboutSlideIndex < 3) {
                      setAboutSlideIndex(prev => prev + 1);
                    } else if (info.offset.x > threshold && aboutSlideIndex > 0) {
                      setAboutSlideIndex(prev => prev - 1);
                    }
                  }}
                  animate={{ x: -aboutSlideIndex * 320 }} // Assuming roughly 320px width per card
                  className="flex gap-4 cursor-grab active:cursor-grabbing px-4"
                  style={{ width: '400%' }}
                >
                  {/* Card 2: Architect */}
                  <div className="w-[calc(25%-16px)] shrink-0 bg-zinc-900 border border-white/5 rounded-[3rem] p-8 shadow-xl min-h-[220px]">
                    <div className="mb-6">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">System Details: DEVELOPER</p>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-wise-green border border-white/5">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Developer</p>
                          <p className="text-sm font-black text-white whitespace-nowrap">Nhel Angelo Antonio, CTT</p>
                          <div className="mt-4 flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default">
                             <img 
                               src="https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg" 
                               alt="Google AI Studio" 
                               className="w-4 h-4"
                               referrerPolicy="no-referrer"
                             />
                             <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Google AI Studio</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Integrity Statement */}
                  <div className="w-[calc(25%-16px)] shrink-0 bg-zinc-950 border border-white/5 rounded-[3rem] p-8 shadow-xl min-h-[220px]">
                    <div className="mb-6">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">System Details: INTEGRITY</p>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[11px] text-zinc-500 leading-relaxed font-black uppercase tracking-tighter">
                        "ELS represents the peak of financial transparency, ensuring absolute accuracy in enterprise asset tracking."
                      </p>
                      <div className="flex items-center gap-2 opacity-30 mt-4">
                        <span className="text-[8px] font-black text-zinc-600">V 2.4.0</span>
                        <div className="w-1 h-1 rounded-full bg-zinc-800" />
                        <span className="text-[8px] font-black text-zinc-600">ELS_CORE</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Target Audience */}
                  <div className="w-[calc(25%-16px)] shrink-0 bg-zinc-900 border border-white/5 rounded-[3rem] p-8 shadow-xl min-h-[220px]">
                    <div className="mb-6">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">System Details: ABOUT SYSTEM</p>
                    </div>
                    <div className="space-y-4">
                       <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-wise-green border border-white/5 mb-2">
                        <Info size={18} />
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-relaxed font-black uppercase tracking-tighter">
                        Ideal for shopkeepers, micro-enterprises, and accounting students looking to practice real-world financial recording on the go.
                      </p>
                    </div>
                  </div>

                  {/* Card 5: Contact Details */}
                  <div className="w-[calc(25%-16px)] shrink-0 bg-zinc-950 border border-white/5 rounded-[3rem] p-8 shadow-xl min-h-[220px]">
                    <div className="mb-6">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">System Details: CONTACT</p>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-wise-green border border-white/5">
                          <Mail size={18} />
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Connect</p>
                          <p className="text-[11px] font-black text-white whitespace-nowrap">nhelangeloantonio@gmail.com</p>
                          <p className="text-[11px] font-black text-zinc-400 mt-1">09564236794</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] animate-pulse">Swipe to explore system details</p>
            </div>
          </div>
        )}
      </div>

      <footer className="pt-12 pb-4 flex flex-col items-center gap-3 opacity-20 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-black border border-white/10 rounded-lg flex items-center justify-center text-wise-green">
             <ShieldCheck size={12} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Eleprim Ledger System</span>
        </div>
        <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-tighter">Terminal ID: {auth.currentUser?.uid.slice(0, 12)}</p>
      </footer>
    </div>
  );
}

function ProfileItem({ icon: Icon, label, value, isCapitalize }: any) {
  return (
    <div className="flex items-center gap-5">
      <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-zinc-600 border border-white/5 group-hover:border-zinc-700 transition-colors">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black mb-0.5">{label}</p>
        <p className={cn("text-white font-bold text-[15px]", isCapitalize && "capitalize")}>{value}</p>
      </div>
    </div>
  );
}

