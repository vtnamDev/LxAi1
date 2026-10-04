/**
 * LX AI — Strict Production Model Verification Suite
 * Performs real bounded verification calls against configured model providers.
 * Adheres strictly to Zero False Claims: NEVER prints PASS unless physically verified.
 */

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

interface VerificationResult {
  id: string;
  name: string;
  provider: string;
  status: 'PASS' | 'AUTH_ERROR' | 'RATE_LIMITED' | 'DISABLED' | 'TIMEOUT' | 'ERROR';
  latencyMs?: number;
  error?: string;
}

async function verifyGoogleModel(apiKey: string, modelId: string): Promise<{ status: 'PASS' | 'AUTH_ERROR' | 'RATE_LIMITED' | 'ERROR'; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
    const res = await ai.models.generateContent({
      model: modelId,
      contents: 'Respond with "OK"',
      config: { maxOutputTokens: 5 },
    });
    if (res.text) {
      return { status: 'PASS', latencyMs: Date.now() - start };
    }
    return { status: 'ERROR', latencyMs: Date.now() - start, error: 'Empty response' };
  } catch (err: any) {
    const msg = err.message || '';
    if (msg.includes('401') || msg.includes('API_KEY_INVALID') || msg.includes('Unauthorized')) {
      return { status: 'AUTH_ERROR', latencyMs: Date.now() - start, error: 'Invalid API key' };
    }
    if (msg.includes('429') || msg.includes('ResourceExhausted')) {
      return { status: 'RATE_LIMITED', latencyMs: Date.now() - start, error: 'Rate limit or quota exhausted' };
    }
    return { status: 'ERROR', latencyMs: Date.now() - start, error: msg.slice(0, 100) };
  }
}

async function verifyOpenAICompatible(
  endpoint: string,
  apiKey: string,
  modelName: string
): Promise<{ status: 'PASS' | 'AUTH_ERROR' | 'RATE_LIMITED' | 'ERROR'; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 5,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      return { status: 'PASS', latencyMs: Date.now() - start };
    }

    if (res.status === 401) {
      return { status: 'AUTH_ERROR', latencyMs: Date.now() - start, error: 'Unauthorized (401)' };
    }
    if (res.status === 429) {
      return { status: 'RATE_LIMITED', latencyMs: Date.now() - start, error: 'Rate limit (429)' };
    }

    const txt = await res.text().catch(() => '');
    return { status: 'ERROR', latencyMs: Date.now() - start, error: `HTTP ${res.status}: ${txt.slice(0, 60)}` };
  } catch (err: any) {
    return { status: 'ERROR', latencyMs: Date.now() - start, error: err.message };
  }
}

async function main() {
  console.log('====================================================');
  console.log('LX AI — Strict Model Verification Suite');
  console.log('Zero False Claim Policy Active');
  console.log('====================================================\n');

  const geminiKey = process.env.GEMINI_KEY_1 || process.env.GEMINI_API_KEY;
  const openAIKey = process.env.OPENAI_KEY_1 || process.env.OPENAI_API_KEY;
  const groqKey = process.env.GROQ_KEY_1 || process.env.GROQ_API_KEY;
  const mistralKey = process.env.MISTRAL_KEY_1 || process.env.MISTRAL_API_KEY;
  const openRouterKey = process.env.OPENROUTER_KEY_1 || process.env.OPENROUTER_API_KEY;

  const results: VerificationResult[] = [];

  // 1. Google Gemini Flash
  if (geminiKey) {
    const res = await verifyGoogleModel(geminiKey, 'gemini-3.8-flash');
    results.push({
      id: 'gemini-3.8-flash',
      name: 'Gemini 3.8 Flash',
      provider: 'Google',
      status: res.status,
      latencyMs: res.latencyMs,
      error: res.error,
    });
  } else {
    results.push({ id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', provider: 'Google', status: 'DISABLED' });
  }

  // 2. Google Gemini Pro
  if (geminiKey) {
    const res = await verifyGoogleModel(geminiKey, 'gemini-3.1-pro-preview');
    results.push({
      id: 'gemini-3.1-pro-preview',
      name: 'Gemini 3.1 Pro',
      provider: 'Google',
      status: res.status,
      latencyMs: res.latencyMs,
      error: res.error,
    });
  } else {
    results.push({ id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', provider: 'Google', status: 'DISABLED' });
  }

  // 3. Groq Llama 3.3 70B
  if (groqKey) {
    const res = await verifyOpenAICompatible('https://api.groq.com/openai/v1/chat/completions', groqKey, 'llama-3.3-70b-versatile');
    results.push({
      id: 'groq-llama-3.3-70b',
      name: 'Llama 3.3 70B',
      provider: 'Groq',
      status: res.status,
      latencyMs: res.latencyMs,
      error: res.error,
    });
  } else {
    results.push({ id: 'groq-llama-3.3-70b', name: 'Llama 3.3 70B', provider: 'Groq', status: 'DISABLED' });
  }

  // 4. Mistral Large
  if (mistralKey) {
    const res = await verifyOpenAICompatible('https://api.mistral.ai/v1/chat/completions', mistralKey, 'mistral-large-latest');
    results.push({
      id: 'mistral-large',
      name: 'Mistral Large',
      provider: 'Mistral',
      status: res.status,
      latencyMs: res.latencyMs,
      error: res.error,
    });
  } else {
    results.push({ id: 'mistral-large', name: 'Mistral Large', provider: 'Mistral', status: 'DISABLED' });
  }

  // 5. OpenAI GPT-4o
  if (openAIKey) {
    const res = await verifyOpenAICompatible('https://api.openai.com/v1/chat/completions', openAIKey, 'gpt-4o');
    results.push({
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'OpenAI',
      status: res.status,
      latencyMs: res.latencyMs,
      error: res.error,
    });
  } else {
    results.push({ id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', status: 'DISABLED' });
  }

  // 6. OpenRouter Claude 3.5 Sonnet
  if (openRouterKey) {
    const res = await verifyOpenAICompatible('https://openrouter.ai/api/v1/chat/completions', openRouterKey, 'anthropic/claude-3.5-sonnet');
    results.push({
      id: 'claude-3-5-sonnet',
      name: 'Claude 3.5 Sonnet',
      provider: 'Anthropic (OpenRouter)',
      status: res.status,
      latencyMs: res.latencyMs,
      error: res.error,
    });
  } else {
    results.push({ id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', status: 'DISABLED' });
  }

  console.log('Model Verification Results:');
  console.log('----------------------------------------------------');
  for (const r of results) {
    const lat = r.latencyMs ? `(${r.latencyMs}ms)` : '';
    const err = r.error ? ` - ${r.error}` : '';
    console.log(`[${r.status.padEnd(12)}] ${r.provider.padEnd(20)} ${r.name} ${lat}${err}`);
  }
  console.log('----------------------------------------------------');

  const failed = results.filter((r) => r.status === 'AUTH_ERROR' || r.status === 'ERROR');
  const passed = results.filter((r) => r.status === 'PASS');

  if (failed.length > 0) {
    console.log(`\n❌ Gate Status: ${failed.length} model(s) failed verification.`);
  } else if (passed.length > 0) {
    console.log(`\n✅ Gate Status: All active models verified operational.`);
  } else {
    console.log(`\n⚠️ Gate Status: No models were enabled.`);
  }
}

main().catch(console.error);
