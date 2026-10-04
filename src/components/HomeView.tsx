import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Paperclip,
  Mic,
  Globe,
  Code2,
  FolderGit2,
  FileText,
  MessageSquare,
  Zap,
  Brain,
  Sliders,
  ChevronDown,
  Clock,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Cpu
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), mode, selectedModel.id, searchEnabled);
    setInputText('');
  };

  // Get friendly greeting based on time of day
  const hour = new Date().getHours();
  const greetingTime = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const quickActions = [
    {
      title: 'Voice Conversational Partner',
      desc: 'Real-time spoken dialogue & language practice',
      icon: Mic,
      color: 'from-emerald-500/20 to-teal-500/20',
      border: 'border-emerald-500/30',
      textColor: 'text-emerald-300',
      action: onOpenVoicePartner,
    },
    {
      title: 'AI Coding Studio',
      desc: 'Full-stack workspace with live preview',
      icon: Code2,
      color: 'from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-500/30',
      textColor: 'text-cyan-300',
      action: () => onNavigate('coding'),
    },
    {
      title: 'Web Search Grounding',
      desc: 'Factual live web research with citations',
      icon: Globe,
      color: 'from-purple-500/20 to-pink-500/20',
      border: 'border-purple-500/30',
      textColor: 'text-purple-300',
      action: () => {
        setSearchEnabled(true);
        setInputText('Latest breakthroughs in AI models and agent frameworks');
      },
    },
    {
      title: 'Analyze Files & Documents',
      desc: 'Inspect PDFs, code repositories, and datasets',
      icon: FileText,
      color: 'from-amber-500/20 to-orange-500/20',
      border: 'border-amber-500/30',
      textColor: 'text-amber-300',
      action: () => onNavigate('files'),
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 md:px-12 max-w-5xl mx-auto space-y-8 animate-in fade-in">
      {/* Hero Greeting */}
      <div className="text-center space-y-2 pt-4">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-200 bg-clip-text text-transparent">
          {greetingTime}, VtnamDev 👋
        </h1>
        <p className="text-sm md:text-base text-slate-400 font-normal">
          Your personal real-time AI workspace. Smarter, faster, more creative.
        </p>
      </div>

      {/* Main Dynamic Glass Composer */}
      <div className="rounded-3xl glass-card border border-white/15 p-4 md:p-5 shadow-2xl space-y-3">
        {/* Mode Selector & Model Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
          {/* Segmented Mode Control */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/30 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setMode('fast')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                mode === 'fast'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Fast</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('thinking')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                mode === 'thinking'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Thinking</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('auto')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                mode === 'auto'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto</span>
            </button>
          </div>

          {/* Model Selector Pill */}
          <button
            type="button"
            onClick={onOpenModelSelector}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 text-xs text-white font-medium transition-all cursor-pointer group"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
            <span className="truncate max-w-[140px] sm:max-w-none">{selectedModel.displayName}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        {/* Text Input Area */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            rows={3}
            placeholder="Ask anything, write code, research topics, or practice languages..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 resize-none outline-none leading-relaxed"
          />

          {/* Bottom Toolbar & Action Buttons */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              {/* Web Search Toggle */}
              <button
                type="button"
                onClick={() => setSearchEnabled(!searchEnabled)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                  searchEnabled
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'
                }`}
                title="Toggle Google Search Grounding"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Search</span>
              </button>

              {/* Real-time Voice Partner Trigger */}
              <button
                type="button"
                onClick={onOpenVoicePartner}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                title="Start Voice Conversation Partner"
              >
                <Mic className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Live Voice</span>
              </button>

              {/* Attach File Button */}
              <button
                type="button"
                onClick={() => onNavigate('files')}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-colors cursor-pointer"
                title="Attach files"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-500/20 transition-all cursor-pointer active:scale-95"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Quick Action Cards */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
          Explore Capabilities
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((qa) => {
            const Icon = qa.icon;
            return (
              <button
                key={qa.title}
                onClick={qa.action}
                className={`p-4 rounded-2xl glass-card border ${qa.border} text-left transition-all hover:scale-[1.02] active:scale-[0.99] cursor-pointer group flex flex-col justify-between h-32`}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                  <Icon className={`w-4 h-4 ${qa.textColor}`} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {qa.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{qa.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Chats Carousel / List */}
      {conversations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider">Recent Chats</span>
            <button
              onClick={() => onNavigate('chat')}
              className="text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              View all
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {conversations.slice(0, 3).map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className="p-3.5 rounded-2xl glass-card border border-white/10 hover:border-cyan-500/40 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span className="truncate max-w-[120px] font-mono text-cyan-300">
                    {conv.modelId}
                  </span>
                  <span>{new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <h4 className="text-xs font-semibold text-white group-hover:text-cyan-200 transition-colors line-clamp-2">
                  {conv.title || 'Untitled Conversation'}
                </h4>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* System Status & Quota Summary */}
      <div className="p-4 rounded-2xl glass-card border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white">LX AI Multi-Model Runtime Active</div>
            <div className="text-[11px] text-slate-400">
              Gemini 3.8 Live, GPT-4o, Claude 3.5 & Tavily Search Grounding enabled.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="text-right">
            <div className="text-slate-400 text-[11px]">Free Token Quota</div>
            <div className="font-bold text-white">
              {quota ? `${quota.usedTokens.toLocaleString()} / 70,000` : '14,200 / 70,000'}
            </div>
          </div>
          <button
            onClick={() => onNavigate('settings')}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            Manage
          </button>
        </div>
      </div>
    </div>
  );
};
