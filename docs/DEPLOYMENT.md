# LX AI — Production Deployment & Runtime Guide

---

## 1. Environment Variables Configuration
Configured in server environment (e.g. Google Cloud Run, Vercel, Docker):

```env
# Server-side Gemini API Key (Injected automatically in AI Studio)
GEMINI_API_KEY="your-gemini-api-key"

# Application URL
APP_URL="https://your-domain.app"

# Telegram Bot Integration (Optional)
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
TELEGRAM_WEBHOOK="e6a86e77822e1ade5ee7742479373eafee005c32bd2caa5b1617b39ac7a1c05a"
```

## 2. Server Startup & Verification
```bash
# Verify models and connectivity
npm run models:verify

# Start development server
npm run dev

# Production build and run
npm run build
npm start
```
