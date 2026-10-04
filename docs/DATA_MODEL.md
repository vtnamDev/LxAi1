# LX AI — Domain Data Model
**Entities and Relationships Specification**

---

### 1. User & Session
- **User**: `id`, `name`, `email`, `avatarUrl`, `plan` ('free' | 'pro'), `createdAt`.
- **Session**: `id`, `userId`, `activeConversationId`, `activeProjectId`, `activeTier`.

### 2. Conversation & Message
- **Conversation**: `id`, `title`, `userId`, `projectId`, `modelId`, `mode` ('fast' | 'thinking' | 'auto'), `createdAt`, `updatedAt`, `totalTokens`.
- **Message**: `id`, `conversationId`, `role` ('user' | 'assistant' | 'system' | 'tool'), `content`, `reasoningContent`, `attachments`, `citations`, `tokens`, `latencyMs`, `createdAt`.

### 3. VoiceSession
- **VoiceSession**: `id`, `conversationId`, `targetLanguage` ('en' | 'es' | 'fr' | 'de' | 'ja' | 'vi' | 'zh'), `voiceName` ('Zephyr' | 'Kore' | 'Puck' | 'Charon' | 'Fenrir'), `status` ('idle' | 'listening' | 'thinking' | 'speaking' | 'interrupted'), `transcriptLog`.

### 4. Project & File
- **Project**: `id`, `name`, `description`, `userId`, `systemPrompt`, `files` (array of `ProjectFile`), `createdAt`.
- **ProjectFile**: `id`, `name`, `path`, `language`, `content`, `size`, `mimeType`.
- **Attachment**: `id`, `name`, `mimeType`, `size`, `extractedText`, `status` ('ready' | 'processing' | 'error').

### 5. Quota & Entitlement
- **Quota**: `userId`, `usedTokens` (0 to 70000), `limitTokens` (70000), `exhaustedAt`, `cooldownExpiresAt`.
- **Entitlement**: `id`, `userId`, `type` ('FREE_24H' | 'PRO_MONTHLY'), `expiresAt`, `isActive`.

### 6. Telegram Bridge
- **TelegramAccount**: `telegramChatId`, `userId`, `username`, `linkedAt`.
- **TelegramUpdate**: `updateId`, `processedAt`, `tokensUsed`.
