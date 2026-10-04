# LX AI — API Wiring Report (2026-10-04)

The credential names supplied in `api.txt` are wired through server-side environment variables. Credential values are intentionally not copied into source, documentation, client bundles, or release ZIPs.

Implemented pools: Gemini x4, OpenRouter x3, Groq x4, Mistral x2, OpenAI x1, Hugging Face x2, Tavily x3, Exa x1, LangSearch x1, xKiro x1, Cerebras x1, NVIDIA per-model credentials, Telegram bot/webhook credentials.

Chat routing:
- Built-in Gemini IDs → Gemini.
- `gpt-*` → OpenAI.
- `groq:*` → Groq.
- `cerebras:*` → Cerebras.
- `mistral:*` → Mistral.
- `openrouter:*` → OpenRouter.
- `huggingface:*` → Hugging Face Inference Providers.
- `xkiro:*` → xKiro.
- Built-in NVIDIA IDs → NVIDIA NIM.

No model is silently redirected to another provider.

Search routing:
Tavily → Exa → LangSearch → Gemini Google Search grounding. Each stage only returns real provider results; no synthetic source URLs are generated.

Validation:
- TypeScript/TSX parser: PASS.
- Full dependency install/build/live provider verification: pending because the isolated build environment could not complete `npm install`.
