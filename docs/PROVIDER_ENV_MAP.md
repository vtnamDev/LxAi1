# LX AI Provider Environment Map

Credentials are server-side only. This file contains variable names, not credential values.

## Model providers
- Google Gemini: `GEMINI_KEY_1..4` or `GEMINI_API_KEY`
- OpenAI: `OPENAI_KEY_1..n` or `OPENAI_API_KEY`
- OpenRouter: `OPENROUTER_KEY_1..n` or `OPENROUTER_API_KEY`
- Groq: `GROQ_KEY_1..n` or `GROQ_API_KEY`
- Mistral: `MISTRAL_KEY_1..n` or `MISTRAL_API_KEY`
- Cerebras: `CEREBRAS_KEY_1..n` or `CEREBRAS_API_KEY`
- NVIDIA NIM: dedicated `NVIDIA_*_KEY` variables
- Hugging Face: `HUGGINGFACE_KEY_1..n` or `HF_TOKEN`
- xKiro: `XKIRO_KEY_1..n` or `XKIRO_API_KEY`

## Search providers
- Tavily: `TAVILY_KEY_1..n`
- Exa: `EXA_KEY_1..n` or `EXA_API_KEY`
- LangSearch: `LANGSEARCH_KEY_1..n` or `LANGSEARCH_API_KEY`
- Gemini Google Search grounding uses the Gemini pool.

## Routing convention
- OpenAI: `gpt-*`
- Groq: `groq:*` or the built-in `groq-llama-3.3-70b`
- Cerebras: `cerebras:*` or the built-in `cerebras-llama-3.3-70b`
- Mistral: `mistral:*` or the built-in `mistral-large`
- OpenRouter: `openrouter:vendor/model` or the built-in `claude-3-5-sonnet`
- Hugging Face: `huggingface:vendor/model[:policy/provider]`
- xKiro: `xkiro:vendor/model`
- NVIDIA: built-in model IDs only; no silent substitution

The application never copies credential values into the repository, client bundle, ZIP metadata, logs, or `/api/models` responses.
