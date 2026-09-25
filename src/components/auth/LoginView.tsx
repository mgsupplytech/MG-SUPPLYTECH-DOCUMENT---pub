import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Laptop
} from 'lucide-react';
import { MGLogo } from '../brand/BrandLogos';
import { authService, DEFAULT_AUTH_CONFIG } from '../../services/authService';
import { AuthUser } from '../../types';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [loginId, setLoginId] = useState(DEFAULT_AUTH_CONFIG.defaultLoginId);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await authService.login(loginId, password, rememberMe);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDefaults = () => {
    setLoginId(DEFAULT_AUTH_CONFIG.defaultLoginId);
    setPassword(DEFAULT_AUTH_CONFIG.defaultPassword);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-[#00241E] via-[#003A30] to-[#014136] text-white relative overflow-hidden">
      {/* Decorative background grid and lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(223,188,100,0.12),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(1,65,54,0.4),transparent_50%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Main Card */}
        <div className="bg-white/95 dark:bg-[#101b19]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-[#223531] p-6 sm:p-8 text-[#16211F] dark:text-[#E3ECE8]">
          {/* Header Branding */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#003A30] shadow-lg mb-3 border border-[#DFBC64]/40">
              <MGLogo size={52} variant="original" />
            </div>

            <h1 className="text-2xl font-black uppercase tracking-tight text-[#003A30] dark:text-white font-['Playfair_Display',Georgia,serif]">
              MG SUPPLYTECH
            </h1>
            <div className="text-[10px] font-extrabold tracking-[0.25em] text-[#B88C2E] uppercase mt-0.5">
              DOCUMENT MAKER &bull; COMMERCIAL SUITE
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Sign in with your Login ID &amp; Password to access commercial records.
            </p>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Login ID Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#003A30] dark:text-[#DFBC64] mb-1.5">
                Login ID / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. info@mgsupplytech.com or admin"
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-[#152220] border border-slate-200 dark:border-[#2a3f3b] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003A30] dark:focus:ring-[#DFBC64] transition"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#003A30] dark:text-[#DFBC64] mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-10 py-2.5 text-xs font-mono rounded-xl bg-slate-50 dark:bg-[#152220] border border-slate-200 dark:border-[#2a3f3b] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003A30] dark:focus:ring-[#DFBC64] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-[#003A30] focus:ring-[#DFBC64] border-slate-300"
                />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Keep me signed in</span>
              </label>

              <span className="text-[11px] text-[#B88C2E] font-semibold">
                Commercial Desk Only
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#003A30] hover:bg-[#014136] text-[#DFBC64] hover:text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-[#DFBC64] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Helper */}
          <div className="mt-5 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-amber-900 dark:text-amber-300 text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#B88C2E]" />
                Standard Credentials
              </span>
              <button
                type="button"
                onClick={handleFillDefaults}
                className="text-[10px] font-bold text-[#003A30] dark:text-[#DFBC64] hover:underline flex items-center gap-1 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded"
              >
                <Sparkles className="w-3 h-3 text-[#B88C2E]" />
                Auto-fill
              </button>
            </div>
            <div className="font-mono text-[10.5px] text-amber-950 dark:text-amber-200/90 space-y-0.5">
              <div><b>Login ID:</b> <code className="bg-white/60 dark:bg-black/30 px-1 rounded">{DEFAULT_AUTH_CONFIG.defaultLoginId}</code> or <code className="bg-white/60 dark:bg-black/30 px-1 rounded">admin</code></div>
              <div><b>Password:</b> <code className="bg-white/60 dark:bg-black/30 px-1 rounded">{DEFAULT_AUTH_CONFIG.defaultPassword}</code></div>
            </div>
          </div>

          {/* Security Subtext */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-[#223531] flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-500" />
              Secure B2B Storage
            </span>
            <span className="flex items-center gap-1">
              <Laptop className="w-3 h-3 text-slate-400" />
              macOS &bull; Windows &bull; Mobile
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
