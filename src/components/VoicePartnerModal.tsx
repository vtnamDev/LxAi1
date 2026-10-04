import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Languages,
  Sparkles,
  PhoneOff,
  Radio,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { Message } from '../types';

interface VoicePartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToChat?: (userText: string, modelReply: string) => void;
}

export const VoicePartnerModal: React.FC<VoicePartnerModalProps> = ({
  isOpen,
  onClose,
  onSaveToChat,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [modelResponse, setModelResponse] = useState<string>('Hello! I am your AI language practice partner. What would you like to talk about today?');
  const [feedbackTip, setFeedbackTip] = useState<string | null>(null);
  
  // Settings
  const [targetLanguage, setTargetLanguage] = useState<string>('English');
  const [scenario, setScenario] = useState<string>('Daily Conversation');
  const [voiceName, setVoiceName] = useState<string>('Zephyr');
  const [continuousMode, setContinuousMode] = useState<boolean>(true);
  
  // Audio state
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Supported languages & scenarios
  const languages = [
    { code: 'en-US', name: 'English', flag: '🇺🇸' },
    { code: 'vi-VN', name: 'Vietnamese', flag: '🇻🇳' },
    { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
    { code: 'de-DE', name: 'German', flag: '🇩🇪' },
    { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
    { code: 'zh-CN', name: 'Mandarin', flag: '🇨🇳' },
  ];

  const scenarios = [
    'Daily Conversation',
    'Ordering at a Café',
    'Job Interview Practice',
    'Tech & Coding Discussion',
    'Travel & Airport Check-in',
    'IELTS / Speaking Test'
  ];

  const voices = ['Zephyr', 'Kore', 'Puck', 'Charon', 'Fenrir'];

  // Initialize Speech Recognition if available in browser
  useEffect(() => {
    if (!isOpen) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      const selectedLangObj = languages.find((l) => l.name === targetLanguage);
      recognition.lang = selectedLangObj?.code || 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        // If user finished speech segment
        if (event.results[event.results.length - 1].isFinal) {
          handleUserSpeechDone(currentTranscript);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition notice:', err.error);
      };

      recognitionRef.current = recognition;
    }

    // Connect to WebSocket /live if available
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[Live Audio Client] Connected to /live');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.audio) {
            playAudioChunk(msg.audio);
          }
          if (msg.text) {
            setModelResponse((prev) => prev + ' ' + msg.text);
          }
          if (msg.interrupted) {
            stopAudioPlayback();
          }
        } catch (e) {}
      };

      wsRef.current = ws;
    } catch (e) {
      console.warn('WebSocket fallback to HTTP Turn Bridge');
    }

    return () => {
      stopAudioPlayback();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isOpen, targetLanguage]);

  // Visualizer Animation Loop
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 65;

      phase += 0.04;
      const amplitude = isSpeaking ? 18 : isListening ? 12 : 5;

      // Draw pulsating concentric cosmic rings
      for (let ring = 3; ring >= 1; ring--) {
        ctx.beginPath();
        const r = radius + ring * 14 + Math.sin(phase + ring) * amplitude;
        ctx.arc(centerX, centerY, Math.max(10, r), 0, Math.PI * 2);
        ctx.strokeStyle = isSpeaking
          ? `rgba(6, 182, 212, ${0.4 / ring})`
          : isListening
          ? `rgba(16, 185, 129, ${0.4 / ring})`
          : `rgba(99, 102, 241, ${0.25 / ring})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // Center glowing orb
      const grad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, radius);
      if (isSpeaking) {
        grad.addColorStop(0, 'rgba(6, 182, 212, 0.9)');
        grad.addColorStop(0.7, 'rgba(59, 130, 246, 0.5)');
        grad.addColorStop(1, 'rgba(147, 51, 234, 0.1)');
      } else if (isListening) {
        grad.addColorStop(0, 'rgba(16, 185, 129, 0.9)');
        grad.addColorStop(0.7, 'rgba(5, 150, 105, 0.5)');
        grad.addColorStop(1, 'rgba(6, 182, 212, 0.1)');
      } else {
        grad.addColorStop(0, 'rgba(99, 102, 241, 0.7)');
        grad.addColorStop(0.7, 'rgba(139, 92, 246, 0.4)');
        grad.addColorStop(1, 'rgba(7, 9, 19, 0.1)');
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + Math.sin(phase * 2) * 3, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, isSpeaking, isListening]);

  const toggleMic = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
    } else {
      stopAudioPlayback();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          setIsListening(true);
        }
      } else {
        setIsListening(true);
      }
    }
  };

  const handleUserSpeechDone = async (spokenText: string) => {
    if (!spokenText.trim() || isProcessing) return;

    setIsProcessing(true);
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    try {
      const response = await fetch('/api/voice/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: spokenText,
          targetLanguage,
          voiceName,
          scenario,
        }),
      });

      const data = await response.json();
      if (data.spokenReply) {
        setModelResponse(data.spokenReply);
        if (data.feedbackTip) {
          setFeedbackTip(data.feedbackTip);
        } else {
          setFeedbackTip(null);
        }

        if (data.audioBase64) {
          playAudioChunk(data.audioBase64);
        } else {
          // Browser TTS fallback if needed
          speakWithBrowser(data.spokenReply);
        }

        if (onSaveToChat) {
          onSaveToChat(spokenText, data.spokenReply);
        }
      }
    } catch (err) {
      console.error('Voice interaction error:', err);
    } finally {
      setIsProcessing(false);
      setTranscript('');
    }
  };

  const currentAudioElemRef = useRef<HTMLAudioElement | null>(null);

  const playAudioChunk = (base64Audio: string) => {
    stopAudioPlayback();
    setIsSpeaking(true);
    try {
      const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
      currentAudioElemRef.current = audio;
      audio.onended = () => {
        setIsSpeaking(false);
        if (continuousMode && isOpen) {
          toggleMic();
        }
      };
      audio.onerror = () => {
        setIsSpeaking(false);
      };
      audio.play().catch(() => {
        setIsSpeaking(false);
      });
    } catch (e) {
      setIsSpeaking(false);
    }
  };

  const speakWithBrowser = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (continuousMode && isOpen) {
          toggleMic();
        }
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopAudioPlayback = () => {
    if (currentAudioElemRef.current) {
      currentAudioElemRef.current.pause();
      currentAudioElemRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl glass-modal border border-white/15 p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Real-time Conversational Voice Partner</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Gemini 3.8 Live
                </span>
              </div>
              <p className="text-xs text-slate-400">Interactive spoken dialogue with instant language coaching</p>
            </div>
          </div>

          <button
            onClick={() => {
              stopAudioPlayback();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Practice Controls Strip */}
        <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-white/10 text-xs">
          {/* Target Language */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
            <Languages className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="bg-transparent text-slate-200 outline-none w-full cursor-pointer"
            >
              {languages.map((l) => (
                <option key={l.name} value={l.name} className="bg-slate-900 text-white">
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Scenario */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="bg-transparent text-slate-200 outline-none w-full cursor-pointer truncate"
            >
              {scenarios.map((s) => (
                <option key={s} value={s} className="bg-slate-900 text-white">
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Voice Personality */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
            <Volume2 className="w-3.5 h-3.5 text-purple-400" />
            <select
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              className="bg-transparent text-slate-200 outline-none w-full cursor-pointer"
            >
              {voices.map((v) => (
                <option key={v} value={v} className="bg-slate-900 text-white">
                  Voice: {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Audio Waveform & Visualizer */}
        <div className="flex-1 flex flex-col items-center justify-center py-4 relative">
          <canvas
            ref={canvasRef}
            width={280}
            height={180}
            className="w-[280px] h-[180px] z-10"
          />

          <div className="text-center mt-2 z-20">
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all ${
                isSpeaking
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                  : isListening
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm animate-pulse'
                  : isProcessing
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-white/5 text-slate-400 border-white/10'
              }`}
            >
              {isSpeaking
                ? 'AI Speaking (24kHz Native)...'
                : isListening
                ? 'Listening to you... Speak now'
                : isProcessing
                ? 'Formulating response & coaching...'
                : 'Ready to converse'}
            </span>
          </div>
        </div>

        {/* Live Subtitles & Coaching Feedback */}
        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
          {/* AI Response Subtitle */}
          <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 text-sm text-cyan-100 flex items-start gap-2.5 shadow-sm">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider mb-0.5">
                AI Partner ({targetLanguage})
              </div>
              <p className="leading-relaxed">{modelResponse}</p>
            </div>
          </div>

          {/* User Live Transcript */}
          {transcript && (
            <div className="p-2.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-200 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="font-mono text-emerald-300">You said:</span>
              <span className="italic truncate">{transcript}</span>
            </div>
          )}

          {/* Language Learning Feedback Tip */}
          {feedbackTip && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-300">Coaching Tip: </span>
                <span>{feedbackTip}</span>
              </div>
            </div>
          )}
        </div>

        {/* Manual quick prompt input if user has no microphone */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = (e.currentTarget.elements.namedItem('textInput') as HTMLInputElement).value;
            if (input.trim()) {
              handleUserSpeechDone(input);
              (e.currentTarget.elements.namedItem('textInput') as HTMLInputElement).value = '';
            }
          }}
          className="flex items-center gap-2 mb-3"
        >
          <input
            name="textInput"
            type="text"
            placeholder={`Type a sentence in ${targetLanguage} or speak using the mic below...`}
            className="flex-1 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-cyan-600/30 border border-cyan-500/40 text-cyan-200 text-xs font-medium hover:bg-cyan-600/50 transition-colors cursor-pointer"
          >
            Send
          </button>
        </form>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setContinuousMode(!continuousMode)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                continuousMode
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-white/5 text-slate-400 border-white/10'
              }`}
            >
              Continuous Conversation: {continuousMode ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Interrupt Speech Button */}
            {isSpeaking && (
              <button
                onClick={stopAudioPlayback}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-xs font-medium transition-colors cursor-pointer"
                title="Interrupt AI and speak"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>Interrupt</span>
              </button>
            )}

            {/* Mic Toggle Button */}
            <button
              onClick={toggleMic}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-xs shadow-lg transition-all cursor-pointer active:scale-95 ${
                isListening
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30 ring-2 ring-emerald-400'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Stop Listening</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Tap to Speak</span>
                </>
              )}
            </button>

            {/* Close session */}
            <button
              onClick={() => {
                stopAudioPlayback();
                onClose();
              }}
              className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-colors cursor-pointer"
              title="End Voice Call"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
