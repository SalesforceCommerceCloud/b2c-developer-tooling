# Dependency patches

Patches in this directory are applied by pnpm via the `pnpm.patchedDependencies`
field in the root `package.json`.

## `@modelcontextprotocol__server@2.0.0.patch` - cancellation of request ID zero

The SDK's cancellation handler tests request IDs for truthiness, so it ignores
ID `0` (and the valid empty-string ID). With the 2026-07-28 protocol, the first
tool call can have ID `0`; cancelling it rejects the client promise but leaves
the server's program running. The patch checks for `undefined` instead, in both
ESM and CommonJS distributions.

The MCP bundles this dependency so npm consumers receive the patched code too.
Its `prepare-sdk-bundle.mjs` prepack step makes the hoisted dependency visible to
pnpm's bundle collector. Remove the patch, server bundling, and that prepack step
when a stable SDK release fixes this check.
`test/e2e/scapi-cancellation.test.ts` verifies actual child-process termination
over legacy and modern stdio, including a modern first-call ID of zero.

## `yargs@17.7.2.patch` — Node 26 compatibility (temporary)

**Why:** On Node 26, `c8` crashes at startup with
`ReferenceError: require is not defined in ES module scope`. `c8` does
`require('yargs/yargs')`, and yargs 17.7.2's `exports["./yargs"].require`
condition points at an **extensionless** file containing raw CommonJS. Node 26
now parses extensionless files inside a `"type": "module"` package as ESM
(nodejs/node#61600 — intentional on Node 26; the 25.x revert does not land on
26), so the `require()` call throws. This blocks running the test suite under
coverage on Node 26.

**What the patch does:** It faithfully reproduces the merged upstream fix
[yargs/yargs#2514](https://github.com/yargs/yargs/pull/2514) (fixes
[#2509](https://github.com/yargs/yargs/issues/2509)) against the 17.7.2 already
in our tree:

- adds a real `yargs.cjs` (the CommonJS entrypoint, with a `.cjs` extension so
  Node always treats it as CommonJS),
- repoints `exports["./yargs"].require` to `./yargs.cjs`,
- reduces the extensionless `yargs` file to `module.exports = require('./yargs.cjs')`
  (kept only for Node < 12.17.0, which lacks full conditional-exports support),
- adds `yargs.cjs` to the package `files` allowlist.

We patch the trusted 17.7.2 rather than pin the `17.7.3-candidate.0` prerelease,
to stay consistent with this repo's conservative dependency posture
(`minimumReleaseAge` / `trustPolicy: no-downgrade` in `pnpm-workspace.yaml`).

**Remove this patch when** either of these lands and our deps pick it up:

- a **stable** `yargs@17.7.3` is published (then the catalog/transitive range can
  resolve to it directly), or
- `c8` bumps its `yargs` dependency to a fixed release.

After removing, re-verify on Node 26 that `c8` no longer crashes, e.g.
`pnpm --filter @salesforce/b2c-tooling-sdk run test:ci`.
