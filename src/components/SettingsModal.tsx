import React, { useState } from 'react';
import {
  X,
  Settings,
  Sliders,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
  Lock,
  RotateCcw,
  Download
} from 'lucide-react';
import { PerformanceTier, QuotaInfo } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: PerformanceTier;
  onChangeTier: (tier: PerformanceTier) => void;
  quota: QuotaInfo | null;
  onRedeemVoucher: (code: string) => Promise<boolean>;
  onRefreshQuota: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  tier,
  onChangeTier,
  quota,
  onRedeemVoucher,
  onRefreshQuota,
}) => {
  const [voucherCode, setVoucherCode] = useState('');
  const [redeemMessage, setRedeemMessage] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  if (!isOpen) return null;

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;

    setIsRedeeming(true);
    const success = await onRedeemVoucher(voucherCode.trim());
    setIsRedeeming(false);

    if (success) {
      setRedeemMessage('✅ Voucher applied successfully! 24H Unlimited Pass is now active.');
      setVoucherCode('');
      onRefreshQuota();
    } else {
      setRedeemMessage('❌ Invalid voucher code. Try FREE_24H or LXAI2026.');
    }
  };

  const tiers: { id: PerformanceTier; label: string; desc: string }[] = [
    {
      id: 'full',
      label: 'Full (Flagship Desktop)',
      desc: 'Heavy blur (16px), saturated glass, ambient dynamic nebula lighting, rich micro-interactions.',
    },
    {
      id: 'balanced',
      label: 'Balanced (Standard)',
      desc: 'Controlled blur (10px), optimized shadows, buttery-smooth 60fps scrolling and typing.',
    },
    {
      id: 'lite',
      label: 'Lite (Mobile / Battery Saver)',
      desc: 'Low blur (3px), high-opacity surfaces (90%), minimal transitions, preserved clarity.',
    },
    {
      id: 'minimal',
      label: 'Minimal (Accessibility)',
      desc: 'Zero blur, high-contrast crisp 1px borders, instantaneous transitions, reduced motion.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-3xl glass-modal border border-white/15 p-6 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Workspace Settings</h3>
              <p className="text-xs text-slate-400">Adaptive Dynamic Glass, Quotas, and Security Policies</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto flex-1 pr-1 text-xs">
          {/* Dynamic Glass Hardware Acceleration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Dynamic Glass Performance Tier</span>
              </span>
              <span className="text-[10px] text-cyan-300 font-mono">Active: {tier.toUpperCase()}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tiers.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onChangeTier(t.id)}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    tier === t.id
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-white shadow-md'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>{t.label}</span>
                    {tier === t.id && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Quota & 24H Pass Voucher */}
          <div className="p-4 rounded-2xl glass-card border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>70,000 Free Quota Management</span>
              </span>
              {quota?.hasFree24h ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium text-[10px]">
                  FREE_24H Active
                </span>
              ) : (
                <span className="text-slate-400 font-mono text-[11px]">
                  {quota?.usedTokens.toLocaleString()} / 70K tokens
                </span>
              )}
            </div>

            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-300"
                style={{ width: `${quota?.percentage ?? 20}%` }}
              />
            </div>

            {/* Voucher Form */}
            <form onSubmit={handleRedeem} className="flex gap-2 pt-1">
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder="Enter voucher code (e.g. FREE_24H)..."
                className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs outline-none focus:border-cyan-500/50"
              />
              <button
                type="submit"
                disabled={isRedeeming || !voucherCode.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-xs hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer disabled:opacity-40"
              >
                Redeem
              </button>
            </form>
            {redeemMessage && (
              <div className="text-[11px] font-medium pt-1 text-slate-300">{redeemMessage}</div>
            )}
          </div>

          {/* Clean Deploy Package ZIP */}
          <div className="p-4 rounded-2xl glass-card border border-cyan-500/30 bg-cyan-950/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Deploy Package (lxai-vercel-deploy.zip)</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">Ready to Deploy</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Clean production package containing the complete source, Gemini 3.8 Live API WebSocket server, Dynamic Glass UI, and deploy configs.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/download/deploy-zip');
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'lxai-vercel-deploy.zip';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  } catch (e) {
                    window.open('https://litter.catbox.moe/ydvexc.zip', '_blank');
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Directly (Browser)</span>
              </button>
              <a
                href="https://litter.catbox.moe/ydvexc.zip"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-medium transition-colors"
              >
                <span>Mirror Link (Catbox)</span>
              </a>
            </div>
          </div>

          {/* Security & Secret Invariant Info */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Security & Credential Boundary</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              In accordance with LX AI Rule C & Rule F, provider API keys, Gemini tokens, and database secrets remain strictly server-side inside <code className="text-cyan-300 font-mono">server.ts</code>. The browser client receives only sanitized tokens and zero raw credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
