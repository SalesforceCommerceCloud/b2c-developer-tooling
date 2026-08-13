---
name: b2c-import-set-migrations
description: Apply an ordered, idempotent set of B2C Commerce site archives as repeatable "migrations" using `b2c job import-set`. This is an OPT-IN, project-level convention — use this skill only when the project has explicitly adopted an import-set/migrations directory (e.g. a committed `./migrations` folder) or the user explicitly asks for import sets or migrations. Do NOT apply it implicitly to projects that simply do one-off site imports; those use the `b2c-cli:b2c-site-import-export` skill. Applies when the user needs to run a growing sequence of site-import archives that must apply in order, skip anything already applied on the target instance, and stay safe to re-run in local setup, onboarding, or CI/CD — e.g. "run my migrations", "apply the import set", "set up idempotent site imports". Also use when they ask how to document per-migration manual follow-up steps (post-import README notes), how receipts and locking work, or how to recover a stuck import set.
---

# Import Set Migrations Skill

Use `b2c job import-set` to apply an ordered directory of site archives idempotently. Think of it as database-style migrations for B2C Commerce site data: each archive is applied once per instance, in order, and skipped on every later run once the instance records its success. Re-running the command is always safe — it is the intended workflow for local setup, developer onboarding, and CI/CD.

> [!IMPORTANT]
> **This is an optional, opt-in, project-level convention — not a default workflow.** A project adopts it deliberately, typically by committing a migrations directory (e.g. `./migrations`) and running `b2c job import-set` from setup scripts or CI. Do **not** introduce it, create a `./migrations` directory, or run `job import-set` in a project that has not opted in. If a project only performs occasional one-off site imports, use the `b2c-cli:b2c-site-import-export` skill instead. When it is unclear whether the project uses import sets, check for an existing migrations directory or ask the user before proceeding.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli job import-set`).

This skill is the canonical, in-depth reference for the migration workflow. For single one-off archive imports/exports and site-archive/metadata XML structure, use the `b2c-cli:b2c-site-import-export` skill.

## Configuration & Authentication

The CLI auto-discovers the target instance and credentials from `SFCC_*` environment variables, `dw.json` in the current or parent directories, `~/.mobify`, `package.json`, and configuration plugins. **Flags like `--server`, `--client-id`, `--client-secret`, `--username`, and `--password` are usually unnecessary** — only pass them to override what's auto-detected.

`job import-set` requires **both** OAuth (to run the import job) and WebDAV credentials (to upload archives and to store its receipt/lock state under `Impex/`). Run `b2c setup inspect` to confirm the resolved configuration; see the `b2c-cli:b2c-config` skill for precedence rules and troubleshooting.

## Directory Layout

Point the command at a directory (default `./migrations`). Each **immediate child directory or `.zip` file** is one import item. Hidden entries (dotfiles) and any other loose files are ignored. Items are applied in lexical filename order.

```text
migrations/
├── 20260801T140000-add-preferences/
│   ├── README.md                   # post-import note for THIS item (see below)
│   ├── meta/
│   │   └── system-objecttype-extensions.xml
│   └── sites/
│       └── RefArch/
│           └── preferences.xml
├── 20260802T091500-seed-content.zip
└── README.md                       # top-level README is ignored as an item
```

Each item directory (or the contents of each zip) is a standard site archive — the same `meta/`, `sites/`, `catalogs/`, `customobjects/`, etc. layout that `b2c job import` accepts. For that structure and the metadata XML patterns, see the `b2c-cli:b2c-site-import-export` skill.

### Naming convention

Name every item `YYYYMMDDTHHmmss-description`, for example `20260801T140000-add-preferences`. Use **UTC** so ordering is stable for teams across time zones.

The timestamp does double duty: it is the **ordering key** and part of the item's **stable receipt identity**. Because receipt identity is the item name only (not its contents or local path), the timestamp-plus-description convention makes accidental collisions between projects sharing an instance extremely unlikely.

## Commands

```bash
# Preview: show pending vs. already-applied items; writes nothing to the instance
b2c job import-set --dry-run

# Apply the default ./migrations directory (safe to repeat)
b2c job import-set

# Apply a different directory
b2c job import-set ./data-migrations

# Keep each uploaded archive on the instance after import (for inspection)
b2c job import-set --keep-archive
```

### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--dry-run` | Show pending and applied items without locking, importing, or writing state | `false` |
| `--keep-archive`, `-k` | Keep each uploaded archive on the instance after import | `false` |
| `--set-id` | Advanced: remote receipt and lock namespace for an independent migration history | `migrations` |
| `--break-lock` | Remove an existing import-set lock before acquiring it | `false` |
| `--stale-lock-seconds` | Take over a lock whose heartbeat is older than this many seconds | `1800` |
| `--lock-poll-interval` | Seconds between checks while another runner holds the set lock | `3` |
| `--timeout`, `-t` | Timeout in seconds for each individual import job | No timeout |
| `--poll-interval` | Job polling interval in seconds | `3` |
| `--show-log` | Show the job log when an import fails | `true` |
| `--json` | Emit the machine-readable result (item statuses, counts) and suppress human output | `false` |

## Post-Import Notes (per-item README)

Some migrations require **manual follow-up** that cannot be captured in a site archive — for example enabling an instance-specific site preference, wiring a service credential in Business Manager, or flipping a feature toggle after the data lands.

