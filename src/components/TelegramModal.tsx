import React, { useState } from 'react';
import { Send, Bot, ShieldCheck, CheckCircle2, Clock, Terminal, X, RefreshCw } from 'lucide-react';

interface TelegramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshQuota?: () => void;
}

export const TelegramModal: React.FC<TelegramModalProps> = ({ isOpen, onClose, onRefreshQuota }) => {
  const [inputText, setInputText] = useState('/start');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: '👋 Hello! I am the LX AI Telegram Bot running on the exact same AI Gateway as your web workspace. Try sending /start, /quota, or ask a question.',
      time: '12:00 PM',
    },
  ]);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const userText = inputText.trim();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { sender: 'user', text: userText, time }]);
    setInputText('');
    setIsSending(true);

    try {
      const res = await fetch('/api/telegram/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userText }),
      });
      const data = await res.json();
      if (data.update?.botReply) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: data.update.botReply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        if (onRefreshQuota) onRefreshQuota();
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: '⚠️ Connection error contacting Telegram Gateway.', time },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl glass-modal border border-white/15 p-6 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Telegram AI Gateway</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Shared Runtime
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Connected to the same AI platform, model registry, and 70K quota
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security & Webhook Status Strip */}
        <div className="py-3 px-4 rounded-2xl bg-white/5 border border-white/10 my-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">Webhook Secret Verified</span>
          </div>
          <div className="text-slate-400 font-mono text-[11px]">
            Endpoint: <span className="text-cyan-300">/api/telegram/webhook</span>
          </div>
        </div>

        {/* Telegram Chat Simulation Window */}
        <div className="flex-1 overflow-y-auto space-y-3 p-4 rounded-2xl bg-[#080d1e] border border-white/10 my-2">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-md rounded-2xl p-3 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white'
                    : 'bg-white/10 text-slate-200 border border-white/10'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
                <div className="text-[10px] text-right opacity-60 mt-1">{m.time}</div>
              </div>
            </div>
          ))}
          {isSending && (
            <div className="text-xs text-cyan-400 animate-pulse pl-2">
              Bot is typing response via AI Gateway...
            </div>
          )}
        </div>

        {/* Telegram Input Form */}
        <form onSubmit={handleSimulate} className="pt-2 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type /start, /quota, or any question..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-semibold hover:from-sky-400 hover:to-blue-500 transition-all cursor-pointer disabled:opacity-40"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
