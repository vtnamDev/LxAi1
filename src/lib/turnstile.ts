import { useEffect, useRef } from 'react';

type TurnstileInstance = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  execute: (widgetId: string) => void;
  reset: (widgetId: string) => void;
  remove?: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileInstance;
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise: Promise<TurnstileInstance | null> | null = null;
const widgets = new Map<string, { id: string; container: HTMLDivElement }>();
const pending = new Map<string, { resolve: (token: string) => void; reject: (error: Error) => void }>();

function siteKey(): string | null {
  const value = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

async function loadTurnstile(): Promise<TurnstileInstance> {
  if (typeof window === 'undefined') throw new Error('Turnstile is only available in a browser.');
  if (window.turnstile) return window.turnstile;
  if (scriptPromise) {
    const loaded = await scriptPromise;
    if (!loaded) throw new Error('Turnstile failed to load.');
    return loaded;
  }

  scriptPromise = new Promise<TurnstileInstance | null>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`) as HTMLScriptElement | null;
    const finish = () => {
      if (window.turnstile) {
        resolve(window.turnstile);
      } else {
        reject(new Error('Turnstile script loaded but the API is unavailable.'));
      }
    };

    if (existing) {
      existing.addEventListener('load', finish, { once: true });
      existing.addEventListener('error', () => reject(new Error('Unable to load Cloudflare Turnstile.')), { once: true });
      if (window.turnstile) finish();
      return;
    }

    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = finish;
    script.onerror = () => reject(new Error('Unable to load Cloudflare Turnstile.'));
    document.head.appendChild(script);
  });

  const loaded = await scriptPromise;
  if (!loaded) throw new Error('Turnstile failed to load.');
  return loaded;
}

function widgetFor(action: string, api: TurnstileInstance): string {
  const existing = widgets.get(action);
  if (existing) return existing.id;

  const container = document.createElement('div');
  container.setAttribute('aria-hidden', 'true');
  container.style.position = 'fixed';
  container.style.width = '1px';
  container.style.height = '1px';
  container.style.left = '-10000px';
  container.style.top = '-10000px';
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';
  document.body.appendChild(container);

  const id = api.render(container, {
    sitekey: siteKey(),
    action,
    execution: 'execute',
    appearance: 'execute',
    theme: 'dark',
    callback: (token: string) => {
      const current = pending.get(action);
      if (!current) return;
      pending.delete(action);
      current.resolve(token);
    },
    'error-callback': () => {
      const current = pending.get(action);
      if (!current) return;
      pending.delete(action);
      current.reject(new Error('Cloudflare Turnstile verification failed.'));
    },
    'expired-callback': () => {
      const current = pending.get(action);
      if (!current) return;
      pending.delete(action);
      current.reject(new Error('Cloudflare Turnstile verification expired. Please retry.'));
    },
    'timeout-callback': () => {
      const current = pending.get(action);
      if (!current) return;
      pending.delete(action);
      current.reject(new Error('Cloudflare Turnstile verification timed out. Please retry.'));
    },
  });

  widgets.set(action, { id, container });
  return id;
}

export async function getTurnstileToken(action: string): Promise<string | null> {
  const key = siteKey();
  if (!key) return null;
  if (pending.has(action)) throw new Error('Turnstile verification is already running.');

  const api = await loadTurnstile();
  const widgetId = widgetFor(action, api);

  return new Promise<string>((resolve, reject) => {
    pending.set(action, { resolve, reject });
    try {
      api.execute(widgetId);
    } catch (error) {
      pending.delete(action);
      reject(error instanceof Error ? error : new Error('Unable to start Turnstile.'));
    }
  });
}

export async function withTurnstile<T>(
  action: string,
  request: (token: string | null) => Promise<T>,
): Promise<T> {
  const token = await getTurnstileToken(action);
  try {
    return await request(token);
  } finally {
    const api = typeof window !== 'undefined' ? window.turnstile : undefined;
    const widget = widgets.get(action);
    if (api && widget) {
      try { api.reset(widget.id); } catch {}
    }
  }
}

export function useTurnstileWarmup(enabled = true): void {
  const started = useRef(false);

  useEffect(() => {
    if (!enabled || started.current || !siteKey()) return;
    started.current = true;
    loadTurnstile().catch(() => {
      started.current = false;
    });
  }, [enabled]);
}
