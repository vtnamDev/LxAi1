import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, MessageSquare, Cpu, FileText, ArrowRight } from 'lucide-react';
import { Conversation, ModelInfo } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  models: ModelInfo[];
  onSelectConversation: (id: string) => void;
  onSelectModel: (id: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  conversations,
  models,
  onSelectConversation,
  onSelectModel,
}) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'chats' | 'models' | 'files'>('all');
  const [files, setFiles] = useState<Array<{ id: string; name: string; type: string; size: number }>>([]);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setActiveTab('all');

    const token = localStorage.getItem('lx_session_token');
    fetch('/api/files', {
      headers: token ? { Authorization: 'Bearer ' + token } : {},
      cache: 'no-store',
    })
      .then((response) => response.ok ? response.json() : { files: [] })
      .then((data) => setFiles(Array.isArray(data.files) ? data.files.slice(0, 50) : []))
      .catch(() => setFiles([]));
  }, [isOpen]);

  const normalized = query.trim().toLowerCase();

  const chatResults = useMemo(() => {
    if (!normalized) return conversations.slice(0, 12);
    return conversations
      .filter((chat) =>
        chat.title.toLowerCase().includes(normalized) ||
        chat.messages.some((message) => message.content.toLowerCase().includes(normalized))
      )
      .slice(0, 16);
  }, [conversations, normalized]);

  const fileResults = useMemo(() => {
    if (!normalized) return files.slice(0, 12);
    return files
      .filter((file) => file.name.toLowerCase().includes(normalized) || file.type.toLowerCase().includes(normalized))
      .slice(0, 16);
  }, [files, normalized]);

  const modelResults = useMemo(() => {
    if (!normalized) return models.slice(0, 12);
    return models
      .filter((model) =>
        model.displayName.toLowerCase().includes(normalized) ||
        model.provider.toLowerCase().includes(normalized) ||
        model.id.toLowerCase().includes(normalized)
      )
      .slice(0, 16);
  }, [models, normalized]);

  if (!isOpen) return null;

  const openChat = (id: string) => {
    onSelectConversation(id);
    onClose();
  };

  const openModel = (id: string) => {
    onSelectModel(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-md" onMouseDown={onClose}>
      <div
        className="mx-auto mt-[10vh] w-[min(92vw,760px)] overflow-hidden rounded-[28px] border border-white/12 bg-[#0b0e13]/98 shadow-[0_30px_120px_rgba(0,0,0,.62)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/8 px-4 py-4">
          <Search className="h-5 w-5 text-cyan-300" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') onClose();
            }}
            placeholder="Tìm cuộc trò chuyện, model..."
            className="min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-slate-600"
          />
          <kbd className="hidden rounded-full border border-white/8 bg-white/[0.035] px-2 py-1 text-[10px] text-slate-500 sm:block">Esc</kbd>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 transition hover:bg-white/[0.06] hover:text-white" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 border-b border-white/8 px-3 py-2">
          {([
            ['all', 'Tất cả'],
            ['chats', 'Cuộc trò chuyện'],
            ['models', 'Models'],
            ['files', 'Files'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${activeTab === id ? 'bg-white text-black' : 'text-slate-500 hover:bg-white/[0.05] hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3">
          {(activeTab === 'all' || activeTab === 'chats') && (
            <section className="mb-4">
              <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">Chats</div>
              <div className="space-y-1">
                {chatResults.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => openChat(chat.id)}
                    className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/[0.05]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/[0.03]">
                      <MessageSquare className="h-4 w-4 text-slate-400" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">{chat.title}</span>
                      <span className="block truncate text-[11px] text-slate-500">
                        {chat.messages.length} messages
                        {normalized ? ' · matched conversation content' : ''}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-700 transition group-hover:text-slate-300" />
                  </button>
                ))}
              </div>
              {chatResults.length === 0 && <div className="px-3 py-6 text-xs text-slate-600">Không tìm thấy cuộc trò chuyện.</div>}
            </section>
          )}

          {(activeTab === 'all' || activeTab === 'models') && (
            <section>
              <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">Models</div>
              <div className="space-y-1">
                {modelResults.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => openModel(model.id)}
                    className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/[0.05]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/[0.03]">
                      <Cpu className="h-4 w-4 text-emerald-300" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">{model.displayName}</span>
                      <span className="block truncate text-[11px] text-slate-500">{model.provider} · {model.status}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-700 transition group-hover:text-slate-300" />
                  </button>
                ))}
              </div>
              {modelResults.length === 0 && <div className="px-3 py-6 text-xs text-slate-600">Không tìm thấy model.</div>}
            </section>
          )}

          {(activeTab === 'all' || activeTab === 'files') && (
            <section className="mt-4">
              <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">Files</div>
              <div className="space-y-1">
                {fileResults.map((file) => (
                  <button
                    key={file.id}
                    onClick={onClose}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/[0.05]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/[0.03]">
                      <FileText className="h-4 w-4 text-cyan-300" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">{file.name}</span>
                      <span className="block truncate text-[11px] text-slate-500">{file.type || 'file'} · {Math.max(1, Math.round(file.size / 1024))} KB</span>
                    </span>
                  </button>
                ))}
              </div>
              {fileResults.length === 0 && <div className="px-3 py-6 text-xs text-slate-600">Không tìm thấy file.</div>}
            </section>
          )}

          <div className="mt-3 border-t border-white/8 pt-3">
            <div className="flex items-center gap-2 px-2 text-[10px] text-slate-600">
              <FileText className="h-3.5 w-3.5" />
              File search is connected to the LX AI workspace file library.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
