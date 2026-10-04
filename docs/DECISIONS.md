# LX AI — Architecture Decision Records (ADR)

---

### ADR 001: Server-Side AI Gateway with Express & Vite Middlewares
- **Context**: The app requires real-time streaming, Live API WebSocket communication, secure key storage, quota tracking, and file extraction.
- **Decision**: Run a unified `server.ts` Express full-stack architecture mounting `vite.middlewares` in dev and static files in production.
- **Consequence**: Keeps client bundle 100% free of secret keys and enables low-latency streaming and duplex audio.

### ADR 002: Dynamic Glass 4-Tier Adaptive Performance
- **Context**: Glass effects (`backdrop-filter`) can cause frame drops on low-end devices or mobile browsers.
- **Decision**: Implement Full, Balanced, Lite, and Minimal modes with CSS variables and runtime/preference detection.
- **Consequence**: Guaranteed 60fps typing and scrolling on any device.

### ADR 003: Conversational Voice Partner with Gemini 3.8 Live & TTS
- **Context**: Users need interactive real-time language practice with live audio feedback.
- **Decision**: Implement duplex audio bridging with Gemini 3.8 Live API, supplemented with Gemini 3.8 Flash Lite TTS and intelligent language correction prompts.
