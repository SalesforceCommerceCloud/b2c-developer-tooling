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

## Start a job

Code mode can start and wait for jobs (SCAPI only); no terminal is needed. Confirm the
intent, check for an active run of the same job (`builtin/job-execution-review` with
`jobId`), and never rerun a job just to inspect it.

`createJobExecution` is `POST /operation/jobs/v1/organizations/{organizationId}/jobs/{jobId}/executions`
(scope `sfcc.jobs.rw`). The body depends on the job:

| Job kind                                                                    | Body                                        |
| --------------------------------------------------------------------------- | ------------------------------------------- |
| Custom jobs / standard steps with parameters                                | `{"parameters":[{"name":"P","value":"v"}]}` |
| `sfcc-search-index-{product,content,active-data}-{full,incremental}-update` | `{"site_scope":["SiteId"]}`                 |

System jobs do not accept `parameters`, and the bundled spec only lists `parameters`,
so it is not authoritative for them. Fields are snake_case and `site_scope` is an array
of site IDs (not an object, not camelCase). Search-index rebuild example:

```js
async () => {
  const base =
    '/operation/jobs/v1/organizations/{organizationId}/jobs/sfcc-search-index-product-full-update/executions';
  const start = await scapi.request({method: 'POST', path: base, body: {site_scope: ['MySite']}});
  if (!start.ok) return start;
  let ex = start.data;
  for (let i = 0; i < 20 && ['pending', 'running'].includes(ex.executionStatus); i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const r = await scapi.request({method: 'GET', path: base + '/' + ex.id});
    if (!r.ok) return r;
    ex = r.data;
  }
  return {id: ex.id, executionStatus: ex.executionStatus, exitStatus: ex.exitStatus, logFilePath: ex.logFilePath};
};
```

If it is still running, report the execution ID and check later with
`builtin/job-execution-inspect`. A `JobAlreadyRunningException` (400) means wait for the
active run. After an index rebuild, verify with a Shopper Search query; a new product
also needs to be online, orderable/in stock, and assigned to a category in the site catalog.
OCAPI equivalent for CLI use: same body at `POST /jobs/{job_id}/executions`
(`b2c job run ID --body '...'`).
