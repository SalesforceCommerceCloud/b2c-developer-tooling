# Failed-job triage with continuation

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

Read logs only for executions that need diagnosis, using dedicated log tools
outside this function. The returned log path is evidence to guide lookup, not
permission to read an arbitrary local path. Do not infer root cause from ERROR alone.
