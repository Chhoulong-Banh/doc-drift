import path from 'node:path';
import { WarningItem } from './types.js';

export function formatWarnings(warnings: WarningItem[], rootDir: string): string {
  if (warnings.length === 0) return '✅ No documentation drift warnings found.';
  const lines: string[] = [`⚠ Found ${warnings.length} documentation drift warning(s):`];
  for (const warning of warnings) {
    const relativeFile = path.relative(rootDir, warning.location.file) || warning.location.file;
    const position = warning.location.line ? `${relativeFile}:${warning.location.line}` : relativeFile;
    lines.push(`- [${warning.kind}] ${position} — ${warning.message} Evidence: ${warning.evidence}`);
  }
  return lines.join('\n');
}

export function emitGitHubAnnotations(warnings: WarningItem[], rootDir: string): void {
  for (const warning of warnings) {
    const relativeFile = path.relative(rootDir, warning.location.file) || warning.location.file;
    const line = warning.location.line ?? 1;
    const column = warning.location.column ?? 1;
    const message = `${warning.message} Evidence: ${warning.evidence}`.replace(/\n/g, ' ');
    console.log(`::warning file=${relativeFile},line=${line},col=${column},title=Doc Drift::${escapeData(message)}`);
  }
}

function escapeData(input: string): string {
  return input.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}
