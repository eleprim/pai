import React, { useState, useEffect } from 'react';
import { useAppearance, FontStyle, Density } from '../hooks/useAppearance';
import { Type, Grid, Palette, Check, Building2, Save, Image as ImageIcon } from 'lucide-react';
import { useReporting } from '../hooks/useReporting';
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

export function AppearanceSettings({ context }: { context: ReturnType<typeof useReporting> }) {
  const { settings: appearance, setSettings } = useAppearance();
  const { settings: appSettings, updateSettings } = context;
  const [orgName, setOrgName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (appSettings) {
      setOrgName(appSettings.orgName || '');
      setLogoUrl(appSettings.logoUrl || '');
    }
  }, [appSettings]);

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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 px-4 pb-12 pt-8 overflow-hidden">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tighter text-white">System Controls</h2>
        <p className="text-zinc-500 font-medium text-sm">Fine-tune your financial operational interface.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Organization Name & Currency */}
        <div className="bento-card p-8 flex flex-col gap-8 col-span-1 lg:col-span-2 border-white/5 bg-zinc-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <Building2 size={24} className="text-blue-500" />
              <h3 className="text-lg font-black tracking-tight">Enterprise Profile</h3>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={isSaving || (orgName === appSettings?.orgName && logoUrl === appSettings?.logoUrl)}
              className="btn-wise-primary h-12 px-6 justify-center shrink-0 uppercase tracking-widest font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {isSaving ? 'Syncing' : 'Apply Changes'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Ledger Entity Name</label>
                <input 
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Business Identity"
                  className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 font-bold text-base focus:outline-none focus:ring-1 focus:ring-white/20 transition-all text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Brand Logo URL</label>
                <div className="relative">
                  <input 
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full bg-black border border-white/5 rounded-2xl pl-12 pr-5 py-4 font-bold text-base focus:outline-none focus:ring-1 focus:ring-white/20 transition-all text-white"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                    <ImageIcon size={18} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Base Valuation Currency</label>
                <div className="relative">
                  <select 
                    value={appSettings?.currency || 'USD'}
                    onChange={(e) => handleUpdateCurrency(e.target.value)}
                    disabled={isSaving}
                    className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 font-bold text-base focus:outline-none focus:ring-1 focus:ring-white/20 transition-all text-white appearance-none cursor-pointer"
                  >
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code} className="bg-zinc-900">{c.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                    <Grid size={16} />
                  </div>
                </div>
              </div>
              
              {logoUrl && (
                <div className="p-4 bg-black border border-white/5 rounded-2xl flex items-center gap-4">
                  <img src={logoUrl} className="w-12 h-12 rounded-xl object-contain bg-white p-2" alt="Logo Preview" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150')} />
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Logo Preview</p>
                    <p className="text-xs text-zinc-400">Rendering optimization active</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Font Selection */}
        <div className="bento-card p-8 flex flex-col gap-6 bg-zinc-900/50 border-white/5">
          <div className="flex items-center gap-3 text-white">
            <Type size={24} className="text-blue-500" />
            <h3 className="text-lg font-black tracking-tight">Typography</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {(['sans', 'mono', 'display'] as FontStyle[]).map((f) => (
              <button
                key={f}
                onClick={() => setSettings({ ...appearance, font: f })}
                className={cn(
                  "flex items-center justify-between p-5 rounded-2xl border transition-all group",
                  appearance.font === f 
                    ? "bg-white border-white text-black shadow-lg" 
                    : "bg-black/40 border-white/5 text-zinc-500 hover:border-white/20"
                )}
              >
                <span className={cn(
                  "text-sm font-black uppercase tracking-widest px-2",
                  f === 'mono' ? 'font-mono' : f === 'display' ? 'font-black' : ''
                )}>
                  {f === 'sans' ? 'Modern Sans' : f === 'mono' ? 'Internal Mono' : 'Ultra Display'}
                </span>
                <div className={cn(
                  "w-6 h-6 rounded-full border flex items-center justify-center transition-all",
                  appearance.font === f ? "bg-black border-black" : "border-white/10"
                )}>
                  {appearance.font === f && <Check size={14} className="text-white" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Color Palette */}
        <div className="bento-card p-8 flex flex-col gap-6 bg-zinc-900/50 border-white/5">
          <div className="flex items-center gap-3 text-white">
            <Palette size={24} className="text-blue-500" />
            <h3 className="text-lg font-black tracking-tight">Interface Accent</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setSettings({ ...appearance, primaryColor: c.value })}
                className={cn(
                  "aspect-square rounded-[1.5rem] border-2 transition-all relative flex items-center justify-center",
                  appearance.primaryColor === c.value 
                    ? "border-white scale-105 shadow-xl" 
                    : "border-transparent opacity-40 hover:opacity-100 hover:scale-105 shadow-sm"
                )}
                style={{ backgroundColor: c.value }}
                title={c.name}
              >
                {appearance.primaryColor === c.value && <Check size={24} className="text-white drop-shadow-md" />}
              </button>
            ))}
          </div>
        </div>

        {/* UI Density */}
        <div className="bento-card p-8 flex flex-col gap-6 col-span-1 lg:col-span-2 bg-zinc-900 border-white/5">
          <div className="flex items-center gap-3 text-white">
            <Grid size={24} className="text-blue-500" />
            <h3 className="text-lg font-black tracking-tight">Terminal Density</h3>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            {(['comfortable', 'compact'] as Density[]).map((d) => (
              <button
                key={d}
                onClick={() => setSettings({ ...appearance, density: d })}
                className={cn(
                  "flex-1 p-8 rounded-[2rem] border transition-all text-left flex flex-col gap-4",
                  appearance.density === d 
                    ? "bg-white border-white text-black" 
                    : "bg-black/50 border-white/5 text-zinc-500 hover:border-white/20"
                )}
              >
                <div className={cn(
                  "flex flex-col gap-1.5 w-10 transition-all",
                  d === 'compact' ? 'scale-75 origin-left' : ''
                )}>
                  <div className={cn("h-1.5 w-full rounded-full", appearance.density === d ? 'bg-black' : 'bg-zinc-800')} />
                  <div className={cn("h-1.5 w-2/3 rounded-full", appearance.density === d ? 'bg-blue-600' : 'bg-zinc-700')} />
                  <div className={cn("h-1.5 w-full rounded-full", appearance.density === d ? 'bg-black' : 'bg-zinc-800')} />
                </div>
                <div>
                  <h4 className="font-black uppercase tracking-widest text-[10px] mb-1">{d} Layout</h4>
                  <p className="text-[11px] font-bold opacity-70 leading-relaxed">
                    {d === 'comfortable' ? 'Optimised for high-resolution visual clarity.' : 'Streamlined for maximum data visibility.'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 p-10 bg-zinc-900 border border-white/10 rounded-[3rem] flex flex-col md:flex-row items-center gap-8 text-center md:text-left shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors" />
        <div className="bg-blue-600/20 p-5 rounded-3xl relative z-10 shrink-0">
           <Palette className="text-blue-500" size={40} />
        </div>
        <div className="relative z-10">
          <h4 className="text-white text-xl font-black tracking-tight mb-2">Automated Identity Sync</h4>
          <p className="text-zinc-500 text-sm max-w-sm font-medium">Display attributes are persistantly mapped to your cloud-verified ledger profile across all authenticated nodes.</p>
        </div>
      </div>
    </div>
  );
}
