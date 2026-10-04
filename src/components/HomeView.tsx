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

  const submit = (event?: React.FormEvent) => {
    event?.preventDefault();
    const value = inputText.trim();
    if (!value) return;
    onSendMessage(value, mode, selectedModel.id, searchEnabled);
    setInputText('');
  };

  const promptChips = [
    { label: 'Analyze code', icon: Code2, action: () => onNavigate('coding') },
    { label: 'Research a topic', icon: Globe2, action: () => { setSearchEnabled(true); setInputText('Research this topic with current sources: '); } },
    { label: 'Work with files', icon: FileText, action: () => onNavigate('files') },
    { label: 'Start voice', icon: Mic, action: onOpenVoicePartner },
  ];

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 pt-8 sm:pt-12 pb-8">
        <section className="min-h-[calc(100dvh-10rem)] flex flex-col justify-start">
          <div className="mb-7 sm:mb-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.035] text-[11px] font-medium text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,.45)]" />
                LX AI online
              </span>
              <span className="text-[11px] text-slate-500">70K free workspace</span>
            </div>
            <h1 className="text-[clamp(2rem,8vw,3.6rem)] leading-[1.02] font-semibold tracking-[-0.04em] text-white">
              {greeting}.
            </h1>
            <p className="mt-3 max-w-xl text-sm sm:text-base leading-6 text-slate-400">
              One workspace for fast answers, deep reasoning, coding, files and live research.
            </p>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-white/[0.035] shadow-[0_30px_100px_rgba(0,0,0,.35)] overflow-hidden">
            <div className="px-3.5 sm:px-4 pt-3.5">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onOpenModelSelector}
                  className="min-w-0 flex items-center gap-2.5 rounded-xl px-2.5 py-2 hover:bg-white/[0.045] transition-colors"
                >
                  <span className="w-7 h-7 rounded-lg border border-white/10 bg-white/[0.045] flex items-center justify-center">
                    <Cpu className="w-3.5 h-3.5 text-slate-200" />
                  </span>
                  <span className="min-w-0 text-left">
                    <span className="block truncate max-w-[170px] sm:max-w-[280px] text-xs sm:text-sm font-medium text-white">
                      {selectedModel.displayName}
                    </span>
                    <span className="block text-[10px] sm:text-[11px] text-slate-500 truncate">
                      {selectedModel.provider} · live model
                    </span>
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                </button>

                <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl border border-white/8 bg-black/20">
                  {([
                    ['fast', 'Fast', Zap],
                    ['thinking', 'Thinking', Brain],
                    ['auto', 'Auto', Sparkles],
                  ] as const).map(([id, label, Icon]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setMode(id)}
                      className={[
                        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                        mode === id ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white',
                      ].join(' ')}
                    >
                      <Icon className="w-3 h-3" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={submit} className="px-4 sm:px-5 pb-4 pt-3">
              <textarea
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
                className="w-full min-h-[118px] sm:min-h-[132px] resize-none bg-transparent outline-none text-[15px] sm:text-[16px] leading-7 text-white placeholder:text-slate-600"
              />

              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => onNavigate('files')}
                    className="w-9 h-9 rounded-xl border border-white/8 bg-white/[0.025] hover:bg-white/[0.06] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                    title="Attach files"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchEnabled((v) => !v)}
                    className={[
                      'inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs transition-colors',
                      searchEnabled
                        ? 'border-white/20 bg-white/[0.08] text-white'
                        : 'border-white/8 bg-white/[0.025] text-slate-400 hover:text-white hover:bg-white/[0.06]',
                    ].join(' ')}
                  >
                    <Globe2 className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenVoicePartner}
                    className="w-9 h-9 rounded-xl border border-white/8 bg-white/[0.025] hover:bg-white/[0.06] text-slate-400 hover:text-white flex items-center justify-center transition-colors sm:w-auto sm:px-3"
                    title="Voice partner"
                  >
                    <Mic className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs ml-1.5">Voice</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-10 h-10 rounded-xl bg-white text-slate-950 flex items-center justify-center shadow-lg shadow-black/20 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition-all active:scale-95"
                  title="Send"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.4]" />
                </button>
              </div>
            </form>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {promptChips.map(({ label, icon: Icon, action }) => (
              <button
                key={label}
                type="button"
                onClick={action}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-white/8 bg-white/[0.02] hover:bg-white/[0.055] hover:border-white/12 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {conversations.slice(0, 2).map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className="text-left rounded-2xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.045] p-4 transition-colors group"
              >
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-slate-600">
                  <MessageSquare className="w-3 h-3" />
                  Recent
                </div>
                <div className="mt-2 text-sm text-slate-200 line-clamp-2 group-hover:text-white">
                  {conversation.title || 'Untitled conversation'}
                </div>
                <div className="mt-2 text-[11px] text-slate-500 truncate">{conversation.modelId}</div>
              </button>
            ))}
          </div>

          <div className="mt-8 pt-2 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Persistent account & server-side session
            </div>
            <div>
              {quota ? String(quota.usedTokens.toLocaleString() + ' / ' + quota.limitTokens.toLocaleString() + ' tokens used') : 'Ready'}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
