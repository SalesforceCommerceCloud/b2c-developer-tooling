# Job execution logs

Use `logFilePath` from the selected execution, not a guessed file or only its
status. `builtin/job-execution-inspect` returns the exact path and step details.
`webdav_get` accepts Sites-relative paths and returned `/Sites/LOGS/...` paths.
Use `webdav_list` on the parent directory for sizes when needed.

Read a bounded byte range; reuse `nextOffset` to preserve UTF-8 boundaries.
`size` is total bytes, not characters. Null continuation means end; a few pages
do not establish whole-file or interval coverage. Files may grow/rotate between
reads. Download to a new `outputPath` for local analysis of a large file.

For recent parsed entries or ongoing watches, use `logs_get_recent` / `logs_watch`.
These tools parse and filter; an empty result does not prove an empty raw log.
Use `webdav_get` when parsing loses useful context. CLI alternative when needed:
`b2c job log JOB_ID EXECUTION_ID`, preserving the selected instance.

Never run the job just to obtain its previous log. A deleted/expired log, missing
path, permission failure, and no matching recent parsed entries are different
outcomes. Preserve the error and suggest the smallest next check. If no file is
available, request the selected execution's log from Business Manager.
