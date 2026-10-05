import React, { useState } from 'react';
import {
  ArrowUp,
  Paperclip,
  Mic,
  Globe2,
  Code2,
  FileText,
  MessageSquare,
  Zap,
  Brain,
  Sparkles,
  ChevronDown,
  Cpu,
  ShieldCheck,
  Search,
  Plus,
} from 'lucide-react';
import { ModeType, ModelInfo, Conversation, QuotaInfo } from '../types';

interface HomeViewProps {
  onSendMessage: (text: string, mode: ModeType, modelId: string, searchEnabled: boolean) => void;
  onOpenVoicePartner: () => void;
  onOpenModelSelector: () => void;
  onNavigate: (view: any) => void;
  selectedModel: ModelInfo;
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  quota: QuotaInfo | null;
}

const isGroq = (model: ModelInfo) => model.provider.toLowerCase() === 'groq' || model.id.startsWith('groq:');
const isDefaultGroq = (model: ModelInfo) => model.id === 'groq:openai/gpt-oss-20b';

export const HomeView: React.FC<HomeViewProps> = ({
  onSendMessage,
  onOpenVoicePartner,
  onOpenModelSelector,
  onNavigate,
  selectedModel,
  conversations,
  onSelectConversation,
  quota,
}) => {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<ModeType>('fast');
  const [searchEnabled, setSearchEnabled] = useState(false);

  const submit = (event?: React.FormEvent) => {
    event?.preventDefault();
    const value = inputText.trim();
    if (!value) return;
    onSendMessage(value, mode, selectedModel.id, searchEnabled);
    setInputText('');
  };

  const promptChips = [
    { label: 'Analyze code', icon: Code2, action: () => onNavigate('coding') },
    { label: 'Research', icon: Globe2, action: () => { setSearchEnabled(true); setInputText('Research '); } },
    { label: 'Files', icon: FileText, action: () => onNavigate('files') },
    { label: 'Voice', icon: Mic, action: onOpenVoicePartner },
  ];

  const updateGlass = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse') return;
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
    el.style.setProperty('--glass-x', x + '%');
    el.style.setProperty('--glass-y', y + '%');
    el.style.setProperty('--liquid-tilt-x', ((50 - y) * 0.055).toFixed(2) + 'deg');
    el.style.setProperty('--liquid-tilt-y', ((x - 50) * 0.055).toFixed(2) + 'deg');
  };

  const resetGlass = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse') return;
    event.currentTarget.style.setProperty('--glass-x', '50%');
    event.currentTarget.style.setProperty('--glass-y', '18%');
    event.currentTarget.style.setProperty('--liquid-tilt-x', '0deg');
    event.currentTarget.style.setProperty('--liquid-tilt-y', '0deg');
  };

  return (
    <div className="relative flex-1 min-h-0 overflow-y-auto">
      <div className="relative mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-5xl flex-col overflow-hidden px-4 pb-6 pt-6 sm:px-6 sm:pt-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden"><span className="higgs-hero-orb higgs-hero-orb--a" /><span className="higgs-hero-orb higgs-hero-orb--b" /></div><div className="relative z-10 flex flex-1 flex-col justify-center">
          <div className="mx-auto w-full max-w-3xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {isGroq(selectedModel) ? 'Groq LPU' : selectedModel.provider}
                  <span className="text-slate-600">•</span>
                  <span>{isDefaultGroq(selectedModel) ? 'Default model' : 'Live routing'}</span>
                </div>
                <h1 className="mt-2 bg-gradient-to-r from-white via-slate-100 to-violet-200 bg-clip-text text-[clamp(1.85rem,5vw,3.15rem)] font-semibold tracking-[-0.05em] text-transparent drop-shadow-[0_10px_35px_rgba(178,160,255,.10)]">
                  What can I help you build?
                </h1>
              </div>
              <button
                type="button"
                onClick={() => onOpenModelSelector()}
                className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white"
              >
                <Cpu className="h-3.5 w-3.5" />
                Models
              </button>
            </div>

            <div
              className="dynamic-glass glass-elevated rounded-[28px] border border-white/15 ring-1 ring-white/[0.025]"
              onPointerMove={updateGlass}
              onPointerLeave={resetGlass}
            >
              <form onSubmit={submit}>
                <div className="flex items-center justify-between border-b border-white/8 px-4 py-3 sm:px-5">
                  <button
                    type="button"
                    onClick={onOpenModelSelector}
                    className="flex min-w-0 items-center gap-2.5 rounded-full px-1.5 py-1 text-left hover:bg-white/[0.035]"
                  >
                    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#0b0d10]">
                      <Cpu className="h-4 w-4 text-slate-200" />
                      {isGroq(selectedModel) && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400" />}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="max-w-[190px] truncate text-xs font-semibold text-white sm:max-w-[300px] sm:text-sm">
                          {selectedModel.displayName}
                        </span>
                        {isDefaultGroq(selectedModel) && (
                          <span className="hidden rounded-md border border-emerald-400/20 bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[.12em] text-emerald-300 sm:inline">
                            Default
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-500 sm:text-[11px]">{selectedModel.provider}</span>
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                  </button>

                  <div className="hidden items-center gap-1 rounded-full border border-white/8 bg-black/20 p-1 sm:flex">
                    {([
                      ['fast', 'Fast', Zap],
                      ['thinking', 'Think', Brain],
                      ['auto', 'Auto', Sparkles],
                    ] as const).map(([id, label, Icon]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setMode(id)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium ${mode === id ? 'bg-white text-black' : 'text-slate-400 hover:text-white'}`}
                      >
                        <Icon className="h-3 w-3" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  autoFocus
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      submit();
                    }
                  }}
                  rows={4}
                  placeholder="Ask anything..."
                  className="min-h-[150px] w-full resize-none bg-transparent px-4 py-4 text-[15px] leading-7 text-white outline-none placeholder:text-slate-600 sm:min-h-[170px] sm:px-5 sm:text-base"
                />

                <div className="flex items-center justify-between border-t border-white/8 px-3 py-3 sm:px-4">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onNavigate('files')}
                      className="higgs-control flex h-9 w-9 items-center justify-center rounded-full border text-slate-300 transition hover:bg-white/[0.10] hover:text-white"
                      title="Files"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchEnabled((v) => !v)}
                      className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs ${searchEnabled ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200' : 'border-white/8 bg-white/[0.025] text-slate-400 hover:bg-white/[0.06] hover:text-white'}`}
                    >
                      <Search className="h-3.5 w-3.5" />
                      Search
                    </button>
                    <button
                      type="button"
                      onClick={onOpenVoicePartner}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/8 bg-white/[0.025] text-slate-400 hover:bg-white/[0.06] hover:text-white sm:w-auto sm:px-3"
                      title="Voice"
                    >
                      <Mic className="h-4 w-4" />
                      <span className="ml-1.5 hidden text-xs sm:inline">Voice</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 hover:bg-slate-100 disabled:opacity-25"
                    title="Send"
                  >
                    <ArrowUp className="h-4 w-4 stroke-[2.7]" />
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {promptChips.map(({ label, icon: Icon, action }) => (
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  className="higgs-chip inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-7 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-slate-600">
                <ShieldCheck className="h-3.5 w-3.5" />
                Server-side session · live provider routing
              </div>
              <div className="text-[10px] text-slate-600">
                {quota ? `${quota.usedTokens.toLocaleString()} / ${quota.limitTokens.toLocaleString()} tokens` : 'Quota ready'}
              </div>
            </div>
          </div>

          <div className="mx-auto mt-8 w-full max-w-3xl">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Recent chats</span>
              <button
                type="button"
                onClick={() => onNavigate('chat')}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-white"
              >
                <Plus className="h-3 w-3" /> New chat
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {conversations.slice(0, 3).map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onSelectConversation(conversation.id)}
                  className="higgs-chip group rounded-2xl border p-3 text-left"
                >
                  <div className="flex items-center gap-2 text-[10px] text-slate-600">
                    <MessageSquare className="h-3 w-3" />
                    {conversation.mode}
                  </div>
                  <div className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-300 group-hover:text-white">
                    {conversation.title || 'Untitled conversation'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
