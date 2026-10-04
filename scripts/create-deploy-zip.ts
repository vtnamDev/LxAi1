import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Strict secret scanning patterns
const SECRET_PATTERNS = [
  /AIza[0-9A-Za-z-_]{35}/,
  /sk-or-v1-[0-9a-f]{32,}/,
  /gsk_[A-Za-z0-9]{30,}/,
  /csk-[A-Za-z0-9]{30,}/,
  /nvapi-[A-Za-z0-9-_]{40,}/,
  /tvly-dev-[A-Za-z0-9-_]{25,}/,
  /hf_[A-Za-z0-9]{20,}/,
  /sk-proj-[A-Za-z0-9_-]{40,}/,
  /sk-xt-[A-Za-z0-9_-]{25,}/,
  /sk-[0-9a-f]{32,}/,
  /[0-9]{9,10}:[A-Za-z0-9_-]{35}/,
];

function scanContentForSecrets(content: string, filePath: string): boolean {
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(content)) {
      console.error(`🚨 [SECRET LEAK BLOCKED] Detected potential secret pattern in ${filePath}!`);
      return true;
    }
  }
  return false;
}

async function buildDeployZip() {
  console.log('[Packaging] Creating clean deployment ZIP: lxai-vercel-deploy.zip...');

  const zip = new AdmZip();

  // Root files to explicitly include
  const rootFiles = [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'server.ts',
    'index.html',
    'metadata.json',
    '.env.example',
    '.gitignore',
    'README.md',
  ];

  for (const file of rootFiles) {
    const fullPath = path.join(rootDir, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (scanContentForSecrets(content, file)) {
        throw new Error(`Packaging aborted: Secret detected in root file ${file}`);
      }
      zip.addLocalFile(fullPath);
      console.log(`  + Added file: ${file}`);
    }
  }

  // Directories to recursively scan and include
  const directories = ['src', 'docs', 'scripts'];
  for (const dir of directories) {
    const fullDirPath = path.join(rootDir, dir);
    if (fs.existsSync(fullDirPath)) {
      // Recursively scan all files in directory before adding
      const scanDir = (currentPath: string) => {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        for (const entry of entries) {
          const entryPath = path.join(currentPath, entry.name);
          if (entry.isDirectory()) {
            scanDir(entryPath);
          } else if (entry.isFile()) {
            const relPath = path.relative(rootDir, entryPath);
            const content = fs.readFileSync(entryPath, 'utf-8');
            if (scanContentForSecrets(content, relPath)) {
              throw new Error(`Packaging aborted: Secret detected in ${relPath}`);
            }
          }
        }
      };

      scanDir(fullDirPath);
      zip.addLocalFolder(fullDirPath, dir);
      console.log(`  + Added folder: ${dir}/ (Scanned clean)`);
    }
  }

  // Ensure public folder exists
  const publicDir = path.join(rootDir, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Output paths
  const rootZipPath = path.join(rootDir, 'lxai-vercel-deploy.zip');
  const publicZipPath = path.join(publicDir, 'lxai-vercel-deploy.zip');

  // Packaging must never include .env, .env.local, node_modules, .git, dist or logs.
  zip.writeZip(rootZipPath);
  zip.writeZip(publicZipPath);

  const stats = fs.statSync(rootZipPath);
  console.log(`\n[Success] Clean, secret-audited deploy zip created:`);
  console.log(`  • Path: ${rootZipPath}`);
  console.log(`  • Public Web Path: ${publicZipPath}`);
  console.log(`  • Size: ${(stats.size / 1024).toFixed(1)} KB`);
  console.log(`  • Security Audit: PASS (Zero secrets detected)`);
  console.log(`  • Status: READY FOR VERCEL & CLOUD RUN DEPLOYMENT`);
}

buildDeployZip().catch((err) => {
  console.error('[Packaging Failed]:', err);
  process.exit(1);
});
