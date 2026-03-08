#!/usr/bin/env node
import path from 'node:path';
import { Command } from 'commander';
import { scanRepository } from './scanner.js';
import { emitGitHubAnnotations, formatWarnings } from './reporter.js';

const program = new Command();

program
  .name('doc-drift')
  .description('Deterministic documentation drift checks for JS/TS repositories')
  .option('--root <path>', 'repository root', process.env.GITHUB_WORKSPACE || process.cwd())
  .option('--docs-glob <patterns>', 'comma-separated markdown globs', process.env.INPUT_DOCS_GLOB || 'README.md,docs/**/*.md')
  .option('--fail-on-warning', 'exit non-zero when warnings are found', readBoolean(process.env.INPUT_FAIL_ON_WARNING))
  .option('--github-annotations', 'emit GitHub warning annotations', true)
  .version('0.1.0')
  .action(async (options) => {
    const rootDir = path.resolve(options.root);
    const docsGlobs = String(options.docsGlob).split(',').map((value: string) => value.trim()).filter(Boolean);
    const warnings = await scanRepository({ rootDir, docsGlobs });
    if (options.githubAnnotations) emitGitHubAnnotations(warnings, rootDir);
    console.log(formatWarnings(warnings, rootDir));
    if (warnings.length > 0 && options.failOnWarning) process.exitCode = 1;
  });

void program.parseAsync(process.argv);

function readBoolean(value: string | undefined): boolean {
  if (!value) return false;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}
