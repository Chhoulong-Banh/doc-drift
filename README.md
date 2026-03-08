# doc-drift

A lightweight tool that detects **documentation drift** in JavaScript / TypeScript repositories.

Documentation drift happens when code changes but documentation is not updated.

Common examples include:

* README commands that no longer exist
* documentation referencing files that were deleted
* broken markdown links
* outdated setup instructions

`doc-drift` performs **deterministic checks** to catch these problems early during development.

---

# What it checks

`doc-drift` currently performs three high-confidence checks:

* README / docs commands vs `package.json` scripts
* Broken local markdown links
* Missing referenced files in documentation

Example problem detected:

```
⚠ Documentation Drift Detected

README.md:12
Command "npm run start" not found in package.json
```

---

# GitHub Action usage

The easiest way to use `doc-drift` is as a GitHub Action.

Add the following workflow to your repository:

```yaml
name: doc-drift

on:
  pull_request:

jobs:
  check-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Chhoulong-Banh/doc-drift@v0.1.0
        with:
          fail-on-warning: true
```

This will automatically check documentation whenever a pull request is opened.

---

# CLI usage

You can also run the tool locally.

### Run using npx (recommended)

```
npx doc-drift
```

### Install globally

```
npm install -g doc-drift
doc-drift
```

### Advanced usage

```
doc-drift --root . --docs-glob "README.md,docs/**/*.md" --fail-on-warning
```

Options:

| Option              | Description                                        |
| ------------------- | -------------------------------------------------- |
| `--root`            | repository root directory                          |
| `--docs-glob`       | markdown files to scan                             |
| `--fail-on-warning` | exit with non-zero status when issues are detected |

---

# Development

If you want to run the project locally:

```
npm install
npm test
npm run build
```

---

# Limitations

`doc-drift` intentionally performs **deterministic checks only**.

It does **not**:

* interpret natural language documentation
* rewrite documentation automatically
* analyze API documentation
* attempt AI-based semantic understanding

This design keeps the tool fast and reduces false positives.

---

# License

MIT