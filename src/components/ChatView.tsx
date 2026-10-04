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
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  ExternalLink,
  Trash2,
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

const isGroq = (model: ModelInfo) =>
  model.provider.toLowerCase() === 'groq' || model.id.startsWith('groq:');

export const ChatView: React.FC<ChatViewProps> = ({
  conversation,
  onSendMessage,
  onStopGeneration,
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
  const feedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!conversation?.mode) return;
    setMode(conversation.mode);
  }, [conversation?.id, conversation?.mode]);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    const distanceFromBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight;
    if (distanceFromBottom < 160 || isStreaming) {
      messagesEndRef.current?.scrollIntoView({
        behavior: isStreaming ? 'auto' : 'smooth',
        block: 'end',
      });
    }
  }, [conversation?.messages, isStreaming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputText.trim();
    if (!value || isStreaming) return;
    onSendMessage(value, mode, selectedModel.id, searchEnabled);
    setInputText('');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedCodeId(id);
    window.setTimeout(() => setCopiedCodeId(null), 1800);
  };

  const toggleReasoning = (msgId: string) => {
    setExpandedReasoningIds((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const renderMessageContent = (content: string, msgId: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const language = lines[0]?.trim() || 'code';
        const codeText = lines.slice(1).join('\n');
        const codeBlockId = `${msgId}_code_${index}`;

        return (
          <div key={index} className="my-3 overflow-hidden rounded-2xl border border-white/10 bg-[#0b0e12]">
            <div className="flex items-center justify-between border-b border-white/8 px-3.5 py-2">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {language}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(codeText, codeBlockId)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[10px] text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
              >
                {copiedCodeId === codeBlockId ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="max-h-[52vh] overflow-auto px-4 py-3 text-xs leading-6 text-slate-200">
              <code>{codeText}</code>
            </pre>
          </div>
        );
      }

      return (
        <span key={index} className="whitespace-pre-wrap break-words">
          {part}
        </span>
      );
    });
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={feedRef}
        className="chat-feed min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-6 sm:px-5 md:px-8"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-7 pb-5">
          {(!conversation || conversation.messages.length === 0) && (
            <div className="flex min-h-full items-center justify-center py-24">
              <div className="w-full max-w-xl text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06]">
                  <Sparkles className="h-5 w-5 text-emerald-300" />
                </div>
                <h2 className="text-lg font-semibold tracking-tight text-white">Start a new conversation</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Ask a question, write code, research something, or attach a file.
                </p>
              </div>
            </div>
          )}

          {conversation?.messages.map((msg) => {
            const isAssistant = msg.role === 'assistant';
            const reasoningOpen = expandedReasoningIds[msg.id];

            return (
              <article
                key={msg.id}
                className={isAssistant ? 'flex justify-start' : 'flex justify-end'}
              >
                <div
                  className={
                    isAssistant
                      ? 'w-full max-w-[48rem] text-[15px] leading-7 text-slate-200'
                      : 'max-w-[42rem] rounded-[24px] rounded-br-md border border-white/10 bg-white/[0.075] px-4 py-3.5 text-[15px] leading-7 text-white shadow-[0_12px_30px_rgba(0,0,0,.22)]'
                  }
                >
                  {isAssistant && msg.reasoningContent && (
                    <div className="mb-3 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.025]">
                      <button
                        type="button"
                        onClick={() => toggleReasoning(msg.id)}
                        className="flex w-full items-center justify-between px-3.5 py-2.5 text-xs text-slate-400 transition hover:bg-white/[0.035] hover:text-white"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Brain className="h-3.5 w-3.5 text-purple-300" />
                          Reasoning
                        </span>
                        {reasoningOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                      {reasoningOpen && (
                        <div className="max-h-72 overflow-auto border-t border-white/8 px-3.5 py-3 font-mono text-[11px] leading-5 text-slate-500">
                          {msg.reasoningContent}
                        </div>
                      )}
                    </div>
                  )}

                  {isAssistant && msg.sources && msg.sources.length > 0 && (
                    <div className="mb-4">
                      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-600">
                        <Globe className="h-3 w-3" />
                        Sources
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.sources.map((src, i) => (
                          <a
                            key={i}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex max-w-full items-center gap-2 rounded-full border border-white/8 bg-white/[0.025] px-3 py-1.5 text-[11px] text-slate-400 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white"
                          >
                            <span className="max-w-[16rem] truncate">{src.title}</span>
                            <ExternalLink className="h-3 w-3 shrink-0 opacity-50 group-hover:opacity-100" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>{renderMessageContent(msg.content, msg.id)}</div>

                  {isAssistant && (
                    <div className="mt-3 flex items-center gap-3 text-[10px] text-slate-600">
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.tokens ? <span>• {msg.tokens} tokens</span> : null}
                    </div>
                  )}
                </div>
              </article>
            );
          })}

          {isStreaming && (
            <div className="flex items-center gap-2 pl-1 text-xs text-slate-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span>LX AI is thinking…</span>
            </div>
          )}

          <div ref={messagesEndRef} className="h-px shrink-0" />
        </div>
      </div>

      <div className="shrink-0 border-t border-white/8 bg-[#090b0e]/90 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl sm:px-5 md:px-8">
        <div className="mx-auto w-full max-w-4xl">
          <form
            onSubmit={handleSubmit}
            className="dynamic-glass glass-elevated overflow-visible rounded-[26px] border border-white/12 p-2.5 shadow-[0_18px_60px_rgba(0,0,0,.36)]"
          >
            <div className="flex items-center gap-2 px-1 pb-2">
              <button
                type="button"
                onClick={onOpenModelSelector}
                className="inline-flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/[0.09]"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isGroq(selectedModel) ? 'bg-emerald-400' : 'bg-cyan-300'}`} />
                <span className="max-w-[12rem] truncate">{selectedModel.displayName}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              </button>

              <div className="flex items-center rounded-full border border-white/8 bg-black/20 p-1">
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
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[10px] font-medium transition',
                      mode === id ? 'bg-white text-black' : 'text-slate-500 hover:text-white',
                    ].join(' ')}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </button>
                ))}
              </div>

              <div className="ml-auto flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSearchEnabled((value) => !value)}
                  className={[
                    'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium transition',
                    searchEnabled
                      ? 'border-cyan-300/20 bg-cyan-300/10 text-cyan-200'
                      : 'border-white/8 bg-white/[0.025] text-slate-500 hover:bg-white/[0.06] hover:text-white',
                  ].join(' ')}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Search</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenVoicePartner}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/8 bg-white/[0.025] text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
                  title="Voice"
                >
                  <Mic className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onClearChat}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/8 bg-white/[0.025] text-slate-500 transition hover:border-rose-400/20 hover:bg-rose-400/10 hover:text-rose-300"
                  title="Clear chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

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
              placeholder="Message LX AI…"
              className="max-h-40 min-h-[66px] w-full resize-none bg-transparent px-2.5 py-2 text-[15px] leading-6 text-white outline-none placeholder:text-slate-600 sm:text-base"
            />

            <div className="flex items-center justify-between px-1 pt-1.5">
              <button
                type="button"
                onClick={() => onOpenModelSelector()}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] text-slate-600 transition hover:bg-white/[0.035] hover:text-slate-300"
              >
                <Cpu className="h-3 w-3" />
                <span className="max-w-[11rem] truncate">{selectedModel.provider}</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenVoicePartner()}
                  className="hidden h-9 w-9 items-center justify-center rounded-full border border-white/8 bg-white/[0.025] text-slate-500 transition hover:bg-white/[0.06] hover:text-white sm:flex"
                  title="Voice"
                >
                  <Mic className="h-4 w-4" />
                </button>
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={onStopGeneration}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-rose-400/20 bg-rose-400/10 px-4 text-xs font-semibold text-rose-200 transition hover:bg-rose-400/15"
                  >
                    <Square className="h-3.5 w-3.5 fill-current" />
                    Stop
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-[0_8px_24px_rgba(255,255,255,.08)] transition hover:scale-[1.04] hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-25"
                    title="Send"
                  >
                    <Send className="h-4 w-4 stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>
          </form>

          <div className="px-2 pt-2 text-center text-[9px] text-slate-700">
            Enter to send · Shift+Enter for a new line
          </div>
        </div>
      </div>
    </section>
  );
};
