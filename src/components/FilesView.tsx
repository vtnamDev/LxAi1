import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  CheckCircle2,
  FileCode,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  Plus
} from 'lucide-react';
import { Attachment } from '../types';
import { withTurnstile } from '../lib/turnstile';

interface FilesViewProps {
  onAttachToChat?: (file: Attachment) => void;
}

export const FilesView: React.FC<FilesViewProps> = ({ onAttachToChat }) => {
  const [files, setFiles] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<Attachment | null>(null);

  const getHeaders = () => {
    const token = localStorage.getItem('lx_session_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/files', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.files && Array.isArray(data.files)) {
          setFiles(data.files);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    const filesToUpload = Array.from(selectedFiles).slice(0, 8);

    try {
      for (const file of filesToUpload) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(reader.error);
          reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
          reader.readAsDataURL(file);
        });

        const res = await withTurnstile('file-upload', (turnstileToken) =>
          fetch('/api/files/upload', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type || 'text/plain',
              size: file.size,
              base64Data: base64,
              turnstileToken,
            }),
          })
        );

        if (res.ok) {
          const uploaded = await res.json();
          setFiles((prev) => [uploaded, ...prev]);
        }
      }
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setFiles(files.filter((f) => f.id !== id));
    try {
      await fetch(`/api/files/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in">
      <div className="pb-4 border-b border-white/10">
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Files & Knowledge Intelligence</h2>
        <p className="text-xs text-slate-400 mt-1">
          Upload PDF documentation, codebases, datasets, or notes to ground your conversations.
        </p>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div className="relative border-2 border-dashed border-white/15 hover:border-cyan-500/50 rounded-3xl p-8 text-center glass-card transition-colors cursor-pointer group">
        <input
          type="file"
          onChange={handleFileUpload}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          accept=".pdf,.txt,.json,.md,.ts,.js,.py,.csv"
        />
        <div className="max-w-sm mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Click or drag files to upload</h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports PDF, JSON, Markdown, Code files up to 15MB.
            </p>
          </div>
          {isUploading && (
            <div className="text-xs text-cyan-400 font-medium animate-pulse">
              Parsing and extracting text contents...
            </div>
          )}
        </div>
      </div>

      {/* Files Table / List */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
          Knowledge Base ({files.length} items)
        </div>

        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="p-4 rounded-2xl glass-card border border-white/10 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">{file.name}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{Math.round(file.size / 1024)} KB</span>
                    <span>·</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewFile(file)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Preview text"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Delete file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-3xl glass-modal border border-white/15 p-6 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white truncate">{previewFile.name}</h3>
              <button onClick={() => setPreviewFile(null)} className="text-slate-400 hover:text-white text-xs">
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 rounded-2xl bg-black/40 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {previewFile.extractedText || 'No extracted text available.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
