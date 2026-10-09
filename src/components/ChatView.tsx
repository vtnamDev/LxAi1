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
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { Message, Conversation, ModeType, ModelInfo, Attachment, CouncilActivity } from '../types';
import { withTurnstile } from '../lib/turnstile';

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
  const [mode, setMode] = useState<ModeType>(conversation?.mode || 'council');
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [expandedReasoningIds, setExpandedReasoningIds] = useState<Record<string, boolean>>({});
  const [councilLimits, setCouncilLimits] = useState<Record<string, number>>({});
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
        const response = await withTurnstile('file-upload', (turnstileToken) =>
          fetch('/api/files/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: 'Bearer ' + token } : {}),
            },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              base64Data,
              turnstileToken,
            }),
          }),
        );
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


  const renderCouncilCards = (items: CouncilActivity[], msgId: string, group: 'thought' | 'debate') => {
    const key = msgId + ':' + group;
    const initialCount = group === 'thought' ? 3 : 2;
    const visibleCount = councilLimits[key] ?? initialCount;
    const visibleItems = items.slice(0, visibleCount);
    return (
      <>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {visibleItems.map((item, index) => (
            <article
              key={item.id}
              style={{ animationDelay: (Math.min(index, 8) * 35) + 'ms' }}
              className="group relative min-w-0 overflow-hidden rounded-[18px] border border-white/[.09] bg-gradient-to-br from-white/[.055] via-white/[.025] to-violet-300/[.025] p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200/25 hover:shadow-[0_14px_38px_rgba(110,85,255,.10)]"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-200/35 to-transparent opacity-70" />
              <div className="flex min-w-0 items-start gap-2.5">
                <div className={'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ' + (group === 'debate' ? 'border-cyan-200/15 bg-cyan-200/[.08] text-cyan-100' : 'border-violet-200/15 bg-violet-200/[.08] text-violet-100')}>
                  {group === 'debate' ? <ShieldCheck className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold tracking-[-.01em] text-slate-100">{item.displayName || item.modelId || 'AI agent'}</p>
                  <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-[.11em] text-slate-500">{item.provider || 'Model'} · {group === 'debate' ? 'Peer critique' : 'Independent view'}</p>
                </div>
                <span className={'shrink-0 rounded-full border px-2 py-1 text-[8px] font-bold tracking-[.08em] ' + (item.status === 'failed' ? 'border-rose-300/15 bg-rose-300/[.06] text-rose-200' : 'border-emerald-200/12 bg-emerald-200/[.05] text-emerald-200')}>
                  {item.status === 'failed' ? 'FAILED' : group === 'debate' ? 'REVIEW' : 'REPLIED'}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words text-[12px] leading-[1.75] text-slate-300">{item.text || (item.status === 'failed' ? 'Provider did not return a response.' : 'Response received.')}</p>
            </article>
          ))}
        </div>
        {items.length > initialCount && (
          <button
            type="button"
            onClick={() => setCouncilLimits((prev) => ({ ...prev, [key]: visibleCount >= items.length ? initialCount : Math.min(items.length, visibleCount + 6) }))}
            className="mt-2.5 inline-flex min-h-9 items-center gap-2 rounded-full border border-white/[.09] bg-white/[.025] px-3.5 text-[10px] font-semibold text-slate-400 transition hover:border-violet-200/25 hover:bg-violet-200/[.06] hover:text-white"
          >
            {visibleCount >= items.length ? 'Show fewer' : 'Reveal ' + Math.min(6, items.length - visibleCount) + ' more voices'}
            {visibleCount < items.length && <span className="rounded-full bg-white/[.08] px-1.5 py-0.5 tabular-nums text-slate-300">{items.length - visibleCount} left</span>}
            <ChevronDown className={'h-3.5 w-3.5 transition-transform ' + (visibleCount >= items.length ? 'rotate-180' : '')} />
          </button>
        )}
      </>
    );
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

  const latestAssistantId = conversation?.messages.slice().reverse().find((item) => item.role === 'assistant')?.id;

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div ref={feedRef} className="chat-feed min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-6 sm:px-5 md:px-8">
        <div className="mx-auto w-full max-w-4xl pb-8">
          {(!conversation || conversation.messages.length === 0) ? (
            <div className="flex min-h-[52vh] items-center justify-center px-4 py-14 text-center">
              <div className="max-w-xl">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-200/10 bg-violet-200/6">
                  <Sparkles className="h-6 w-6 text-violet-200" />
                </div>
                <h2 className="text-[clamp(1.8rem,7vw,2.7rem)] font-semibold tracking-[-.045em] text-white">Start a new conversation</h2>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-500">Ask a question, attach a file, research something, or switch to AI Coding Agent.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {conversation.messages.map((msg) => {
                const isAssistant = msg.role === 'assistant';
                const canRegenerate = isAssistant && msg.id === latestAssistantId;
                const reasoningOpen = expandedReasoningIds[msg.id];
                const councilEvents = msg.councilActivity || [];
                const councilThoughts = councilEvents.filter((item) => item.kind === 'thought');
                const councilReviews = councilEvents.filter((item) => item.kind === 'debate');
                const councilStart = councilEvents.find((item) => item.kind === 'started');
                const councilCompletion = [...councilEvents].reverse().find((item) => item.kind === 'completed');
                const councilDebateStart = councilEvents.find((item) => item.kind === 'debate-started');
                const councilSynthesis = [...councilEvents].reverse().find((item) => item.kind === 'synthesis-started');
                const successfulThoughts = councilThoughts.filter((item) => item.status === 'responded').length;
                const successfulReviews = councilReviews.filter((item) => item.status === 'responded').length;
                const participantCount = councilCompletion?.participantCount || councilStart?.participantCount || councilThoughts.length;
                const jurorCount = councilCompletion?.jurorCount || councilDebateStart?.jurorCount || councilSynthesis?.jurorCount || 0;
                const councilStatus = councilCompletion ? 'SYNTHESIS COMPLETE' : isStreaming ? (councilSynthesis ? 'SYNTHESIZING' : councilDebateStart ? 'PEER DEBATE' : 'LIVE COUNCIL') : 'PARTIAL RUN';

                return (
                  <article key={msg.id} className={isAssistant ? 'flex justify-start' : 'flex justify-end'}>
                    <div className={isAssistant ? 'w-full max-w-[48rem]' : 'max-w-[42rem]'}>
                      {isAssistant && msg.reasoningContent && councilEvents.length === 0 && (
                        <div className="mb-3 overflow-hidden rounded-2xl border border-violet-200/10 bg-violet-200/[0.03]">
                          <button type="button" onClick={() => toggleReasoning(msg.id)} className="flex h-10 w-full items-center justify-between px-3.5 text-xs text-slate-400 hover:bg-white/4 hover:text-white">
                            <span className="inline-flex items-center gap-2"><Brain className="h-3.5 w-3.5 text-violet-200" /> Reasoning</span>
                            {reasoningOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                          {reasoningOpen && <div className="max-h-72 overflow-auto border-t border-white/8 px-3.5 py-3 font-mono text-[11px] leading-5 text-slate-500">{msg.reasoningContent}</div>}
                        </div>
                      )}

                      {isAssistant && councilEvents.length > 0 && (
                        <section className="relative mb-5 overflow-hidden rounded-[25px] border border-violet-200/[.14] bg-gradient-to-br from-[#171526]/95 via-[#11141b]/95 to-[#0d1a22]/95 p-3.5 shadow-[0_18px_55px_rgba(20,15,50,.22)] sm:p-4.5">
                          <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-violet-400/[.10] blur-3xl" />
                          <div className="pointer-events-none absolute -bottom-14 left-[26%] h-32 w-32 rounded-full bg-cyan-300/[.06] blur-3xl" />
                          <div className="relative">
                            <div className="flex items-start gap-3">
                              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] border border-violet-200/20 bg-gradient-to-br from-violet-200/[.14] to-cyan-200/[.06] shadow-[inset_0_1px_0_rgba(255,255,255,.12)]">
                                <Sparkles className="h-4.5 w-4.5 text-violet-100" />
                                {isStreaming && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#171526] bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.65)]" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[10px] font-bold uppercase tracking-[.19em] text-violet-100">LX AI Council</span>
                                  <span className="rounded-full border border-white/[.09] bg-white/[.04] px-2 py-1 text-[8px] font-bold tracking-[.09em] text-slate-300">{councilStatus}</span>
                                </div>
                                <p className="mt-1 text-[12px] leading-5 text-slate-400">One conversation. Independent minds. Peer review before the answer.</p>
                              </div>
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-2">
                              <div className="rounded-2xl border border-white/[.07] bg-white/[.025] px-2.5 py-2.5">
                                <p className="text-[8px] font-bold uppercase tracking-[.12em] text-slate-500">Models</p>
                                <p className="mt-1 text-lg font-semibold tracking-tight text-white tabular-nums">{participantCount || '—'}</p>
                                <p className="text-[9px] text-slate-500">invited</p>
                              </div>
                              <div className="rounded-2xl border border-white/[.07] bg-white/[.025] px-2.5 py-2.5">
                                <p className="text-[8px] font-bold uppercase tracking-[.12em] text-slate-500">Voices</p>
                                <p className="mt-1 text-lg font-semibold tracking-tight text-white tabular-nums">{successfulThoughts}<span className="text-xs font-medium text-slate-500">/{participantCount || '—'}</span></p>
                                <p className="text-[9px] text-slate-500">independent</p>
                              </div>
                              <div className="rounded-2xl border border-white/[.07] bg-white/[.025] px-2.5 py-2.5">
                                <p className="text-[8px] font-bold uppercase tracking-[.12em] text-slate-500">Reviews</p>
                                <p className="mt-1 text-lg font-semibold tracking-tight text-white tabular-nums">{successfulReviews}<span className="text-xs font-medium text-slate-500">/{jurorCount || '—'}</span></p>
                                <p className="text-[9px] text-slate-500">peer critiques</p>
                              </div>
                            </div>

                            <div className="my-4 flex flex-wrap items-center gap-2">
                              <span className={'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[9px] font-semibold ' + (councilThoughts.length ? 'border-violet-200/15 bg-violet-200/[.06] text-violet-100' : 'border-white/[.08] bg-white/[.025] text-slate-500')}>
                                <Brain className="h-3 w-3" /> Independent analysis
                              </span>
                              <ChevronRight className="h-3 w-3 text-slate-700" />
                              <span className={'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[9px] font-semibold ' + (councilReviews.length ? 'border-cyan-200/15 bg-cyan-200/[.06] text-cyan-100' : 'border-white/[.08] bg-white/[.025] text-slate-500')}>
                                <ShieldCheck className="h-3 w-3" /> Adversarial review
                              </span>
                              <ChevronRight className="h-3 w-3 text-slate-700" />
                              <span className={'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[9px] font-semibold ' + (councilCompletion ? 'border-emerald-200/15 bg-emerald-200/[.06] text-emerald-100' : 'border-white/[.08] bg-white/[.025] text-slate-500')}>
                                <Sparkles className="h-3 w-3" /> Final synthesis
                              </span>
                            </div>

                            <div className="border-t border-white/[.07] pt-3.5">
                              <div className="mb-2.5 flex items-center justify-between gap-2">
                                <div>
                                  <h3 className="text-[11px] font-semibold text-white">Independent voices</h3>
                                  <p className="mt-0.5 text-[10px] text-slate-500">Different providers answer separately before comparing ideas.</p>
                                </div>
                                <span className="rounded-full bg-white/[.05] px-2 py-1 text-[9px] text-slate-400">{councilThoughts.length} updates</span>
                              </div>
                              {councilThoughts.length > 0 ? renderCouncilCards(councilThoughts, msg.id, 'thought') : (
                                <div className="flex items-center gap-2 rounded-2xl border border-white/[.07] bg-white/[.025] p-4 text-[11px] text-slate-500">
                                  <span className="h-2 w-2 animate-pulse rounded-full bg-violet-300" /> Waiting for the first model responses…
                                </div>
                              )}
                            </div>

                            {(councilReviews.length > 0 || councilDebateStart) && (
                              <div className="mt-4 border-t border-white/[.07] pt-3.5">
                                <div className="mb-2.5 flex items-center justify-between gap-2">
                                  <div>
                                    <h3 className="text-[11px] font-semibold text-white">Peer debate & counterpoints</h3>
                                    <p className="mt-0.5 text-[10px] text-slate-500">Reviewers challenge contradictions, assumptions, and weak claims.</p>
                                  </div>
                                  <span className="rounded-full bg-cyan-200/[.06] px-2 py-1 text-[9px] text-cyan-100">{successfulReviews}/{jurorCount || '—'} reviewed</span>
                                </div>
                                {councilReviews.length > 0 ? renderCouncilCards(councilReviews, msg.id, 'debate') : (
                                  <div className="flex items-center gap-2 rounded-2xl border border-cyan-200/[.08] bg-cyan-200/[.025] p-4 text-[11px] text-slate-500">
                                    <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-200" /> {councilDebateStart?.text || 'Waiting for the peer review phase…'}
                                  </div>
                                )}
                              </div>
                            )}

                            {(councilCompletion || councilSynthesis) && (
                              <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-emerald-200/[.12] bg-emerald-200/[.035] p-3">
                                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" />
                                <div className="min-w-0">
                                  <p className="text-[10px] font-semibold text-emerald-100">{councilCompletion ? 'Final arbiter finished synthesis' : 'Final arbiter is synthesizing'}</p>
                                  <p className="mt-1 break-all text-[10px] leading-5 text-slate-400">{councilCompletion?.finalModelId || 'Combining shared conclusions and opposing views'}{councilCompletion ? ' · ' + (councilCompletion.respondedCount || 0) + '/' + (councilCompletion.participantCount || 0) + ' responses returned' : ''}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </section>
                      )}

                      <div className={isAssistant ? 'text-[15px] leading-7 text-slate-100' : 'rounded-[22px] rounded-br-md border border-white/12 bg-white/[.085] px-4 py-3.5 text-[15px] leading-7 text-white shadow-[0_16px_38px_rgba(0,0,0,.22)]'}>
                        {renderMessageContent(msg.content, msg.id)}
                      </div>

                      {isAssistant && (
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-600">
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {msg.tokens ? <span>• {msg.tokens} tokens</span> : null}
                          <div className="ml-auto flex items-center gap-1">
                            <button type="button" onClick={() => navigator.clipboard?.writeText(msg.content)} className="rounded-lg border border-white/7 bg-white/2 px-2 py-1 hover:bg-white/6 hover:text-white"><Copy className="h-3 w-3" /></button>
                            {canRegenerate && <button type="button" onClick={() => onRegenerate(msg.id)} className="rounded-lg border border-white/7 bg-white/2 px-2 py-1 text-[10px] hover:bg-white/6 hover:text-white">Regenerate</button>}
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
              {isStreaming && <div className="flex items-center gap-2 text-xs text-slate-500"><span className="h-2 w-2 animate-pulse rounded-full bg-violet-300" /> LX AI is working…</div>}
            </div>
          )}
          <div ref={messagesEndRef} className="h-px" />
        </div>
      </div>

      <div className="higgs-composer shrink-0 border-t px-3 pb-[calc(env(safe-area-inset-bottom)+.7rem)] pt-2.5 sm:px-5 md:px-8">
        <div className="mx-auto w-full max-w-4xl">
          <form onSubmit={handleSubmit} className="rounded-[24px] border border-white/10 bg-white/[.035] p-2 shadow-[0_18px_60px_rgba(0,0,0,.22)]">
            <div className="flex items-center gap-1.5 border-b border-white/7 px-1 pb-2">
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(event) => { uploadAttachments(event.target.files); event.currentTarget.value = ''; }} />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="higgs-control flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-slate-200" title="Attach files"><Paperclip className="h-4 w-4" /></button>
              <button type="button" onClick={onOpenModelSelector} className="higgs-control flex min-w-0 max-w-[48vw] items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-semibold text-white sm:max-w-xs">
                <span className={'h-1.5 w-1.5 rounded-full ' + (isGroq(selectedModel) ? 'bg-emerald-300' : 'bg-cyan-300')} />
                <span className="min-w-0 truncate">{selectedModel.displayName || selectedModel.id.split(':').pop() || 'Model'}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              </button>
              <div className="ml-auto flex items-center gap-1">
                <button type="button" onClick={() => setSearchEnabled((value) => !value)} className={['higgs-control flex h-9 items-center gap-1.5 rounded-full border px-3 text-[11px] font-semibold', searchEnabled ? 'border-cyan-200/20 bg-cyan-200/8 text-cyan-100' : 'text-slate-500 hover:text-white'].join(' ')}><Globe className="h-3.5 w-3.5" /><span className="hidden sm:inline">Search</span></button>
                <button type="button" onClick={onOpenVoicePartner} className="higgs-control hidden h-9 w-9 items-center justify-center rounded-full border text-slate-300 sm:flex" title="Voice"><Mic className="h-3.5 w-3.5" /></button>
              </div>
            </div>

            {pendingAttachments.length > 0 && (
              <div className="flex gap-2 overflow-x-auto px-1 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {pendingAttachments.map((attachment) => (
                  <div key={attachment.id} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/8 bg-white/4 px-2.5 py-1.5 text-[10px] text-slate-300">
                    <Paperclip className="h-3 w-3 text-cyan-200" />
                    <span className="max-w-[10rem] truncate">{attachment.name}</span>
                    <button type="button" onClick={() => setPendingAttachments((items) => items.filter((item) => item.id !== attachment.id))} className="rounded-full p-0.5 text-slate-600 hover:text-white">×</button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2 px-1 py-1">
              <textarea
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSubmit(event); }
                }}
                rows={2}
                placeholder="Message LX AI…"
                className="min-h-[54px] max-h-40 min-w-0 flex-1 resize-none bg-transparent px-1 py-2 text-[15px] leading-6 text-white outline-none placeholder:text-slate-600"
              />
              <button type="button" onClick={() => { setMode(mode === 'fast' ? 'thinking' : mode === 'thinking' ? 'council' : 'fast'); }} className="mb-1 hidden rounded-full border border-white/8 bg-white/4 px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 hover:text-white sm:block" title="Cycle mode">
                {mode === 'fast' ? 'Fast' : mode === 'thinking' ? 'Think' : 'Council'}
              </button>
              {isStreaming ? (
                <button type="button" onClick={onStopGeneration} className="mb-1 flex h-11 shrink-0 items-center gap-2 rounded-full border border-rose-300/15 bg-rose-300/10 px-4 text-xs font-bold text-rose-100"><Square className="h-3.5 w-3.5 fill-current" /> Stop</button>
              ) : (
                <button type="submit" disabled={!inputText.trim()} className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,.12)] transition hover:scale-[1.04] hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-25" title="Send message"><Send className="h-4 w-4 stroke-[2.5]" /></button>
              )}
            </div>

            <div className="flex items-center justify-between px-1 pt-1">
              <div className="flex items-center gap-2 text-[10px] text-slate-600">
                <span>Enter to send</span>
                <span className="text-slate-700">•</span>
                <span>{mode === 'fast' ? 'Fast' : mode === 'thinking' ? 'Deep reasoning' : 'All-model council'} mode</span>
              </div>
              <button type="button" onClick={onClearChat} className="rounded-lg p-1.5 text-slate-600 hover:bg-rose-500/10 hover:text-rose-300" title="Clear chat"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
