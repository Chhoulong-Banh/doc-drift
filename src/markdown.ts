import fs from 'node:fs/promises';
import path from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import { WarningItem } from './types.js';
import { fileExists, resolveRepoPath } from './fs-utils.js';

const SCRIPT_PATTERNS: RegExp[] = [
  /\bnpm\s+run\s+([a-zA-Z0-9:_-]+)/g,
  /\bpnpm\s+run\s+([a-zA-Z0-9:_-]+)/g,
  /\bpnpm\s+([a-zA-Z0-9:_-]+)/g,
  /\byarn\s+([a-zA-Z0-9:_-]+)/g
];

const FILE_EXTENSIONS = new Set(['.md','.mdx','.txt','.json','.yaml','.yml','.toml','.js','.cjs','.mjs','.ts','.tsx','.jsx','.css','.scss','.html','.sh','.bash','.zsh','.env','.example','.png','.jpg','.jpeg','.gif','.svg','.pdf','.lock','.sql']);

function maybeLocalFileReference(value: string): boolean {
  if (!value || value.startsWith('http://') || value.startsWith('https://') || value.startsWith('#') || value.startsWith('mailto:')) return false;
  if (value.includes('://')) return false;
  if (value.startsWith('./') || value.startsWith('../') || value.startsWith('/')) return true;
  const ext = path.extname(value);
  if (FILE_EXTENSIONS.has(ext)) return true;
  return value.includes('/') && !value.includes(' ');
}

function extractScriptRefs(text: string, line?: number, column?: number) {
  const refs: Array<{command:string; scriptName:string; line?:number; column?:number}> = [];
  for (const pattern of SCRIPT_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      refs.push({ command: match[0], scriptName: match[1], line, column });
    }
  }
  return refs;
}

export async function analyzeMarkdownFile(absoluteDocPath: string, repoRoot: string, scripts: Record<string, string>): Promise<WarningItem[]> {
  const source = await fs.readFile(absoluteDocPath, 'utf8');
  const tree = unified().use(remarkParse).use(remarkGfm).parse(source);
  const warnings: WarningItem[] = [];
  const fileRefs: Array<{raw:string; resolvedTarget:string; line?:number; column?:number; kind:'missing-file'|'broken-link'}> = [];

  visit(tree, (node: any) => {
    const line = node.position?.start?.line;
    const column = node.position?.start?.column;

    if (node.type === 'code' || node.type === 'inlineCode' || node.type === 'text') {
      const text: string = node.value ?? '';
      for (const ref of extractScriptRefs(text, line, column)) {
        if (!scripts[ref.scriptName]) {
          warnings.push({
            kind: 'missing-script',
            message: `Command references missing script \"${ref.scriptName}\".`,
            location: { file: absoluteDocPath, line: ref.line, column: ref.column },
            evidence: ref.command
          });
        }
      }
    }

    if (node.type === 'link' && typeof node.url === 'string') {
      const raw = node.url.trim();
      if (maybeLocalFileReference(raw)) {
        fileRefs.push({ raw, resolvedTarget: resolveRepoPath(repoRoot, absoluteDocPath, raw.split('#')[0]), line, column, kind: 'broken-link' });
      }
    }

    if (node.type === 'inlineCode' && typeof node.value === 'string') {
      const raw = node.value.trim();
      if (maybeLocalFileReference(raw)) {
        fileRefs.push({ raw, resolvedTarget: resolveRepoPath(repoRoot, absoluteDocPath, raw.split('#')[0]), line, column, kind: 'missing-file' });
      }
    }
  });

  for (const ref of fileRefs) {
    if (!(await fileExists(ref.resolvedTarget))) {
      warnings.push({
        kind: ref.kind,
        message: ref.kind === 'broken-link' ? 'Markdown link points to a missing local file.' : 'Inline code appears to reference a missing local file.',
        location: { file: absoluteDocPath, line: ref.line, column: ref.column },
        evidence: ref.raw
      });
    }
  }

  const seen = new Set<string>();
  return warnings.filter((warning) => {
    const key = [warning.kind, warning.location.file, warning.location.line, warning.evidence].join('::');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
