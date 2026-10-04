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
  Gauge,
  Search,
  Layers3,
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
const isGptOss20B = (model: ModelInfo) => model.id === 'groq:openai/gpt-oss-20b';

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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const updateGlass = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse') return;
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--glass-x', `${Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100))}%`);
    el.style.setProperty('--glass-y', `${Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100))}%`);
  };

  const resetGlass = (event: React.PointerEvent<HTMLElement>) => {
    const el = event.currentTarget;
    el.style.removeProperty('--glass-x');
    el.style.removeProperty('--glass-y');
  };

  const submit = (event?: React.FormEvent) => {
    event?.preventDefault();
    const value = inputText.trim();
    if (!value) return;
    onSendMessage(value, mode, selectedModel.id, searchEnabled);
    setInputText('');
  };

  const promptChips = [
    { label: 'Analyze code', icon: Code2, action: () => onNavigate('coding') },
    { label: 'Research', icon: Globe2, action: () => { setSearchEnabled(true); setInputText('Research this topic with current sources: '); } },
    { label: 'Files', icon: FileText, action: () => onNavigate('files') },
    { label: 'Voice', icon: Mic, action: onOpenVoicePartner },
  ];

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-8">
        <section className="min-h-full flex flex-col">
          <div className="relative pt-2 sm:pt-6">
            <div className="pointer-events-none absolute -top-10 left-1/2 h-40 w-[32rem] -translate-x-1/2 rounded-full bg-cyan-300/[0.035] blur-3xl" />
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(74,222,128,.55)]" />
                {isGroq(selectedModel) ? 'Groq LPU' : 'LX AI'}
              </span>
              <span className="text-[10px] text-slate-500">Private workspace · live routing</span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="max-w-3xl text-[clamp(2.15rem,7vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.055em] text-white">
                  {greeting}.
                  <span className="block text-white/35">What are we building?</span>
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-[15px]">
                  One fast workspace for coding, research, files, reasoning and multi-model work.
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.025] px-3 py-2 text-[10px] text-slate-500">
                <Gauge className="h-3.5 w-3.5 text-emerald-400" />
                <span>{isGptOss20B(selectedModel) ? '~1,000 t/s target' : 'Live provider model'}</span>
              </div>
            </div>
          </div>

          <div
            className="dynamic-glass glass-elevated mt-7 rounded-[28px] border-white/12 shadow-[0_30px_100px_rgba(0,0,0,.42)]"
            onPointerMove={updateGlass}
            onPointerLeave={resetGlass}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3 sm:px-5">
                <button
                  type="button"
                  onClick={onOpenModelSelector}
                  className="min-w-0 flex items-center gap-2.5 rounded-2xl px-2 py-1.5 text-left transition-colors hover:bg-white/[0.05]"
                >
                  <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20">
                    <Cpu className="h-4 w-4 text-slate-100" />
                    {isGroq(selectedModel) && (
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,.65)]" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="block max-w-[180px] truncate text-xs font-semibold text-white sm:max-w-[300px] sm:text-sm">
                        {selectedModel.displayName}
                      </span>
                      {isGptOss20B(selectedModel) && (
                        <span className="hidden rounded-md border border-emerald-400/15 bg-emerald-400/8 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-300 sm:inline">
                          Default
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-slate-500 sm:text-[11px]">
                      {selectedModel.provider} · {isGptOss20B(selectedModel) ? 'GPT OSS 20B · reasoning' : 'live model'}
                    </span>
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                </button>

                <div className="hidden items-center gap-1 rounded-xl border border-white/8 bg-black/20 p-1 sm:flex">
                  {([
                    ['fast', 'Fast', Zap],
                    ['thinking', 'Think', Brain],
                    ['auto', 'Auto', Sparkles],
                  ] as const).map(([id, label, Icon]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setMode(id)}
                      className={[
                        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all',
                        mode === id ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white',
                      ].join(' ')}
                    >
                      <Icon className="h-3 w-3" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={submit} className="px-4 pb-4 pt-2.5 sm:px-5 sm:pb-5">
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
                  rows={5}
                  placeholder="Ask anything. Write code. Research. Build."
                  className="min-h-[142px] w-full resize-none bg-transparent text-[15px] leading-7 text-white outline-none placeholder:text-slate-600 sm:min-h-[154px] sm:text-[16px]"
                />

                <div className="flex items-center justify-between gap-3 border-t border-white/7 pt-3">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onNavigate('files')}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.025] text-slate-400 transition-colors hover:border-white/15 hover:bg-white/[0.06] hover:text-white"
                      title="Attach files"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchEnabled((v) => !v)}
                      className={[
                        'inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs transition-colors',
                        searchEnabled
                          ? 'border-cyan-400/20 bg-cyan-300/[0.08] text-cyan-200'
                          : 'border-white/8 bg-white/[0.025] text-slate-400 hover:border-white/15 hover:bg-white/[0.06] hover:text-white',
                      ].join(' ')}
                    >
                      <Search className="h-3.5 w-3.5" />
                      <span>Search</span>
                    </button>
                    <button
                      type="button"
                      onClick={onOpenVoicePartner}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.025] text-slate-400 transition-colors hover:border-white/15 hover:bg-white/[0.06] hover:text-white sm:w-auto sm:px-3"
                      title="Voice partner"
                    >
                      <Mic className="h-4 w-4" />
                      <span className="ml-1.5 hidden text-xs sm:inline">Voice</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-950 shadow-[0_10px_30px_rgba(255,255,255,.09)] transition-all hover:scale-[1.03] hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-25 active:scale-95"
                    title="Send"
                  >
                    <ArrowUp className="h-4 w-4 stroke-[2.5]" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {promptChips.map(({ label, icon: Icon, action }) => (
              <button
                key={label}
                type="button"
                onClick={action}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/8 bg-white/[0.018] px-3.5 py-2 text-xs text-slate-400 transition-all hover:-translate-y-0.5 hover:border-white/14 hover:bg-white/[0.05] hover:text-white"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {conversations.length > 0 && (
            <div className="mt-8">
              <div className="mb-2 flex items-center justify-between px-0.5">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  <Layers3 className="h-3.5 w-3.5" />
                  Recent
                </div>
                <span className="text-[10px] text-slate-600">{Math.min(conversations.length, 5)} saved</span>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {conversations.slice(0, 4).map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => onSelectConversation(conversation.id)}
                    className="dynamic-glass group rounded-2xl border border-white/8 bg-white/[0.02] p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-white/14"
                    onPointerMove={updateGlass}
                    onPointerLeave={resetGlass}
                  >
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-slate-600">
                        <MessageSquare className="h-3 w-3" />
                        {conversation.mode}
                      </div>
                      <div className="mt-2 line-clamp-2 text-sm leading-5 text-slate-200 group-hover:text-white">
                        {conversation.title || 'Untitled conversation'}
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-slate-500">
                        <span className="truncate">{conversation.modelId.replace(/^.*:/, '')}</span>
                        <span>{new Date(conversation.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-white/6 pt-4 text-[10px] text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              Server-side session · live providers
            </div>
            <div>
              {quota ? `${quota.usedTokens.toLocaleString()} / ${quota.limitTokens.toLocaleString()} tokens` : 'Quota ready'}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
