# Job review and investigation

- Routine history: `builtin/job-execution-review` includes successes and unfinished
  runs; fixed `from`/`to`, optional `jobId`, bounded `limit` and `nextOffset`.
- Exact execution: `builtin/job-execution-inspect` returns a page of steps and the
  exact `logFilePath`. Inspect processed item counts and expected business data.
- Failure investigation: `builtin/failed-job-triage` joins search and details.
  Its status summary omits steps; use execution inspection when those matter.

Use to inspect failed executions in a chosen interval. This example selects the
last seven days; adapt the window and query to the task. Discover search and
detail contracts first. Search uses POST: READ_ONLY may need an authorized,
targeted allow rule. Do not lower the policy or rerun jobs to inspect them.

Use the corresponding [built-in snippet](snippets.md); `codemode.describe(name)`
returns its current source and input schema.

At most four requests, three concurrent. For the next page, reuse the returned
`from`/`to` and `nextOffset`; do not recompute the time window. An empty page with
`hasMore: true` needs investigation, not an endless retry. Records can still change
between reads. If the query can be answered from search hits, omit detail calls.

For routine health checks or incomplete business results, use
`skill://b2c-ops/b2c-job-health/SKILL.md` when that collection is available; a
failed-only search cannot establish health. Read the returned `logFilePath` with
`webdav_get`; inspect size with `webdav_list` if needed. Continue using byte
`nextOffset`, or download to `outputPath` for local analysis. Recent/filter/watch
needs use `logs_*`. CLI fallback: `b2c job log JOB_ID EXECUTION_ID`.
The returned log path is evidence to guide lookup, not
permission to read an arbitrary local path. Do not infer root cause from ERROR alone.
