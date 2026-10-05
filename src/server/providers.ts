/**
 * LX AI — Production AI Provider Adapters & Exact Model Router
 * Enforces Zero Silent Substitution: models route strictly to their claimed provider.
 */

import { GoogleGenAI } from '@google/genai';
import { ServerConfig } from './config';

export interface StreamChunk {
  text?: string;
  reasoningText?: string;
  sources?: Array<{ title: string; url: string; snippet: string }>;
  done?: boolean;
}

export interface StreamParams {
  modelId: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string; attachments?: any[] }>;
  mode: 'fast' | 'thinking' | 'auto';
  enableSearch?: boolean;
  projectContext?: string;
  webContext?: string;
  signal?: AbortSignal;
}

export class ProviderError extends Error {
  code: string;
  status: number;
  constructor(message: string, code = 'PROVIDER_ERROR', status = 502) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
    this.status = status;
  }
}

// 1. Google Gemini Adapter
export class GeminiAdapter {
  private static readonly modelMap: Record<string, string> = {
    'gemini-3.8-flash': 'gemini-3.8-flash',
  };

  public static getClient(): GoogleGenAI {
    const keys = ServerConfig.geminiKeys;
    if (keys.length === 0) {
      throw new ProviderError('Gemini is not configured on this server.', 'PROVIDER_UNAVAILABLE', 503);
    }

    const key = keys[Math.floor(Math.random() * keys.length)];
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: { headers: { 'User-Agent': 'lxai-gateway' } },
    });
  }

  static async *stream(params: StreamParams): AsyncIterable<StreamChunk> {
    const targetModel = this.modelMap[params.modelId];
    if (!targetModel) {
      throw new ProviderError(
        `Gemini model "${params.modelId}" is not supported for text chat.`,
        'MODEL_UNSUPPORTED',
        400,
      );
    }

    const ai = this.getClient();

    let systemInstruction = `You are LX AI, an advanced AI workspace assistant with a Dynamic Glass interface.
Provide articulate, concise, and helpful responses. Format code in markdown code blocks with clear language tags.`;

    if (params.projectContext) {
      systemInstruction += `\n\n<project_context>\n${params.projectContext}\n</project_context>`;
    }

    if (params.webContext) {
      systemInstruction += `\n\n<web_research>\nUse the verified web research below as the factual grounding for current or time-sensitive claims. Prefer these sources over memory. Do not invent citations or URLs.\nFor the final answer, write the main conclusion first, then a short "Điểm chính" bullet list when useful. When the information is tabular, comparative, or numeric, convert it into a clean Markdown table with meaningful column names. Do not print raw source URLs, source lists, or a "Sources" section unless the user explicitly asks for sources.\n${params.webContext}\n</web_research>`;
    }

    const contents = params.messages.map((m) => {
      const role = m.role === 'assistant' ? 'model' : 'user';
      let text = m.content || '';
      if (m.attachments && m.attachments.length > 0) {
        text += `\n\n[Attached Files Content (Untrusted)]:\n${m.attachments.map((a: any) => `File: ${a.name}\n${a.extractedText || a.content || ''}`).join('\n---\n')}`;
      }
      return { role, parts: [{ text }] };
    });

    // Gemini 3.x uses thinkingLevel rather than legacy temperature/top-p/top-k controls.
    // Gemini 3.8 Flash specifically rejects deprecated sampling parameters.
    const config: any = {
      systemInstruction,
      abortSignal: params.signal,
      thinkingConfig: {
        thinkingLevel: params.mode === 'fast' ? 'low' : params.mode === 'thinking' ? 'high' : 'medium',
      },
    };

    if (params.enableSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const responseStream = await ai.models.generateContentStream({
      model: targetModel,
      contents,
      config,
    });

    for await (const chunk of responseStream) {
      if (params.signal?.aborted) break;

      const parts = chunk.candidates?.[0]?.content?.parts || [];
      let yieldedPart = false;

      for (const part of parts as any[]) {
        if (part.thought && part.text) {
          yield { reasoningText: part.text };
          yieldedPart = true;
        } else if (part.text) {
          yield { text: part.text };
          yieldedPart = true;
        }
      }

      if (!yieldedPart && chunk.text) {
        yield { text: chunk.text };
      }

      const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks && groundingChunks.length > 0) {
        const sources = groundingChunks
          .filter((c: any) => c.web?.uri && c.web?.title)
          .map((c: any) => ({
            title: c.web.title,
            url: c.web.uri,
            snippet: c.web.snippet || '',
          }));
        if (sources.length > 0) yield { sources };
      }
    }
  }
}

