# LX AI — System Architecture & Layer Boundaries
**Version:** 1.0.0-RC  
**Architectural Standard:** Strict 4-Layer Clean Architecture with Unified AI Gateway

---

## 1. Architectural Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                     │
│  - React 19 SPA (Vite)                                      │
│  - Dynamic Glass UI System (CSS Level 0-5 tokens)          │
│  - Web Audio Context (Mic 16kHz capture, Output 24kHz)      │
│  - Voice Partner Visualizer, AI Coding Studio, Workspace    │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / SSE / WebSocket
┌──────────────────────────────▼──────────────────────────────┐
│                      APPLICATION LAYER                      │
│  - Express Full-Stack Server (`server.ts`)                  │
│  - WebSocket Server (`/live` audio bridge)                  │
│  - Conversation & Session Orchestration                     │
│  - Context Engine (Prioritization, Compaction, Truncation)  │
│  - Quota, Cooldown & Entitlement Enforcement                │
│  - Telegram Webhook Receiver & Formatter                    │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                        AI GATEWAY                           │
│  - Exact Model Routing Policy (No Silent Substitution)      │
│  - Execution Mode Router (Fast, Thinking, Auto)             │
│  - Unified Stream Normalizer (SSE generation events)        │
│  - Server Credential Manager (Never leaks to client)        │
│  - Prompt-Injection Firewall & Untrusted Boundary Sanitizer │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐┌──────────────▼───────────────┐
│     PROVIDER ADAPTERS       ││       TOOL SUBSYSTEM         │
│  - Google GenAI (3.8 Flash, ││  - Web Search (Grounding)    │
│    3.8 Live, 3.1 Pro, TTS)  ││  - File Intelligence         │
│  - OpenAI Adapter (GPT-4o)  ││  - Coding Engine             │
│  - Anthropic Adapter        ││  - Telegram Formatter        │
│  - Mistral / Meta / Groq    ││                              │
└─────────────────────────────┘└──────────────────────────────┘
```

---

## 2. Invariants & Guarantees
1. **One Source of Truth**: All requests (Web UI, Voice, Telegram) traverse the same AI Gateway, quota counter, and security rules.
2. **Exact Routing**: When the user explicitly selects model `MODEL_X`, the gateway must route to `MODEL_X`. Silent model downgrade is prohibited.
3. **Zero Secrets in Client**: API keys are injected exclusively on the server (`process.env.GEMINI_API_KEY`, etc.). The client only receives operational metadata.
4. **Adaptive Performance**: Dynamic Glass gracefully degrades on lower-end devices from Level A (Full) down to Level D (Minimal) without functional loss.
