import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Sparkles, UserRound, AlertCircle, LogIn } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthScreenProps {
  onLogin: (user: UserProfile, token: string) => void;
  defaultEmail?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            ux_mode?: 'popup' | 'redirect';
          }) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
          prompt?: () => void;
        };
      };
    };
  }
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadGoogle = async () => {
      try {
        const configRes = await fetch('/api/auth/google/config');
        const config = await configRes.json();
        if (!config?.clientId) {
          throw new Error('Google Login chưa được cấu hình trên máy chủ.');
        }
        if (cancelled) return;
        setGoogleClientId(config.clientId);

        const render = () => {
          if (cancelled || !googleButtonRef.current || !window.google) return;
          googleButtonRef.current.innerHTML = '';
          window.google.accounts.id.initialize({
            client_id: config.clientId,
            callback: async ({ credential }) => {
              setProcessing(true);
              setErrorMessage(null);
              try {
                const res = await fetch('/api/auth/google', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ credential }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data.error || 'Google authentication failed.');
                localStorage.setItem('lx_session_token', data.sessionToken);
                localStorage.setItem('lx_ai_user', JSON.stringify(data.user));
                onLogin(data.user, data.sessionToken);
              } catch (err: any) {
                setErrorMessage(err?.message || 'Google authentication failed.');
              } finally {
                setProcessing(false);
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
            ux_mode: 'popup',
          });
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            width: Math.min(380, googleButtonRef.current.clientWidth || 380),
            logo_alignment: 'left',
          });
        };

        if (window.google) {
          render();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = render;
        script.onerror = () => setErrorMessage('Không tải được Google Sign-In. Kiểm tra kết nối mạng.');
        document.head.appendChild(script);
      } catch (err: any) {
        if (!cancelled) setErrorMessage(err?.message || 'Không thể khởi tạo Google Sign-In.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadGoogle();
    return () => {
      cancelled = true;
    };
  }, [onLogin]);

  const handleGuest = async () => {
    setProcessing(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/auth/guest', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Guest access failed.');
      localStorage.setItem('lx_session_token', data.sessionToken);
      localStorage.setItem('lx_ai_user', JSON.stringify(data.user));
      onLogin(data.user, data.sessionToken);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Guest access failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen cosmic-bg flex items-center justify-center p-4 selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="w-full max-w-md rounded-3xl glass-modal border border-white/15 p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center mx-auto shadow-xl shadow-cyan-500/25">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">LX AI Workspace</h1>
            <p className="text-sm text-slate-400 mt-2">
              Đăng nhập bằng tài khoản Google thật để truy cập Workspace.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-sm text-rose-300 flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-3">
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Google Sign-In
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-3 min-h-[52px] flex items-center justify-center">
            <div ref={googleButtonRef} className="w-full flex justify-center" />
          </div>

          {loading && (
            <div className="text-center text-xs text-slate-500">Đang tải Google Sign-In…</div>
          )}

          {!googleClientId && !loading && (
            <div className="text-xs text-amber-300 text-center">
              Quản trị viên cần cấu hình GOOGLE_CLIENT_ID trên Vercel.
            </div>
          )}

          {processing && (
            <div className="text-center text-xs text-cyan-300 flex items-center justify-center gap-2">
              <LogIn className="w-4 h-4 animate-pulse" />
              Đang xác thực với Google…
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-slate-500">Không muốn đăng nhập Google?</span>
          <button
            type="button"
            onClick={handleGuest}
            disabled={processing}
            className="text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-4 disabled:opacity-50"
          >
            Vào chế độ Khách
          </button>
        </div>

        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 text-[11px] text-slate-400">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>
            LX AI xác minh ID token của Google ở máy chủ trước khi tạo phiên đăng nhập.
          </span>
        </div>
      </div>
    </div>
  );
};
