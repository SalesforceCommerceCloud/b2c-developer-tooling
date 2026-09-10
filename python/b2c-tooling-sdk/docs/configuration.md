# Configuration

The SDK resolves configuration from the same files the B2C CLI reads, so a
`dw.json` or `~/.mobify` that works with `b2c` works unchanged from Python.

## `resolve_config`

`resolve_config` is the high-level entry point. It merges all configuration
sources and returns a rich `ResolvedConfigImpl` with validation predicates and
factory methods:

```python
from b2c_tooling_sdk import resolve_config

config = await resolve_config()

if config.has_oauth_config():
    instance = config.create_b2c_instance()  # typed, authenticated clients
    strategy = config.create_oauth()  # just the auth strategy
```

You can pass explicit overrides (a `NormalizedConfig`) and options
(`ResolveConfigOptions`):

```python
from b2c_tooling_sdk import NormalizedConfig, resolve_config

config = await resolve_config(
    NormalizedConfig(
        hostname="example.demandware.net",
        client_id="your-client-id",
        client_secret="your-client-secret",
        scopes=["sfcc.products"],
    )
)
```

### Resolution priority

From highest to lowest precedence:

1. Explicit `overrides`
2. `options.sources_before`
3. Default sources — `dw.json`, `~/.mobify`, `package.json`
4. `options.sources_after`
5. Globally-registered sources

Later sources only fill in values that earlier ones left unset. A
hostname-mismatch guard prevents accidentally mixing credentials that belong to
different instances. Set `options.replace_default_sources=True` to omit the
default sources entirely.

## `dw.json`, aliases, and multi-config selection

`dw.json` is discovered by walking up from the working directory
(`find_dw_json`) and loaded with `load_dw_json`. The file may hold a single
instance or a multi-instance document with named configurations
(`configs` / an active alias). Use the lower-level helpers when you need to
manage the file directly:

```python
from b2c_tooling_sdk.config import (
    find_dw_json,
    load_dw_json,
    load_full_dw_json,
    add_instance,
    set_active_instance,
    save_dw_json,
)

path = find_dw_json()  # nearest dw.json, walking up
single = load_dw_json(path)  # the active/only configuration
full = load_full_dw_json(path)  # the whole multi-config document
```

`set_active_instance` selects which named alias resolution should use, and
`add_instance` / `remove_instance` maintain the set of named configurations.

## `~/.mobify`

The `~/.mobify` file (Mobify/PWA-Kit credentials) is a default source, so its
values are folded into `resolve_config` automatically at the appropriate
precedence. No extra wiring is required.

## `settings.json`

CLI settings (the `settings.json` in the B2C config directory) are read and
written with dedicated helpers, and share the same directory the CLI uses:

```python
from b2c_tooling_sdk.config import (
    get_b2c_config_directory,
    get_b2c_settings_path,
    read_b2c_settings,
    write_b2c_settings,
)

print(get_b2c_settings_path())
settings = read_b2c_settings()
```

## `NormalizedConfig`

`NormalizedConfig` is the canonical intermediate format every source maps to,
regardless of on-disk shape (dw.json kebab/camelCase, environment variables,
etc.). It carries snake_case fields for instance coordinates (`hostname`,
`webdav_hostname`, `code_version`), Basic auth (`username`, `password`), OAuth
(`client_id`, `client_secret`, `scopes`, `auth_methods`, `account_manager_host`),
JWT (`jwt_cert_path`, `jwt_key_path`, `jwt_passphrase`), SCAPI (`short_code`,
`tenant_id`), SLAS, ODS, MRT, TLS, and more. Pass one as `overrides` to
`resolve_config`, or build an instance directly from it.

## From config straight to an instance

`create_instance_from_config` (or `ResolvedConfigImpl.create_b2c_instance`) turns
resolved configuration into a ready-to-use `B2CInstance`:

```python
from b2c_tooling_sdk import create_instance_from_config, NormalizedConfig

instance = create_instance_from_config(
    NormalizedConfig(
        hostname="example.demandware.net",
        client_id="your-client-id",
        client_secret="your-client-secret",
    )
)
```

See [Instance & Clients](instance-and-clients.md) for what you can do with the
returned instance.

## API reference

See the [config section of the API reference](api-reference.md#configuration).
