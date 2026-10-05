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
  Trash2,
} from 'lucide-react';
import { Message, Conversation, ModeType, ModelInfo, Attachment } from '../types';

interface ChatViewProps {
  conversation: Conversation | null;
  onSendMessage: (text: string, mode: ModeType, modelId: string, searchEnabled: boolean, attachments?: Attachment[]) => void;
  onStopGeneration: () => void;
  onRegenerate: (messageId?: string) => void;
  onClearChat: () => void;
  onOpenVoicePartner: () => void;
  onOpenModelSelector: () => void;
  selectedModel: ModelInfo;
  isStreaming: boolean;
}

const isGroq = (model: ModelInfo) =>
  model.provider.toLowerCase() === 'groq' || model.id.startsWith('groq:');

const isTableDivider = (line: string) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
const splitTableRow = (line: string) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
const isNumericCell = (value: string) => /^-?\d+[\d\s.,]*\s*[₫$€£¥%]?$/.test(value.replace(/[*_`~]/g, '').trim());

const renderInlineMarkdown = (value: string, keyPrefix: string): React.ReactNode[] => {
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)]+\)|\*[^*]+\*|_[^_]+_)/g;
  return value.split(pattern).filter(Boolean).map((part, index) => {
    if (/^\*\*[^*]+\*\*$/.test(part) || /^__[^_]+__$/.test(part)) return <strong key={keyPrefix + '-b-' + index} className='font-semibold text-white'>{part.slice(2, -2)}</strong>;
    if (/^~~[^~]+~~$/.test(part)) return <del key={keyPrefix + '-d-' + index} className='text-slate-500'>{part.slice(2, -2)}</del>;
    if (/^`[^`]+`$/.test(part)) return <code key={keyPrefix + '-c-' + index} className='rounded-md border border-white/8 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[0.9em] text-cyan-100'>{part.slice(1, -1)}</code>;
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) return <a key={keyPrefix + '-l-' + index} href={link[2]} target='_blank' rel='noopener noreferrer' className='font-medium text-cyan-300 underline decoration-cyan-300/30 underline-offset-2 hover:text-cyan-200'>{link[1]}</a>;
    if (/^\*[^*]+\*$/.test(part) || /^_[^_]+_$/.test(part)) return <em key={keyPrefix + '-i-' + index} className='text-slate-100'>{part.slice(1, -1)}</em>;
    return <React.Fragment key={keyPrefix + '-t-' + index}>{part}</React.Fragment>;
  });
};

