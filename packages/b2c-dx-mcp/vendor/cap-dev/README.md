# Vendored `cap-dev` skills

The skills in `skills/` are copied from the public
[`SalesforceCommerceCloud/commerce-apps`](https://github.com/SalesforceCommerceCloud/commerce-apps)
repository (`.claude/skills`). The MCP server bundles them as the `cap-dev` collection
(`skill://cap-dev/...`). `source.json` records the upstream commit they were copied from.

**Do not edit these files here.** Change the skills upstream, then refresh this copy:

```bash
# Copy the latest skills from the upstream default branch (or pass --ref <branch|tag|sha>)
pnpm --filter @salesforce/b2c-dx-mcp run sync:cap-dev-skills

# Review what changed upstream since the last sync
git diff -- packages/b2c-dx-mcp/vendor/cap-dev

# Rebuild and check the bundle
pnpm --filter @salesforce/b2c-dx-mcp run test:agent
```

If the sync adds or renames a skill, add its `cap-dev/<skill>` line to
`packages/b2c-dx-mcp/skills/index-summaries.json` (the tests fail until you do). Commit the refreshed files with an `@salesforce/b2c-dx-mcp` patch changeset so the update ships in
the next MCP release.

The sync copies only Markdown, because the MCP serves only Markdown. It skips the upstream
`evals/`, `scripts/`, and `assets/` folders. Links into the upstream `shared/` folder are rewritten
to a copy in the linking skill's `references/` folder, because bundled skills must be
self-contained. Skill text that mentions those scripts or templates assumes a checkout of the
commerce-apps repository.
