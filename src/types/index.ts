export type ModeType = 'fast' | 'thinking' | 'council';
export type PerformanceTier = 'full' | 'balanced' | 'lite' | 'minimal';
export type ViewType = 'home' | 'chat' | 'coding' | 'projects' | 'files' | 'models' | 'utilities' | 'telegram' | 'settings';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  provider: 'google' | 'email' | 'guest';
  plan: 'free' | 'pro';
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  extractedText?: string;
  status: 'ready' | 'processing' | 'error';
  uploadedAt: string;
}

export interface SearchSource {
  title: string;
  url: string;
  snippet: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoningContent?: string;
  attachments?: Attachment[];
  sources?: SearchSource[];
  tokens?: number;
  latencyMs?: number;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  modelId: string;
  mode: ModeType;
  messages: Message[];
  projectId?: string;
  createdAt: string;
  updatedAt: string;
  totalTokens: number;
}

export interface ModelInfo {
  id: string;
  provider: string;
  displayName: string;
  capabilities: string[];
  contextWindow: number;
  status: 'active' | 'configured' | 'unavailable';
  isDefault?: boolean;
  description: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  files: ProjectFile[];
  createdAt: string;
}

export interface QuotaInfo {
  usedTokens: number;
  limitTokens: number;
  percentage: number;
  inCooldown: boolean;
  cooldownSecondsRemaining: number;
  hasFree24h: boolean;
  free24hExpiresAt: number | null;
}

export interface LanguagePartnerConfig {
  targetLanguage: string;
  scenario: string;
  voiceName: string;
}
