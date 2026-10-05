import React, { useState } from 'react';
import {
  Menu,
  Search,
  Mic,
  Sun,
  Moon,
  Sliders,
  Bell,
  CheckCircle2,
  X
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
  const tiers: { id: PerformanceTier; label: string; desc: string }[] = [
    { id: 'full', label: 'Full Glass', desc: 'Heavy blur & rich cosmic dynamic lighting' },
    { id: 'balanced', label: 'Balanced', desc: 'Standard production glass & smooth 60fps' },
    { id: 'lite', label: 'Lite Mode', desc: 'Low blur, high surface opacity for battery' },
    { id: 'minimal', label: 'Minimal', desc: 'Zero blur, solid high-contrast borders' },
  ];

  return (
    <header className="glass-shell h-14 shrink-0 px-3 sm:px-5 flex items-center justify-between border-0 border-b border-white/10 sticky top-0 z-30">
      {/* Left: Mobile Menu & Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 lg:hidden cursor-pointer"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search trigger bar */}
        <button
          onClick={onOpenSearch}
          className="higgs-control flex-1 max-w-[22rem] flex items-center justify-between px-3 py-2 rounded-full border text-slate-500 hover:text-slate-100 transition-all text-xs cursor-pointer group"
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
        {/* Quick Voice Partner Action Button */}
        <button
          onClick={onOpenVoicePartner}
          className="higgs-control hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-slate-200 hover:text-white text-xs font-medium transition-all cursor-pointer"
          title="Start real-time voice conversation partner"
        >
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <Mic className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Voice Partner</span>
        </button>

        {/* Performance Tier Selector */}
        <div className="relative">
          <button
            onClick={() => setShowTierDropdown(!showTierDropdown)}
            className="higgs-control flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-slate-200 text-xs font-medium transition-colors cursor-pointer"
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
          className="higgs-control p-2 rounded-full border text-slate-200 hover:text-white transition-colors cursor-pointer"
          title={`Theme: ${theme}`}
        >
          {theme === 'cosmic' ? <Moon className="w-4 h-4 text-cyan-300" /> : <Sun className="w-4 h-4 text-amber-300" />}
        </button>

        {/* Notifications Icon */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="higgs-control p-2 rounded-full border text-slate-200 hover:text-white transition-colors relative cursor-pointer"
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
