# Import Site Archives

### Import Site Archives

The `job import` command waits for the import job to complete by default. The same command imports a **job definition** (`jobs.xml` at the archive root) that registers a new runnable job on the instance — for the `jobs.xml` structure (job/flow/step, step `type`, the required `<triggers>` element), see the [jobs.xml Reference](../../../../b2c/skills/b2c-custom-job-steps/references/JOBS-XML.md).

```bash
# import a local directory as a site archive (waits for completion by default)
b2c job import ./my-site-data

# import a local zip file
b2c job import ./export.zip

# import and return immediately without waiting for completion
b2c job import ./my-site-data --no-wait

# keep the archive on the instance after import
b2c job import ./my-site-data --keep-archive

# import an archive that already exists on the instance (in Impex/src/instance/)
b2c job import existing-archive.zip --remote

# show job log on failure
b2c job import ./my-site-data --show-log

# import only a subset of a directory (extra positionals are paths/globs
# resolved against the directory; preserves layout inside the archive)
b2c job import ./my-site-data sites/RefArch libraries/mylib
b2c job import ./my-site-data 'libraries/**'
```

### Import Sets

`job import-set` first applies site import/export archives from discovered cartridge `metadata/` sources, then applies archives in `./migrations`, and skips archives already recorded on the target instance:

```bash
b2c job import-set --dry-run
b2c job import-set
b2c job import-set --no-cartridge-metadata # only use ./migrations
b2c job import-set --import-set-exclude fixtures # ignore this project subtree
```

`--import-set-exclude` can be repeated or comma-separated and can also be configured as `b2c.importSetExclude` in `package.json`, `import-set-exclude` in `dw.json`, or `SFCC_IMPORT_SET_EXCLUDE`. For the full migration workflow — archive layouts, timestamp naming, post-import README notes, retry behavior, reset options, concurrency, and recovery — use the `b2c-cli:b2c-import-set-migrations` skill.
