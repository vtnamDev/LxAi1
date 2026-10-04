# LX AI — Master Product & Requirement Specification
**Version:** 1.0.0-RC  
**System:** LX AI Personal AI Workspace & Real-time Conversational Partner  
**Architecture Phase:** Phase 1–5 Unified Architecture

---

## 1. Executive Summary
LX AI is a serious, coherent personal AI workspace and real-time conversational partner. It replaces disjointed chatbot wrappers with an integrated computing surface featuring:
1. **Dynamic Glass UI System**: Translucent layered surfaces with 4-tier adaptive hardware acceleration (Full, Balanced, Lite, Minimal).
2. **Conversational AI Partner**: Low-latency voice practice (Gemini 3.8 Live API + TTS + pronunciation hints for language learning and natural dialogue).
3. **Multi-Model Intelligence**: Canonical AI Gateway connecting Google Gemini 3.8, OpenAI GPT-4o, Claude 3.5 Sonnet, Mistral, Llama 3.1, Groq, and Nvidia NIM with exact routing.
4. **AI Coding Studio**: In-browser multi-file project workspace, syntax-highlighted editor, live iframe preview, and console terminal emulator.
5. **Knowledge & File Intelligence**: Client-validated, server-sanitized attachment pipeline with PDF/code text extraction and prompt-injection firewalls.
6. **Web Search Grounding**: Source-aware external search with citation markers and untrusted content sandboxing.
7. **Telegram AI Gateway**: Same backend, AI Gateway, model registry, and quota tracking for Telegram bot updates.
8. **Authoritative Quota & Entitlement**: Server-enforced 70K free token budget, 1-hour cooldown window, and FREE_24H entitlement verification.

---

## 2. Core User Journeys

### 2.1 Primary User Journey
1. **Authenticate / Enter Workspace**: Automatic secure session establishment with profile persistence.
2. **Select Mode & Model**: User selects execution mode (Fast, Thinking, Auto) and exact model (e.g. Gemini 3.8 Flash, GPT-4o).
3. **Compose Request**: Text, voice input, file attachments, or web search tool toggle.
4. **Generate & Stream**: Server-Sent Events stream tokens, reasoning thoughts, and source citations in real-time.
5. **Persist & Record Usage**: Incremental token count recorded against 70K quota; conversation saved to local/server store.

### 2.2 Voice & Language Learning Journey
1. **Open Voice Partner**: User clicks microphone or Quick Action "Voice Partner".
2. **Connect Live Session**: Real-time duplex audio channel via Gemini 3.8 Live API / WebSocket.
3. **Speak & Practice**: Real-time audio waveform visualizer; instant model speech output via 24kHz audio; language learning feedback (grammar, vocabulary, pronunciation).
4. **Interruptibility**: User speech automatically interrupts model output; transcripts are saved to chat history.

### 2.3 Coding & Project Journey
1. **Select or Create Project**: Workspace binds project files, custom guidelines, and conversation history.
2. **Edit Code**: Full multi-file code editor with file tabs, syntax coloration, and line numbers.
3. **Live Preview**: Responsive iframe sandbox rendering code changes in real-time.
4. **Terminal / Console**: Run test commands, build scripts, and debug logs.

### 2.4 Quota & Cooldown Journey
1. **Usage Accounting**: Each generation logs input tokens, output tokens, and execution latency.
2. **Threshold**: At 70,000 tokens, system enters 1-hour cooldown with live countdown timer.
3. **Entitlement**: Users can claim a FREE_24H pass or wait for the cooldown window to reset.
