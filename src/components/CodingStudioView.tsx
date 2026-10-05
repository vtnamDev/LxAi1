import React, { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  Code2,
  Download,
  FileCode2,
  FilePlus2,
  FolderTree,
  Monitor,
  Play,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Tablet,
  TerminalSquare,
  Trash2,
  Upload,
  Zap,
} from 'lucide-react';
import { withTurnstile } from '../lib/turnstile';

type WorkspaceFile = { path: string; content: string };
type AgentModel = { id: string; displayName?: string; provider?: string; status?: string; capabilities?: string[] };
type Viewport = 'desktop' | 'tablet' | 'mobile';

const starterFiles: WorkspaceFile[] = [
  {
    path: 'index.html',
    content: '<!doctype html>\\n<html lang="en">\\n<head>\\n<meta charset="UTF-8" />\\n<meta name="viewport" content="width=device-width, initial-scale=1.0" />\\n<title>LX AI Preview</title>\\n<link rel="stylesheet" href="style.css" />\\n</head>\\n<body>\\n<main class="app"><span class="eyebrow">LX AI</span><h1>Build something.</h1><p>Edit the files or ask the coding agent to build the next version.</p><button id="demo">Test interaction</button></main><script src="app.js"></script>\\n</body>\\n</html>',
  },
  {
    path: 'style.css',
    content: ':root{font-family:Inter,system-ui,sans-serif;color:#f8fafc;background:#090a0f}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 20% 10%,#7c6cff22,transparent 35%),radial-gradient(circle at 85% 25%,#31d7ff18,transparent 32%),#090a0f}.app{width:min(680px,calc(100% - 32px));padding:48px;border:1px solid #ffffff16;border-radius:32px;background:#ffffff08;backdrop-filter:blur(18px);box-shadow:0 30px 90px #0008}.eyebrow{font-size:12px;text-transform:uppercase;letter-spacing:.22em;color:#8eeaff}.app h1{font-size:clamp(42px,8vw,76px);line-height:.95;letter-spacing:-.06em;margin:14px 0}.app p{color:#a6adba;line-height:1.7;max-width:48ch}.app button{margin-top:18px;border:0;border-radius:999px;padding:12px 18px;background:#fff;color:#090a0f;font-weight:700;cursor:pointer}',
  },
  {
    path: 'app.js',
    content: "document.getElementById('demo')?.addEventListener('click',()=>{document.querySelector('h1').textContent='It works.';});",
  },
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^()|[\\]\\\\]/g, '\\\\$&');
}

function encodePreviewAsset(value: string) {
  return value.replace(/<\\/script/gi, '<\\\\/script');
}

