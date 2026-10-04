# LX AI — AI Gateway Fix

## Root causes fixed

- Gemini 3.8 Flash was being sent the deprecated `temperature` generation setting. Current Google guidance uses `thinkingLevel` for Gemini 3.x and says to remove deprecated sampling parameters for Gemini 3.8 Flash.
- The browser trusted a persisted localStorage session until the first protected API call failed. Startup now validates `/api/auth/me`.
- HTTP failures were collapsed into one generic message. The browser now surfaces the actual safe error class and request ID.
- SSE parsing now preserves the event name across chunk boundaries and handles `generation.failed`.
- Unknown model IDs no longer silently fall back to Gemini.
- Raw upstream provider error bodies stay server-side.
- Stream disconnect/cancellation and quota reservation cleanup are safer.

## Secrets
Use fresh provider credentials in Replit Secrets using the variable names from `.env.example`. The uploaded credential file contains exposed secrets and must not be copied into this project or reused.

## Verification
Use a clean install, then run `npm run lint`, `npm run build`, `npm test`, and `npm run models:verify`. With fresh credentials configured, test an authenticated `gemini-3.8-flash` chat end-to-end.
