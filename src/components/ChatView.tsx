import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Mic,
  Globe,
  Sparkles,
  Zap,
  Brain,
  Square,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  ExternalLink,
  Trash2,
  Download,
  AlertCircle
} from 'lucide-react';
import { Message, Conversation, ModeType, ModelInfo, Attachment } from '../types';

interface ChatViewProps {
  conversation: Conversation | null;
  onSendMessage: (text: string, mode: ModeType, modelId: string, searchEnabled: boolean, attachments?: Attachment[]) => void;
  onStopGeneration: () => void;
  onRegenerate: () => void;
  onClearChat: () => void;
  onOpenVoicePartner: () => void;
  onOpenModelSelector: () => void;
  selectedModel: ModelInfo;
  isStreaming: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversation,
  onSendMessage,
  onStopGeneration,
  onRegenerate,
  onClearChat,
  onOpenVoicePartner,
  onOpenModelSelector,
  selectedModel,
  isStreaming,
}) => {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<ModeType>(conversation?.mode || 'fast');
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [expandedReasoningIds, setExpandedReasoningIds] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on new messages or streaming chunks
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages, isStreaming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isStreaming) return;
    onSendMessage(inputText.trim(), mode, selectedModel.id, searchEnabled);
    setInputText('');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const toggleReasoning = (msgId: string) => {
    setExpandedReasoningIds((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  // Helper to render markdown and code blocks safely
  const renderMessageContent = (content: string, msgId: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const language = lines[0].trim() || 'code';
        const codeText = lines.slice(1).join('\n');
        const codeBlockId = `${msgId}_code_${index}`;

        return (
          <div key={index} className="my-3 rounded-2xl overflow-hidden border border-white/10 bg-[#090d1f] shadow-lg">
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10 text-xs text-slate-400">
              <span className="font-mono text-cyan-300 uppercase tracking-wider">{language}</span>
              <button
                onClick={() => copyToClipboard(codeText, codeBlockId)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
              >
                {copiedCodeId === codeBlockId ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
              <code>{codeText}</code>
            </pre>
          </div>
        );
      }

      // Normal text formatting (bold, bullet points)
      return (
        <div key={index} className="whitespace-pre-wrap leading-relaxed">
          {part}
        </div>
      );
    });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col h-[calc(100dvh-4rem)] overflow-hidden">
      {/* Conversation Top Header */}
      <div className="px-4 py-3 border-b border-white/10 glass-shell flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenModelSelector}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 text-white font-medium transition-colors cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold">{selectedModel.displayName}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          <span className="capitalize px-2 py-0.5 rounded-md bg-white/5 text-slate-400 font-mono text-[11px]">
            Mode: {mode}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClearChat}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 md:px-8 py-6 space-y-6">
        {(!conversation || conversation.messages.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-slate-500 py-16">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Start a new conversation</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Type a prompt, attach files, enable web search, or click Live Voice to speak in real-time.
              </p>
            </div>
          </div>
        )}

        {conversation?.messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';
          const isReasoningExpanded = expandedReasoningIds[msg.id];

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'} animate-in fade-in`}
            >
              <div
                className={`max-w-3xl rounded-3xl p-4 md:p-5 text-sm shadow-xl ${
                  isAssistant
                    ? 'glass-card border border-white/10 text-slate-200'
                    : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-cyan-500/20'
                }`}
              >
                {/* Assistant Reasoning Accordion if present */}
                {isAssistant && msg.reasoningContent && (
                  <div className="mb-3 rounded-2xl bg-black/40 border border-purple-500/20 overflow-hidden text-xs">
                    <button
                      onClick={() => toggleReasoning(msg.id)}
                      className="w-full flex items-center justify-between px-3.5 py-2 text-purple-300 font-medium hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Brain className="w-3.5 h-3.5 text-purple-400" />
                        <span>Reasoning Process</span>
                      </div>
                      {isReasoningExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    {isReasoningExpanded && (
                      <div className="p-3 text-slate-400 font-mono text-[11px] whitespace-pre-wrap border-t border-purple-500/20 bg-black/20 leading-relaxed">
                        {msg.reasoningContent}
                      </div>
                    )}
                  </div>
                )}

                {/* Web Search Sources Cards */}
                {isAssistant && msg.sources && msg.sources.length > 0 && (
                  <div className="mb-3 space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Search Sources</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.sources.map((src, i) => (
                        <a
                          key={i}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-start justify-between group"
                        >
                          <div className="pr-2">
                            <div className="text-xs font-medium text-cyan-300 line-clamp-1 group-hover:underline">
                              {src.title}
                            </div>
                            <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{src.snippet}</div>
                          </div>
                          <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-300 shrink-0 mt-0.5" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message Body */}
                <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                  {renderMessageContent(msg.content, msg.id)}
                </div>

                {/* Footer Metadata */}
                <div className="flex items-center justify-between gap-3 mt-3 pt-2 border-t border-white/10 text-[10px] text-slate-400">
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isAssistant && msg.tokens && (
                    <span>~{msg.tokens} tokens</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Live Streaming indicator */}
        {isStreaming && (
          <div className="flex items-center gap-2 text-xs text-cyan-400 animate-pulse pl-2">
            <Sparkles className="w-4 h-4" />
            <span>LX AI is generating response...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Bottom Composer */}
      <div className="p-4 md:px-8 border-t border-white/10 glass-shell">
        <div className="max-w-4xl mx-auto rounded-3xl glass-card border border-white/15 p-3 shadow-2xl space-y-2">
          {/* Controls Bar */}
          <div className="flex items-center justify-between text-xs pb-1.5 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              {/* Mode Pills */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/40 border border-white/10 text-[11px]">
                <button
                  type="button"
                  onClick={() => setMode('fast')}
                  className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    mode === 'fast' ? 'bg-cyan-500/30 text-cyan-200' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Fast
                </button>
                <button
                  type="button"
                  onClick={() => setMode('thinking')}
                  className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    mode === 'thinking' ? 'bg-purple-500/30 text-purple-200' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Thinking
                </button>
                <button
                  type="button"
                  onClick={() => setMode('auto')}
                  className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    mode === 'auto' ? 'bg-emerald-500/30 text-emerald-200' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Auto
                </button>
              </div>

              {/* Web Search Grounding Toggle */}
              <button
                type="button"
                onClick={() => setSearchEnabled(!searchEnabled)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  searchEnabled
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Voice Partner Quick Button */}
              <button
                type="button"
                onClick={onOpenVoicePartner}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 transition-colors cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice Call</span>
              </button>
            </div>
          </div>

          {/* Textarea Form */}
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              rows={2}
              placeholder="Type your message or prompt here..."
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 resize-none outline-none leading-relaxed"
            />

            <div className="flex items-center gap-2 shrink-0">
              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStopGeneration}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-500/20 transition-all cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
