import app from '../dist-server/server.mjs';

// Vercel Node.js Function entrypoint.
// The Express app is bundled during the Vercel build into dist-server/server.mjs
// so the ESM function runtime never depends on an extensionless TypeScript import.
export default app;
