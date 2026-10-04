# LX AI — Security Model & Protection Boundaries

---

### 1. Secret Isolation Invariant
- All API keys, bot tokens, and database secrets are stored exclusively in the server environment (`process.env.GEMINI_API_KEY`, etc.).
- The client bundle contains zero API keys or authorization credentials.
- Error payloads strip internal stack traces and API keys before reaching the browser.

### 2. Prompt Injection Defense
- User-supplied web search results and file contents are classified as **UNTRUSTED EXTERNAL DATA**.
- They are enclosed in strict isolation tags (`<untrusted_content_boundary>`) with explicit instructions to the AI model that they may contain malicious instructions and must NOT override system rules.

### 3. File Security Boundary
- Maximum file upload size: 15MB.
- MIME type validation against whitelist (`application/pdf`, `text/*`, `application/json`, `image/*`).
- File uploads are processed in memory and never written to raw server file paths (preventing path traversal and remote code execution).

### 4. Authoritative Quota Enforcement
- Quota (70,000 tokens) is checked and deducted on the server.
- The client receives read-only usage stats and cannot manipulate token counts or cooldown timers.
