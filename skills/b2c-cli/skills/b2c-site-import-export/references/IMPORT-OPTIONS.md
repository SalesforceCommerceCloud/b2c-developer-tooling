# Import Options

## Import Commands

### Import Local Directory

```bash
# Import a local directory as a site archive (waits for completion by default)
b2c job import ./my-site-data

# Import and return immediately without waiting
b2c job import ./my-site-data --no-wait

# Import a local zip file
b2c job import ./export.zip

# Keep the archive on the instance after import
b2c job import ./my-site-data --keep-archive

# Show job log if the import fails
b2c job import ./my-site-data --show-log
```

### Import Remote Archive

```bash
# Import an archive that already exists on the instance (in Impex/src/instance/)
b2c job import existing-archive.zip --remote
```

### Apply an Ordered, Idempotent Import Set

Use `job import-set` when site import/export archives must be applied in order and skipped after the instance records their successful import. By default, the command reads discovered cartridge metadata first and the migrations directory second. This section is a summary; for the full migration workflow — source exclusions, post-import README notes, import history, set IDs, CI/CD patterns, and recovery — use the dedicated `b2c-cli:b2c-import-set-migrations` skill.

Cartridge metadata supports two project layouts:

- A standard site import/export archive directly inside `metadata/`, applied as one archive.
- An ordered collection of immediate child directories or `.zip` files inside `metadata/`, with each child applied as one archive.

Use one layout consistently within a cartridge. Cartridges are ordered by name, their archives are ordered lexically, and every cartridge archive is considered before the explicit import-set directory. Every directory-based archive must contain at least one file; empty directory trees are rejected before upload. The explicit directory uses the ordered-child layout:

```text
migrations/
├── 20260801T140000-add-preferences/
│   ├── meta/
│   └── sites/
├── 20260802T091500-seed-content.zip
└── README.md                       # ignored
```

Name every archive `YYYYMMDDTHHmmss-description`, using UTC for cross-time-zone teams. The timestamp supplies ordering and helps keep archive names unique across projects.

```bash
# Show pending and already-applied archives without writing anything
b2c job import-set --dry-run

# Apply the default ./migrations directory
b2c job import-set

# Ignore discovered cartridge metadata and apply only ./migrations
b2c job import-set --no-cartridge-metadata

# Ignore project directories recursively during source discovery
b2c job import-set --import-set-exclude fixtures --import-set-exclude test/integration

# Apply a different directory
b2c job import-set ./data-migrations

# Keep uploaded archives for inspection
b2c job import-set --keep-archive
```

Important semantics:

- After an archive succeeds, later runs against the same instance skip it, including runs from other machines.
- The archive name determines whether it has run; changing its contents does not cause another import. Never edit an applied archive—add a new, later-sorting archive for each change.
- An interrupted run can retry its current archive. Make every archive safe to apply more than once.
- Only one runner applies a history at a time. Other runners wait and then skip work completed while they were waiting.
- An inactive run becomes recoverable after 30 minutes by default. Adjust this with `--stale-lock-seconds`; use `--break-lock` only after confirming the previous runner has stopped.
- `--timeout` applies to each archive import, `--poll-interval` controls job polling, and `--lock-poll-interval` controls waiting for another runner.
- `--import-set-exclude` can be repeated or comma-separated. Paths are relative to the project directory and exclude the named source directory and all descendants. Configure the same project default with `b2c.importSetExclude` in `package.json`, `import-set-exclude` in `dw.json`, or `SFCC_IMPORT_SET_EXCLUDE`.

The default directory is `./migrations`; it may be absent if discovered cartridges supply at least one metadata archive. The default history name is `migrations` and is shared across runs against the target instance, regardless of local path. Most users should omit `--set-id`; use it only when intentionally creating an independent history. Cartridge discovery is enabled by default; use `--no-cartridge-metadata` to opt out.

To start over without deleting the previous history, use a new set ID and keep using it on subsequent runs:

```bash
b2c job import-set --set-id migrations-reset-20260818
```

To reset the default history in place, remove it and rerun the import set:

```bash
b2c webdav rm --root=impex b2c-cli/import-sets/migrations
b2c job import-set
```

For a custom set ID, replace the final `migrations` path segment with that ID. Resetting in place permanently forgets which archives succeeded and makes every current archive pending again, so only use it when every archive is safe to reapply. `--break-lock` is for recovery and does not reset history.

### Import Archives Larger Than the Instance Limit

An instance rejects a single import archive above its size limit (typically 200 MB). Use `--split` on a directory import to import the data in multiple smaller parts:

```bash
# Split a large directory import into multiple archive parts
b2c job import ./big-site-data --split

# Tune the per-archive size limit (default 190mb; bare number is MiB)
b2c job import ./big-site-data --split --max-size 150mb
```

How splitting works:

- **Metadata/XML is imported first**, kept together in one archive when it fits (so internal references and dependency ordering resolve within a single import). If the XML alone is too large, it splits at top-level data-unit boundaries (`catalogs`, `libraries`, `sites`, `meta`, …) in dependency order — never splitting a single unit.
- **Static assets** (files under a `static/` folder) are deferred into later archive parts, packed by compressed size. They attach to the catalogs/libraries created by the metadata import.
- Parts import sequentially; the command stops on the first failure.

If a single file, or a single data unit's XML, is larger than `--max-size` on its own, the command errors (a file is never split across archives). A normal directory import that exceeds the limit warns and recommends `--split`. `--split` cannot be combined with `--remote`, subset paths, or `--no-wait`.
