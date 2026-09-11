# Job execution logs

Use the log path from the selected execution, not a guessed file or only the
job's current status. `logs_list_files` and `logs_get_recent` accept nested path
filters relative to `Logs/`. For `Logs/jobs/example/exec.log`, pass
`prefixes: ["jobs/example/exec.log"]`; do not invent a path if the execution lacks one.
Top-level discovery does not enumerate every subdirectory. A path prefix lists
the selected directory; it is not a recursive search of all job logs.
For a top-level file, use its returned `prefix`, not its full filename: filters
without `/` match categories. If multiple executions share that category, use
the execution's time/correlation IDs or the CLI's exact execution-log read.

Start with `count: 20` and a relevant `search`/`since` filter. Recent-log tools
parse and bound the fetched entries before returning matches. They do not prove
coverage of a whole file or historical interval. Missing directory/access errors
can currently appear as an empty listing; do not interpret that as a healthy job.

If the execution log is unavailable or parsing loses useful context, use terminal
access with `b2c job log JOB_ID EXECUTION_ID`, preserving the selected
instance. Consult `--help` before adding flags. Save long output locally and
extract only the pertinent step/error context. Raw WebDAV download is another
CLI option when the exact path is known. Without terminal access, report the
missing evidence and ask for the selected execution's job log from Business Manager.

Never run the job just to obtain its previous log. A deleted/expired log, missing
path, permission failure, and no matching recent parsed entries are different
outcomes. Preserve the error and suggest the smallest next check.
