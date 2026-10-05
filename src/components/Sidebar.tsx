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
  ChevronRight,
  ShieldCheck,
  Zap,
  Clock,
  ExternalLink,
  Boxes,
  LogOut
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
  const navItems = [
    { id: 'home' as ViewType, label: 'Home', labelVi: 'Trang chủ', icon: Home },
    { id: 'chat' as ViewType, label: 'Chat & Partner', labelVi: 'Trò chuyện AI', icon: MessageSquare },
    { id: 'coding' as ViewType, label: 'AI Coding', labelVi: 'Lập trình AI', icon: Code2 },
    { id: 'projects' as ViewType, label: 'Projects', labelVi: 'Dự án', icon: FolderGit2 },
    { id: 'files' as ViewType, label: 'Knowledge & Files', labelVi: 'Tệp & Tri thức', icon: FileText },
    { id: 'models' as ViewType, label: 'Models & Providers', labelVi: 'Mô hình AI', icon: Cpu },
    { id: 'utilities' as ViewType, label: 'Utilities & Tools', labelVi: 'Tiện ích thông minh', icon: Boxes },
    { id: 'telegram' as ViewType, label: 'Telegram Gateway', labelVi: 'Telegram Bot', icon: Send },
    { id: 'settings' as ViewType, label: 'Settings', labelVi: 'Cài đặt', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 flex flex-col bg-[#090b0e]/98 border-r border-white/8 transition-transform duration-300 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo & Brand Header */}
        <div className="px-4 py-4 flex items-center justify-between border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-lg tracking-tight text-white">LX AI</span>
                <span className="text-[9px] font-medium uppercase tracking-[.12em] px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-500 border border-white/8">
                  {tier}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Next-Gen AI Workspace</p>
            </div>
          </div>
        </div>

        {/* Primary Action: New Chat */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full font-medium text-sm !text-slate-950 !bg-white hover:!bg-slate-100 shadow-lg shadow-black/20 transition-all duration-200 cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 min-h-0 px-2.5 py-2 space-y-1 overflow-y-auto overscroll-contain">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-white/[0.075] text-white border border-white/10'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.035]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </button>
            );
          })}

          {/* Recent Conversations quick-list */}
          {conversations.length > 0 && (
            <div className="pt-4 pb-2">
              <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Recent Chats
              </div>
              <div className="space-y-0.5 mt-1 max-h-40 overflow-y-auto">
                {conversations.slice(0, 5).map((c) => {
                  const isConvActive = activeConversationId === c.id && currentView === 'chat';
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        onSelectConversation(c.id);
                        onCloseMobile();
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs truncate transition-colors flex items-center gap-2 cursor-pointer ${
                        isConvActive
                          ? 'bg-blue-600/20 text-cyan-200 border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      <MessageSquare className="w-3 h-3 shrink-0 opacity-60" />
                      <span className="truncate">{c.title || 'Untitled Chat'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Quota & Token Progress Card */}
        <div className="p-3 border-t border-white/10">
          <div className="p-3 rounded-xl glass-card space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Free Quota</span>
              </span>
              <span className="text-[11px] text-cyan-300 font-semibold">
                {quota ? `${Math.round((quota.usedTokens / quota.limitTokens) * 100)}%` : '20%'}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/60 transition-all duration-300"
                style={{ width: `${quota?.percentage ?? 20}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>{quota ? `${quota.usedTokens.toLocaleString()} / 70K` : '14K / 70K'} tokens</span>
              {quota?.inCooldown ? (
                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                  <Clock className="w-3 h-3" /> 1h Cooldown
                </span>
              ) : quota?.hasFree24h ? (
                <span className="text-emerald-400 font-semibold">FREE 24H Pass</span>
              ) : (
                <span>1h Cooldown limit</span>
              )}
            </div>
          </div>
        </div>

        {/* User Account Bar */}
        <div className="p-3 border-t border-white/10 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-2.5 min-w-0">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full border border-white/20 bg-slate-800 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/10 flex items-center justify-center font-bold text-xs text-white shadow shrink-0">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'NA'}
              </div>
            )}
            <div className="text-left min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {user?.name || 'Nguyen Aum'}
              </div>
              <div className="text-[10px] text-slate-400 truncate font-mono">
                {user?.email || 'nguynaum@gmail.com'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => onNavigate('settings')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
