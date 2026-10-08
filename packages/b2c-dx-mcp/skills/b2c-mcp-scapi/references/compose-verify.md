# Compose and verify

- Pass the execution `projectDirectory`; reuse resolved `organizationId`/`siteId`.
  Encode path IDs. `{organizationId}` placeholders resolve automatically.
- Compose dependent calls with intermediate results and local helpers.
  Pause for unresolved intent or contracts.
- Sequence dependent writes; batch independent reads at most four at a time.
  Await all requests. Map rejections to `{id, error: String(error)}`;
  raw `Promise.allSettled()` reasons lose Error details in JSON.
- PUT can create or update: check existence and intent; read back writes.
- Check `ok`/`status`: HTTP errors return; transport/auth/safety failures throw.
  Preserve completed writes and failed stages. Check writes before retrying;
  no program replay or automatic cleanup deletion.
- Filter/page at the API, then project/aggregate in code. Include IDs, verification
  fields, errors, totals, and continuation inputs. Do not crop away missing data.
- Limits: 20 calls, four outstanding, 30 seconds of active execution, 24 KB returned.
  Managed API/token calls are serialized within an execution. Narrow oversized
  discovery; reduce live pages/projections.
- SDK safety applies per request, including POST searches. Use only authorized
  targeted exceptions. Confirmation uses client elicitation; see below. Code mode does not
  transfer binaries; use WebDAV tools for instance files, an external client for
  binary SCAPI endpoints.
- `fetch` and `WebSocket` are disabled. Use `scapi.request()` inside programs;
  direct HTTP belongs in an external client, outside MCP Safety Mode. Do not use
  imports or other Node networking APIs to bypass this boundary.
