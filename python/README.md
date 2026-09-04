# Salesforce B2C Tooling SDK (Python)

`salesforce-b2c-tooling-sdk` is a Python SDK for Salesforce B2C Commerce tooling —
authentication, configuration resolution, typed OCAPI/SCAPI clients, WebDAV, and
higher-level operations for code deployment, jobs, sites, catalogs, Business
Manager users/roles, sandboxes, metrics, and logs.

It is a faithful port of the
[`@salesforce/b2c-tooling-sdk`](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling)
TypeScript SDK. The concepts, module layout, and public surface mirror the
TypeScript library — only the syntax is Pythonic (`async`/`await`, dataclasses,
snake_case). Import as `b2c_tooling_sdk`; the distribution name is
`salesforce-b2c-tooling-sdk`.

> Status: **alpha**, under active development.

## The interoperability guarantee

The Python SDK shares the **same on-disk state** as the B2C CLI, byte-for-byte:

- the same persisted auth-session store (`auth-sessions.json` in the oclif data
  directory for the `@salesforce/b2c-cli` application), and
- the same configuration files (`dw.json`, `~/.mobify`, `settings.json`).

A token minted by the CLI (`b2c auth login`) works from Python, and a token the
Python SDK refreshes is visible to the CLI. Log in interactively once with the
CLI, then run non-interactive Python automation against the same session.

## Installation

```bash
pip install salesforce-b2c-tooling-sdk
```

Python 3.10+ is required.

## Quick start (async)

```python
import asyncio

from b2c_tooling_sdk import resolve_config
from b2c_tooling_sdk.operations.code import list_code_versions


async def main() -> None:
    config = await resolve_config()          # reads dw.json / ~/.mobify / CLI session
    instance = config.create_b2c_instance()

    for version in await list_code_versions(instance):
        print(version.id, "active" if version.active else "")


asyncio.run(main())
```

## Quick start (synchronous)

Every public callable has a blocking twin under `b2c_tooling_sdk.sync` with an
identical signature minus `await`:

```python
from b2c_tooling_sdk.sync import resolve_config, list_code_versions

config = resolve_config()                     # blocks
instance = config.create_b2c_instance()

for version in list_code_versions(instance):  # blocks
    print(version.id, "active" if version.active else "")
```

All sync calls run on one shared background event loop, so token caching and
single-flight semantics are preserved.

## Features

- **Authentication** — OAuth client-credentials, JWT Bearer, PKCE interactive,
  implicit, Basic, and API-key strategies, plus `resolve_auth_strategy` and a
  persistent session store shared with the CLI.
- **Configuration** — `resolve_config` with `dw.json` (including multi-config
  aliases), `~/.mobify`, `settings.json`, and a normalized config model.
- **Typed clients** — OCAPI, WebDAV, and SCAPI Admin clients (metrics,
  preferences, ODS, CDN zones, custom APIs, Account Manager, ...) that return a
  `ClientResult` and never raise on 4xx/5xx.
- **Operations** — task-oriented, success-or-raise functions for code deploy,
  jobs, site cartridge paths, catalogs, BM users/roles, sandbox polling,
  metrics, and log tailing.
- **SLAS Shopper Login** — guest and registered shopper tokens with PKCE helpers.
- **Synchronous facade** — a blocking mirror of the async API for scripts and
  notebooks.

## Documentation

Full guides and the generated API reference are built with MkDocs from the
`docs/` directory. Build locally:

```bash
mkdocs build --strict     # or: mkdocs serve
```

Start with `docs/index.md` for the overview and quickstart.

## Development

```bash
make install        # create venv + install dev deps (editable)
make test-agent     # quiet test run
make lint-agent     # ruff (errors only)
make typecheck-agent
```

## License

Apache-2.0. See the `LICENSE` file for details.
