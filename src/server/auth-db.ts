import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';
import type { User } from './db';

let schemaPromise: Promise<boolean> | null = null;

function getSql() {
  const url = process.env.DATABASE_URL?.trim();
  return url ? neon(url) : null;
}

export function hasAuthDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

async function ensureSchema(): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  if (!schemaPromise) {
    schemaPromise = (async () => {
      try {
        await sql`CREATE TABLE IF NOT EXISTS lxai_users (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          avatar_url TEXT,
          provider TEXT NOT NULL,
          google_sub TEXT UNIQUE,
          plan TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`;
        await sql`CREATE TABLE IF NOT EXISTS lxai_sessions (
          token_hash TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES lxai_users(id) ON DELETE CASCADE,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          revoked_at TIMESTAMPTZ
        )`;
        await sql`CREATE INDEX IF NOT EXISTS lxai_sessions_user_idx ON lxai_sessions(user_id)`;
        await sql`CREATE INDEX IF NOT EXISTS lxai_sessions_expiry_idx ON lxai_sessions(expires_at)`;
        return true;
      } catch (error) {
        schemaPromise = null;
        throw error;
      }
    })();
  }
  return schemaPromise;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function rowToUser(row: any): User {
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    avatarUrl: row.avatar_url ? String(row.avatar_url) : undefined,
    provider: row.provider as User['provider'],
    googleSub: row.google_sub ? String(row.google_sub) : undefined,
    plan: row.plan as User['plan'],
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function upsertUser(user: User): Promise<User> {
  const sql = getSql();
  if (!sql || !(await ensureSchema())) throw new Error('DATABASE_URL is not configured.');

  const existing = await sql`SELECT id, email, name, avatar_url, provider, google_sub, plan, created_at
    FROM lxai_users
    WHERE lower(email) = lower(${user.email})
       OR (${user.googleSub ?? null} IS NOT NULL AND google_sub = ${user.googleSub ?? null})
    LIMIT 1`;

  if (existing.length) {
    const id = String(existing[0].id);
    const createdAt = new Date(existing[0].created_at).toISOString();
    await sql`UPDATE lxai_users
      SET email=${user.email},
          name=${user.name},
          avatar_url=${user.avatarUrl ?? null},
          provider=${user.provider},
          google_sub=${user.googleSub ?? null},
          plan=${user.plan},
          last_login_at=NOW()
      WHERE id=${id}`;
    return { ...user, id, createdAt };
  }

  await sql`INSERT INTO lxai_users
    (id, email, name, avatar_url, provider, google_sub, plan, created_at, last_login_at)
    VALUES (${user.id}, ${user.email}, ${user.name}, ${user.avatarUrl ?? null},
            ${user.provider}, ${user.googleSub ?? null}, ${user.plan},
            ${user.createdAt}, NOW())`;
  return user;
}

export async function createSession(token: string, userId: string, expiresAt: number): Promise<void> {
  const sql = getSql();
  if (!sql || !(await ensureSchema())) throw new Error('DATABASE_URL is not configured.');
  const tokenHash = hashToken(token);
  await sql`INSERT INTO lxai_sessions (token_hash, user_id, expires_at)
    VALUES (${tokenHash}, ${userId}, ${new Date(expiresAt).toISOString()})
    ON CONFLICT (token_hash) DO UPDATE SET
      user_id=EXCLUDED.user_id,
      expires_at=EXCLUDED.expires_at,
      revoked_at=NULL`;
}

export async function validateSession(token: string): Promise<User | null> {
  const sql = getSql();
  if (!sql || !(await ensureSchema())) return null;
  const tokenHash = hashToken(token);
  const rows = await sql`
    SELECT u.id, u.email, u.name, u.avatar_url, u.provider, u.google_sub, u.plan, u.created_at
    FROM lxai_sessions s
    JOIN lxai_users u ON u.id = s.user_id
    WHERE s.token_hash=${tokenHash}
      AND s.revoked_at IS NULL
      AND s.expires_at > NOW()
    LIMIT 1
  `;
  return rows.length ? rowToUser(rows[0]) : null;
}

export async function revokeSession(token: string): Promise<void> {
  const sql = getSql();
  if (!sql || !(await ensureSchema())) return;
  const tokenHash = hashToken(token);
  await sql`UPDATE lxai_sessions SET revoked_at=NOW() WHERE token_hash=${tokenHash}`;
}
