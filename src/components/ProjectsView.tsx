import React, { useState, useEffect } from 'react';
import { FolderGit2, Plus, Code2, FileText, Sparkles, ChevronRight, Trash2 } from 'lucide-react';
import { Project } from '../types';

export const ProjectsView: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem('lx_session_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.projects && Array.isArray(data.projects)) {
          setProjects(data.projects);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const newProj: Project = {
      id: `proj_${Date.now()}`,
      name: newProjectName.trim(),
      description: newProjectDesc.trim() || 'Custom workspace project',
      systemPrompt: 'You are a dedicated AI assistant for this project.',
      files: [],
      createdAt: new Date().toISOString().split('T')[0],
    };

    setProjects([newProj, ...projects]);
    setNewProjectName('');
    setNewProjectDesc('');
    setIsCreating(false);

    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newProj),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    setProjects(projects.filter((p) => p.id !== id));
    try {
      await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Projects & Context Hub</h2>
          <p className="text-xs text-slate-400 mt-1">
            Organize codebases, knowledge documents, and custom instructions per workspace.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-xs shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="p-5 rounded-3xl glass-modal border border-white/15 space-y-3">
          <h3 className="text-sm font-bold text-white">Create New Workspace Project</h3>
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Project name (e.g. E-Commerce Website, IELTS Speaking Coach)..."
            className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            required
          />
          <textarea
            value={newProjectDesc}
            onChange={(e) => setNewProjectDesc(e.target.value)}
            rows={2}
            placeholder="Project description & custom context instructions..."
            className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-500"
            >
              Create Project
            </button>
          </div>
        </form>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((p) => (
          <div
            key={p.id}
            className="p-5 rounded-3xl glass-card border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-mono text-cyan-300 text-[11px]">{p.createdAt}</span>
                <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px]">Active</span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-cyan-200 transition-colors">
                {p.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {p.description}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500">Includes system instructions</span>
              <button className="flex items-center gap-1 text-cyan-400 font-medium group-hover:translate-x-1 transition-transform cursor-pointer">
                <span>Open Project</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
