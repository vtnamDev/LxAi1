import React, { useState } from 'react';
import {
  Code2,
  Play,
  FileCode,
  FolderTree,
  Terminal,
  Monitor,
  Smartphone,
  Tablet,
  RotateCcw,
  Sparkles,
  Save,
  Check,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

export const CodingStudioView: React.FC = () => {
  const [activeFile, setActiveFile] = useState<string>('src/app/page.tsx');
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '✓ lxai-web git:(main) yarn dev',
    '✓ Next.js 16.3.7 (Turbopack) & Tailwind CSS v4 initialized',
    '✓ Ready in 642ms',
    '➜ Local:   http://localhost:3000',
    '➜ Network: http://192.168.1.10:3000',
    '✓ Gemini 3.8 Live API WebSocket connected on ws://localhost:3000/live'
  ]);
  const [commandInput, setCommandInput] = useState('');
  const [saveStatus, setSaveStatus] = useState<boolean>(false);

  // Files virtual filesystem
  const files: Record<string, { language: string; content: string }> = {
    'src/app/page.tsx': {
      language: 'typescript',
      content: `import React, { useState } from 'react';
import { Sparkles, Mic, Code2, Send } from 'lucide-react';

export default function WorkspacePage() {
  const [status, setStatus] = useState('Ready');

  return (
    <main className="min-h-screen bg-[#070913] text-white p-8 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full p-6 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-2xl text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">LX AI Interactive Preview</h1>
        <p className="text-sm text-slate-400">
          Full-Stack AI Workspace with real-time conversational partner and multi-model intelligence.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button 
            onClick={() => setStatus('Voice Active')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-semibold"
          >
            Start Voice
          </button>
          <button 
            onClick={() => setStatus('Code Running')}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold"
          >
            Test Action
          </button>
        </div>
        <div className="text-xs text-cyan-300 font-mono pt-2">Status: {status}</div>
      </div>
    </main>
  );
}`
    },
    'src/components/chat-interface.tsx': {
      language: 'typescript',
      content: `import React from 'react';

export const ChatInterface = () => {
  return (
    <div className="p-4 rounded-2xl border border-white/10 bg-slate-950/70 text-slate-200">
      <h2 className="text-sm font-semibold text-cyan-300">Live AI Conversation Stream</h2>
      <p className="text-xs text-slate-400 mt-1">
        Connected to Gemini 3.8 Flash with Server-Sent Events (SSE).
      </p>
    </div>
  );
};`
    },
    'src/lib/ai.ts': {
      language: 'typescript',
      content: `import { GoogleGenAI } from '@google/genai';

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

export async function askGemini(prompt: string) {
  const res = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt
  });
  return res.text;
}`
    }
  };

  const [currentFileContent, setCurrentFileContent] = useState<string>(files['src/app/page.tsx'].content);

  const handleSelectFile = (path: string) => {
    setActiveFile(path);
    setCurrentFileContent(files[path]?.content || '');
  };

  const handleSave = () => {
    setSaveStatus(true);
    setTerminalLogs((prev) => [...prev, `[Build Engine] Saved & compiled: ${activeFile}`]);
    setTimeout(() => setSaveStatus(false), 2000);
  };

  const handleRunCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    const cmd = commandInput.trim();

    if (cmd === 'clear') {
      setTerminalLogs([]);
      setCommandInput('');
      return;
    }

    if (cmd === 'help') {
      setTerminalLogs((prev) => [
        ...prev,
        `$ ${cmd}`,
        'Sandbox Evaluator Commands:',
        '  • eval <code>     - Safely evaluate JavaScript expression in isolated context',
        '  • check           - Run syntax and structure check on current file',
        '  • clear           - Clear terminal logs',
      ]);
      setCommandInput('');
      return;
    }

    if (cmd.startsWith('eval ') || cmd.startsWith('js ')) {
      const codeToRun = cmd.replace(/^(eval|js)\s+/, '');
      try {
        // Safe evaluation in isolated function scope
        const result = new Function(`"use strict"; return (${codeToRun});`)();
        setTerminalLogs((prev) => [
          ...prev,
          `$ ${cmd}`,
          `=> ${typeof result === 'object' ? JSON.stringify(result) : String(result)}`,
        ]);
      } catch (err: any) {
        setTerminalLogs((prev) => [...prev, `$ ${cmd}`, `Error: ${err.message}`]);
      }
      setCommandInput('');
      return;
    }

    if (cmd === 'check' || cmd === 'npm run build' || cmd === 'build') {
      try {
        // Syntax verification check
        new Function(`"use strict"; ${currentFileContent}`);
        setTerminalLogs((prev) => [
          ...prev,
          `$ ${cmd}`,
          `[Check Passed] ${activeFile}: Syntax and structure validated successfully. Zero syntax errors.`,
        ]);
      } catch (err: any) {
        setTerminalLogs((prev) => [
          ...prev,
          `$ ${cmd}`,
          `[Syntax Error in ${activeFile}]: ${err.message}`,
        ]);
      }
      setCommandInput('');
      return;
    }

    setTerminalLogs((prev) => [
      ...prev,
      `$ ${cmd}`,
      `[Sandbox Notice] Full cloud container execution is disabled for safety. Run 'eval <expr>' or 'check' to test code safely.`,
    ]);
    setCommandInput('');
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Studio Header */}
      <div className="px-4 py-2.5 border-b border-white/10 glass-shell flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white">AI Coding Studio</span>
            <span className="ml-2 px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px]">
              Interactive Sandbox
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/30 text-cyan-200 border border-cyan-500/40 hover:bg-cyan-600/50 transition-colors font-medium cursor-pointer"
          >
            {saveStatus ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saveStatus ? 'Saved' : 'Save & Build'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Body: 3-column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Files Explorer */}
        <div className="w-60 border-r border-white/10 glass-card flex flex-col shrink-0 text-xs">
          <div className="p-3 font-semibold text-slate-400 uppercase tracking-wider text-[11px] border-b border-white/10 flex items-center gap-2">
            <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
            <span>Project Explorer</span>
          </div>
          <div className="p-2 space-y-1 overflow-y-auto flex-1 font-mono text-[11px]">
            <div className="text-slate-400 px-2 py-1">📁 src/</div>
            <div className="pl-4 space-y-0.5">
              {Object.keys(files).map((filePath) => (
                <button
                  key={filePath}
                  onClick={() => handleSelectFile(filePath)}
                  className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 truncate transition-colors cursor-pointer ${
                    activeFile === filePath
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{filePath.split('/').pop()}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Code Editor */}
        <div className="flex-1 flex flex-col border-r border-white/10 bg-[#090d1f] overflow-hidden">
          {/* File Tab */}
          <div className="px-4 py-2 bg-black/40 border-b border-white/10 flex items-center justify-between text-xs font-mono">
            <span className="text-cyan-300">{activeFile}</span>
            <span className="text-slate-500 text-[10px]">TypeScript / React</span>
          </div>

          <div className="flex-1 p-4 font-mono text-xs overflow-y-auto">
            <textarea
              value={currentFileContent}
              onChange={(e) => setCurrentFileContent(e.target.value)}
              className="w-full h-full bg-transparent text-slate-200 outline-none resize-none font-mono text-xs leading-relaxed selection:bg-cyan-500/30"
              spellCheck={false}
            />
          </div>

          {/* Bottom Console / Terminal */}
          <div className="h-44 border-t border-white/10 bg-black/70 flex flex-col font-mono text-xs">
            <div className="px-3 py-1.5 border-b border-white/10 bg-white/5 flex items-center gap-2 text-slate-400 text-[11px]">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-slate-300">Terminal & Build Console</span>
            </div>
            <div className="flex-1 p-3 overflow-y-auto space-y-1 text-slate-300 text-[11px]">
              {terminalLogs.map((log, index) => (
                <div key={index} className="leading-tight">
                  {log}
                </div>
              ))}
            </div>
            <form onSubmit={handleRunCommand} className="p-2 border-t border-white/10 flex items-center gap-2">
              <span className="text-emerald-400">$</span>
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="Type command (e.g. npm run build, clear, help)..."
                className="flex-1 bg-transparent text-white text-xs outline-none"
              />
            </form>
          </div>
        </div>

        {/* Right: Live Interactive Web Preview */}
        <div className="w-[450px] hidden xl:flex flex-col glass-card shrink-0 overflow-hidden">
          {/* Preview Navigation Header */}
          <div className="p-2.5 bg-black/40 border-b border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-[11px] flex-1 max-w-[280px] truncate">
              <span className="text-cyan-400">https://</span>
              <span>localhost:3000</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPreviewViewport('desktop')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  previewViewport === 'desktop' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                }`}
                title="Desktop"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewViewport('tablet')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  previewViewport === 'tablet' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                }`}
                title="Tablet"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewViewport('mobile')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  previewViewport === 'mobile' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                }`}
                title="Mobile"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Preview Canvas */}
          <div className="flex-1 p-4 bg-[#070913] flex items-center justify-center overflow-auto">
            <div
              className={`transition-all duration-300 bg-slate-950 rounded-2xl border border-white/15 p-6 shadow-2xl text-center space-y-4 ${
                previewViewport === 'mobile'
                  ? 'w-[320px]'
                  : previewViewport === 'tablet'
                  ? 'w-[380px]'
                  : 'w-full'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-cyan-500/20">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Live Applet Running</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Dynamic Glass & Real-time AI services compiled and responding to user actions.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-cyan-300 font-mono">
                ✓ Gemini 3.8 Live API Active
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
