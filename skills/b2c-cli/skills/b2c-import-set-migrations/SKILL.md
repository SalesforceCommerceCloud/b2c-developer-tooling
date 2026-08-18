---
name: b2c-import-set-migrations
description: Apply ordered, idempotent B2C Commerce site import/export archives from discovered cartridge metadata and project migrations using `b2c job import-set`. Use this opt-in project workflow for repeatable setup, onboarding, and CI/CD imports that apply once per instance. Also covers source exclusions, post-import README notes, resetting history, and recovering an interrupted run.
---

# Import Set Migrations Skill

Use `b2c job import-set` to apply site import/export archives from discovered cartridge `metadata/` directories followed by project migrations. Each archive is applied once per instance and skipped on later runs. Re-running the command is the intended workflow for local setup, developer onboarding, and CI/CD.

> [!IMPORTANT]
> **This is an optional, opt-in, project-level approach — not a default workflow.** A project adopts it deliberately by keeping import-set sources with its code and running `b2c job import-set` from setup scripts or CI. Follow an existing project's conventions. If a project only uses occasional one-off site imports, use the `b2c-cli:b2c-site-import-export` skill instead.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli job import-set`).

## Configuration & Authentication

The CLI auto-discovers the target instance and credentials from `SFCC_*` environment variables, `dw.json` in the current or parent directories, `~/.mobify`, `package.json`, and configuration plugins. **Flags like `--server`, `--client-id`, `--client-secret`, `--username`, and `--password` are usually unnecessary** — only pass them to override what's auto-detected.

`job import-set` requires both OAuth and WebDAV credentials. Run `b2c setup inspect` to confirm the resolved configuration; see the `b2c-cli:b2c-config` skill for precedence rules and troubleshooting.

## Import Sources and Order

The command considers cartridge metadata first, followed by the project migrations directory (`./migrations` by default). Discovered cartridges are ordered by name, and archives within each source are ordered lexically.

A cartridge `metadata/` directory can use either layout:

- If it resembles a standard site import/export archive, the entire `metadata/` directory is one archive.
- Otherwise, each immediate child directory or `.zip` file is one archive, matching the migrations-directory behavior.

Keep each cartridge in one form rather than mixing an archive layout with ordered children. Directory-based archives must contain at least one file.

The project migrations directory contains immediate child directories and `.zip` files as archives. Hidden entries and other loose files are ignored:

```text
migrations/
├── 20260801T140000-add-preferences/
│   ├── README.md                   # post-import note for THIS archive (see below)
│   ├── meta/
│   │   └── system-objecttype-extensions.xml
│   └── sites/
│       └── RefArch/
│           └── preferences.xml
├── 20260802T091500-seed-content.zip
└── README.md                       # top-level README is not an archive
```

Each archive directory (or the contents of each zip) uses the standard site import/export archive layout that `b2c job import` accepts. For archive structure and metadata XML patterns, see the `b2c-cli:b2c-site-import-export` skill.

### Naming convention

Name every ordered child archive `YYYYMMDDTHHmmss-description`, e.g. `20260801T140000-add-preferences`. Use UTC so ordering is stable across time zones. Names identify applied archives, so never edit or reuse a name after it has been applied; add a new, later-sorting archive instead.

## Commands

```bash
# Preview: show pending vs. already-applied archives; writes nothing to the instance
b2c job import-set --dry-run

# Apply the default ./migrations directory (safe to repeat)
b2c job import-set

# Apply a different directory
b2c job import-set ./data-migrations

# Import project migrations without discovered cartridge metadata
b2c job import-set --no-cartridge-metadata

# Exclude project-relative source trees recursively
b2c job import-set --import-set-exclude fixtures --import-set-exclude test/integration

# Keep each uploaded archive on the instance after import (for inspection)
b2c job import-set --keep-archive
```

### Flags

| Flag                        | Description                                                                        | Default      |
| --------------------------- | ---------------------------------------------------------------------------------- | ------------ |
| `--dry-run`                 | Show pending and applied archives without locking, importing, or writing state     | `false`      |
| `--keep-archive`, `-k`      | Keep each uploaded archive on the instance after import                            | `false`      |
| `--[no-]cartridge-metadata` | Include imports from discovered cartridge `metadata/` directories                  | `true`       |
| `--import-set-exclude`      | Exclude a project-relative directory recursively from source discovery; repeatable |              |
| `--set-id`                  | Name an independent import history                                                 | `migrations` |
| `--break-lock`              | Recover an interrupted import-set run immediately                                  | `false`      |
| `--stale-lock-seconds`      | Consider an inactive import-set run recoverable after this many seconds            | `1800`       |
| `--lock-poll-interval`      | Seconds between checks while waiting for another run                               | `3`          |
| `--timeout`, `-t`           | Timeout in seconds for each individual import job                                  | No timeout   |
| `--poll-interval`           | Job polling interval in seconds                                                    | `3`          |
| `--show-log`                | Show the job log when an import fails                                              | `true`       |
| `--json`                    | Emit machine-readable archive statuses and counts; suppress human output           | `false`      |

