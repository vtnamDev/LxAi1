import React, { useState } from 'react';
import {
  Search,
  Check,
  X,
  Sparkles,
  Zap,
  Code2,
  Eye,
  Brain,
  Mic,
  Cpu,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { ModelInfo } from '../types';

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: ModelInfo[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
}

export const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({
  isOpen,
  onClose,
  models,
  selectedModelId,
  onSelectModel,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'text' | 'vision' | 'code' | 'reasoning' | 'voice'>('all');

  if (!isOpen) return null;

  const filteredModels = models.filter((m) => {
    const matchesSearch =
      m.displayName.toLowerCase().includes(search.toLowerCase()) ||
      m.provider.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'all') return true;
    if (filter === 'vision') return m.capabilities.includes('vision');
    if (filter === 'code') return m.capabilities.includes('code');
    if (filter === 'reasoning') return m.capabilities.includes('reasoning') || m.id.includes('pro');
    if (filter === 'voice') return m.capabilities.includes('voice') || m.capabilities.includes('audio');
    return true;
  });

  // Group by provider
  const orderedModels = [...filteredModels].sort((a, b) => {
    const rank = (m: ModelInfo) => m.id === 'groq:openai/gpt-oss-20b' ? 0 : m.provider.toLowerCase() === 'groq' ? 1 : 2;
    return rank(a) - rank(b) || a.displayName.localeCompare(b.displayName);
  });
  const providers = Array.from(new Set(orderedModels.map((m) => m.provider)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-3xl glass-modal border border-white/15 p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Select Intelligence Model</h3>
              <p className="text-xs text-slate-400">Live provider catalog · exact routing · no silent substitution</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Capability Filter Tabs */}
        <div className="py-3 space-y-2 border-b border-white/10">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by model name, provider, or ID..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'All Models' },
              { id: 'voice', label: 'Voice & Live' },
              { id: 'reasoning', label: 'Deep Reasoning' },
              { id: 'code', label: 'Coding' },
              { id: 'vision', label: 'Multimodal' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  filter === f.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Model List by Provider */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {providers.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No models match your search criteria.
            </div>
          ) : (
            providers.map((provider) => {
              const providerModels = orderedModels.filter((m) => m.provider === provider);
              return (
                <div key={provider} className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">
                    {provider}
                  </div>
                  <div className="space-y-1.5">
                    {providerModels.map((m) => {
                      const isSelected = selectedModelId === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => {
                            onSelectModel(m.id);
                            onClose();
                          }}
                          className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-cyan-500/15 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                              : 'bg-white/5 border-white/5 hover:border-white/15 hover:bg-white/[0.07]'
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white tracking-tight">
                                {m.displayName}
                              </span>
                              {(m.id === 'groq:openai/gpt-oss-20b' || (m.isDefault && m.provider.toLowerCase() === 'groq')) && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                  Default
                                </span>
                              )}
                              {m.id.includes('live') && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  Voice Live
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                              {m.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500">
                              <span>Context: {(m.contextWindow / 1000).toFixed(0)}K</span>
                              <span>·</span>
                              <span className="capitalize text-emerald-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                {m.status}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center">
                            {isSelected ? (
                              <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold">
                                <Check className="w-4 h-4 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full border border-white/20" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