function buildPreviewDocument(files: WorkspaceFile[]): string {
  const normalized = files.map((file) => ({ ...file, path: file.path.replace(/^\\/+/, '') }));
  const html = normalized.find((file) => file.path.toLowerCase() === 'index.html')?.content;
  const css = normalized.filter((file) => /\\.css$/i.test(file.path));
  const js = normalized.filter((file) => /\\.(js|mjs)$/i.test(file.path));

  if (!html) {
    const body = normalized.find((file) => /\\.(html|htm)$/i.test(file.path))?.content;
    if (body) return body;
    const cssInline = css.map((file) => '<style>' + encodePreviewAsset(file.content) + '</style>').join('');
    const jsInline = js.map((file) => '<script>' + encodePreviewAsset(file.content) + '<\\\\/script>').join('');
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' + cssInline + '</head><body><main style="padding:24px;font-family:system-ui;color:#fff;background:#090a0f;min-height:100vh"><h1>No index.html</h1><p>Generate an index.html to enable the browser preview.</p></main>' + jsInline + '</body></html>';
  }

  let document = html;
  for (const file of css) {
    const escaped = encodePreviewAsset(file.content);
    const fileName = file.path.split('/').pop() || file.path;
    const pattern = new RegExp('<link[^>]+href=["\\'](?:\\.\\/)?' + escapeRegExp(fileName) + '["\\'][^>]*>','ig');
    document = document.replace(pattern, '<style data-lxai-file="' + fileName + '">' + escaped + '</style>');
  }

  for (const file of js) {
    const escaped = encodePreviewAsset(file.content);
    const fileName = file.path.split('/').pop() || file.path;
    const pattern = new RegExp('<script[^>]+src=["\\'](?:\\.\\/)?' + escapeRegExp(fileName) + '["\\'][^>]*><\\\\/script>','ig');
    document = document.replace(pattern, '<script data-lxai-file="' + fileName + '">' + escaped + '<\\\\/script>');
  }

  const bridge = '<script>(function(){function send(type,data){parent.postMessage({source:"lxai-preview",type:type,data:data||{}}, "*")}window.addEventListener("error",function(e){send("error",{message:e.message,line:e.lineno||null})});window.addEventListener("unhandledrejection",function(e){send("error",{message:String(e.reason)})});var original=console.log;console.log=function(){send("log",{message:Array.from(arguments).map(function(v){try{return typeof v==="string"?v:JSON.stringify(v)}catch{return String(v)}}).join(" ")});original.apply(console,arguments)};window.addEventListener("load",function(){send("ready",{title:document.title||"Preview"})})})();<\\/script>';
  if (document.includes('</body>')) return document.replace('</body>', bridge + '</body>');
  return document + bridge;
}

export const CodingStudioView: React.FC = () => {
  const [task, setTask] = useState('');
  const [workspace, setWorkspace] = useState<WorkspaceFile[]>(starterFiles);
  const [activeFile, setActiveFile] = useState('index.html');
  const [editorValue, setEditorValue] = useState(starterFiles[0].content);
  const [models, setModels] = useState<AgentModel[]>([]);
  const [roleModels, setRoleModels] = useState({ architect: '', builder: '', reviewer: '' });
  const [activeTab, setActiveTab] = useState<'agent' | 'files' | 'output'>('agent');
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [isRunning, setIsRunning] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [plan, setPlan] = useState('');
  const [review, setReview] = useState<any>(null);
  const [honesty, setHonesty] = useState('');
  const [previewNonce, setPreviewNonce] = useState(0);
  const [previewState, setPreviewState] = useState<'idle' | 'ready' | 'error'>('idle');
  const [previewLogs, setPreviewLogs] = useState<string[]>([]);

  const active = useMemo(() => workspace.find((file) => file.path === activeFile) || workspace[0], [workspace, activeFile]);

  useEffect(() => {
    setEditorValue(active?.content || '');
  }, [active?.path]);

  useEffect(() => {
    fetch('/api/models', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : { models: [] })
      .then((data) => {
        const live = Array.isArray(data.models)
          ? data.models.filter((model: AgentModel) => model.status === 'configured' || model.status === 'live' || !model.status)
          : [];
        setModels(live);
        if (!live.length) return;
        const byCode = live.find((model: AgentModel) => model.capabilities?.includes('code'));
        const reasoning = live.find((model: AgentModel) => model.capabilities?.includes('reasoning'));
        const groq = live.find((model: AgentModel) => model.id === 'groq:openai/gpt-oss-20b') || live.find((model: AgentModel) => (model.provider || '').toLowerCase() === 'groq');
        setRoleModels((current) => ({
          architect: current.architect || reasoning?.id || live[0]?.id || '',
          builder: current.builder || groq?.id || byCode?.id || live[1]?.id || live[0]?.id || '',
          reviewer: current.reviewer || reasoning?.id || live[2]?.id || live[0]?.id || '',
        }));
      })
      .catch(() => setModels([]));
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event.data || event.data.source !== 'lxai-preview') return;
      if (event.data.type === 'ready') {
        setPreviewState('ready');
        setPreviewLogs((current) => [...current, 'Preview loaded successfully.'].slice(-50));
      } else if (event.data.type === 'log') {
        setPreviewLogs((current) => [...current, String(event.data.data?.message || '')].slice(-50));
      } else if (event.data.type === 'error') {
        setPreviewState('error');
        setPreviewLogs((current) => [...current, 'ERROR: ' + String(event.data.data?.message || 'Preview runtime error')].slice(-50));
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const syncEditorToWorkspace = () => {
    if (!active) return;
    setWorkspace((current) => current.map((file) => file.path === active.path ? { ...file, content: editorValue } : file));
  };

  const selectFile = (path: string) => {
    syncEditorToWorkspace();
    setActiveFile(path);
    setPreviewState('idle');
  };

  const addFile = () => {
    const path = window.prompt('Tên file, ví dụ src/app.js');
    if (!path || path.includes('..') || path.startsWith('/')) return;
    if (workspace.some((file) => file.path === path)) return;
    setWorkspace((current) => [...current, { path, content: '' }]);
    setActiveFile(path);
    setEditorValue('');
  };

  const removeFile = () => {
    if (workspace.length <= 1 || !active) return;
    const next = workspace.filter((file) => file.path !== active.path);
    setWorkspace(next);
    setActiveFile(next[0].path);
    setEditorValue(next[0].content);
  };

  const importFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.currentTarget.value = '';
    for (const file of files.slice(0, 12)) {
      if (file.size > 2 * 1024 * 1024) continue;
      const content = await file.text();
      setWorkspace((current) => {
        const existing = current.find((item) => item.path === file.name);
        return existing
          ? current.map((item) => item.path === file.name ? { ...item, content } : item)
          : [...current, { path: file.name, content }];
      });
      setActiveFile(file.name);
      setEditorValue(content);
    }
  };

  const runAgent = async () => {
    const cleanTask = task.trim();
    if (!cleanTask || isRunning || !roleModels.architect || !roleModels.builder || !roleModels.reviewer) return;
    syncEditorToWorkspace();
    setIsRunning(true);
    setActiveTab('output');
    setPlan('');
    setReview(null);
    setHonesty('');
    setLogs(['Agent started.', '1/4 Architect: analyzing task and workspace…']);

    try {
      const response = await withTurnstile('agent', (turnstileToken) =>
        fetch('/api/agent/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('lx_session_token') || '') },
          body: JSON.stringify({ task: cleanTask, modelIds: roleModels, workspace, turnstileToken }),
        }),
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        setLogs((current) => [...current, 'FAILED: ' + String(data.error || 'Agent failed without a verified result.')]);
        return;
      }
      setPlan(String(data.plan || ''));
      setReview(data.review || null);
      setHonesty(String(data.honesty?.statement || 'Generated and reviewed. Server execution was not claimed.'));
      if (Array.isArray(data.files) && data.files.length) {
        setWorkspace(data.files);
        setActiveFile(data.files[0].path);
        setEditorValue(data.files[0].content || '');
      }
      setPreviewState('idle');
      setPreviewLogs([]);
      setPreviewNonce((value) => value + 1);
      setLogs((current) => [
        ...current,
        '2/4 Builder: generated project files.',
        '3/4 Reviewer: review returned.',
        data.fixApplied ? '4/4 Fixer: applied reviewer feedback.' : '4/4 Fixer: no additional fix was required.',
        'RESULT: files updated. No server-side code execution was claimed.',
        data.execution?.browserPreview ? 'Preview: browser sandbox available.' : 'Preview: generate index.html for live browser preview.',
      ]);
    } catch (error: any) {
      setLogs((current) => [...current, 'FAILED: ' + String(error?.message || error)]);
    } finally {
      setIsRunning(false);
    }
  };

  const runPreview = () => {
    syncEditorToWorkspace();
    setPreviewLogs([]);
    setPreviewState('idle');
    setPreviewNonce((value) => value + 1);
  };

  const downloadZip = async () => {
    syncEditorToWorkspace();
    setIsZipping(true);
    try {
      const response = await fetch('/api/workspace/zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('lx_session_token') || '') },
        body: JSON.stringify({ name: task.trim().slice(0, 48) || 'lx-ai-project', files: workspace }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({})))?.error || 'ZIP export failed.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = ((task.trim().slice(0, 48) || 'lx-ai-project').replace(/[^a-zA-Z0-9._-]+/g, '-') || 'lx-ai-project') + '.zip';
      anchor.click();
      URL.revokeObjectURL(url);
      setLogs((current) => [...current, 'Export: ZIP archive generated successfully by the server.']);
    } catch (error: any) {
      setLogs((current) => [...current, 'EXPORT FAILED: ' + String(error?.message || error)]);
    } finally {
      setIsZipping(false);
    }
  };

  const downloadCurrentFile = () => {
    syncEditorToWorkspace();
    if (!active) return;
    const blob = new Blob([editorValue], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = active.path.split('/').pop() || 'file.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const previewDocument = buildPreviewDocument(workspace);

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-black/10 px-3 py-2.5 backdrop-blur-xl md:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-300/15 bg-violet-300/8 text-violet-200"><Code2 className="h-4 w-4" /></span>
          <div className="min-w-0"><div className="truncate text-sm font-semibold text-white">AI Coding Agent</div><div className="text-[10px] text-slate-500">Architect → Builder → Reviewer → Preview</div></div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button type="button" onClick={runPreview} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-cyan-300/15 bg-cyan-300/8 px-3 text-xs font-semibold text-cyan-100 hover:bg-cyan-300/12"><Play className="h-3.5 w-3.5" /> Preview</button>
          <button type="button" onClick={downloadZip} disabled={isZipping || workspace.length === 0} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/7 px-3 text-xs font-semibold text-white hover:bg-white/12 disabled:opacity-40"><Archive className="h-3.5 w-3.5" /> {isZipping ? 'ZIP…' : 'Export ZIP'}</button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[280px_minmax(0,1fr)_minmax(360px,42%)]">
        <aside className="hidden min-h-0 flex-col border-r border-white/10 bg-black/8 xl:flex">
          <div className="flex items-center justify-between border-b border-white/8 px-3 py-2.5">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.14em] text-slate-400"><FolderTree className="h-3.5 w-3.5" /> Workspace</div>
            <div className="flex items-center gap-1">
              <button onClick={addFile} type="button" className="rounded-lg p-1.5 text-slate-400 hover:bg-white/7 hover:text-white" title="Add file"><FilePlus2 className="h-4 w-4" /></button>
              <label className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-white/7 hover:text-white" title="Import file"><Upload className="h-4 w-4" /><input type="file" multiple className="hidden" onChange={importFiles} /></label>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {workspace.map((file) => (
              <button key={file.path} type="button" onClick={() => selectFile(file.path)} className={['mb-1 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition', activeFile === file.path ? 'bg-white/10 text-white ring-1 ring-white/10' : 'text-slate-400 hover:bg-white/6 hover:text-white'].join(' ')}>
                <FileCode2 className="h-3.5 w-3.5 shrink-0 text-cyan-300" /><span className="min-w-0 flex-1 truncate">{file.path}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="flex min-h-0 flex-col bg-[#0a0b10]/70">
          <div className="flex flex-wrap items-center gap-2 border-b border-white/8 px-3 py-2 md:px-4">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-cyan-200">{activeFile}</span>
            <span className="text-[10px] text-slate-600">{workspace.reduce((sum, file) => sum + file.content.length, 0).toLocaleString()} chars</span>
            <button type="button" onClick={downloadCurrentFile} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/7 hover:text-white" title="Download current file"><Download className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={removeFile} disabled={workspace.length <= 1} className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-30" title="Delete current file"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
          <textarea value={editorValue} onChange={(event) => setEditorValue(event.target.value)} onBlur={syncEditorToWorkspace} spellCheck={false} className="min-h-0 flex-1 resize-none bg-transparent px-3 py-3 font-mono text-[12px] leading-6 text-slate-200 outline-none selection:bg-violet-400/20 md:px-4" />
          <div className="flex items-center gap-2 border-t border-white/8 bg-black/15 px-3 py-2 text-[10px] text-slate-500"><TerminalSquare className="h-3.5 w-3.5" />Edit → Preview → Export. Server execution is intentionally not faked.</div>
        </div>

        <section className="min-h-0 border-t border-white/10 bg-black/8 xl:border-l xl:border-t-0">
          <div className="flex items-center gap-1 border-b border-white/8 px-2 py-2">
            {(['agent', 'files', 'output'] as const).map((id) => (
              <button key={id} type="button" onClick={() => setActiveTab(id)} className={['rounded-full px-3 py-1.5 text-xs font-semibold', activeTab === id ? 'bg-white text-black' : 'text-slate-500 hover:bg-white/7 hover:text-white'].join(' ')}>{id[0].toUpperCase() + id.slice(1)}</button>
            ))}
            <div className="ml-auto text-[10px] text-slate-600">{previewState === 'ready' ? 'Preview live' : previewState === 'error' ? 'Preview error' : 'Preview idle'}</div>
          </div>

          {activeTab === 'agent' && (
            <div className="flex h-full min-h-0 flex-col overflow-y-auto p-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-white"><Zap className="h-3.5 w-3.5 text-violet-300" />Ask LX AI to build it</div>
                <textarea value={task} onChange={(event) => setTask(event.target.value)} placeholder="Ví dụ: Tạo landing page SaaS cao cấp có hero, pricing, animation nhẹ và responsive mobile." className="min-h-28 w-full resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-slate-600" />
                <div className="mt-3 space-y-2">
                  {([
                    ['Architect', roleModels.architect, 'architect'],
                    ['Builder', roleModels.builder, 'builder'],
                    ['Reviewer', roleModels.reviewer, 'reviewer'],
                  ] as const).map(([label, value, key]) => (
                    <label key={label} className="grid grid-cols-[74px_1fr] items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[.1em] text-slate-500">{label}</span>
                      <select value={value} onChange={(event) => setRoleModels((current) => ({ ...current, [key]: event.target.value }))} className="h-8 rounded-lg border border-white/10 bg-black/20 px-2 text-[11px] text-slate-200 outline-none">
                        {models.map((model) => <option key={model.id} value={model.id}>{(model.displayName || model.id).slice(0, 34)} · {model.provider || 'Provider'}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
                <button type="button" onClick={runAgent} disabled={isRunning || !task.trim() || !roleModels.architect || !roleModels.builder || !roleModels.reviewer} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-35">
                  {isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} {isRunning ? 'Agent đang làm…' : 'Build with AI Agent'}
                </button>
              </div>

              <div className="mt-3 rounded-xl border border-emerald-300/10 bg-emerald-300/5 p-3 text-[11px] text-emerald-100/80">
                <div className="mb-1 flex items-center gap-2 font-semibold text-emerald-200"><ShieldCheck className="h-3.5 w-3.5" />Honesty boundary</div>
                Model output is real. Server-side arbitrary code execution is disabled; browser preview runs only inside a sandboxed iframe.
              </div>

              <div className="mt-3 rounded-xl border border-white/8 bg-black/15 p-3">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">Pipeline</div>
                <div className="space-y-1 font-mono text-[10px] leading-5 text-slate-400">{logs.length ? logs.map((line, index) => <div key={index}>{line}</div>) : <div>Ready.</div>}</div>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="flex h-full min-h-0 flex-col p-3">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={addFile} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-slate-200 hover:bg-white/8"><FilePlus2 className="h-3.5 w-3.5" />New file</button>
                <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-slate-200 hover:bg-white/8"><Upload className="h-3.5 w-3.5" />Import<input type="file" multiple className="hidden" onChange={importFiles} /></label>
              </div>
              <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
                {workspace.map((file) => <button key={file.path} type="button" onClick={() => selectFile(file.path)} className={['w-full rounded-xl border p-2.5 text-left', activeFile === file.path ? 'border-white/15 bg-white/7' : 'border-white/8 bg-white/3'].join(' ')}><div className="flex items-center gap-2"><FileCode2 className="h-3.5 w-3.5 text-cyan-300" /><span className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-200">{file.path}</span><span className="text-[9px] text-slate-600">{file.content.length} B</span></div></button>)}
              </div>
            </div>
          )}

          {activeTab === 'output' && (
            <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto p-3">
              <div className="rounded-xl border border-white/8 bg-black/15 p-3">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">Architect plan</div>
                <pre className="whitespace-pre-wrap text-[11px] leading-5 text-slate-300">{plan || 'Chưa có plan.'}</pre>
              </div>
              {review && <div className="rounded-xl border border-white/8 bg-black/15 p-3"><div className="mb-1 text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">Reviewer</div><div className={review.approved ? 'text-emerald-300' : 'text-amber-300'}>{review.approved ? 'Approved' : 'Needs fixes'}</div><pre className="mt-2 whitespace-pre-wrap text-[10px] leading-5 text-slate-400">{JSON.stringify(review, null, 2)}</pre></div>}
              {honesty && <div className="rounded-lg border border-emerald-300/10 bg-emerald-300/5 p-2.5 text-[10px] leading-5 text-emerald-100/80">{honesty}</div>}
              <div className="rounded-xl border border-white/8 bg-black/15 p-3"><div className="mb-2 text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">Preview output</div>{previewLogs.length ? previewLogs.map((line, index) => <div key={index} className="font-mono text-[10px] leading-5 text-slate-400">{line}</div>) : <div className="text-[10px] text-slate-600">Run Preview to collect browser runtime events.</div>}</div>
            </div>
          )}
        </section>
      </div>

      <div className="min-h-0 border-t border-white/10 bg-[#07080c] px-2.5 py-2.5 sm:px-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-300"><Monitor className="h-3.5 w-3.5 text-cyan-300" />Live Preview {previewState === 'ready' && <span className="text-[9px] font-medium text-emerald-300">LIVE</span>}{previewState === 'error' && <span className="text-[9px] font-medium text-rose-300">ERROR</span>}</div>
          <div className="flex items-center gap-1">
            {([
              ['desktop', Monitor],
              ['tablet', Tablet],
              ['mobile', Smartphone],
            ] as const).map(([id, Icon]) => <button key={id} type="button" onClick={() => setViewport(id)} className={['rounded-lg p-1.5', viewport === id ? 'bg-white text-black' : 'text-slate-500 hover:bg-white/7 hover:text-white'].join(' ')} title={id}><Icon className="h-3.5 w-3.5" /></button>)}
            <button type="button" onClick={runPreview} className="ml-1 rounded-lg p-1.5 text-cyan-200 hover:bg-cyan-300/10" title="Reload preview"><RefreshCw className="h-3.5 w-3.5" /></button>
          </div>
        </div>
        <div className="flex min-h-[220px] items-center justify-center overflow-auto rounded-2xl border border-white/10 bg-black/20 p-2">
          <div className={['h-[42vh] min-h-[220px] max-h-[620px] overflow-hidden rounded-xl border border-white/12 bg-white transition-[width] duration-300', viewport === 'mobile' ? 'w-[340px]' : viewport === 'tablet' ? 'w-[620px] max-w-[92vw]' : 'w-full'].join(' ')}>
            <iframe key={previewNonce} title="LX AI live code preview" sandbox="allow-scripts" srcDoc={previewDocument} className="h-full w-full border-0 bg-white" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/8 bg-black/15 px-3 py-1.5 text-[9px] text-slate-600">
        <span>Input: local workspace files · Output: editable files + server ZIP</span>
        <span>{workspace.length} files</span>
      </div>
    </section>
  );
};
