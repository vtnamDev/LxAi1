# LX AI — API Contracts & Generation Event Protocol

---

## 1. Generation Stream Protocol (Server-Sent Events)

Endpoint: `POST /api/chat/stream`  
Headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`

### Events:
1. `event: generation.started`  
   `data: { generationId: string, modelId: string, mode: string, timestamp: number }`

2. `event: reasoning.delta`  
   `data: { text: string }`

3. `event: message.delta`  
   `data: { text: string }`

4. `event: tool.started`  
   `data: { tool: "web_search", query: string }`

5. `event: tool.result`  
   `data: { tool: "web_search", sources: Array<{ title: string, url: string, snippet: string }> }`

6. `event: usage.recorded`  
   `data: { inputTokens: number, outputTokens: number, totalTokens: number, quotaRemaining: number }`

7. `event: message.completed`  
   `data: { messageId: string, finishReason: "stop" | "length" | "cancelled" }`

8. `event: generation.failed`  
   `data: { error: string, code: string, recoverable: boolean }`

---

## 2. Voice & Live API Duplex Protocol (WebSocket & HTTP)

- **WebSocket**: `/live`
  - Client -> Server: `{"type": "audio", "audio": "<base64 PCM 16kHz>"}`
  - Client -> Server: `{"type": "config", "language": "en", "voice": "Zephyr"}`
  - Server -> Client: `{"type": "audio", "audio": "<base64 PCM 24kHz>"}`
  - Server -> Client: `{"type": "transcript", "role": "user" | "model", "text": string}`
  - Server -> Client: `{"type": "interrupted", "interrupted": true}`

- **HTTP Turn Fallback**: `POST /api/voice/interact`
  - Request: `{ audioBase64?: string, text?: string, targetLanguage?: string, voiceName?: string, conversationHistory?: Message[] }`
  - Response: `{ text: string, audioBase64: string, feedback?: { grammar?: string, pronunciation?: string, suggestion?: string }, tokens: number }`

---

## 3. Tool & Search Contract
- `POST /api/search`
  - Input: `{ query: string, maxResults?: number }`
  - Output: `{ results: Array<{ title: string, url: string, snippet: string, score?: number }> }`

---

## 4. Quota & Entitlement Contract
- `GET /api/quota` -> `{ usedTokens: number, limitTokens: 70000, inCooldown: boolean, cooldownSecondsRemaining: number, hasFree24h: boolean }`
- `POST /api/quota/redeem` -> `{ code: "FREE_24H" }` -> `{ success: boolean, newExpiry: number }`

---

## 5. Telegram Webhook Contract
- `POST /api/telegram/webhook`
  - Headers: `X-Telegram-Bot-Api-Secret-Token: <configured_secret>`
  - Body: Standard Telegram `Update` object
