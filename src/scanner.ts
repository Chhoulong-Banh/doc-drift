import path from 'node:path';
import fg from 'fast-glob';
import { loadPackageScripts } from './package-json.js';
import { analyzeMarkdownFile } from './markdown.js';
import { ScanOptions, WarningItem } from './types.js';

export async function scanRepository(options: ScanOptions): Promise<WarningItem[]> {
  const absoluteRoot = path.resolve(options.rootDir);
  const docs = await fg(options.docsGlobs, {
    cwd: absoluteRoot,
    onlyFiles: true,
    absolute: true,
    dot: false,
    unique: true,
  });

  const { scripts } = await loadPackageScripts(absoluteRoot);
  const warnings: WarningItem[] = [];
  for (const docFile of docs) warnings.push(...await analyzeMarkdownFile(docFile, absoluteRoot, scripts));

  return warnings.sort((a, b) => a.location.file !== b.location.file ? a.location.file.localeCompare(b.location.file) : (a.location.line ?? 0) - (b.location.line ?? 0));
}
