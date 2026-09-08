# Testing MCP skills with an isolated Codex setup

From a checkout with dependencies installed, prepare an isolated installation:

```bash
pnpm --filter @salesforce/b2c-dx-mcp run prepare:guidance-test
```

This builds and packs the SDK and MCP, installs both tarballs outside the
repository (reusing the package cache where possible), runs an offline stdio smoke test,
and prints the test directory. It creates a fresh Codex configuration and an
empty workspace. It does not copy credentials or launch a model session.

Use the printed absolute directory for these commands:

```bash
export B2C_MCP_TEST_ROOT=/absolute/path/printed/by/the/script
CODEX_HOME="$B2C_MCP_TEST_ROOT/codex-home" codex login
CODEX_HOME="$B2C_MCP_TEST_ROOT/codex-home" codex -C "$B2C_MCP_TEST_ROOT/workspace"
```

The test configuration uses file-based Codex credential storage, so logging in
does not replace a shared keychain credential. Keep the directory private and
remove it when finished. A separate `CODEX_HOME` isolates user configuration,
history, and installed plugins; the empty workspace avoids this repository's
project instructions. Machine-managed settings and skills in other discovery
locations can still apply. Check `/mcp` and `/skills` in the test session.

The initial MCP configuration enables only `skills_read`. That makes this a
credential-free skills test. To evaluate tool choice alongside the normal
catalog, edit the generated `config.toml`: remove `"--tools", "skills_read"`
from the arguments. All toolsets are enabled by default. Restart the Codex session afterward. Tools that need
instance credentials will require a separately configured test sandbox before
they can run.

Try these prompts in fresh conversations:

1. "Use the B2C MCP to find guidance for deploying cartridges. Read the relevant
   workflow and explain the prerequisites. Do not deploy anything."
2. "Find the debugger workflow. Explain when to use MCP versus CLI and how to
   clean up a debugger session. Do not connect to an instance."
3. "Find Storefront Next guidance for adding a component. Read only the relevant
   entrypoint and reference section."
4. "Read `mcp/server` through MCP resources, then through `skills_read`.
   Compare the results."
5. "This MCP was installed with only the MRT toolset. Explain how to enable
   configuration inspection and debugging while keeping MRT. Check the current
   client registration if accessible, but do not change it yet."

Look for short discovery calls, correct exact IDs, selective reference reads,
and appropriate CLI/MCP preferences. The agent should not load the entire
catalog's prose. Resource listings should contain `skill-index`, `mcp/server`,
`mcp/b2c-config`, and `mcp/debugger`. Read `skill://index` to discover the full catalog, then read
one relevant linked skill URI that is not individually listed. All skills remain
available through `skills_read` by collection, query, or ID. Both readers should
return identical skill text. No skill acknowledgment gate is active at this checkpoint.

With `--tools config_inspect`, verify the same top-level resources remain readable,
the index lists only `mcp` entries, and shared collection URIs are unavailable.
With `skills_read` selected, all collections should be discoverable and readable.
Configuration warnings, unmapped breakpoints, and capture timeouts should include
`skillReferences` to applicable sections; routine clean inspection should not.

For source iteration, configure Node with arguments `--conditions`, `development`,
and the absolute path to `packages/b2c-dx-mcp/bin/dev.js`. Launch Codex in your
test project; no separate package installation is needed. Restart MCP after
source edits. After skill edits, run
`pnpm --filter @salesforce/b2c-dx-mcp run generate:guidance` before restarting.
Use the tarball preparation to assess release packaging.

The isolation and configuration instructions follow the official OpenAI docs:
[Codex configuration and state](https://developers.openai.com/codex/config-advanced/),
[MCP configuration](https://developers.openai.com/codex/mcp/), and
[authentication](https://developers.openai.com/codex/auth/).
