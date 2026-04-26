import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Logo } from './Logo';
import { LogIn, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

export function AuthView() {
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);
  const [authStatus, setAuthStatus] = React.useState<string | null>(null);

  const login = async () => {
    setIsAuthenticating(true);
    setAuthStatus("Opening Google Sign-in...");
    
    // Set a timeout to reset state if the popup doesn't return
    const timeout = setTimeout(() => {
      setAuthStatus(null);
      setIsAuthenticating(false);
    }, 45000); // 45 seconds timeout

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      clearTimeout(timeout);
    } catch (err: any) {
      clearTimeout(timeout);
      console.error(err);
      if (err.code === 'auth/popup-blocked') {
        alert("The sign-in window was blocked. Please enable pop-ups or try the 'Open in New Tab' button below.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        alert("Login was cancelled. Please try again.");
      } else if (err.code === 'auth/unauthorized-domain' || err.message?.includes('auth/invalid-auth-endpoint')) {
        alert("Domain Not Authorized: You must add " + window.location.hostname + " to 'Authorized Domains' in your Firebase Authentication settings.");
      } else if (err.message?.includes('missing initial state')) {
        alert("Login Error: Browser storage is blocked. This happens inside frames. Use the 'Open in New Tab' button below.");
      } else {
        alert("Login failed: " + (err.message || 'Unknown error'));
      }
      setAuthStatus(null);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const isInIframe = window.self !== window.top;

  return (
    <div className="min-h-screen bg-wise-bg flex flex-col items-center justify-center p-6 selection:bg-wise-green/30">
      <div className="w-full max-w-sm space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex flex-col items-center text-center gap-6">
          <Logo className="h-12" />
        </div>

        <div className="wise-card p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center space-y-8">
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-white tracking-tight">Welcome back</h2>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium">Log in to manage your professional accounts with eleprim.</p>
          </div>
          
          {(isInIframe || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) ? (
            <div className="space-y-6 pt-4 border-t border-white/5">
              <div className="space-y-4">
                <p className="text-[10px] text-zinc-400 font-medium px-4 leading-relaxed">
                  Google login requires a secure popup. This is often blocked or broken on mobile and inside preview frames.
                </p>
                <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5 space-y-3">
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Recommended Action</p>
                  <button 
                    onClick={() => window.open(window.location.href, '_blank')}
                    className="w-full py-4 rounded-[1.5rem] bg-wise-green text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-wise-green/10"
                  >
                    <ShieldCheck size={14} />
                    Login in New Tab
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={login}
                  disabled={isAuthenticating}
                  className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest hover:text-zinc-300 transition-colors py-2"
                >
                  {isAuthenticating ? "Trying standard login..." : "Or try standard login (may fail)"}
                </button>
                {isAuthenticating && (
                   <button 
                    onClick={() => { setIsAuthenticating(false); setAuthStatus(null); }}
                    className="text-[8px] text-red-500 font-black uppercase tracking-widest"
                   >
                     Reset Locked State
                   </button>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={login}
              disabled={isAuthenticating}
              className={cn(
                "w-full flex items-center justify-center gap-4 py-5 rounded-[2rem] font-black uppercase tracking-widest transition-all active:scale-[0.98] text-[10px]",
                isAuthenticating 
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                  : "bg-wise-green text-black hover:brightness-110 shadow-xl shadow-wise-green/20"
              )}
            >
              {isAuthenticating ? (
                <span className="flex flex-col items-center gap-2">
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-zinc-700 border-t-wise-green rounded-full animate-spin"></span>
                    <span className="text-white">{authStatus || "Processing..."}</span>
                  </span>
                  <span className="text-[8px] text-zinc-500 lowercase">Don't close the popup window</span>
                </span>
              ) : (
                <>
                  Sign in with Google
                  <LogIn size={14} />
                </>
              )}
            </button>
          )}
          
          <div className="pt-4 flex flex-col items-center gap-4">
             <div className="flex items-center gap-2 text-[10px] font-black text-wise-green bg-wise-green/10 px-4 py-2 rounded-full border border-wise-green/10 uppercase tracking-widest">
               <ShieldCheck size={12} />
               Secure Cloud Accounting
             </div>
          </div>
        </div>

        <footer className="text-center">
          <div className="flex justify-center gap-8 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            <span>Verified System</span>
            <span>Real-Time Audit</span>
          </div>
          <p className="mt-8 text-gray-300 text-[9px] font-medium max-w-xs mx-auto">By signing in, you agree to our Terms of Use and Privacy Policy. Ledger v1.2</p>
        </footer>
      </div>
    </div>
  );
}
