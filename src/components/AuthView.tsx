import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Logo } from './Logo';
import { LogIn, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

export function AuthView() {
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);

  const login = async () => {
    setIsAuthenticating(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-blocked') {
        alert("The sign-in window was blocked. Please enable pop-ups for this site or try opening the app in its own tab.");
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

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
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin"></span>
                Processing...
              </span>
            ) : (
              <>
                Sign in with Google
                <LogIn size={14} />
              </>
            )}
          </button>
          
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
