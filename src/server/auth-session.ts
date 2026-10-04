import crypto from 'crypto';
import type { User } from './db';

function getSecret(): Buffer {
  const configured = process.env.AUTH_SESSION_SECRET?.trim();
  if (configured) return Buffer.from(configured, 'utf8');
  if (process.env.VERCEL) throw new Error('AUTH_SESSION_SECRET is required on Vercel.');
  return crypto.createHash('sha256').update('lxai-local-development-session-secret').digest();
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

export function createSignedSession(user: User, expiresAt: number): string {
  const payload = Buffer.from(JSON.stringify({
    v: 1,
    sub: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    provider: user.provider,
    googleSub: user.googleSub,
    plan: user.plan,
    createdAt: user.createdAt,
    exp: expiresAt,
  })).toString('base64url');
  return `lx1.${payload}.${sign(payload)}`;
}

export function verifySignedSession(token: string): User | null {
  try {
    if (!token.startsWith('lx1.')) return null;
    const [, payload, signature] = token.split('.');
    if (!payload || !signature) return null;
    const expected = sign(payload);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decoded?.v !== 1 || typeof decoded?.sub !== 'string' || typeof decoded?.email !== 'string') return null;
    if (typeof decoded?.exp !== 'number' || Date.now() >= decoded.exp) return null;
    return {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name || decoded.email.split('@')[0],
      avatarUrl: decoded.avatarUrl || undefined,
      provider: decoded.provider || 'google',
      googleSub: decoded.googleSub || undefined,
      plan: decoded.plan || 'pro',
      createdAt: decoded.createdAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
