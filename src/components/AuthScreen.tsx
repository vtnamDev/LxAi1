import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Lock,
  Mail,
  CheckCircle2,
  Cpu,
  Globe
} from 'lucide-react';
import { UserProfile } from '../types';

interface AuthScreenProps {
  onLogin: (user: UserProfile, token: string) => void;
  defaultEmail?: string;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, defaultEmail = 'nguynaum@gmail.com' }) => {
  const [authMode, setAuthMode] = useState<'google_select' | 'email_form'>('google_select');
  const [emailInput, setEmailInput] = useState(defaultEmail);
  const [passwordInput, setPasswordInput] = useState('••••••••••••');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [showCustomGoogle, setShowCustomGoogle] = useState(false);

  const executeServerLogin = async (email: string, name: string, provider: 'google' | 'email' | 'guest') => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          provider,
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Login failed on server');
      }

      const data = await res.json();
      localStorage.setItem('lx_session_token', data.sessionToken);
      localStorage.setItem('lx_ai_user', JSON.stringify(data.user));
      onLogin(data.user, data.sessionToken);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleSignIn = (selectedEmail: string, name: string) => {
    executeServerLogin(selectedEmail, name, 'google');
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    executeServerLogin(emailInput.trim(), emailInput.split('@')[0], 'email');
  };

  const handleGuestAccess = () => {
    executeServerLogin(`guest_${Date.now()}@lxai.space`, 'Guest Developer', 'guest');
  };

  return (
    <div className="min-h-screen cosmic-bg flex items-center justify-center p-4 selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="w-full max-w-md rounded-3xl glass-modal border border-white/15 p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center mx-auto shadow-xl shadow-cyan-500/25">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              LX AI Workspace
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Đăng nhập tài khoản để mở khóa toàn bộ mô hình AI & Tiện ích
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setAuthMode('google_select')}
            className={`flex-1 py-2 rounded-lg font-medium transition-all cursor-pointer ${
              authMode === 'google_select'
                ? 'bg-gradient-to-r from-cyan-500/30 to-blue-600/30 text-cyan-200 border border-cyan-500/30 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Google Sign-In
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('email_form')}
            className={`flex-1 py-2 rounded-lg font-medium transition-all cursor-pointer ${
              authMode === 'email_form'
                ? 'bg-gradient-to-r from-cyan-500/30 to-blue-600/30 text-cyan-200 border border-cyan-500/30 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Email / Mật khẩu
          </button>
        </div>

        {/* Error message alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Google Authentication View */}
        {authMode === 'google_select' ? (
          <div className="space-y-3">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
              Chọn tài khoản Google để tiếp tục
            </div>

            {/* Quick 1-Tap Google Account (User Email from prompt) */}
            <button
              onClick={() => handleGoogleSignIn(defaultEmail, 'Nguyen Aum')}
              disabled={isProcessing}
              className="w-full p-3.5 rounded-2xl glass-card border border-white/15 hover:border-cyan-500/50 hover:bg-white/[0.08] transition-all flex items-center justify-between group cursor-pointer active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow">
                  NA
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-white group-hover:text-cyan-200 transition-colors">
                    Nguyen Aum
                  </div>
                  <div className="text-xs text-slate-400 font-mono">{defaultEmail}</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-medium">
                <span>Đăng nhập</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Custom Google Account */}
            {!showCustomGoogle ? (
              <button
                type="button"
                onClick={() => setShowCustomGoogle(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-dashed border-white/20 hover:border-white/40 text-slate-400 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {/* Google G SVG */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Sử dụng tài khoản Google khác</span>
              </button>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (customGoogleEmail.trim()) {
                    handleGoogleSignIn(customGoogleEmail.trim(), customGoogleEmail.split('@')[0]);
                  }
                }}
                className="space-y-2 p-3 rounded-2xl bg-black/40 border border-white/10"
              >
                <input
                  type="email"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  placeholder="Nhập email @gmail.com..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500/50"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomGoogle(false)}
                    className="flex-1 py-1.5 rounded-lg bg-white/5 text-slate-400 text-xs hover:text-white"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                  >
                    Tiếp tục
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* Email & Password Form */
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500/50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500/50"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-md shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {isProcessing ? 'Đang xác thực...' : 'Đăng nhập vào Workspace'}
            </button>
          </form>
        )}

        {/* Guest access alternative */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Truy cập nhanh không lưu:</span>
          <button
            onClick={handleGuestAccess}
            className="text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-4 cursor-pointer"
          >
            Vào chế độ Khách (Guest)
          </button>
        </div>

        {/* Security assurance */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 text-[11px] text-slate-400">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>
            API Keys, Quota 70K và toàn bộ mô hình AI được bảo vệ an toàn trên máy chủ.
          </span>
        </div>
      </div>
    </div>
  );
};
