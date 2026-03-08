# doc-drift

A minimal, deterministic documentation drift checker for JavaScript/TypeScript repositories.

## What it checks

- README/docs mention `npm run <script>` or `pnpm <script>` or `yarn <script>` commands that are not present in `package.json`
- Markdown links to local files that do not exist
- Inline code or markdown links referencing local files that do not exist

## Install

```bash
npm install
npm run build
```

## Test

```bash
npm test
```

## CLI usage

```bash
node dist/cli.js --root . --docs-glob "README.md,docs/**/*.md" --fail-on-warning
```

## GitHub Action usage

```yaml
name: doc-drift

on:
  pull_request:
  push:
    branches: [main]

jobs:
  check-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: ./
        with:
          fail-on-warning: 'true'
```

## Notes

This MVP intentionally avoids semantic AI reasoning and only performs high-confidence checks.
