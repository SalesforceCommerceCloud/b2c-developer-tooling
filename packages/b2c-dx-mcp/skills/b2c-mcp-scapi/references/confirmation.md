# Confirmation and cancellation

- A request requiring approval retains the running program and returns MCP
  `input_required`. Let the client handle elicitation and the protocol retry;
  never manufacture approval responses or modify opaque `requestState`.
- Retries validate the original code, input, and target arguments, then resume
  the same execution. Repeated code is **not evaluated again**. Each request
  needs its own approval; a whole program is not a transaction.
- Later managed calls wait for the pending decision. Earlier writes remain
  applied. Prompts identify the organization, operation, method/path, and execution
  ID. JSON previews are redacted and capped at five lines/400 characters; marked
  truncation does not limit approval, which covers the full request.
  Results include operation outcomes; `unknown` requires
  checking the affected records before a fresh attempt.
- Decline/cancel terminates the entire execution, even if code catches errors.
  Explicitly stop work with `scapi_execute({action: "cancel", executionId, skillRead: true})`;
  omit code, input, project overrides, and protocol continuation state.
- Approval has no server deadline; waiting does not consume the active runtime
  budget. At most four executions may be active per server, including pending
  approvals. Cancel unwanted work to free a slot. Server shutdown or disconnect
  releases retained workers; state does not survive a restart. Clients may impose
  their own timeout. Duplicate responses never replay code or send a request twice.
- To change code/input/target, cancel unwanted retained work and start a fresh
  execution without continuation state. Cancellation does not roll back writes.
  Clients without form elicitation stop at confirmation-required requests.

For safety levels, rule matching, configuration precedence, and confirmation
semantics, read `docs_read({query: "guide-safety"})` when needed. If docs tools
are unavailable, use the [Safety Mode guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/safety.md).
This is an optional policy reference, not another prerequisite read.
