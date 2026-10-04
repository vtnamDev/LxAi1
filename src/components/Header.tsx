import React, { useState } from 'react';
import {
  Menu,
  Search,
  Mic,
  Sun,
  Moon,
  Sparkles,
  Sliders,
  Shield,
  Bell,
  CheckCircle2,
  X,
  Download
} from 'lucide-react';
import { PerformanceTier } from '../types';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  onOpenVoicePartner: () => void;
  onOpenSearch: () => void;
  tier: PerformanceTier;
  onChangeTier: (tier: PerformanceTier) => void;
  theme: string;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  onOpenVoicePartner,
  onOpenSearch,
  tier,
  onChangeTier,
  theme,
  onToggleTheme,
}) => {
  const [showTierDropdown, setShowTierDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadZip = async () => {
    setIsDownloading(true);
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
    } catch (err) {
      window.open('https://litter.catbox.moe/ydvexc.zip', '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const tiers: { id: PerformanceTier; label: string; desc: string }[] = [
    { id: 'full', label: 'Full Glass', desc: 'Heavy blur & rich cosmic dynamic lighting' },
    { id: 'balanced', label: 'Balanced', desc: 'Standard production glass & smooth 60fps' },
    { id: 'lite', label: 'Lite Mode', desc: 'Low blur, high surface opacity for battery' },
    { id: 'minimal', label: 'Minimal', desc: 'Zero blur, solid high-contrast borders' },
  ];

  return (
    <header className="h-14 sm:h-16 shrink-0 px-3 sm:px-5 flex items-center justify-between border-b border-white/8 glass-shell sticky top-0 z-30">
      {/* Left: Mobile Menu & Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 lg:hidden cursor-pointer"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search trigger bar */}
        <button
          onClick={onOpenSearch}
          className="flex-1 max-w-[22rem] flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.025] border border-white/8 hover:bg-white/[0.05] hover:border-white/12 text-slate-500 hover:text-slate-200 transition-all text-xs cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            <span className="truncate">Search chats, models, files...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-slate-300 font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Download Deploy ZIP Button */}
        <button
          onClick={handleDownloadZip}
          disabled={isDownloading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 text-slate-200 text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95 group disabled:opacity-50"
          title="Download complete project ZIP to deploy immediately"
        >
          <Download className={`w-3.5 h-3.5 text-cyan-400 group-hover:translate-y-0.5 transition-transform ${isDownloading ? 'animate-bounce' : ''}`} />
          <span className="hidden md:inline">{isDownloading ? 'Downloading...' : 'Deploy ZIP'}</span>
        </button>

        {/* Quick Voice Partner Action Button */}
        <button
          onClick={onOpenVoicePartner}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-200 hover:text-white text-xs font-medium shadow-sm transition-all cursor-pointer active:scale-95 group"
          title="Start real-time voice conversation partner"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Mic className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Voice Partner</span>
        </button>

        {/* Performance Tier Selector */}
        <div className="relative">
          <button
            onClick={() => setShowTierDropdown(!showTierDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            title="Dynamic Glass Performance Tier"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="capitalize hidden md:inline">{tier}</span>
          </button>

          {showTierDropdown && (
            <div className="absolute right-0 mt-2 w-64 p-2 rounded-2xl glass-modal shadow-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                Dynamic Glass Tier
              </div>
              <div className="space-y-1 mt-1">
                {tiers.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onChangeTier(t.id);
                      setShowTierDropdown(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl text-xs flex items-start justify-between cursor-pointer transition-colors ${
                      tier === t.id
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <div className="font-medium capitalize">{t.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{t.desc}</div>
                    </div>
                    {tier === t.id && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title={`Theme: ${theme}`}
        >
          {theme === 'cosmic' ? <Moon className="w-4 h-4 text-cyan-300" /> : <Sun className="w-4 h-4 text-amber-300" />}
        </button>

        {/* Notifications Icon */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-colors relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 p-3 rounded-2xl glass-modal shadow-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-semibold text-white">Notifications</span>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                <div className="p-2.5 rounded-xl bg-white/5 text-xs">
                  <div className="text-cyan-300 font-medium">Groq Default Route Active</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    GPT OSS 20B on Groq is the default chat route and live model catalog is enabled.
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 text-xs">
                  <div className="text-emerald-300 font-medium">70,000 Free Quota Ready</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Your hourly token limit is initialized. Redeem voucher for 24h unlimited access.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
