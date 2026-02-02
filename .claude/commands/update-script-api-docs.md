# Update Script API Documentation

Download the latest B2C Commerce Script API documentation from the configured sandbox and update the bundled docs in the SDK.

## Steps

1. Download Script API docs from the configured sandbox using `./cli docs download`
2. Replace the markdown files in `packages/b2c-tooling-sdk/data/script-api/`
3. Regenerate the search index with `pnpm --filter @salesforce/b2c-tooling-sdk run generate:docs-index`
4. Show the version extracted from `index.md` header
5. Show git status/diff summary of what changed

## Commands to Run

```bash
# Download to temp directory
./cli docs download /tmp/script-api-docs-update

# Check version
head -1 /tmp/script-api-docs-update/index.md

# Replace existing files
rm -f packages/b2c-tooling-sdk/data/script-api/*.md
cp /tmp/script-api-docs-update/*.md packages/b2c-tooling-sdk/data/script-api/

# Regenerate index
pnpm --filter @salesforce/b2c-tooling-sdk run generate:docs-index

# Show changes
git status packages/b2c-tooling-sdk/data/script-api/ --short
git diff packages/b2c-tooling-sdk/data/script-api/*.md --stat

# Cleanup
rm -rf /tmp/script-api-docs-update
```

After running, summarize:
- The Script API version (from index.md header like "# B2C Commerce Script API 26.2")
- Number of files updated
- Key changes (new classes, deprecated methods, etc.)
