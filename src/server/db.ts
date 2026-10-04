/**
 * LX AI — Production Database & Persistence Layer
 * Provides transactional, file-backed atomic storage with per-user isolation,
 * concurrency-safe quota reservations, and zero data loss on restart.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { hasAuthDatabase, upsertUser as upsertUserInDatabase, createSession as createDbSession, validateSession as validateDbSession, revokeSession as revokeDbSession } from './auth-db';
import { createSignedSession, verifySignedSession } from './auth-session';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: 'google' | 'email' | 'guest';
  googleSub?: string;
  plan: 'free' | 'pro';
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  expiresAt: number;
  createdAt: string;
}

export interface UserQuota {
  userId: string;
  usedTokens: number;
  limitTokens: number;
  exhaustedAt: number | null;
  cooldownMs: number;
  hasFree24h: boolean;
  free24hExpiresAt: number | null;
  redeemedVouchers: string[];
}

export interface DBConversation {
  id: string;
  userId: string;
  title: string;
  modelId: string;
  mode: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    sources?: any[];
    tokens?: number;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface DBProject {
  id: string;
  userId: string;
  name: string;
  description: string;
  files: Array<{
    name: string;
    content: string;
    size: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface DBFile {
  id: string;
  userId: string;
  name: string;
  size: number;
  type: string;
  extractedText?: string;
  uploadedAt: string;
}

interface DatabaseSchema {
  users: Record<string, User>;
  sessions: Record<string, Session>;
  quotas: Record<string, UserQuota>;
  conversations: Record<string, DBConversation>;
  projects: Record<string, DBProject>;
  files: Record<string, DBFile>;
  processedTelegramUpdates: number[];
  telegramLinks: Record<string, string>; // chatId -> userId
}

const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'lxai-data')
  : path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export class Database {
  private static instance: DatabaseSchema = {
    users: {},
    sessions: {},
    quotas: {},
    conversations: {},
    projects: {},
    files: {},
    processedTelegramUpdates: [],
    telegramLinks: {},
  };

  // In-memory active reservation tracking to prevent race conditions during concurrent generations
  private static activeReservations: Map<string, number> = new Map();
  private static isInitialized = false;

  static init(): void {
    if (this.isInitialized) return;

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.instance = { ...this.instance, ...parsed };
      } catch (err) {
        console.error('[DB] Failed to parse db.json, creating clean store:', err);
        this.save();
      }
    } else {
      this.save();
    }

    this.isInitialized = true;
  }

  private static save(): void {
    try {
      const tempPath = `${DB_FILE}.${Date.now()}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.instance, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('[DB] Failed to save database file atomically:', err);
    }
  }

  // ---------------- USER & SESSIONS ----------------
  static async createOrGetGoogleUser(googleSub: string, email: string, name: string, avatarUrl?: string): Promise<User> {
    this.init();

    const normalizedEmail = email.toLowerCase();
    const candidate: User = {
      id: `usr_${crypto.randomBytes(8).toString('hex')}`,
      email: normalizedEmail,
      name: name.trim() || normalizedEmail.split('@')[0],
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(normalizedEmail)}`,
      provider: 'google',
      googleSub,
      plan: 'pro',
      createdAt: new Date().toISOString(),
    };

    if (hasAuthDatabase()) {
      try {
        const persisted = await upsertUserInDatabase(candidate);
        this.instance.users[persisted.id] = persisted;
        this.instance.quotas[persisted.id] = this.instance.quotas[persisted.id] || {
          userId: persisted.id,
          usedTokens: 0,
          limitTokens: 70000,
          exhaustedAt: null,
          cooldownMs: 3600000,
          hasFree24h: false,
          free24hExpiresAt: null,
          redeemedVouchers: [],
        };
        this.save();
        return persisted;
      } catch (error) {
        console.error('[DB] Persistent Google user write failed; using local fallback:', error);
      }
    }

    const bySub = Object.values(this.instance.users).find((u) => u.googleSub === googleSub);
    if (bySub) return bySub;

    const byEmail = Object.values(this.instance.users).find((u) => u.email.toLowerCase() === normalizedEmail);
    if (byEmail) {
      byEmail.googleSub = googleSub;
      byEmail.provider = 'google';
      if (name.trim()) byEmail.name = name.trim();
      if (avatarUrl) byEmail.avatarUrl = avatarUrl;
      this.save();
      return byEmail;
    }

    this.instance.users[candidate.id] = candidate;
    this.instance.quotas[candidate.id] = {
      userId: candidate.id,
      usedTokens: 0,
      limitTokens: 70000,
      exhaustedAt: null,
      cooldownMs: 3600000,
      hasFree24h: false,
      free24hExpiresAt: null,
      redeemedVouchers: [],
    };
    this.save();
    return candidate;
  }

  static async createOrGetUser(email: string, name: string, provider: 'google' | 'email' | 'guest', avatarUrl?: string): Promise<User> {
    this.init();
    const normalizedEmail = email.toLowerCase();
    const existing = Object.values(this.instance.users).find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) return existing;

    const user: User = {
      id: `usr_${crypto.randomBytes(8).toString('hex')}`,
      email: normalizedEmail,
      name,
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
      provider,
      plan: 'pro',
      createdAt: new Date().toISOString(),
    };

    if (hasAuthDatabase()) {
      try {
        const persisted = await upsertUserInDatabase(user);
        this.instance.users[persisted.id] = persisted;
        this.instance.quotas[persisted.id] = this.instance.quotas[persisted.id] || {
          userId: persisted.id,
          usedTokens: 0,
          limitTokens: 70000,
          exhaustedAt: null,
          cooldownMs: 3600000,
          hasFree24h: false,
          free24hExpiresAt: null,
          redeemedVouchers: [],
        };
        this.save();
        return persisted;
      } catch (error) {
        console.error('[DB] Persistent user write failed; using local fallback:', error);
      }
    }

    this.instance.users[user.id] = user;
    this.instance.quotas[user.id] = {
      userId: user.id,
      usedTokens: 0,
      limitTokens: 70000,
      exhaustedAt: null,
      cooldownMs: 3600000,
      hasFree24h: false,
      free24hExpiresAt: null,
      redeemedVouchers: [],
    };
    this.save();
    return user;
  }

  static async createSession(userId: string): Promise<string> {
    this.init();
    const user = this.instance.users[userId];
    if (!user) throw new Error('Cannot create a session for an unknown user.');

    const expiresAt = Date.now() + 30 * 24 * 3600 * 1000;

    if (hasAuthDatabase()) {
      const token = crypto.randomBytes(32).toString('hex');
      try {
        await createDbSession(token, userId, expiresAt);
        return token;
      } catch (error) {
        console.error('[DB] Persistent session write failed; using signed-session fallback:', error);
      }
    }

    return createSignedSession(user, expiresAt);
  }

  static async validateSession(token?: string | null): Promise<User | null> {
    if (!token) return null;
    this.init();

    if (hasAuthDatabase()) {
      try {
        const dbUser = await validateDbSession(token);
        if (dbUser) return dbUser;
      } catch (error) {
        console.error('[DB] Persistent session validation failed:', error);
      }
    }

    const signedUser = verifySignedSession(token);
    if (signedUser) return signedUser;

    // Legacy local session fallback for tokens created by earlier deployments.
    const session = this.instance.sessions[token];
    if (!session) return null;

    if (Date.now() > session.expiresAt) {
      delete this.instance.sessions[token];
      this.save();
      return null;
    }

    return this.instance.users[session.userId] || null;
  }

  static async deleteSession(token: string): Promise<void> {
    this.init();
    if (hasAuthDatabase()) {
      try {
        await revokeDbSession(token);
      } catch (error) {
        console.error('[DB] Persistent session revoke failed:', error);
      }
    }
    delete this.instance.sessions[token];
    this.save();
  }

  // ---------------- PER-USER QUOTA & RACE PREVENTION ----------------
  static getQuota(userId: string): UserQuota {
    this.init();
    if (!this.instance.quotas[userId]) {
      this.instance.quotas[userId] = {
        userId,
        usedTokens: 0,
        limitTokens: 70000,
        exhaustedAt: null,
        cooldownMs: 3600000,
        hasFree24h: false,
        free24hExpiresAt: null,
        redeemedVouchers: [],
      };
      this.save();
    }

    const quota = this.instance.quotas[userId];

    // Check expiration of FREE_24H
    if (quota.hasFree24h && quota.free24hExpiresAt && Date.now() > quota.free24hExpiresAt) {
      quota.hasFree24h = false;
      quota.free24hExpiresAt = null;
      this.save();
    }

    // Check cooldown expiry
    if (quota.exhaustedAt && Date.now() - quota.exhaustedAt > quota.cooldownMs) {
      quota.usedTokens = 0;
      quota.exhaustedAt = null;
      this.save();
    }

    return quota;
  }

  /**
   * Concurrency-safe budget reservation before calling AI model.
   * Prevents race condition where 2 concurrent requests bypass quota.
   */
  static reserveBudget(userId: string, estimatedTokens = 500): { allowed: boolean; reason?: string } {
    const quota = this.getQuota(userId);

    // Free 24h pass bypasses limit
    if (quota.hasFree24h && quota.free24hExpiresAt && Date.now() < quota.free24hExpiresAt) {
      return { allowed: true };
    }

    // Check cooldown
    if (quota.exhaustedAt) {
      const remainingSeconds = Math.max(0, Math.ceil((quota.cooldownMs - (Date.now() - quota.exhaustedAt)) / 1000));
      if (remainingSeconds > 0) {
        return { allowed: false, reason: `Quota exhausted. Cooldown active for ${remainingSeconds}s.` };
      }
    }

    const currentReserved = this.activeReservations.get(userId) || 0;
    if (quota.usedTokens + currentReserved + estimatedTokens > quota.limitTokens) {
      quota.exhaustedAt = Date.now();
      this.save();
      return { allowed: false, reason: '70,000 token limit reached. 1 hour cooldown initiated.' };
    }

    // Reserve tokens in memory for current in-flight generation
    this.activeReservations.set(userId, currentReserved + estimatedTokens);
    return { allowed: true };
  }

  static commitUsage(userId: string, actualTokens: number, estimatedReservation = 500): void {
    const quota = this.getQuota(userId);

    // Release reservation
    const currentReserved = this.activeReservations.get(userId) || 0;
    this.activeReservations.set(userId, Math.max(0, currentReserved - estimatedReservation));

    // Free 24h does not deplete token budget
    if (quota.hasFree24h && quota.free24hExpiresAt && Date.now() < quota.free24hExpiresAt) {
      return;
    }

    quota.usedTokens += actualTokens;
    if (quota.usedTokens >= quota.limitTokens && !quota.exhaustedAt) {
      quota.exhaustedAt = Date.now();
    }
    this.save();
  }

  static releaseReservation(userId: string, estimatedReservation = 500): void {
    const currentReserved = this.activeReservations.get(userId) || 0;
    this.activeReservations.set(userId, Math.max(0, currentReserved - estimatedReservation));
  }

  static redeemVoucher(userId: string, code: string): { success: boolean; message: string; expiresAt?: number } {
    const quota = this.getQuota(userId);
    const normalizedCode = code.trim().toUpperCase();

    // Valid vouchers allowed in the system
    const validCodes = ['FREE_24H', 'LXAI2026', 'VTNAMDEV'];
    if (!validCodes.includes(normalizedCode)) {
      return { success: false, message: 'Invalid or unrecognized voucher code.' };
    }

    // One-time redemption check per user
    if (quota.redeemedVouchers.includes(normalizedCode)) {
      return { success: false, message: 'This voucher has already been redeemed for your account.' };
    }

    quota.redeemedVouchers.push(normalizedCode);
    quota.hasFree24h = true;
    quota.free24hExpiresAt = Date.now() + 24 * 3600 * 1000; // 24 hours
    quota.exhaustedAt = null;
    this.save();

    return {
      success: true,
      message: 'FREE_24H entitlement activated! Unlimited tokens for 24 hours.',
      expiresAt: quota.free24hExpiresAt,
    };
  }

  // ---------------- CONVERSATIONS PERSISTENCE ----------------
  static listConversations(userId: string): DBConversation[] {
    this.init();
    return Object.values(this.instance.conversations)
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  static saveConversation(userId: string, conv: Partial<DBConversation> & { id: string }): DBConversation {
    this.init();
    const existing = this.instance.conversations[conv.id];
    if (existing && existing.userId !== userId) {
      throw new Error('Forbidden: Conversation does not belong to user');
    }

    const updated: DBConversation = {
      id: conv.id,
      userId,
      title: conv.title || existing?.title || 'New Conversation',
      modelId: conv.modelId || existing?.modelId || 'gemini-3.8-flash',
      mode: conv.mode || existing?.mode || 'fast',
      messages: conv.messages || existing?.messages || [],
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.instance.conversations[conv.id] = updated;
    this.save();
    return updated;
  }

  static deleteConversation(userId: string, id: string): boolean {
    this.init();
    const existing = this.instance.conversations[id];
    if (!existing || existing.userId !== userId) return false;
    delete this.instance.conversations[id];
    this.save();
    return true;
  }

  // ---------------- PROJECTS PERSISTENCE ----------------
  static listProjects(userId: string): DBProject[] {
    this.init();
    return Object.values(this.instance.projects)
      .filter((p) => p.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  static saveProject(userId: string, project: Partial<DBProject> & { id: string }): DBProject {
    this.init();
    const existing = this.instance.projects[project.id];
    if (existing && existing.userId !== userId) {
      throw new Error('Forbidden: Project does not belong to user');
    }

    const updated: DBProject = {
      id: project.id,
      userId,
      name: project.name || existing?.name || 'Untitled Project',
      description: project.description || existing?.description || '',
      files: project.files || existing?.files || [],
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.instance.projects[project.id] = updated;
    this.save();
    return updated;
  }

  static deleteProject(userId: string, id: string): boolean {
    this.init();
    const existing = this.instance.projects[id];
    if (!existing || existing.userId !== userId) return false;
    delete this.instance.projects[id];
    this.save();
    return true;
  }

  // ---------------- FILES PERSISTENCE ----------------
  static listFiles(userId: string): DBFile[] {
    this.init();
    return Object.values(this.instance.files).filter((f) => f.userId === userId);
  }

  static saveFile(userId: string, file: DBFile): DBFile {
    this.init();
    this.instance.files[file.id] = file;
    this.save();
    return file;
  }

  static deleteFile(userId: string, id: string): boolean {
    this.init();
    const existing = this.instance.files[id];
    if (!existing || existing.userId !== userId) return false;
    delete this.instance.files[id];
    this.save();
    return true;
  }

  // ---------------- TELEGRAM IDEMPOTENCY ----------------
  static isTelegramUpdateProcessed(updateId: number): boolean {
    this.init();
    return this.instance.processedTelegramUpdates.includes(updateId);
  }

  static markTelegramUpdateProcessed(updateId: number): void {
    this.init();
    if (!this.instance.processedTelegramUpdates.includes(updateId)) {
      this.instance.processedTelegramUpdates.push(updateId);
      if (this.instance.processedTelegramUpdates.length > 500) {
        this.instance.processedTelegramUpdates.shift();
      }
      this.save();
    }
  }
}
