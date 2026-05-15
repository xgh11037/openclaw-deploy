import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const norm = (p) => p.replace(/\\/g, '/');
const skipDirs = new Set(['.git', 'node_modules', 'release', 'dist', 'dist-electron', 'build']);
const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.yml', '.yaml', '.html', '.md', '.cjs', '.mjs']);
const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = norm(path.relative(root, full));
    const st = statSync(full);
    if (st.isDirectory()) {
      if (!skipDirs.has(name)) walk(full);
    } else if (exts.has(path.extname(name)) && rel !== 'scripts/check-yunrui-release.mjs') {
      files.push(rel);
    }
  }
}
walk(root);

const visibleScopes = [
  'src/pages/',
  'src/components/',
  'src/i18n/locales/zh/',
  'electron-builder.yml',
  'package.json',
  'electron/utils/openrouter-headers-preload.cjs',
  'electron/main/updater.ts',
  'electron/main/menu.ts',
  'electron/shared/providers/',
  'src/lib/providers.ts',
];
const forbidden = [
  'https://claw-x.com',
  'github.com/ValueCell-ai/ClawX',
  'oss.intelli-spectrum.com',
  'QQ群',
  'QQ 群',
  'Telegram 群',
  '1085253453',
  'docs.openclaw.ai',
];
const failures = [];
for (const rel of files) {
  if (!visibleScopes.some((scope) => rel === scope || rel.startsWith(scope))) continue;
  const text = readFileSync(path.join(root, rel), 'utf8');
  for (const needle of forbidden) {
    if (text.includes(needle)) failures.push(`${rel}: forbidden visible string: ${needle}`);
  }
}

const requiredChecks = [
  ['package.json', 'yunrui-openclaw'],
  ['electron-builder.yml', 'productName: 云睿OpenClaw'],
  ['electron-builder.yml', 'appId: com.yunrui.openclaw'],
  ['src/lib/providers.ts', "id: 'yunrui-relay'"],
  ['src/lib/providers.ts', 'https://www.yunruiai.xyz'],
  ['src/lib/providers.ts', 'gpt-5.5'],
  ['src/lib/providers.ts', 'gpt-5.4'],
  ['src/lib/providers.ts', 'claude-opus-4-7'],
  ['src/lib/providers.ts', 'gemini-3-pro-preview'],
  ['electron/shared/providers/registry.ts', "id: 'yunrui-relay'"],
  ['electron/shared/providers/registry.ts', 'https://www.yunruiai.xyz/v1'],
  ['electron/shared/providers/registry.ts', 'claude-opus-4-7'],
  ['electron/shared/providers/registry.ts', 'claude-sonnet-4-6'],
  ['electron/shared/providers/registry.ts', 'gpt-5.5'],
  ['electron/shared/providers/registry.ts', 'gemini-3-flash-preview'],
  ['electron/shared/providers/registry.ts', 'claude-sonnet-4.5'],
  ['src/i18n/locales/zh/settings.json', '云睿OpenClaw'],
  ['src/i18n/locales/zh/setup.json', '云睿OpenClaw'],
];
for (const [rel, needle] of requiredChecks) {
  const text = readFileSync(path.join(root, rel), 'utf8');
  if (!text.includes(needle)) failures.push(`${rel}: missing required string: ${needle}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Yunrui release checks passed');
