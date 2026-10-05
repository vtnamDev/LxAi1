import React from 'react';
import {
  Sparkles,
  Plus,
  Home,
  MessageSquare,
  Code2,
  FolderGit2,
  FileText,
  Cpu,
  Send,
  Settings,
  ShieldCheck,
  Zap,
  Clock,
  LogOut,
  Pin,
  Boxes,
} from 'lucide-react';
import { ViewType, QuotaInfo, Conversation, UserProfile } from '../types';

interface SidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onNewChat: () => void;
  quota: QuotaInfo | null;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  tier: string;
  user?: UserProfile | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onNewChat,
  quota,
  conversations,
  activeConversationId,
  onSelectConversation,
  isMobileOpen,
  onCloseMobile,
  tier,
  user,
  onLogout,
}) => {
  const [pinnedIds, setPinnedIds] = React.useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('lx_pinned_conversations') || '[]'); } catch { return []; }
  });

  const togglePinned = (id: string) => {
    setPinnedIds((current) => {
      const next = current.includes(id) ? current.filter((value) => value !== id) : [id, ...current].slice(0, 12);
      try { localStorage.setItem('lx_pinned_conversations', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const groups: Array<{ title: string; items: Array<{ id: ViewType; label: string; icon: React.ComponentType<{ className?: string }> }> }> = [
    {
      title: 'Workspace',
      items: [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'chat', label: 'AI Chat', icon: MessageSquare },
        { id: 'coding', label: 'AI Coding Agent', icon: Code2 },
      ],
    },
    {
      title: 'Project',
      items: [
        { id: 'projects', label: 'Projects', icon: FolderGit2 },
        { id: 'files', label: 'Files & Knowledge', icon: FileText },
      ],
    },
    {
      title: 'AI & Tools',
      items: [
        { id: 'models', label: 'Models & Providers', icon: Cpu },
        { id: 'utilities', label: 'Utilities', icon: Boxes },
        { id: 'telegram', label: 'Telegram Gateway', icon: Send },
      ],
    },
    {
      title: 'Account',
      items: [{ id: 'settings', label: 'Settings', icon: Settings }],
    },
  ];

  const pinned = conversations.filter((c) => pinnedIds.includes(c.id));
  const recent = conversations.filter((c) => !pinnedIds.includes(c.id)).slice(0, 5);
  const percent = quota ? Math.round((quota.usedTokens / Math.max(1, quota.limitTokens)) * 100) : 0;

  return (
    <>
      {isMobileOpen && <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden" onClick={onCloseMobile} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[min(88vw,22rem)] flex-col border-r border-white/10 bg-[#0a0b10]/96 shadow-2xl transition-transform duration-300 lg:w-64 lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/6"><Sparkles className="h-5 w-5 text-white" /></div>
            <div className="min-w-0">
              <div className="flex items-center gap-2"><span className="text-lg font-semibold tracking-tight text-white">LX AI</span><span className="rounded-full border border-white/8 bg-white/4 px-1.5 py-0.5 text-[8px] uppercase tracking-[.14em] text-slate-500">{tier}</span></div>
              <div className="truncate text-[10px] text-slate-500">AI workspace</div>
            </div>
          </div>
        </div>

        <div className="p-3">
          <button type="button" onClick={() => { onNewChat(); onCloseMobile(); }} className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-semibold text-black shadow-lg shadow-black/25 transition hover:bg-slate-100 active:scale-[.99]">
            <Plus className="h-4 w-4" /> New Chat
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 pb-3">
          {groups.map((group) => (
            <div key={group.title} className="mb-4">
              <div className="px-3 pb-1.5 text-[9px] font-semibold uppercase tracking-[.18em] text-slate-600">{group.title}</div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = currentView === item.id;
                  return (
                    <button key={item.id} type="button" onClick={() => { onNavigate(item.id); onCloseMobile(); }} className={['flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition', active ? 'border border-white/10 bg-white/8 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'].join(' ')}>
                      <Icon className={['h-4 w-4 shrink-0', active ? 'text-cyan-200' : 'text-slate-500'].join(' ')} />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {pinned.length > 0 && (
            <div className="mb-4">
              <div className="px-3 pb-1.5 text-[9px] font-semibold uppercase tracking-[.18em] text-slate-600">Pinned</div>
              <div className="space-y-1">
                {pinned.map((conversation) => (
                  <div key={conversation.id} className={['flex items-center rounded-xl border', activeConversationId === conversation.id ? 'border-cyan-300/15 bg-cyan-300/6' : 'border-transparent hover:bg-white/4'].join(' ')}>
                    <button type="button" onClick={() => { onSelectConversation(conversation.id); onCloseMobile(); }} className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-xs text-slate-300">
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                      <span className="min-w-0 truncate">{conversation.title || 'Untitled chat'}</span>
                    </button>
                    <button type="button" onClick={() => togglePinned(conversation.id)} className="mr-1 rounded-lg p-1.5 text-cyan-200/70 hover:bg-white/5 hover:text-cyan-100" title="Unpin"><Pin className="h-3.5 w-3.5 fill-current" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recent.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-3 pb-1.5"><span className="text-[9px] font-semibold uppercase tracking-[.18em] text-slate-600">Recent chats</span><span className="text-[9px] text-slate-700">{recent.length}</span></div>
              <div className="space-y-1">
                {recent.map((conversation) => (
                  <div key={conversation.id} className={['flex items-center rounded-xl border', activeConversationId === conversation.id ? 'border-cyan-300/15 bg-cyan-300/6' : 'border-transparent hover:bg-white/4'].join(' ')}>
                    <button type="button" onClick={() => { onSelectConversation(conversation.id); onCloseMobile(); }} className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-xs text-slate-400 hover:text-slate-200">
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 text-slate-700" />
                      <span className="min-w-0 truncate">{conversation.title || 'Untitled chat'}</span>
                    </button>
                    <button type="button" onClick={() => togglePinned(conversation.id)} className="mr-1 rounded-lg p-1.5 text-slate-700 hover:bg-white/5 hover:text-cyan-200" title="Pin"><Pin className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="border-t border-white/8 px-3 py-2">
          <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/4 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2"><Zap className="h-3.5 w-3.5 shrink-0 text-amber-300" /><span className="text-[10px] font-medium text-slate-300">Free quota</span></div>
            <div className="flex items-center gap-2"><span className="text-[10px] font-semibold text-cyan-200">{percent}%</span><span className="hidden text-[9px] text-slate-600 sm:inline">{Math.round((quota?.usedTokens || 0) / 1000)}K/{Math.round((quota?.limitTokens || 70000) / 1000)}K</span></div>
          </div>
        </div>

        <div className="border-t border-white/8 bg-black/15 px-3 py-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/8">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-xs font-bold text-white">{user?.name ? user.name.slice(0, 2).toUpperCase() : 'LX'}</div>}
            </div>
            <div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold text-white">{user?.name || 'Guest Developer'}</div><div className="truncate text-[9px] text-slate-500">{user?.email || 'Guest session'}</div></div>
            <div className="flex items-center gap-1">
              {onLogout && <button type="button" onClick={onLogout} className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-300" title="Logout"><LogOut className="h-3.5 w-3.5" /></button>}
              <button type="button" onClick={() => onNavigate('settings')} className="rounded-lg p-1.5 text-slate-500 hover:bg-white/6 hover:text-white" title="Settings"><Settings className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
