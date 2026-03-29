# Skill Trigger Evaluation Harness

Tests whether skill descriptions cause Claude to correctly trigger (or not trigger) for given queries. Based on the [skill-creator](https://github.com/anthropics/claude-code-plugins) eval harness.

Requires [uv](https://docs.astral.sh/uv/) and the `claude` CLI.

## Quick Start

```bash
# Evaluate all skills that have trigger evals (default: discovers skills/)
uv run skills/eval/run_eval.py --model us.anthropic.claude-sonnet-4-6 --verbose

# Evaluate a single skill
uv run skills/eval/run_eval.py \
  --skill-path skills/b2c-cli/skills/b2c-am \
  --model us.anthropic.claude-sonnet-4-6 \
  --verbose

# Save results to file
uv run skills/eval/run_eval.py \
  --model us.anthropic.claude-sonnet-4-6 \
  --output results.json \
  --verbose

# Search additional directories
uv run skills/eval/run_eval.py \
  --discover skills/ .claude/skills/ \
  --model us.anthropic.claude-sonnet-4-6 \
  --verbose
```

## Optimization Loop

Iteratively improves a skill's description to maximize trigger accuracy. Uses Claude with extended thinking to propose new descriptions, evaluates them, and picks the best. Opens a live HTML report in your browser.

Requires `ANTHROPIC_API_KEY` set in your environment.

```bash
# Optimize a single skill's description (opens live report)
uv run skills/eval/run_loop.py \
  --eval-set skills/b2c-cli/skills/b2c-am/evals/trigger-evals.json \
  --skill-path skills/b2c-cli/skills/b2c-am \
  --model us.anthropic.claude-sonnet-4-6 \
  --max-iterations 5 \
  --verbose

# Save all outputs to a directory
uv run skills/eval/run_loop.py \
  --eval-set skills/b2c-cli/skills/b2c-am/evals/trigger-evals.json \
  --skill-path skills/b2c-cli/skills/b2c-am \
  --model us.anthropic.claude-sonnet-4-6 \
  --results-dir skills/eval/results \
  --verbose

# Disable browser report
uv run skills/eval/run_loop.py \
  --eval-set skills/b2c-cli/skills/b2c-am/evals/trigger-evals.json \
  --skill-path skills/b2c-cli/skills/b2c-am \
  --model us.anthropic.claude-sonnet-4-6 \
  --report none \
  --verbose
```

### How the optimization loop works

1. Splits eval queries into train (60%) and test (40%) sets
2. Evaluates the current description against all queries (runs each 3x by default)
3. If train set has failures, calls Claude to propose an improved description
4. Re-evaluates the new description
5. Repeats up to `--max-iterations` or until all train queries pass
6. Returns the best description by **test** score (prevents overfitting)

## Trigger Eval Format

Each skill stores its evals in `evals/trigger-evals.json`:

```json
[
  {"query": "realistic user prompt that should trigger the skill", "should_trigger": true},
  {"query": "near-miss prompt that should NOT trigger", "should_trigger": false}
]
```

### Writing good trigger evals

- **Should-trigger queries** (3 per skill): Realistic prompts a developer would type. Include specific details — file paths, error messages, API names. Mix casual and formal tones.
- **Should-not-trigger queries** (2 per skill): Near-misses that share keywords but need a different skill. These test discrimination. Don't use obviously irrelevant queries.
- Queries should be substantive enough that Claude would benefit from consulting a skill. Simple one-step queries may not trigger any skill regardless of description quality.

### Adding trigger evals to a new skill

1. Create `evals/trigger-evals.json` in your skill directory
2. Write 3 should-trigger + 2 should-not-trigger queries
3. Run the eval: `uv run skills/eval/run_eval.py --skill-path <path> --model <model> --verbose`
4. If trigger rate is low, run the optimization loop to improve the description

### Updating trigger evals

Edit `evals/trigger-evals.json` directly. Add new queries, adjust existing ones, or change `should_trigger` values. Then re-run the eval to verify.

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
└── run_loop.py        # Optimization loop (uv script, requires anthropic)
```

The harness works by creating temporary `.claude/commands/` files with the skill's description, running `claude -p` with `--output-format stream-json --verbose --include-partial-messages`, and detecting whether Claude attempts to invoke the `Skill` or `Read` tool for that command. This tests the real triggering mechanism without mocking.
