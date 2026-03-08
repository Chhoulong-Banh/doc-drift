import fs from 'node:fs/promises';
import path from 'node:path';
import { PackageScripts } from './types.js';

export async function loadPackageScripts(rootDir: string): Promise<PackageScripts> {
  const packageJsonPath = path.join(rootDir, 'package.json');
  try {
    const raw = await fs.readFile(packageJsonPath, 'utf8');
    const parsed = JSON.parse(raw) as { scripts?: Record<string, string> };
    return { scripts: parsed.scripts ?? {} };
  } catch {
    return { scripts: {} };
  }
}
