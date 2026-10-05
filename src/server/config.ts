/**
 * LX AI — Centralized Server Configuration Layer
 * Secrets are read only from environment variables. Never hardcode credentials.
 * Tavily web search uses the TAVILY_KEY_N pool with server-side rotation.
 */

export interface ProviderStatus {
  google: boolean;
  openai: boolean;
  openrouter: boolean;
  groq: boolean;
  mistral: boolean;
  cerebras: boolean;
  nvidia: boolean;
  huggingface: boolean;
  tavily: boolean;
  exa: boolean;
  langsearch: boolean;
  xkiro: boolean;
  cloudflare: boolean;
  telegram: boolean;
}

function envPool(prefix: string, max = 16): string[] {
  const values: string[] = [];
  for (let i = 1; i <= max; i += 1) {
    const value = process.env[`${prefix}${i}`]?.trim();
    if (value) values.push(value);
  }
  return values;
}

function singleOrPool(prefix: string, legacyName?: string): string[] {
  const pool = envPool(prefix);
  const legacy = legacyName ? process.env[legacyName]?.trim() : undefined;
  if (legacy && !pool.includes(legacy)) pool.push(legacy);
  return pool;
}

export class ServerConfig {
  static get geminiKeys(): string[] {
    return singleOrPool('GEMINI_KEY_', 'GEMINI_API_KEY');
  }

  static get openAIKeys(): string[] {
    return singleOrPool('OPENAI_KEY_', 'OPENAI_API_KEY');
  }

  static get openRouterKeys(): string[] {
    return singleOrPool('OPENROUTER_KEY_', 'OPENROUTER_API_KEY');
  }

  static get groqKeys(): string[] {
    return singleOrPool('GROQ_KEY_', 'GROQ_API_KEY');
  }

  static get mistralKeys(): string[] {
    return singleOrPool('MISTRAL_KEY_', 'MISTRAL_API_KEY');
  }

  static get cerebrasKeys(): string[] {
    return singleOrPool('CEREBRAS_KEY_', 'CEREBRAS_API_KEY');
  }

  static get huggingFaceKeys(): string[] {
    return [
      ...singleOrPool('HUGGINGFACE_KEY_'),
      ...(process.env.HF_TOKEN?.trim() ? [process.env.HF_TOKEN.trim()] : []),
    ].filter((v, i, a) => a.indexOf(v) === i);
  }

  static get tavilyKeys(): string[] {
    return envPool('TAVILY_KEY_');
  }

  static get exaKeys(): string[] {
    return singleOrPool('EXA_KEY_', 'EXA_API_KEY');
  }

  static get langSearchKeys(): string[] {
    return [
      ...singleOrPool('LANGSEARCH_KEY_', 'LANGSEARCH_API_KEY'),
    ];
  }

  static get xKiroKeys(): string[] {
    return singleOrPool('XKIRO_KEY_', 'XKIRO_API_KEY');
  }

  static get cloudflareApiToken(): string | null {
    return process.env.CLOUDFLARE_API_TOKEN?.trim() || process.env.CLOUDFLARE_API_KEY?.trim() || null;
  }

  static get cloudflareAccountId(): string | null {
    return process.env.CLOUDFLARE_ACCOUNT_ID?.trim() || null;
  }

  static get cloudflareConfigured(): boolean {
    return !!(this.cloudflareApiToken && this.cloudflareAccountId);
  }

  static get openAIKey(): string | null { return this.openAIKeys[0] || null; }
  static get openRouterKey(): string | null { return this.openRouterKeys[0] || null; }
  static get groqKey(): string | null { return this.groqKeys[0] || null; }
  static get mistralKey(): string | null { return this.mistralKeys[0] || null; }
  static get cerebrasKey(): string | null { return this.cerebrasKeys[0] || null; }

  static get nvidiaKeys(): {
    kimiK3: string | null;
    deepseekV4Pro: string | null;
    nemotronUltra1: string | null;
    nemotronUltra2: string | null;
    nemotronSuper: string | null;
    minimaxM3: string | null;
    gptOss120b: string | null;
  } {
    return {
      kimiK3: process.env.NVIDIA_KIMI_K3_KEY?.trim() || null,
      deepseekV4Pro: process.env.NVIDIA_DEEPSEEK_V4_PRO_KEY?.trim() || null,
      nemotronUltra1: process.env.NVIDIA_NEMOTRON_ULTRA_KEY_1?.trim() || null,
      nemotronUltra2: process.env.NVIDIA_NEMOTRON_ULTRA_KEY_2?.trim() || null,
      nemotronSuper: process.env.NVIDIA_NEMOTRON_SUPER_KEY?.trim() || null,
      minimaxM3: process.env.NVIDIA_MINIMAX_M3_KEY?.trim() || null,
      gptOss120b: process.env.NVIDIA_GPT_OSS_120B_KEY?.trim() || null,
    };
  }

  static get googleClientId(): string | null {
    return process.env.GOOGLE_CLIENT_ID?.trim() || null;
  }

  static get telegramBotToken(): string | null {
    return process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
  }

  static get telegramWebhookSecret(): string | null {
    return process.env.TELEGRAM_WEBHOOK?.trim() || null;
  }

  static get port(): number {
    const parsed = Number.parseInt(process.env.PORT || '3000', 10);
    return Number.isFinite(parsed) ? parsed : 3000;
  }

  static getProviderStatus(): ProviderStatus {
    const n = this.nvidiaKeys;
    return {
      google: this.geminiKeys.length > 0,
      openai: this.openAIKeys.length > 0,
      openrouter: this.openRouterKeys.length > 0,
      groq: this.groqKeys.length > 0,
      mistral: this.mistralKeys.length > 0,
      cerebras: this.cerebrasKeys.length > 0,
      nvidia: !!(n.kimiK3 || n.deepseekV4Pro || n.nemotronUltra1 || n.nemotronUltra2 || n.nemotronSuper || n.minimaxM3 || n.gptOss120b),
      huggingface: this.huggingFaceKeys.length > 0,
      tavily: this.tavilyKeys.length > 0,
      exa: this.exaKeys.length > 0,
      langsearch: this.langSearchKeys.length > 0,
      xkiro: this.xKiroKeys.length > 0,
      cloudflare: this.cloudflareConfigured,
      telegram: !!(this.telegramBotToken && this.telegramWebhookSecret),
    };
  }
}
