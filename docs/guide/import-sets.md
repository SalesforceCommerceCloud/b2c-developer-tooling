---
description: Deploy B2C Commerce metadata as an ordered, repeatable import history from cartridges and project migrations.
---

# Import Sets

Import sets make B2C Commerce metadata deployments repeatable. They apply site import/export archives in a predictable order and remember successful archives on each target instance, so the same command can run during local setup, onboarding, and every CI/CD deployment.

Use an import set for version-controlled changes that grow over time, such as custom attributes, site preferences, services, catalogs, and initial feature data. For an occasional archive that should run every time you request it, use [`b2c job import`](/cli/jobs#b2c-job-import) instead.

## Before You Start

Import sets are an opt-in project convention. Adopt them deliberately and commit the archive sources with your code.

The command requires OAuth credentials to run the platform import job and WebDAV credentials to transfer archives. See [Authentication Setup](./authentication) for configuration options.

## Import Sources and Order

`b2c job import-set` considers two sources:

1. Metadata supplied by discovered cartridges.
2. Project migrations, from `./migrations` by default.

All cartridge metadata is considered before project migrations. Cartridges are ordered by name, and archives within each source are sorted lexically.

Run the command from the project root. If the project is elsewhere, use the global `--project-directory` flag.

## Cartridge Metadata

A cartridge can provide metadata in either of two forms.

### One Archive

Use a standard site import/export archive layout when all of the cartridge's initial metadata belongs together:

```text
cartridges/
└── app_loyalty/
    ├── cartridge/
    └── metadata/
        ├── meta/
        │   └── system-objecttype-extensions.xml
        └── sites/
            └── RefArch/
                └── preferences.xml
```

The `metadata/` directory is applied as one archive.

### An Ordered Collection

Use child archives when a cartridge owns several changes that must be tracked separately:

```text
cartridges/
└── int_payments/
    ├── cartridge/
    └── metadata/
        ├── 20260801T140000-add-preferences/
        │   └── meta/
        │       └── system-objecttype-extensions.xml
        └── 20260802T091500-configure-services.zip
```

Each immediate child directory or `.zip` file is one archive. Keep a cartridge's `metadata/` directory in one form—either one archive or an ordered collection—rather than mixing the two layouts.

Every directory-based archive must contain at least one file. Empty directory trees are rejected before upload because they do not form an importable archive.

## Project Migrations

Use the project-level `migrations/` directory for changes that do not belong to one cartridge or that must follow all cartridge metadata:

```text
migrations/
├── 20260803T100000-create-site-data/
│   ├── meta/
│   └── sites/
├── 20260804T160000-seed-content.zip
└── README.md
```

Each immediate child directory or `.zip` file is one archive. Hidden entries and other loose files are ignored. The directory can be omitted when cartridges provide all required archives.

## Naming Archives

Use names in this form for every ordered child archive:

```text
YYYYMMDDTHHmmss-description
```

Use UTC timestamps so ordering is consistent across time zones. Names are permanent once applied: do not modify or reuse an applied archive. Add a new archive with a later name for every subsequent change.

## Preview and Apply

Preview the complete plan without importing or changing import history:

```bash
b2c job import-set --dry-run
```

Apply pending archives:

```bash
b2c job import-set
```

Use a different project migration directory when needed:

```bash
b2c job import-set ./deployment/data-migrations
```

To ignore cartridge metadata and use only the project migration directory:

```bash
b2c job import-set --no-cartridge-metadata
```

## Post-Import Notes

When an archive needs manual follow-up, add a `README.md` or `README` at the top of its directory. After importing, the CLI groups those instructions under **Post-import notes**. A dry run previews notes for pending archives, while already-applied archives do not repeat them.

This works for directory-based archives in both cartridge `metadata/` sources and project migrations. Zip archives are not inspected for notes. With `--json`, the note is included in the archive's result instead of being printed.

## Excluding Source Directories

Exclude project directories that contain fixtures, examples, archived checkouts, or other cartridges and migration archives that must not participate in import sets. Each path is resolved from the project directory, and the directory and everything below it are ignored as import-set sources:

```bash
b2c job import-set --import-set-exclude fixtures --import-set-exclude test/integration
```

For a shared project default, commit the exclusions under the `b2c` key in `package.json`:

```json
{
  "b2c": {
    "importSetExclude": ["fixtures", "test/integration"]
  }
}
```

The equivalent `dw.json` field is `"import-set-exclude"`. You can also set `SFCC_IMPORT_SET_EXCLUDE` to a comma-separated list. A CLI flag overrides file-based configuration.

Exclusions select which directories can become import-set sources; they do not remove files from inside a selected archive.

## How Repeat Runs Behave

After an archive succeeds on an instance, later runs skip it. The archive name—not its current contents—determines whether it has already run. This makes deployments fast and repeatable, but it also means editing an applied archive can make instances diverge.

If an archive fails, the command stops. Fix the archive or target-instance problem and run the command again; earlier successful archives are skipped.

A run interrupted at exactly the wrong time can retry its current archive. Design every archive so applying it more than once is safe.

## Teams and CI/CD

The default import history is shared across developers, checkouts, and CI runners targeting the same instance. Concurrent runs coordinate automatically: one applies archives while the others wait, then waiting runs skip completed work.

This makes the command suitable for a standard deployment step:

```yaml
- name: Apply B2C metadata
  run: b2c job import-set --json
```

Use `--set-id` only when the same instance intentionally needs a separate import history. Changing a local directory path does not require a different set ID.

## Resetting Import History

There is no dedicated reset command. Choose between starting a separate history or clearing the current one.

### Start a Fresh History

Use a new set ID to leave the existing history intact while treating every current archive as pending:

```bash
b2c job import-set --set-id migrations-reset-20260818
```

Continue using that set ID on later runs. This is the recommended approach because it does not delete the previous history.

### Clear the Current History

To reuse the default `migrations` history from the beginning, remove it through WebDAV and then run the import set again:

```bash
b2c webdav rm --root=impex b2c-cli/import-sets/migrations
b2c job import-set
```

For a custom set ID, replace the final `migrations` path segment with that ID. Clearing a history permanently forgets which archives succeeded, so the next run treats every current archive as pending. Use this approach only when every archive is safe to apply again.

`--break-lock` recovers an interrupted run; it does not reset import history.

## Recovering an Interrupted Run

An inactive run becomes recoverable after 30 minutes by default. Most interruptions need no special action: wait for that window and rerun the command.

If you have confirmed that the previous process has stopped and must recover immediately, use:

```bash
b2c job import-set --break-lock
```

Do not use `--break-lock` while another import-set process might still be active.

For all command options, see the [`job import-set` CLI reference](/cli/jobs#b2c-job-import-set).
