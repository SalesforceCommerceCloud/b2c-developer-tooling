# SCAPI confirmation spike: manual checks

## Start the local server

Build the SDK and MCP, then configure your MCP client to run the local build:

```sh
pnpm --filter @salesforce/b2c-tooling-sdk run build:esm
pnpm --filter @salesforce/b2c-dx-mcp run build
node /absolute/path/to/repo/packages/b2c-dx-mcp/bin/run.js --project-directory /absolute/path/to/test-project --tools scapi_search,scapi_execute,config_inspect,skills_read --log-level debug
```

Use a test project's existing `dw.json` with a sandbox target, Account Manager
credentials, short code, tenant ID, and site ID where required. Add or replace
only its `safety` object for each scenario. Confirm the selected target through
`config_inspect`. Global safety files and launch/project environment values also
apply: review these when the effective behavior differs from the examples.

Read `skill://mcp/scapi/SKILL.md` and use `skillRead: true` on code-mode calls.
The shared policy reference is `docs_read({query: "guide-safety"})`, or
[Safety Mode](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/safety.md).

The client must support form elicitation. Both current MCP `input_required`
and legacy `elicitation/create` are supported through the SDK compatibility
bridge. A generic tool-approval dialog is separate from Safety Mode approval.

## First test: confirmation with reads only

Use an existing product ID and the appropriate product read scope. Explicit
`confirm` rules can apply to GET, so testing approval does not require writes:

```json
{
  "safety": {
    "level": "READ_ONLY",
    "rules": [
      {
        "method": "GET",
        "path": "/product/products/v1/organizations/*/products/*",
        "action": "confirm"
      }
    ]
  }
}
```

Pass `input: {"productId": "YOUR_EXISTING_PRODUCT_ID"}` with this code:

```js
async (input) => {
  const startedAt = new Date().toISOString();
  const path = '/product/products/v1/organizations/{organizationId}/products/' + encodeURIComponent(input.productId);
  const first = await scapi.request({method: 'GET', path});
  const second = await scapi.request({method: 'GET', path});
  return {
    startedAt,
    first: {status: first.status, id: first.data?.id},
    second: {status: second.status, id: second.data?.id},
  };
};
```

Expected: two distinct approval prompts; each shows the resolved target,
operation, execution ID, and cancellation instructions. Approve each. The final result contains
two completed operation records and the original `startedAt`. Debug logs show
one worker start for the entire program, including its approval round trips.
The client retries the same arguments with protocol state automatically; do
not ask the model to synthesize approval responses or reissue the program.

Repeat with these decisions:

| Situation                                                                   | Expected result                                                                                             |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Decline the first prompt                                                    | Execution ends with `SCAPI_APPROVAL_DECLINED`; no product request is sent.                                  |
| Accept the first, decline the second                                        | First read completes; second is `not_sent`; the execution is cancelled.                                     |
| Leave the prompt unanswered for over ten minutes or overnight, then approve | Execution resumes once, provided the server stayed connected and the client did not impose its own timeout. |
| Spend over 30 seconds answering each prompt                                 | Execution still works: approval waits do not consume the active runtime budget.                             |
| Restart/disconnect the server while the prompt is open                      | Worker is released; the old continuation cannot start new code.                                             |
| Use a client without form elicitation                                       | `SCAPI_CONFIRMATION_UNSUPPORTED`; no product request is sent.                                               |

## Explicit cancellation

While a prompt is open, copy its execution ID and issue a separate tool call:

```json
{
  "action": "cancel",
  "executionId": "EXECUTION_ID_FROM_PROMPT",
  "skillRead": true
}
```

Call `scapi_execute` with these arguments; omit code, input, project overrides,
and protocol continuation state. Expected: cancellation and the operations
already attempted. Repeat cancellation: it returns the retained terminal
result. Accepting the old prompt afterwards cannot send its request.

Some clients prevent another call while an approval dialog is open; test this
with an MCP client/inspector that supports concurrent calls if necessary.

## Multiple calls submitted together

With the GET confirmation policy above, replace the two sequential awaits with:

```js
const [first, second] = await Promise.all([scapi.request({method: 'GET', path}), scapi.request({method: 'GET', path})]);
```

Expected: two separate approvals. Approving the first does not approve the
second, even though method, URL, query, and body are identical. The spike
serializes managed API and token calls; later calls wait behind the prompt.

## Write confirmation and partial completion

Use a disposable sandbox catalog and unique, previously absent product IDs.
Discover/describe `builtin/create-product` first; it checks existence, creates
an offline product, and verifies the result. It requires product write access.

```json
{"safety": {"level": "READ_ONLY", "confirm": true}}
```

Run this with `input` containing `catalogId`, `firstId`, and `secondId`:

```js
async (input) => {
  const first = await codemode.run('builtin/create-product', {
    catalogId: input.catalogId,
    productId: input.firstId,
    offline: true,
  });
  if (first.state !== 'verified') return {first};
  const second = await codemode.run('builtin/create-product', {
    catalogId: input.catalogId,
    productId: input.secondId,
    offline: true,
  });
  return {first, second};
};
```

Expected: reads proceed; each product PUT needs its own approval. Approve the
first and decline the second. Inspect both IDs with fresh GET calls: the first
exists and the second does not. Nothing rolls back the first product. Review
the operations in the cancellation result before deciding what to run next.
Remove disposable records only when you explicitly intend to clean them up;
deletion itself follows Safety Mode.

## Hard block and narrow exception

Repeat a create attempt with this configuration:

```json
{
  "safety": {
    "level": "READ_ONLY",
    "confirm": true,
    "rules": [{"method": "PUT", "action": "block"}]
  }
}
```

Expected: PUT is blocked without an approval prompt. Confirmation mode does
not override an explicit block.

For a narrow exception, place an `allow` rule for one exact test product path
before that block rule. Only that path can be written without prompting;
another product path remains blocked. Match the resolved organization ID.

## Protocol and lifecycle checks

The automated fixtures use mocked or disabled network access:

```sh
pnpm --filter @salesforce/b2c-dx-mcp exec mocha --reporter min test/tools/scapi/scapi-confirmation.test.ts
pnpm --filter @salesforce/b2c-dx-mcp exec mocha --reporter min test/e2e/scapi-confirmation.test.ts test/e2e/scapi-cancellation.test.ts
pnpm --filter @salesforce/b2c-tooling-sdk exec mocha --reporter min test/scapi/confirmation.test.ts
```

The handler tests exercise changed code/input/target rejection, altered and
cross-server continuation tokens, duplicate approval retries, long approval waits, capacity,
and shutdown. Stdio tests exercise both protocol versions and verify that
variables survive repeated prompts. Retries are transport-level protocol
requests, not `code` that the agent should construct.

Limits for this spike: four active executions per server (including pending
approvals), 30 seconds active runtime, and 20 helper calls per execution. Approval
waits have no server deadline or total-lifetime limit; cancel unwanted executions
to release their slots. The server's legacy bridge permits 20 approval rounds;
clients may impose a smaller retry budget or shorter timeout. Retained state
belongs to one stdio server and does not survive a restart. Keep successful or
failed terminal results only for the last 50 executions to deduplicate retries.

The bundled MCP SDK patch adds `roundTimeoutMs: 0` support to disable the legacy
bridge's approval timer. The server uses this setting; native `input_required`
continuations have no server timer either. Client timeouts remain client-owned.
The regression tests advance a fake clock by seven days before approving or
cancelling, without waiting seven days in real time.
