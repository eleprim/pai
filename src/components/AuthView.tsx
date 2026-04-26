import React from 'react';
import { motion } from 'motion/react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Logo } from './Logo';
import { LogIn, ShieldCheck, Mail, Lock } from 'lucide-react';
import { cn } from '../lib/utils';

export function AuthView() {
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);
  const [authStatus, setAuthStatus] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLocal, setIsLocal] = React.useState(false);
  const [isRegistering, setIsRegistering] = React.useState(false);

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
      } else {
        alert("Login failed: " + (err.message || 'Unknown error'));
      }
      setAuthStatus(null);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthStatus(isRegistering ? "Creating account..." : "Signing in...");
    try {
        if (isRegistering) {
            await createUserWithEmailAndPassword(auth, email, password);
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
    } catch (err: any) {
        console.error(err);
        alert((isRegistering ? "Registration" : "Login") + " failed: " + (err.message || 'Unknown error'));
    } finally {
        setIsAuthenticating(false);
        setAuthStatus(null);
    }
  };

  const isInIframe = window.self !== window.top;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm space-y-12"
      >
        <div className="flex flex-col items-center text-center gap-6">
          <Logo className="h-12" />
        </div>

        <div className="wise-card p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center space-y-8">
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-white tracking-tight">
                {isLocal ? (isRegistering ? "Create Account" : "Local Sign In") : "Welcome back"}
            </h2>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium">Log in to manage your professional accounts with eleprim.</p>
          </div>
          
          {isLocal ? (
            <form onSubmit={handleLocalSubmit} className="space-y-4">
               <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-zinc-500" size={16} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full bg-zinc-800 p-3 pl-10 rounded-xl text-white outline-none focus:ring-2 focus:ring-wise-green" required />
               </div>
               <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-zinc-500" size={16} />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-zinc-800 p-3 pl-10 rounded-xl text-white outline-none focus:ring-2 focus:ring-wise-green" required />
               </div>
               <button type="submit" disabled={isAuthenticating} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition">
                 {isAuthenticating ? "Processing..." : (isRegistering ? "Create Account" : "Sign In")}
               </button>
               <button type="button" onClick={() => { setIsLocal(false); setIsRegistering(false); }} className="text-zinc-500 text-xs hover:text-white">Back to Google Sign-in</button>
               <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="block w-full text-zinc-500 text-xs hover:text-white underline">
                   {isRegistering ? "Already have an account? Sign In" : "Need an account? Create one"}
               </button>
            </form>
          ) : (
            <div className="space-y-4">
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
              <button onClick={() => setIsLocal(true)} className="text-zinc-500 text-xs hover:text-white">Or use Email & Password</button>
            </div>
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
      </motion.div>
    </div>
  );
}