const renderRichBlocks = (markdown: string, keyPrefix: string) => {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }

    if (line.includes('|') && index + 1 < lines.length && isTableDivider(lines[index + 1])) {
      const header = splitTableRow(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].trim() && lines[index].includes('|')) { rows.push(splitTableRow(lines[index])); index += 1; }
      const width = Math.max(header.length, ...rows.map((row) => row.length));
      const normalize = (row: string[]) => row.concat(Array(Math.max(0, width - row.length)).fill(''));
      blocks.push(
        <div key={keyPrefix + '-table-' + index} className='my-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] shadow-[0_10px_35px_rgba(0,0,0,.18)]'>
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[620px] border-collapse text-left text-[12px]'>
              <thead><tr className='border-b border-white/10 bg-white/[0.045]'>
                {normalize(header).map((cell, column) => <th key={column} className='whitespace-nowrap px-3.5 py-3 font-semibold text-slate-200'>{renderInlineMarkdown(cell, keyPrefix + '-th-' + column)}</th>)}
              </tr></thead>
              <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className='border-b border-white/[0.06] last:border-0 odd:bg-white/[0.012] hover:bg-white/[0.035]'>
                {normalize(row).map((cell, column) => <td key={column} className={'px-3.5 py-3 align-top leading-5 text-slate-300 ' + (isNumericCell(cell) ? 'whitespace-nowrap text-right font-mono text-[11px] tabular-nums text-slate-100' : '')}>{renderInlineMarkdown(cell, keyPrefix + '-td-' + rowIndex + '-' + column)}</td>)}
              </tr>)}</tbody>
            </table>
          </div>
        </div>
      );
      continue;
    }

    const heading = line.match(/^#{1,4}\s+(.+)$/);
    if (heading) {
      const level = (line.match(/^#+/) || ['#'])[0].length;
      const className = level === 1 ? 'mt-5 mb-2 text-xl font-semibold tracking-tight text-white' : level === 2 ? 'mt-5 mb-2 text-lg font-semibold tracking-tight text-white' : 'mt-4 mb-1.5 text-[15px] font-semibold tracking-tight text-slate-100';
      blocks.push(<div key={keyPrefix + '-h-' + index} className={className}>{renderInlineMarkdown(heading[1], keyPrefix + '-hi-' + index)}</div>);
      index += 1; continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) { items.push(lines[index].replace(/^\s*[-*+]\s+/, '')); index += 1; }
      blocks.push(<ul key={keyPrefix + '-ul-' + index} className='my-3 list-disc space-y-1.5 pl-5 text-[15px] leading-7 text-slate-200 marker:text-slate-500'>{items.map((item, i) => <li key={i} className='pl-1'>{renderInlineMarkdown(item, keyPrefix + '-li-' + i)}</li>)}</ul>);
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+[.)]\s+/.test(lines[index])) { items.push(lines[index].replace(/^\s*\d+[.)]\s+/, '')); index += 1; }
      blocks.push(<ol key={keyPrefix + '-ol-' + index} className='my-3 list-decimal space-y-1.5 pl-6 text-[15px] leading-7 text-slate-200 marker:text-slate-500'>{items.map((item, i) => <li key={i} className='pl-1'>{renderInlineMarkdown(item, keyPrefix + '-oli-' + i)}</li>)}</ol>);
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) { quote.push(lines[index].replace(/^>\s?/, '')); index += 1; }
      blocks.push(<blockquote key={keyPrefix + '-q-' + index} className='my-3 rounded-r-xl border-l-2 border-cyan-400/40 bg-cyan-400/[0.04] px-4 py-2.5 text-[14px] leading-6 text-slate-300'>{quote.map((item, i) => <div key={i}>{renderInlineMarkdown(item, keyPrefix + '-qi-' + i)}</div>)}</blockquote>);
      continue;
    }

    if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
      blocks.push(<div key={keyPrefix + '-hr-' + index} className='my-5 h-px bg-white/8' />);
      index += 1; continue;
    }

    const paragraph: string[] = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^#{1,4}\s+/.test(lines[index]) && !/^\s*[-*+]\s+/.test(lines[index]) && !/^\s*\d+[.)]\s+/.test(lines[index]) && !/^>\s?/.test(lines[index]) && !(lines[index].includes('|') && index + 1 < lines.length && isTableDivider(lines[index + 1])) && !/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(lines[index])) { paragraph.push(lines[index].trim()); index += 1; }
    blocks.push(<p key={keyPrefix + '-p-' + index} className='my-2.5 text-[15px] leading-7 text-slate-200'>{renderInlineMarkdown(paragraph.join(' '), keyPrefix + '-pi-' + index)}</p>);
  }
  return blocks;
};
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
  const feedRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);

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
    onSendMessage(value, mode, selectedModel.id, searchEnabled, pendingAttachments);
    setInputText('');
    setPendingAttachments([]);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedCodeId(id);
    window.setTimeout(() => setCopiedCodeId(null), 1800);
  };

  const uploadAttachments = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const token = localStorage.getItem('lx_session_token');
    const selected = Array.from(files).slice(0, 4);

    for (const file of selected) {
      try {
        const buffer = await file.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const chunkSize = 0x8000;
        for (let offset = 0; offset < bytes.length; offset += chunkSize) {
          binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
        }
        const base64Data = btoa(binary);
        const response = await fetch('/api/files/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: 'Bearer ' + token } : {}),
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            base64Data,
          }),
        });
        if (!response.ok) continue;
        const data = await response.json();
        setPendingAttachments((current) => [...current, {
          id: data.id,
          name: data.name,
          type: data.type,
          size: data.size,
          extractedText: data.extractedText,
          status: 'ready',
          uploadedAt: data.uploadedAt,
        }]);
      } catch {}
    }
  };

  const toggleReasoning = (msgId: string) => {
    setExpandedReasoningIds((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };


  const renderMessageContent = (content: string, msgId: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const raw = part.slice(3, -3).replace(/^\n/, '');
        const lines = raw.split('\n');
        const firstLine = lines[0]?.trim() || '';
        const hasLanguage = /^[a-zA-Z0-9#+._-]{1,24}$/.test(firstLine);
        const language = hasLanguage ? firstLine : 'code';
        const codeText = (hasLanguage ? lines.slice(1) : lines).join('\n').trimEnd();
        const codeBlockId = msgId + '_code_' + index;
        return (
          <div key={index} className='my-4 overflow-hidden rounded-2xl border border-white/10 bg-[#0b0e12] shadow-[0_12px_40px_rgba(0,0,0,.16)]'>
            <div className='flex items-center justify-between border-b border-white/8 px-3.5 py-2'>
              <span className='font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500'>{language}</span>
              <button type='button' onClick={() => copyToClipboard(codeText, codeBlockId)} className='inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[10px] text-slate-400 transition hover:bg-white/[0.08] hover:text-white'>
                {copiedCodeId === codeBlockId ? <><Check className='h-3.5 w-3.5 text-emerald-400' />Copied</> : <><Copy className='h-3.5 w-3.5' />Copy</>}
              </button>
            </div>
            <pre className='max-h-[52vh] overflow-auto px-4 py-3 text-xs leading-6 text-slate-200'><code>{codeText}</code></pre>
          </div>
        );
      }
      return <React.Fragment key={index}>{renderRichBlocks(part, msgId + '-part-' + index)}</React.Fragment>;
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



                  <div>{renderMessageContent(msg.content, msg.id)}</div>

                  {isAssistant && (
                    <div className="mt-3 flex items-center gap-3 text-[10px] text-slate-600">
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.tokens ? <span>• {msg.tokens} tokens</span> : null}
                      <span className="ml-auto flex items-center gap-1">
                        <button type="button" onClick={() => navigator.clipboard?.writeText(msg.content)} className="rounded-full border border-white/8 bg-white/[0.02] p-1.5 transition hover:bg-white/[0.06] hover:text-white" title="Copy answer">
                          <Copy className="h-3 w-3" />
                        </button>
                        <button type="button" onClick={() => onRegenerate(msg.id)} className="rounded-full border border-white/8 bg-white/[0.02] px-2 py-1 text-[10px] transition hover:bg-white/[0.06] hover:text-white" title="Regenerate">
                          Regenerate
                        </button>
                      </span>
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
            className="border-t border-white/8 pt-2"
          >
            <div className="flex items-center gap-2 px-1 pb-2">
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(event) => { uploadAttachments(event.target.files); event.currentTarget.value = ''; }} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/8 bg-white/[0.025] text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
                title="Đính kèm tệp"
              >
                <Paperclip className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onOpenModelSelector}
                className="inline-flex h-8 min-w-[108px] max-w-[38vw] shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[11px] font-medium text-white transition hover:bg-white/[0.09] sm:max-w-[12rem]"
              >
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isGroq(selectedModel) ? 'bg-emerald-400' : 'bg-cyan-300'}`} />
                <span className="min-w-0 truncate">{selectedModel.displayName || selectedModel.id.split(':').pop() || 'Model'}</span>
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

            {pendingAttachments.length > 0 && (
              <div className="flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {pendingAttachments.map((attachment) => (
                  <div key={attachment.id} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/8 bg-white/[0.035] px-2.5 py-1.5 text-[10px] text-slate-300">
                    <Paperclip className="h-3 w-3 text-cyan-300" />
                    <span className="max-w-[10rem] truncate">{attachment.name}</span>
                    <button type="button" onClick={() => setPendingAttachments((items) => items.filter((item) => item.id !== attachment.id))} className="rounded-full p-0.5 text-slate-600 hover:text-white" title="Remove attachment">×</button>
                  </div>
                ))}
              </div>
            )}

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
