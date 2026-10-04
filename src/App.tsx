/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import {
  ViewType,
  PerformanceTier,
  Conversation,
  Message,
  ModelInfo,
  QuotaInfo,
  ModeType,
  Attachment,
  UserProfile,
} from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { ChatView } from './components/ChatView';
import { CodingStudioView } from './components/CodingStudioView';
import { ProjectsView } from './components/ProjectsView';
import { FilesView } from './components/FilesView';
import { UtilitiesView } from './components/UtilitiesView';
import { AuthScreen } from './components/AuthScreen';
import { useAdaptivePerformance } from './hooks/useAdaptivePerformance';
import { VoicePartnerModal } from './components/VoicePartnerModal';
import { ModelSelectorModal } from './components/ModelSelectorModal';
import { TelegramModal } from './components/TelegramModal';
import { SettingsModal } from './components/SettingsModal';

const DEFAULT_GROQ_MODEL: ModelInfo = {
  id: 'groq:openai/gpt-oss-20b',
  provider: 'Groq',
  displayName: 'GPT OSS 20B',
  capabilities: ['text', 'reasoning', 'code', 'search', 'fast'],
  contextWindow: 131072,
  status: 'configured',
  isDefault: true,
  description: 'Groq LPU default — ultra-fast reasoning, coding and tool-capable chat.',
};

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const { tier, setTier } = useAdaptivePerformance('balanced');
  const [theme, setTheme] = useState<'cosmic' | 'sunset'>('cosmic');

  // User Authentication & Session State
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    return localStorage.getItem('lx_session_token');
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('lx_ai_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const handleLogin = (newUser: UserProfile, token: string) => {
    setUser(newUser);
    setSessionToken(token);
    try {
      localStorage.setItem('lx_ai_user', JSON.stringify(newUser));
      localStorage.setItem('lx_session_token', token);
    } catch (e) {}
    fetchConversations(token);
    fetchQuota(token);
  };

  const handleLogout = () => {
    if (sessionToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}` },
      }).catch(() => {});
    }
    setUser(null);
    setSessionToken(null);
    try {
      localStorage.removeItem('lx_ai_user');
      localStorage.removeItem('lx_session_token');
    } catch (e) {}
  };

  // Modal states
  const [isVoicePartnerOpen, setIsVoicePartnerOpen] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isTelegramOpen, setIsTelegramOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Models & Quota state
  const [models, setModels] = useState<ModelInfo[]>(DEFAULT_MODELS);
  const [selectedModel, setSelectedModel] = useState<ModelInfo>(DEFAULT_MODELS[0]);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(Boolean(sessionToken));
  const [authError, setAuthError] = useState<string | null>(null);

  // Streaming control
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Conversations state
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem('lx_ai_conversations');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'conv_initial',
        title: 'Welcome to LX AI Workspace',
        modelId: 'groq:openai/gpt-oss-20b',
        mode: 'fast',
        messages: [
          {
            id: 'm1',
            role: 'assistant',
            content: `Welcome to **LX AI** — your Next-Generation Personal AI Workspace!\n\nHere are a few things you can do:\n- 🎙️ **Voice Partner**: Click **Live Voice** to practice conversations in English, Spanish, French, Japanese, Vietnamese, etc. with instant language coaching.\n- ⚡ **Multi-Model Intelligence**: Exact routing across your live provider catalog, with **Groq GPT OSS 20B** as the default.\n- 💻 **AI Coding Studio**: Full multi-file code editor with live responsive preview and terminal console.\n- 🌐 **Web Search Grounding**: Ask factual questions with real-time web citations.\n- 🚀 **Dynamic Glass**: Adaptive 4-tier visual system designed for high performance.\n\nHow can I help you today?`,
            tokens: 140,
            createdAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalTokens: 140,
      },
    ];
  });

  const [activeConversationId, setActiveConversationId] = useState<string>(
    conversations[0]?.id || 'conv_initial'
  );

  // Sync tier to document element data attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-tier', tier);
  }, [tier]);

  // Persist conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lx_ai_conversations', JSON.stringify(conversations));
    } catch (e) {}
  }, [conversations]);

  // Fetch models and validate the persisted session against the server authority.
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      fetchModels();
      setAuthError(null);

      if (!sessionToken) {
        setAuthChecking(false);
        return;
      }

      setAuthChecking(true);
      try {
        const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${sessionToken}` } });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('lx_session_token');
          localStorage.removeItem('lx_ai_user');
          setSessionToken(null);
          setUser(null);
          setAuthError('Your session has expired. Please sign in again.');
          return;
        }
        if (!res.ok) {
          setAuthError(data.error || 'Unable to validate your session.');
          return;
        }
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('lx_ai_user', JSON.stringify(data.user));
        }
        if (data.quota) setQuota(data.quota);
        await fetchConversations(sessionToken);
      } catch {
        if (!cancelled) setAuthError('Unable to reach LX AI authentication service.');
      } finally {
        if (!cancelled) setAuthChecking(false);
      }
    };

    bootstrap();

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsModelSelectorOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => { cancelled = true; window.removeEventListener('keydown', handleKeyDown); };
  }, [sessionToken]);

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/models');
      const data = await res.json();
      if (data.models && Array.isArray(data.models)) {
        setModels(data.models);
      }
    } catch (e) {}
  };

  const fetchConversations = async (token?: string) => {
    const t = token || sessionToken;
    if (!t) return;
    try {
      const res = await fetch('/api/conversations', {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.conversations && Array.isArray(data.conversations) && data.conversations.length > 0) {
        setConversations(data.conversations);
        if (!activeConversationId || activeConversationId === 'conv_initial') {
          setActiveConversationId(data.conversations[0].id);
        }
      }
    } catch (e) {}
  };

  const saveConversationToDb = async (conv: Conversation) => {
    if (!sessionToken) return;
    try {
      await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(conv),
      });
    } catch (e) {}
  };

  const fetchQuota = async (token?: string) => {
    const t = token || sessionToken;
    if (!t) return;
    try {
      const res = await fetch('/api/quota', {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      setQuota(data);
    } catch (e) {}
  };

  const handleRedeemVoucher = async (code: string) => {
    if (!sessionToken) return false;
    try {
      const res = await fetch('/api/quota/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchQuota();
        return true;
      }
    } catch (e) {}
    return false;
  };

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0] || null;

  const handleNewChat = () => {
    const newId = `conv_${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: 'New Conversation',
      modelId: selectedModel.id,
      mode: 'fast',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalTokens: 0,
    };
    setConversations([newConv, ...conversations]);
    setActiveConversationId(newId);
    setCurrentView('chat');
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setCurrentView('chat');
  };

  const handleClearChat = () => {
    if (!activeConversation) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? { ...c, messages: [], updatedAt: new Date().toISOString() }
          : c
      )
    );
  };

  // Main SSE Chat Stream Handler
  const handleSendMessage = async (
    text: string,
    mode: ModeType,
    modelId: string,
    searchEnabled: boolean,
    attachments?: Attachment[]
  ) => {
    if (!text.trim() || isStreaming) return;

    let targetConv = activeConversation;
    if (!targetConv || currentView === 'home') {
      const newId = `conv_${Date.now()}`;
      targetConv = {
        id: newId,
        title: text.slice(0, 35) + (text.length > 35 ? '...' : ''),
        modelId,
        mode,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalTokens: 0,
      };
      setConversations((prev) => [targetConv!, ...prev]);
      setActiveConversationId(newId);
    } else if (targetConv.messages.length === 0) {
      targetConv.title = text.slice(0, 35) + (text.length > 35 ? '...' : '');
    }

    setCurrentView('chat');

    const userMessage: Message = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: text,
      attachments,
      createdAt: new Date().toISOString(),
    };

    const assistantMessageId = `msg_asst_${Date.now()}`;
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      reasoningContent: '',
      sources: [],
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...targetConv.messages, userMessage, initialAssistantMessage];

    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetConv!.id
          ? {
              ...c,
              messages: updatedMessages,
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );

    setIsStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({
          messages: [...targetConv.messages, userMessage],
          modelId,
          mode,
          enableSearch: searchEnabled,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error || `Server returned HTTP ${response.status}`) as Error & { code?: string; status?: number; requestId?: string };
        error.code = errorData.code;
        error.status = response.status;
        error.requestId = errorData.requestId;
        throw error;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('AI Gateway returned an empty stream.');

      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let currentEvent = '';
      let streamCompleted = false;
      let streamFailed = false;

      const applyAssistantError = (message: string) => {
        setConversations((prev) => prev.map((c) => c.id !== targetConv!.id ? c : {
          ...c,
          messages: c.messages.map((m) => m.id === assistantMessageId ? { ...m, content: m.content || message } : m),
        }));
      };

      const processSseLine = (line: string) => {
        const trimmed = line.trimEnd();
        if (!trimmed) return;
        if (trimmed.startsWith('event:')) { currentEvent = trimmed.slice(6).trim(); return; }
        if (!trimmed.startsWith('data:')) return;
        const dataStr = trimmed.slice(5).trim();
        try {
          const data = JSON.parse(dataStr);
          if (currentEvent === 'message.delta' && data.text) {
            setConversations((prev) => prev.map((c) => c.id !== targetConv!.id ? c : {
              ...c, messages: c.messages.map((m) => m.id === assistantMessageId ? { ...m, content: m.content + data.text } : m),
            }));
          } else if (currentEvent === 'reasoning.delta' && data.text) {
            setConversations((prev) => prev.map((c) => c.id !== targetConv!.id ? c : {
              ...c, messages: c.messages.map((m) => m.id === assistantMessageId ? { ...m, reasoningContent: (m.reasoningContent || '') + data.text } : m),
            }));
          } else if (currentEvent === 'tool.result' && data.sources) {
            setConversations((prev) => prev.map((c) => c.id !== targetConv!.id ? c : {
              ...c, messages: c.messages.map((m) => m.id === assistantMessageId ? { ...m, sources: data.sources } : m),
            }));
          } else if (currentEvent === 'usage.recorded') {
            fetchQuota();
          } else if (currentEvent === 'message.completed') {
            streamCompleted = true;
          } else if (currentEvent === 'generation.failed') {
            streamFailed = true;
            const requestSuffix = data.requestId ? ` (Request ID: ${data.requestId})` : '';
            applyAssistantError(`⚠️ ${data.error || 'The AI provider could not complete the request.'}${requestSuffix}`);
          }
        } catch {}
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) processSseLine(line);
      }
      buffer += decoder.decode();
      if (buffer) processSseLine(buffer);
      reader.releaseLock();
      if (!streamCompleted && !streamFailed && !controller.signal.aborted) {
        throw new Error('AI stream ended before completion.');
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        let message = err?.message || 'The AI Gateway could not complete the request.';
        const code = err?.code as string | undefined;

        if (err?.status === 401 || code === 'AUTH_REQUIRED') {
          localStorage.removeItem('lx_session_token');
          localStorage.removeItem('lx_ai_user');
          setSessionToken(null);
          setUser(null);
          message = 'Your session has expired. Please sign in again.';
        } else if (err?.status === 429 || code === 'QUOTA_EXCEEDED' || code === 'RATE_LIMITED') {
          message = '⚠️ Your AI quota or provider rate limit has been reached. Please try again later.';
        } else if (code === 'MODEL_NOT_FOUND' || code === 'MODEL_UNSUPPORTED') {
          message = '⚠️ The selected model is unavailable for this chat route. Please choose a verified model.';
        } else if (code === 'PROVIDER_NETWORK_ERROR') {
          message = '⚠️ The AI provider could not be reached. Check provider status and try again.';
        } else if (code === 'PROVIDER_UNAVAILABLE') {
          message = `⚠️ ${message}`;
        }

        if (err?.requestId) message += ` (Request ID: ${err.requestId})`;

        setConversations((prev) => prev.map((c) => c.id !== targetConv!.id ? c : {
          ...c,
          messages: c.messages.map((m) => m.id === assistantMessageId ? { ...m, content: m.content || message } : m),
        }));
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
      fetchQuota();
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const handleRegenerate = () => {
    if (!activeConversation || activeConversation.messages.length === 0) return;
    const lastUserMsg = [...activeConversation.messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content, activeConversation.mode, activeConversation.modelId, false);
    }
  };

  const handleSaveVoiceTurnToChat = (userText: string, modelReply: string) => {
    if (!userText.trim()) return;
    const userMsg: Message = {
      id: `msg_voice_u_${Date.now()}`,
      role: 'user',
      content: `🎙️ [Voice]: ${userText}`,
      createdAt: new Date().toISOString(),
    };
    const asstMsg: Message = {
      id: `msg_voice_a_${Date.now()}`,
      role: 'assistant',
      content: modelReply,
      createdAt: new Date().toISOString(),
    };

    if (activeConversation) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? { ...c, messages: [...c.messages, userMsg, asstMsg], updatedAt: new Date().toISOString() }
            : c
        )
      );
    }
    fetchQuota();
  };

  if (!user && authChecking) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#07090d] text-white">
        <div className="text-sm text-white/60">Validating LX AI session…</div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={handleLogin} defaultEmail="nguynaum@gmail.com" />;
  }

  return (
    <div
      className={`min-h-dvh ${
        theme === 'cosmic' ? 'cosmic-bg' : 'cosmic-sunset-bg'
      } text-[#F3F4F6] flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200`}
    >
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'telegram') setIsTelegramOpen(true);
          else if (view === 'settings') setIsSettingsOpen(true);
          else if (view === 'models') setIsModelSelectorOpen(true);
          else setCurrentView(view);
        }}
        onNewChat={handleNewChat}
        quota={quota}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        tier={tier}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex-1 min-h-0 flex flex-col">
        <Header
          onToggleMobileMenu={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenVoicePartner={() => setIsVoicePartnerOpen(true)}
          onOpenSearch={() => setIsModelSelectorOpen(true)}
          tier={tier}
          onChangeTier={setTier}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'cosmic' ? 'sunset' : 'cosmic')}
        />

        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {currentView === 'home' && (
            <HomeView
              onSendMessage={handleSendMessage}
              onOpenVoicePartner={() => setIsVoicePartnerOpen(true)}
              onOpenModelSelector={() => setIsModelSelectorOpen(true)}
              onNavigate={(v) => {
                if (v === 'telegram') setIsTelegramOpen(true);
                else if (v === 'settings') setIsSettingsOpen(true);
                else if (v === 'models') setIsModelSelectorOpen(true);
                else setCurrentView(v);
              }}
              selectedModel={selectedModel}
              conversations={conversations}
              onSelectConversation={handleSelectConversation}
              quota={quota}
            />
          )}

          {currentView === 'chat' && (
            <ChatView
              conversation={activeConversation}
              onSendMessage={handleSendMessage}
              onStopGeneration={handleStopGeneration}
              onRegenerate={handleRegenerate}
              onClearChat={handleClearChat}
              onOpenVoicePartner={() => setIsVoicePartnerOpen(true)}
              onOpenModelSelector={() => setIsModelSelectorOpen(true)}
              selectedModel={selectedModel}
              isStreaming={isStreaming}
            />
          )}

          {currentView === 'coding' && <CodingStudioView />}

          {currentView === 'projects' && <ProjectsView />}

          {currentView === 'utilities' && <UtilitiesView />}

          {currentView === 'files' && (
            <FilesView
              onAttachToChat={(file) => {
                handleSendMessage(
                  `Analyze attached file: ${file.name}\n\nFile Content:\n${file.extractedText}`,
                  'fast',
                  selectedModel.id,
                  false
                );
              }}
            />
          )}
        </main>
      </div>

      {/* Modals & Dialogs */}
      <VoicePartnerModal
        isOpen={isVoicePartnerOpen}
        onClose={() => setIsVoicePartnerOpen(false)}
        onSaveToChat={handleSaveVoiceTurnToChat}
      />

      <ModelSelectorModal
        isOpen={isModelSelectorOpen}
        onClose={() => setIsModelSelectorOpen(false)}
        models={models}
        selectedModelId={selectedModel.id}
        onSelectModel={(id) => {
          const found = models.find((m) => m.id === id);
          if (found) setSelectedModel(found);
        }}
      />

      <TelegramModal
        isOpen={isTelegramOpen}
        onClose={() => setIsTelegramOpen(false)}
        onRefreshQuota={fetchQuota}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        tier={tier}
        onChangeTier={setTier}
        quota={quota}
        onRedeemVoucher={handleRedeemVoucher}
        onRefreshQuota={fetchQuota}
      />
    </div>
  );
}
