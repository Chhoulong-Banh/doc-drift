import fs from 'node:fs/promises';
import path from 'node:path';

export async function fileExists(absolutePath: string): Promise<boolean> {
  try {
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

export function resolveRepoPath(rootDir: string, docFile: string, target: string): string {
  if (target.startsWith('/')) {
    return path.resolve(rootDir, `.${target}`);
  }
  return path.resolve(path.dirname(docFile), target);
}
