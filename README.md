# LX AI — The Next Generation AI Workspace

LX AI is a high-performance personal AI workspace featuring:
- **Dynamic Glass UI System**: 4-tier adaptive performance (Full, Balanced, Lite, Minimal).
- **Conversational Voice Partner**: Real-time language practice with Gemini 3.8 Live API (`gemini-3.8-live`) & low-latency TTS.
- **AI Coding Studio**: In-browser code editor with live sandboxed web preview and terminal console.
- **Multi-Model Intelligence**: Exact routing to Google Gemini 3.8, Gemini 3.1 Pro, GPT-4o, Claude 3.5 Sonnet, etc.
- **Authoritative 70K Quota**: Token tracking with 1-hour cooldown and FREE_24H pass entitlement.
- **Telegram AI Gateway**: Webhook receiver and shared AI runtime.

---

## Quick Start (Deploy anywhere)

### 1. Requirements
- Node.js >= 18.0.0
- npm or yarn or pnpm

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in:
```env
GEMINI_API_KEY="your-gemini-api-key"
PORT=3000
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Production Build & Run
```bash
npm run build
npm start
```

### 6. Verify Models & Gateway
```bash
npm run models:verify
```