// Generic OpenAI-compatible streaming helper
async function* streamOpenAICompatible(
  endpoint: string,
  apiKeyOrPool: string | string[],
  providerModel: string,
  params: StreamParams,
  providerName: string,
  headers: Record<string, string> = {},
  requestExtras: Record<string, unknown> = {}
): AsyncIterable<StreamChunk> {
  let systemMessage = `You are LX AI, an advanced personal AI workspace assistant.`;
  if (params.projectContext) systemMessage += `\n\nContext:\n${params.projectContext}`;
  if (params.webContext) {
    systemMessage += `\n\nVerified web research from Tavily:\nUse it as grounding. Start with the answer, add "Điểm chính" when useful, use a clean Markdown table for structured or numeric data, and do not print raw URLs or a Sources section unless requested.\n${params.webContext}`;
  }

  const messages = [
    { role: 'system', content: systemMessage },
    ...params.messages.map((m) => ({ role: m.role, content: m.content || '' })),
  ];

  let res: Response | null = null;
  const keyOrder = randomKeyOrder(Array.isArray(apiKeyOrPool) ? apiKeyOrPool : [apiKeyOrPool]);

  for (const apiKey of keyOrder) {
    try {
      const candidate = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          ...headers,
        },
        body: JSON.stringify({
          model: providerModel,
          messages,
          stream: true,
          temperature: params.mode === 'fast' ? 0.3 : 0.7,
          ...requestExtras,
        }),
        signal: params.signal,
      });

      if (candidate.ok) {
        res = candidate;
        break;
      }

      // Retry another configured key for credential/rate/service failures.
      if (![401, 403, 429, 500, 502, 503, 504].includes(candidate.status)) {
        res = candidate;
        break;
      }
    } catch (err: any) {
      if (params.signal?.aborted) return;
    }
  }

  if (!res) {
    throw new ProviderError(`${providerName} unavailable after trying configured keys.`, 'PROVIDER_ERROR', 502);
  }

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    console.error('[AI_PROVIDER_ERROR]', { provider: providerName, status: res.status, body: errorBody.slice(0, 500) });
    const code =
      res.status === 401 ? 'AUTH_ERROR' :
      res.status === 403 ? 'FORBIDDEN' :
      res.status === 404 ? 'MODEL_NOT_FOUND' :
      res.status === 429 ? 'RATE_LIMITED' :
      'PROVIDER_ERROR';
    const message =
      res.status === 401 ? `${providerName} authentication failed.` :
      res.status === 403 ? `${providerName} denied the request.` :
      res.status === 404 ? `${providerName} could not find the selected model.` :
      res.status === 429 ? `${providerName} is rate limiting requests.` :
      `${providerName} rejected the request.`;
    throw new ProviderError(message, code, res.status);
  }

  if (!res.body) throw new ProviderError(`${providerName} returned empty response body`, 'PROVIDER_EMPTY_BODY');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      if (params.signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (trimmed === 'data: [DONE]') return;
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          const delta = json.choices?.[0]?.delta;
          if (delta?.content) yield { text: delta.content };
          if (delta?.reasoning_content) yield { reasoningText: delta.reasoning_content };
          if (delta?.reasoning) yield { reasoningText: typeof delta.reasoning === 'string' ? delta.reasoning : JSON.stringify(delta.reasoning) };
          if (json.web_search?.results) {
            yield { sources: json.web_search.results.map((r: any) => ({ title: r.title || '', url: r.url || '', snippet: r.snippet || r.text || '' })) };
          }
        } catch {
          // Ignore malformed/partial SSE records; reader buffer handles incomplete lines.
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function randomKeyOrder(pool: string[]): string[] {
  return [...pool].sort(() => Math.random() - 0.5);
}

// Provider API-key pools are shuffled per request so multiple configured keys are exercised over time.

// 2. OpenAI Adapter
export class OpenAIAdapter {
  static async *stream(params: StreamParams): AsyncIterable<StreamChunk> {
    const keys = ServerConfig.openAIKeys;
    if (!keys.length) throw new ProviderError('OpenAI is not configured on this server.', 'PROVIDER_UNAVAILABLE', 503);
    yield* streamOpenAICompatible(
      'https://api.openai.com/v1/chat/completions', keys,
      params.modelId, params, 'OpenAI'
    );
  }
}

// 3. Groq Adapter
export class GroqAdapter {
  static async *stream(params: StreamParams): AsyncIterable<StreamChunk> {
    const keys = ServerConfig.groqKeys;
    if (!keys.length) throw new ProviderError('Groq is not configured on this server.', 'PROVIDER_UNAVAILABLE', 503);
    const model = params.modelId.replace(/^groq:/, '');
    yield* streamOpenAICompatible('https://api.groq.com/openai/v1/chat/completions', keys, model, params, 'Groq');
  }
}

// 4. Cerebras Adapter
export class CerebrasAdapter {
  static async *stream(params: StreamParams): AsyncIterable<StreamChunk> {
    const keys = ServerConfig.cerebrasKeys;
    if (!keys.length) throw new ProviderError('Cerebras is not configured on this server.', 'PROVIDER_UNAVAILABLE', 503);
    const model = params.modelId.replace(/^cerebras:/, '');
    yield* streamOpenAICompatible('https://api.cerebras.ai/v1/chat/completions', keys, model, params, 'Cerebras');
  }
}

// 5. Mistral Adapter
export class MistralAdapter {
  static async *stream(params: StreamParams): AsyncIterable<StreamChunk> {
    const keys = ServerConfig.mistralKeys;
    if (!keys.length) throw new ProviderError('Mistral is not configured on this server.', 'PROVIDER_UNAVAILABLE', 503);
    const model = params.modelId.replace(/^mistral:/, '');
    const extras = params.mode === 'thinking' ? { prompt_mode: 'reasoning' } : {};
    yield* streamOpenAICompatible('https://api.mistral.ai/v1/chat/completions', keys, model, params, 'Mistral', {}, extras);
  }
}

// 6. OpenRouter Adapter — exact model forwarding
export class OpenRouterAdapter {
  static async *stream(params: StreamParams): AsyncIterable<StreamChunk> {
    const keys = ServerConfig.openRouterKeys;
    if (!keys.length) throw new ProviderError('OpenRouter is not configured on this server.', 'PROVIDER_UNAVAILABLE', 503);
    const model = params.modelId.replace(/^openrouter:/, '');
    yield* streamOpenAICompatible(
      'https://openrouter.ai/api/v1/chat/completions', keys, model, params, 'OpenRouter',
      { 'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || 'https://lxai1.vercel.app', 'X-Title': 'LX AI' }
    );
  }
}

// 7. NVIDIA NIM Adapter
export class NvidiaAdapter {
  static async *stream(params: StreamParams): AsyncIterable<StreamChunk> {
    const keys = Object.values(ServerConfig.nvidiaKeys).filter((v): v is string => Boolean(v));
    if (!keys.length) throw new ProviderError('NVIDIA NIM is not configured on this server.', 'PROVIDER_UNAVAILABLE', 503);
    const modelName = params.modelId.replace(/^nvidia:/, '');
    if (!modelName) throw new ProviderError('NVIDIA model ID is required.', 'MODEL_NOT_FOUND', 404);
    yield* streamOpenAICompatible('https://integrate.api.nvidia.com/v1/chat/completions', keys, modelName, params, 'NVIDIA NIM');
  }
}

// 8. Hugging Face Inference Providers — exact model is supplied as huggingface:<model-id>
export class HuggingFaceAdapter {
  static async *stream(params: StreamParams): AsyncIterable<StreamChunk> {
    const keys = ServerConfig.huggingFaceKeys;
    if (!keys.length) throw new ProviderError('Hugging Face is not configured on this server.', 'PROVIDER_UNAVAILABLE', 503);
    const model = params.modelId.replace(/^huggingface:/, '');
    if (!model) throw new ProviderError('Hugging Face model ID is required.', 'MODEL_NOT_FOUND', 404);
    yield* streamOpenAICompatible('https://router.huggingface.co/v1/chat/completions', keys, model, params, 'Hugging Face');
  }
}

// 9. xKiro AI Gateway — exact vendor/model forwarding
export class XKiroAdapter {
  static async *stream(params: StreamParams): AsyncIterable<StreamChunk> {
    const keys = ServerConfig.xKiroKeys;
    if (!keys.length) throw new ProviderError('xKiro is not configured on this server.', 'PROVIDER_UNAVAILABLE', 503);
    const model = params.modelId.replace(/^xkiro:/, '');
    if (!model) throw new ProviderError('xKiro model ID is required.', 'MODEL_NOT_FOUND', 404);
    yield* streamOpenAICompatible('https://api.xkiro.com/v1/chat/completions', keys, model, params, 'xKiro');
  }
}

// 10. Canonical Model Router — strict model-prefix routing, no hidden provider substitution.
export class ModelRouter {
  static async *route(params: StreamParams): AsyncIterable<StreamChunk> {
    const id = params.modelId;

    if (id.startsWith('gemini-')) yield* GeminiAdapter.stream(params);
    else if (id.startsWith('gpt-') || /^o[134](?:-|$)/.test(id)) yield* OpenAIAdapter.stream(params);
    else if (id.startsWith('groq:')) yield* GroqAdapter.stream(params);
    else if (id.startsWith('cerebras:')) yield* CerebrasAdapter.stream(params);
    else if (id.startsWith('mistral:')) yield* MistralAdapter.stream(params);
    else if (id.startsWith('openrouter:')) yield* OpenRouterAdapter.stream(params);
    else if (id.startsWith('nvidia:')) yield* NvidiaAdapter.stream(params);
    else if (id.startsWith('huggingface:')) yield* HuggingFaceAdapter.stream(params);
    else if (id.startsWith('xkiro:')) yield* XKiroAdapter.stream(params);
    else throw new ProviderError(`Unknown model: ${id}`, 'MODEL_NOT_FOUND', 404);
  }
}
