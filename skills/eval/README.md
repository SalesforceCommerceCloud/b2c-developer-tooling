# Skill Trigger Evaluation Harness

Tests whether skill descriptions cause Claude to correctly trigger (or not trigger) for given queries. Based on the [skill-creator](https://github.com/anthropics/claude-code-plugins) eval harness.

Requires [uv](https://docs.astral.sh/uv/) and the `claude` CLI.

## How It Works

The harness runs `claude -p <query>` inside an isolated eval project (`project/`) — a minimal B2C Commerce storefront with a dummy cartridge and realistic project structure. Before each run, all real skills are synced (copied) from the source directories into `project/.claude/skills/`, exactly as a user would install them.

This means:

- Skills are tested with their **real names**, descriptions, and content
- **All skills are present simultaneously**, so inter-skill competition is captured
- The eval project has its own `.git` for isolation — Claude won't see the main repo's plugins or CLAUDE.md
- Detection checks whether Claude invokes the `Skill` tool with the skill under test's name

## Quick Start

```bash
# Evaluate all skills that have trigger evals (default: discovers skills/)
pnpm run skills:eval

# Evaluate a single skill
pnpm run skills:eval -- --skill-path skills/b2c-cli/skills/b2c-logs

# With multiple runs per query for reliability
pnpm run skills:eval -- --runs-per-query 3

# Save results to file
pnpm run skills:eval -- --output results.json
```

Or run directly with `uv`:

```bash
uv run skills/eval/run_eval.py --model us.anthropic.claude-sonnet-4-6 --verbose

# Single skill
uv run skills/eval/run_eval.py \
  --skill-path skills/b2c-cli/skills/b2c-logs \
  --model us.anthropic.claude-sonnet-4-6 \
  --verbose
```

## Optimization Loop

Iteratively improves a skill's description to maximize trigger accuracy. Uses Claude with extended thinking to propose new descriptions, evaluates them, and picks the best. Opens a live HTML report in your browser.

Requires `ANTHROPIC_API_KEY` set in your environment.

```bash
pnpm run skills:eval:optimize -- \
  --eval-set skills/b2c-cli/skills/b2c-logs/evals/trigger-evals.json \
  --skill-path skills/b2c-cli/skills/b2c-logs \
  --max-iterations 5
```

### How the optimization loop works

1. Splits eval queries into train (60%) and test (40%) sets
2. Evaluates the current description against all queries (runs each 3x by default)
3. If train set has failures, calls Claude to propose an improved description
4. Re-evaluates the new description
5. Repeats up to `--max-iterations` or until all train queries pass
6. Returns the best description by **test** score (prevents overfitting)

## Eval Project

The `project/` directory is a minimal B2C Commerce storefront:

```
project/
├── .claude/skills/          # Synced at runtime from real skill dirs (gitignored)
├── .git/                    # Own git repo for isolation from main project
├── CLAUDE.md                # Minimal project context
├── README.md
├── dw.json                  # Dummy instance config
└── cartridges/
    └── app_storefront_custom/
        └── cartridge/
            ├── controllers/
            ├── models/
            ├── scripts/
            ├── templates/
            └── meta/
```

The project has its own `.git` so `claude -p` doesn't inherit the main repo's CLAUDE.md, `.claude-plugin`, or other project configuration. Skills are copied into `.claude/skills/` before each eval run.

## Trigger Eval Format

Each skill stores its evals in `evals/trigger-evals.json`:

```json
[
  {"query": "realistic user prompt that should trigger the skill", "should_trigger": true},
  {"query": "near-miss prompt that should NOT trigger", "should_trigger": false}
]
```

### Writing good trigger evals

- **Should-trigger queries** (6 per skill): Realistic prompts a developer would type. Include specific details — file paths, error messages, project context. Mix casual and formal tones. Don't mention the skill name or CLI commands explicitly.
- **Should-not-trigger queries** (4 per skill): Near-misses that share keywords but need a different skill. These test discrimination. Don't use obviously irrelevant queries.
- Queries should be substantive enough that Claude would benefit from consulting a skill. Simple one-step queries may not trigger any skill regardless of description quality.

### Adding trigger evals to a new skill

1. Create `evals/trigger-evals.json` in your skill directory
2. Write 6 should-trigger + 4 should-not-trigger queries
3. Run the eval: `pnpm run skills:eval -- --skill-path <path>`
4. If trigger rate is low, run the optimization loop to improve the description

## Options Reference

### run_eval.py

| Flag | Default | Description |
|------|---------|-------------|
| `--skill-path` | — | Evaluate a single skill (overrides discovery) |
| `--discover` | `skills/` | Directories to search for skills with trigger evals |
| `--model` | — | Model ID for `claude -p` |
| `--runs-per-query` | 1 | Times to run each query (higher = more reliable) |
| `--num-workers` | 10 | Parallel `claude -p` processes |
| `--timeout` | 30 | Seconds per query |
| `--trigger-threshold` | 0.5 | Trigger rate needed to pass |
| `--output` | stdout | Write JSON results to file |
| `--report` | auto | HTML report path ('auto' for temp file, 'none' to disable) |
| `--previous` | — | Path to previous results JSON for comparison deltas |
| `--view` | — | View an existing results JSON as HTML report (skips eval) |
| `--verbose` | off | Print progress to stderr |

### run_loop.py

| Flag | Default | Description |
|------|---------|-------------|
| `--eval-set` | — | Path to trigger-evals.json |
| `--skill-path` | — | Path to skill directory |
| `--model` | — | Model for eval and improvement |
| `--max-iterations` | 5 | Max improvement iterations |
| `--runs-per-query` | 3 | Times to run each query per iteration |
| `--holdout` | 0.4 | Fraction held out for testing |
| `--report` | auto | HTML report path ('auto' or 'none') |
| `--results-dir` | — | Save outputs to timestamped subdirectory |
| `--verbose` | off | Print progress to stderr |

## Architecture

```
skills/eval/
├── README.md          # This file
├── eval_lib.py        # Shared: query runner, eval engine, HTML report generator
├── run_eval.py        # Single eval pass (uv script, no deps)
├── run_loop.py        # Optimization loop (uv script, requires anthropic)
└── project/           # Isolated eval project (own .git)
    ├── .claude/skills/  # Synced from real skill dirs at runtime
    ├── CLAUDE.md
    └── cartridges/...
```
