# MCP Server Evals

Agent-level evals for the B2C DX MCP server, run with [`claude plugin eval`](https://code.claude.com/docs/en/plugin-evals). Each case gives Claude a prompt with the **locally built** MCP server loaded and grades the transcript: which tools it chose, in what order, what it avoided, and whether the answer is right.

These complement the unit tests in `test/`. The unit tests check that tools work. The evals check that an agent picks and uses them well: tool descriptions, server instructions and skill resources.

## Running

```bash
# Build first; the eval plugin launches bin/run.js from this package
pnpm --filter @salesforce/b2c-tooling-sdk run build
pnpm --filter @salesforce/b2c-dx-mcp run build

# Compliance suite (the default): every case, plugin loaded, no baseline arm
pnpm run mcp:eval --runs 1 -j 5   # fast smoke check
pnpm run mcp:eval --runs 3 -j 5   # scored run

# Enhancement set: `ablation`-tagged cases, with and without the plugin, reports Δ
pnpm run mcp:eval:ablation --runs 3 -j 5

# Only some cases
pnpm run mcp:eval --tag docs
pnpm run mcp:eval --case 'category-rules-*'   # name glob; matches the case directory name, not its path
```

The script defaults to `--model claude-sonnet-5-5`. Override it with `--model <full-id>`. Use full model IDs, not aliases: on some providers `sonnet`/`opus` resolve to older models. Tool-selection behaviour differs a lot between models (see the SCAPI skill-gate note below).

Add `--keep-temp` to keep each run's trace (`out/trace.jsonl`) for debugging, and `--json` for machine-readable output. Results are written under `cases/results/` (gitignored).

## Two kinds of case

The suite measures two things, in this order of priority:

1. **Tool compliance** (every case). With the plugin loaded, does the agent pick the right tool, read the required skill first, avoid the tools it shouldn't call, and stay away from terminal fallbacks? `pnpm run mcp:eval` runs every case with `--ablation none`: one arm, with the plugin loaded, and every grader counts. This is the default run and the one to use while changing tool descriptions, server instructions or skills.
2. **Enhancement over general knowledge** (cases tagged `ablation`). Does the plugin make the _answer_ better than the model manages alone? `pnpm run mcp:eval:ablation` runs only these, once with the plugin and once without, and reports Δ. Run it when the docs corpus changes or before a release.

A new case is a compliance case unless a capable model could attempt the question without the plugin: obscure Script API or Developer Center details, job step parameters, platform limits. Questions about our own tools, skills, toolsets, curated CIP reports or configuration never get the `ablation` tag. Their no-plugin arm fails by definition and says nothing.

In `ablation` cases, grade the answer, and mark every grader about the path to it (`docs_read` was called, a skill was read) `arm: with-only`. Those graders still show in the report as "plugin was used" indicators, but they're left out of Δ, so a no-plugin answer is judged on its merits. Under `--ablation none` they count as normal compliance checks.

### Prompts

Write prompts the way a developer new to B2C Commerce would ask: describe the problem, not the tool. Don't say "use the B2C MCP", name a tool or skill, or hint at the answer. That tips the scales and stops measuring whether the descriptions and server instructions do their job. Questions about the plugin itself (e.g. its toolsets) can name the product, since a user would.

## Layout

```
evals/
  .claude-plugin/plugin.json   eval-only plugin manifest (experimental.evals → cases/)
  .mcp.json                    starts launch.mjs instead of the published npx package
  launch.mjs                   starts the local build; applies per-case EVAL_* settings
  fixtures/                    project directories a case can use as its working project
  cases/<area>/<case>/
    prompt.md                  frontmatter (tags, max_turns, env) + the user prompt
    graders/*.md               one grader per file
```

The shipped plugin in `plugins/b2c-dx-mcp` is left alone. It pins a published npm version, so this directory has its own manifest that runs the working tree.

## Per-case server configuration

`launch.mjs` reads these variables from a case's `env` frontmatter:

| Variable           | Effect                                                                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EVAL_MCP_ARGS`    | Extra server flags, e.g. `--toolsets MRT`.                                                                                                            |
| `EVAL_MCP_PROJECT` | A directory name under `fixtures/`. It is copied to a temp dir (so `dw.json` discovery can't walk into the repo) and passed as `--project-directory`. |

Eval runs get a temporary `HOME`, so no user `dw.json`, credentials or telemetry settings are visible.

## Backend tiers

Tag each case with the backend it needs:

- `tier0`: offline tools only (docs, schemas, skills, CIP discovery, config inspection, tool/toolset guidance). Runs anywhere with no credentials. This is the whole suite today.
- `tier1` (planned): instance tools against a mock backend preloaded into the server process.
- `tier2` (planned): live sandbox. Opt-in only, never in CI.

## Writing cases

- Tool names in graders look like `mcp__plugin_b2c-dx-mcp_b2c-dx-mcp__<tool>`.
- Prefer deterministic graders (`tool_used`, `tool_order`, `regex`) and use `llm` only for judgement calls. Keep a regex on the final answer as a factual check.
- If a tool must not be called (deploys, debugger sessions, `scapi_execute`, `cip_query`), use `tool_used` with `max: 0` and `arm: both`.
- If more than one tool path is correct (common with natural prompts), don't pin a single tool. Use a `regex` on `target: trace` with an alternation, e.g. `"name":"mcp__plugin_b2c-dx-mcp_b2c-dx-mcp__docs_(search|read)"`.
- Check ground truth against the real tools before writing an answer regex.

## Flagged for improvement

- **`docs_schema_read` output size.** It returns a whole XSD as one JSON string (`catalog.xsd` is ~80 KB). In Claude Code the result goes over the inline limit and is saved to a file outside the workspace, the agent can't read it, and it retries until it runs out of turns. Suggested fix: an optional `element` argument that returns just the named element/type definitions, or `offset`/`limit` paging. The case `disabled/docs/catalog-xsd-online-flag` covers this; re-enable it once the tool is fixed.

## Resolved

- **Agents skipped the SCAPI skill.** Sonnet 5, Sonnet 5.5 and Opus 4.8 usually called `scapi_search` before reading `skill://mcp/b2c-mcp-scapi/SKILL.md`, then recovered from `SCAPI_SKILL_REQUIRED`; only Opus 5.5 followed the "read first" description text. Making `skillRead` a required `true` literal, and leading the shorter descriptions with the requirement, fixed it on Sonnet 5 and Sonnet 5.5 (Opus 4.8 not re-tested). `scapi/category-rules-execution` and `cip/promotion-roi-query` guard against regressions.
