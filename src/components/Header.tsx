import React, { useState } from 'react';
import { Menu, Search, Mic, Sliders, Bell, CheckCircle2, X, MoreHorizontal } from 'lucide-react';
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
  theme: _theme,
  onToggleTheme: _onToggleTheme,
}) => {
  const [showTierDropdown, setShowTierDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const tiers: { id: PerformanceTier; label: string; desc: string }[] = [
    { id: 'full', label: 'Full Glass', desc: 'Rich blur & lighting' },
    { id: 'balanced', label: 'Balanced', desc: 'Production default' },
    { id: 'lite', label: 'Lite', desc: 'Lower GPU / battery' },
    { id: 'minimal', label: 'Minimal', desc: 'Maximum clarity' },
  ];

  return (
    <header className="glass-shell relative z-30 flex h-14 shrink-0 items-center gap-2 border-0 border-b border-white/10 px-2.5 sm:px-4">
      <button
        type="button"
        onClick={onToggleMobileMenu}
        className="higgs-control flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-slate-200 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-4.5 w-4.5" />
      </button>

      <button
        type="button"
        onClick={onOpenSearch}
        className="higgs-control flex min-w-0 flex-1 items-center gap-2 rounded-full border px-3 py-2 text-left text-xs text-slate-500 hover:text-slate-100 sm:max-w-sm"
      >
        <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="min-w-0 flex-1 truncate">Search chats, files, models…</span>
        <kbd className="hidden rounded bg-white/7 px-1.5 py-0.5 font-mono text-[9px] text-slate-400 sm:inline">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenVoicePartner}
          className="higgs-control hidden h-9 items-center gap-2 rounded-full border px-3 text-xs font-semibold text-slate-200 sm:flex"
        >
          <Mic className="h-3.5 w-3.5 text-cyan-200" />
          Voice
        </button>

        <div className="relative hidden md:block">
          <button
            type="button"
            onClick={() => setShowTierDropdown((value) => !value)}
            className="higgs-control flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold text-slate-200"
            title="Performance"
          >
            <Sliders className="h-3.5 w-3.5 text-violet-200" />
            <span className="capitalize">{tier}</span>
          </button>
          {showTierDropdown && (
            <div className="glass-modal absolute right-0 mt-2 w-64 rounded-2xl p-2 shadow-2xl">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">Visual performance</div>
              <div className="mt-1 space-y-1">
                {tiers.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { onChangeTier(item.id); setShowTierDropdown(false); }}
                    className={[\"w-full rounded-xl p-2 text-left transition\", tier === item.id ? \"bg-white/10 text-white\" : \"text-slate-400 hover:bg-white/5 hover:text-white\"].join(' ')}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{item.label}</span>
                      {tier === item.id && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />}
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-600">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowNotifications((value) => !value)}
          className="higgs-control relative flex h-9 w-9 items-center justify-center rounded-full border text-slate-200"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-300" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMore((value) => !value)}
            className="higgs-control flex h-9 w-9 items-center justify-center rounded-full border text-slate-200 md:hidden"
            aria-label="More"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {showMore && (
            <div className="glass-modal absolute right-0 mt-2 w-52 rounded-2xl p-2 shadow-2xl">
              <button type="button" onClick={onOpenVoicePartner} className="w-full rounded-xl px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/6">Voice Partner</button>
              <button type="button" onClick={() => setShowTierDropdown((value) => !value)} className="w-full rounded-xl px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/6">Performance: {tier}</button>
              <button type="button" onClick={_onToggleTheme} className="w-full rounded-xl px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/6">Toggle theme</button>
            </div>
          )}
        </div>

        {showNotifications && (
          <div className="glass-modal absolute right-2 top-14 w-[min(20rem,calc(100vw-1rem))] rounded-2xl p-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/8 pb-2">
              <span className="text-xs font-semibold text-white">Notifications</span>
              <button type="button" onClick={() => setShowNotifications(false)} className="rounded-full p-1 text-slate-500 hover:bg-white/6 hover:text-white"><X className="h-3.5 w-3.5" /></button>
            </div>
            <div className="mt-2 rounded-xl bg-white/4 p-2.5 text-xs text-slate-400">
              LX AI security, model routing and agent features are shown here when they need attention.
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