### Source exclusions

`--import-set-exclude` accepts repeated flags or comma-separated paths. Paths are relative to `--project-directory` or the current project and exclude the directory and all descendants from source discovery. The setting is also available as:

- `import-set-exclude` in `dw.json`
- `b2c.importSetExclude` in `package.json`, which is suitable for committed project defaults
- comma-separated `SFCC_IMPORT_SET_EXCLUDE`

Exclusions select source directories; they do not remove files from inside a selected archive.

## Post-Import Notes (per-archive README)

Some migrations require **manual follow-up** that cannot be captured in an archive — for example enabling an instance-specific site preference, wiring a service credential in Business Manager, or flipping a feature toggle after the data lands.

Document these in a `README.md` (or `README`) file at the top of a directory-based archive, whether it comes from cartridge metadata or project migrations. After a run, the CLI prints the notes for archives it applied in a consolidated **Post-import notes** summary.

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

- Notes are surfaced only for archives **applied in this run** (freshly imported). Archives already applied on the instance (skipped) do not repeat their notes, so the summary reflects only what just changed.
- `--dry-run` shows the notes for **pending** archives as a preview, so you can review manual steps before committing to the import.
- Only directory-based archives are scanned for a README; `.zip` archives are not. `README.md` takes precedence over `README`. An empty README produces no note.
- The top-level README of the set directory itself is not an archive and is not printed — use it for human-facing docs about the set as a whole.
- With `--json`, notes are not printed; each archive's note text is available in the JSON result instead.

This is the idiomatic place to record "what a human must still do" for a migration — keep archive contents safe to reapply and push environment-specific manual work into the note.

## Repeat Runs

After each successful import, the target instance records that archive's name. Later runs skip it without comparing contents.

Key rules:

- An interrupted run can retry its current archive, so every archive must be safe to apply more than once.
- Applied state is shared across developers, checkouts, and CI runners targeting the same instance.
- Never edit an applied archive. Add a new, later-sorting archive for every change.
- Keep names distinct within an import history; UTC timestamps make collisions unlikely.

## Set IDs (namespaces)

The default import history is named `migrations` and is shared by runs against the same instance, regardless of local directory path.

Most projects should **omit `--set-id`**. Use it only to intentionally maintain an independent migration history on the same instance, or to preserve a legacy namespace whose archive names cannot follow the timestamp convention.

## Concurrent Runs and Recovery

Only one runner applies a given history at a time. Other runners wait and then skip archives completed while they were waiting.

An interrupted run becomes recoverable after 30 minutes by default; tune this with `--stale-lock-seconds`. Use `--break-lock` when it must be recovered immediately.

## Idiomatic Workflows

### Local setup / onboarding

Commit the cartridge metadata and/or `./migrations` sources to the repo. New developers point the CLI at their sandbox and run:

```bash
b2c job import-set --dry-run   # see what will apply
b2c job import-set             # apply; read the post-import notes for manual steps
```

Running it again later applies only the migrations added since.

### CI/CD

Run `b2c job import-set` as a deploy step against staging/production. It is safe to run on every pipeline invocation — only unapplied archives import. Prefer `--json` to capture the applied/skipped counts and per-archive note text for logs or downstream summaries:

```bash
b2c job import-set --json > import-set-result.json
```

Concurrent pipeline runs coordinate automatically.

### Adding a new migration

1. Create a new directory named with the current UTC timestamp: `20260815T120000-add-loyalty-attrs/`.
2. Put the site archive contents inside (`meta/`, `sites/`, etc.).
3. If manual follow-up is needed, add a `README.md` describing it.
4. Commit. The next `b2c job import-set` applies only this archive.

## Resetting Import History

There is no dedicated reset command. Prefer starting a separate history so the old one remains intact:

```bash
b2c job import-set --set-id migrations-reset-20260818
```

Continue using that set ID on future runs. To clear the default history in place instead, remove it through WebDAV and rerun:

```bash
b2c webdav rm --root=impex b2c-cli/import-sets/migrations
b2c job import-set
```

For a custom set ID, replace the final path segment. Clearing history makes every current archive pending again, so use it only when all archives are safe to reapply. `--break-lock` recovers an interrupted run; it does not reset history.

## Import Failure Recovery

Fix the archive or target-instance problem and rerun. Archives already applied are skipped, and the failed archive retries. `--show-log` is enabled by default and displays the platform job log for a failed import.

## Related Skills

- `b2c-cli:b2c-site-import-export` - Single archive import/export, site-archive folder structure, and metadata XML patterns
- `b2c-cli:b2c-job` - Running and monitoring jobs, including individual archive imports and `job search`/`job wait`
- `b2c:b2c-metadata` - System object extensions, custom object definitions, and site preferences
- `b2c-cli:b2c-webdav` - Clearing an import history when an in-place reset is required
- `b2c-cli:b2c-config` - Resolving instance and credential configuration
