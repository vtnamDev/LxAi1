# LX AI authentication persistence

The production LX AI deployment runs on Vercel Functions, which are stateless. The previous auth layer stored its JSON database under `/tmp`. That explains the observed behavior: Google authentication returned HTTP 200, but the next `/api/auth/me` request could land on another instance and return 401.

The auth layer now supports durable Neon Postgres storage through `DATABASE_URL`.

Tables created automatically:
- `lxai_users` — verified Google identities and account profile.
- `lxai_sessions` — hashed session tokens, expiry, and revocation.

Required Vercel environment variables:
- `GOOGLE_CLIENT_ID`
- `AUTH_SESSION_SECRET`
- `DATABASE_URL` for durable user/session storage.

A signed session fallback prevents the UI from being kicked back to the login screen while the database connection is unavailable.