Document these in a `README.md` (or `README`) file at the **top of that item's directory**. After a run, the CLI prints the README contents of every item it applied in a consolidated **"Post-import notes"** summary, so the operator sees exactly what still needs doing and for which migration.

```text
migrations/
└── 20260801T140000-add-preferences/
    ├── README.md
    ├── meta/
    └── sites/
```

**`20260801T140000-add-preferences/README.md`:**
```markdown
# Add feature-X preferences

Manual follow-up (per instance):

1. In Business Manager, go to Merchant Tools > Site Preferences > Feature X.
2. Set the API endpoint to the instance-specific value (not imported — differs per environment).
3. Save and verify the storefront picks it up.
```

Behavior:

- Notes are surfaced only for items **applied in this run** (freshly imported). Items already applied on the instance (skipped) do not repeat their notes, so the summary reflects only what just changed.
- `--dry-run` shows the notes for **pending** items as a preview, so you can review manual steps before committing to the import.
- Only directory items are scanned for a README; `.zip` items are not. `README.md` takes precedence over `README`. An empty README produces no note.
- The top-level README of the set directory itself is never treated as an item and is not printed — use it for human-facing docs about the set as a whole.
- With `--json`, notes are not printed; each item's note text is available on the item in the JSON result instead.

This is the idiomatic place to record "what a human must still do" for a migration. Keep archive contents safe to reapply and push all environment-specific manual work into the note.

## Idempotency: receipts and retry behavior

After each successful import, the CLI creates and verifies a durable **receipt** on the target instance (a WebDAV directory under `Impex/b2c-cli/import-sets/<set-id>/receipts/`). On later runs, any item whose name already has a valid receipt is **skipped without comparing its contents**.

Key rules:

- **At-least-once until the receipt is durable.** If an import succeeds but the process crashes or WebDAV fails before the receipt is written and verified, the next run imports that item again. **Site archive contents must be safe to apply more than once.**
- **Receipts survive machines and cleanups.** Receipt identity is the item name, so an item applied from one developer's machine (or a CI runner) is skipped by everyone else. Receipts are durable directories, not regular files, so routine Impex file cleanup does not erase applied state.
- **Never edit an applied item.** Instances that already recorded its name keep skipping it, while a fresh instance would import the edited contents — divergence. Add a **new, later-sorting** item for every change.
- **Distinct names within a namespace.** Two projects sharing the same receipt namespace must use distinct item names; the UTC-timestamp-and-description convention makes collisions unlikely.

## Set IDs (namespaces)

Receipts and the concurrency lock live under a fixed, **instance-wide** namespace — `migrations` by default — regardless of the local directory path. Two checkouts of the same repo, or two CI runners, therefore share one history and cooperate correctly.

Most projects should **omit `--set-id`**. Use it only to intentionally maintain an independent migration history on the same instance, or to preserve a legacy namespace whose item names cannot follow the timestamp convention.

## Concurrent runners and stale locks

Only one runner applies a given set at a time. The CLI atomically creates a WebDAV collection as the set lock, writes owner metadata, and refreshes a heartbeat while imports run. Other runners **wait**, then re-check receipts after acquiring the lock (so work another runner completed while they waited is correctly skipped).

- A lock is treated as **stale after 30 minutes** by default; tune with `--stale-lock-seconds`. Stale locks are taken over automatically, and the takeover is always reported in command output.
- Use `--break-lock` only after **confirming the recorded runner is actually gone**. B2C Commerce WebDAV does not enforce conditional deletes, so forced/stale takeover is best-effort.

## Idiomatic Workflows

### Local setup / onboarding

Commit a `./migrations` directory to the repo. New developers point the CLI at their sandbox and run:

```bash
b2c job import-set --dry-run   # see what will apply
b2c job import-set             # apply; read the post-import notes for manual steps
```

Running it again later applies only the migrations added since.

### CI/CD

Run `b2c job import-set` as a deploy step against staging/production. It is safe to run on every pipeline invocation — only unapplied items import. Prefer `--json` to capture the applied/skipped counts and per-item note text for logs or downstream summaries:

```bash
b2c job import-set --json > import-set-result.json
```

Concurrent pipeline runs cooperate via the lock; a run that finds the lock held will wait and then skip whatever the winner already applied.

### Adding a new migration

1. Create a new directory named with the current UTC timestamp: `20260815T120000-add-loyalty-attrs/`.
2. Put the site archive contents inside (`meta/`, `sites/`, etc.).
3. If manual follow-up is needed, add a `README.md` describing it.
4. Commit. The next `b2c job import-set` applies only this item.

## Recovery

- **An import failed midway.** Fix the underlying issue (use `--show-log`, on by default, to see the platform job log) and re-run. Items already applied are skipped; the failed item retries.
- **A lock is stuck after a crashed runner.** Wait for the stale window, lower `--stale-lock-seconds`, or, once you have confirmed no runner is active, use `--break-lock`.
- **An item imported but its receipt is missing/invalid.** It will import again on the next run — this is by design. Ensure archives are safe to reapply.

## Related Skills

- `b2c-cli:b2c-site-import-export` - Single archive import/export, site-archive folder structure, and metadata XML patterns
- `b2c-cli:b2c-job` - Running and monitoring jobs, including individual archive imports and `job search`/`job wait`
- `b2c:b2c-metadata` - System object extensions, custom object definitions, and site preferences
- `b2c-cli:b2c-webdav` - Inspecting the `Impex/b2c-cli/import-sets/` receipt and lock state directly
- `b2c-cli:b2c-config` - Resolving instance and credential configuration
