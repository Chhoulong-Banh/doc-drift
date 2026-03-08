import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { scanRepository } from '../src/scanner.js';

async function createFixture(files: Record<string, string>): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'doc-drift-'));
  for (const [relativePath, content] of Object.entries(files)) {
    const absolutePath = path.join(tempDir, relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, content, 'utf8');
  }
  return tempDir;
}

test('detects missing npm script from README code block', async () => {
  const fixture = await createFixture({
    'package.json': JSON.stringify({ scripts: { dev: 'vite' } }, null, 2),
    'README.md': '# App\n\n```bash\nnpm run start\n```\n',
  });
  const warnings = await scanRepository({ rootDir: fixture, docsGlobs: ['README.md'] });
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].kind, 'missing-script');
});

test('detects broken local markdown link', async () => {
  const fixture = await createFixture({
    'package.json': JSON.stringify({ scripts: {} }, null, 2),
    'README.md': '# App\n\nSee [guide](docs/guide.md).\n',
  });
  const warnings = await scanRepository({ rootDir: fixture, docsGlobs: ['README.md'] });
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].kind, 'broken-link');
});

test('passes when script and linked file exist', async () => {
  const fixture = await createFixture({
    'package.json': JSON.stringify({ scripts: { dev: 'vite' } }, null, 2),
    'README.md': '# App\n\nRun `npm run dev`.\n\nSee [guide](docs/guide.md).\n',
    'docs/guide.md': 'Hello',
  });
  const warnings = await scanRepository({ rootDir: fixture, docsGlobs: ['README.md', 'docs/**/*.md'] });
  assert.equal(warnings.length, 0);
});
