# Salesforce B2C Tooling SDK (Python)

A Python SDK for Salesforce B2C Commerce tooling — authentication, configuration
resolution, typed OCAPI/SCAPI clients, WebDAV, and higher-level operations for
code deployment, jobs, sites, catalogs, Business Manager users/roles, sandboxes,
metrics, and logs.

It is a faithful port of the
[`@salesforce/b2c-tooling-sdk`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling)
TypeScript SDK. The concepts, module layout, and public surface mirror the
TypeScript library — only the syntax is Pythonic (`async`/`await`, dataclasses,
snake_case).

!!! note "Status"
    Alpha, under active development. The public API mirrors the TypeScript SDK
    but may still change.

## The interoperability guarantee

The Python SDK shares the **same on-disk state** as the B2C CLI, byte-for-byte:

- the same persisted auth-session store (`auth-sessions.json` in the oclif data
  directory for the `@salesforce/b2c-cli` application), and
- the same configuration files (`dw.json`, `~/.mobify`, `settings.json`).

That means a token minted by the CLI (`b2c auth login`) works from Python, and a
token refreshed from Python is visible to the CLI. You can authenticate
interactively once with the CLI and then run non-interactive Python automation
against the same session. See [CLI Interoperability](cli-interop.md) for the full
story.

## Installation

> **Note:** installing from GitHub is a **temporary arrangement during
> development**. The package is not yet published to PyPI; once it is, the
> install will simply be `pip install salesforce-b2c-tooling-sdk`.

Install the latest version straight from the `python` branch — pip builds it
from source (pure Python, no compilers needed):

```bash
pip install "git+https://github.com/priandsf/b2c-developer-tooling.git@python#subdirectory=python"
```

Pin to a specific tag:

```bash
pip install "git+https://github.com/priandsf/b2c-developer-tooling.git@python-v0.1.0#subdirectory=python"
```

The importable package is `b2c_tooling_sdk`; the distribution name is
`salesforce-b2c-tooling-sdk`. Python 3.10+ is required.

## 30-second quickstart (async)

`resolve_config()` reads `dw.json` / `~/.mobify` (and any CLI-managed session),
and `create_b2c_instance()` gives you typed, authenticated clients.

```python
import asyncio

from b2c_tooling_sdk import resolve_config
from b2c_tooling_sdk.operations.code import list_code_versions


async def main() -> None:
    config = await resolve_config()
    instance = config.create_b2c_instance()

    versions = await list_code_versions(instance)
    for version in versions:
        print(version.id, "active" if version.active else "")


asyncio.run(main())
```

## Same thing, synchronously

Every public callable has a blocking twin under `b2c_tooling_sdk.sync` with an
identical signature minus `await`. Import from `b2c_tooling_sdk.sync` and drop
the `async`/`await`:

```python
from b2c_tooling_sdk.sync import resolve_config, list_code_versions

config = resolve_config()                # blocks
instance = config.create_b2c_instance()

for version in list_code_versions(instance):   # blocks
    print(version.id, "active" if version.active else "")
```

All sync calls run on one shared background event loop, so token caching and
single-flight semantics are preserved. See the [Synchronous API](sync-api.md)
guide for details and caveats.

## Where to go next

- [Authentication](authentication.md) — OAuth, JWT, PKCE, implicit, Basic, API-key
- [Configuration](configuration.md) — `resolve_config`, `dw.json`, `~/.mobify`, `settings.json`
- [Instance & Clients](instance-and-clients.md) — `B2CInstance`, OCAPI, WebDAV, SCAPI, `ClientResult`
- [Operations](operations.md) — code, jobs, sites, catalogs, users/roles, sandboxes, metrics, logs
- [Synchronous API](sync-api.md) — the blocking facade
- [SLAS Shopper Login](slas.md) — guest and registered shopper tokens
- [CLI Interoperability](cli-interop.md) — sharing sessions and config with the CLI
- [API Reference](api-reference.md) — full generated reference

## License

Apache-2.0.
