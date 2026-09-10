# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Configuration mapping utilities.

Mirrors ``src/config/mapping.ts``. The single source of truth for mapping
between configuration formats (dw.json ↔ :class:`NormalizedConfig`).

Two layers of key naming are kept deliberately distinct:

- The **dw.json / package.json layer** uses camelCase keys, exactly matching the
  on-disk format the TypeScript SDK reads and writes (so files stay
  byte-for-byte interoperable). :func:`normalize_config_keys` canonicalizes raw
  kebab/camel/alias keys to that camelCase form.
- :class:`NormalizedConfig` uses snake_case attribute names (idiomatic Python).

The ``safety`` block from the TypeScript SDK is intentionally omitted here
(safety is out of scope for the Python port).
"""

from __future__ import annotations

import dataclasses
import re
from typing import Any

from b2c_tooling_sdk.auth.types import AuthConfig, AuthMethod, BasicAuthConfig, OAuthAuthConfig
from b2c_tooling_sdk.clients.tls import TlsOptions
from b2c_tooling_sdk.config.types import ConfigWarning, CreateB2CInstanceOptions, LibraryEntry, NormalizedConfig
from b2c_tooling_sdk.instance import B2CInstance, B2CInstanceOptions, InstanceConfig


def normalize_origin_url(origin: str | None) -> str | None:
    """Ensure a URL origin has an ``https://`` prefix and no trailing slash.

    Accepts bare hostnames (``cloud.mobify.com``) and full URLs. Returns ``None``
    when the input is falsy.
    """
    if not origin:
        return None
    normalized = origin
    if not normalized.startswith("http://") and not normalized.startswith("https://"):
        normalized = f"https://{normalized}"
    return re.sub(r"/+$", "", normalized)


def resolve_library_entries(libraries: list[str | LibraryEntry] | None) -> list[LibraryEntry]:
    """Normalize a ``libraries`` value to :class:`LibraryEntry` objects.

    Bare strings become ``LibraryEntry(id=..., site_library=False)``. Returns an
    empty list when the input is ``None``.
    """
    if not libraries:
        return []
    result: list[LibraryEntry] = []
    for entry in libraries:
        if isinstance(entry, str):
            result.append(LibraryEntry(id=entry, site_library=False))
        else:
            result.append(entry)
    return result


def kebab_to_camel_case(value: str) -> str:
    """Convert a kebab-case string to camelCase (``code-version`` -> ``codeVersion``)."""
    return re.sub(r"-([a-z])", lambda m: m.group(1).upper(), value)


#: Legacy/non-standard aliases that cannot be derived by kebab->camel conversion.
#: Maps alias -> canonical camelCase dw.json field name.
CONFIG_KEY_ALIASES: dict[str, str] = {
    "server": "hostname",
    "scapi-shortcode": "shortCode",
    "webdav-server": "webdavHostname",
    "secure-server": "webdavHostname",
    "secureHostname": "webdavHostname",
    "passphrase": "certificatePassphrase",
    "cartridgesPath": "cartridges",
    "cloudOrigin": "mrtOrigin",
    "selfsigned": "selfSigned",
    "oauth-scopes": "oauthScopes",
    "auth-methods": "authMethods",
    "cip-host": "cipHost",
    "api-backend": "apiBackend",
}


def normalize_config_keys(raw: dict[str, Any]) -> dict[str, Any]:
    """Normalize config keys to their canonical camelCase form.

    Resolution order per key: alias table, then kebab->camelCase conversion. The
    first value wins when multiple keys resolve to the same canonical name.
    ``None`` values are dropped (mirrors the TS ``undefined`` skip) so absent
    keys never shadow a later alias for the same canonical name.
    """
    result: dict[str, Any] = {}
    for key, value in raw.items():
        if value is None:
            continue
        canonical = CONFIG_KEY_ALIASES.get(key) or kebab_to_camel_case(key)
        if canonical not in result:
            result[canonical] = value
    return result


def _parse_cartridges(value: str | list[str] | None) -> list[str] | None:
    """Parse a cartridges value (colon/comma string, or list) to a list."""
    if value is None:
        return None
    if isinstance(value, list):
        return value if len(value) > 0 else None
    items = [s.strip() for s in re.split(r"[,:]", value)]
    items = [s for s in items if s]
    return items if items else None


def map_dw_json_to_normalized_config(json: dict[str, Any]) -> NormalizedConfig:
    """Map a (key-normalized, camelCase) dw.json config to :class:`NormalizedConfig`.

    :raises ValueError: if both ``userAuth`` and ``authMethods`` are set (they are
        mutually exclusive — ``user-auth: true`` is shorthand for
        ``"auth-methods": ["user"]``).
    """
    user_auth = json.get("userAuth")
    auth_methods_raw = json.get("authMethods")
    if user_auth is not None and auth_methods_raw is not None:
        raise ValueError(
            "dw.json: `user-auth` and `auth-methods` are mutually exclusive. "
            '`user-auth: true` is shorthand for `"auth-methods": ["user"]` — set one or the other.'
        )
    auth_methods: list[AuthMethod] | None = ["user"] if user_auth is True else auth_methods_raw

    return NormalizedConfig(
        hostname=json.get("hostname"),
        webdav_hostname=json.get("webdavHostname"),
        code_version=json.get("codeVersion"),
        username=json.get("username"),
        password=json.get("password"),
        client_id=json.get("clientId"),
        client_secret=json.get("clientSecret"),
        scopes=json.get("oauthScopes"),
        slas_client_id=json.get("slasClientId"),
        slas_client_secret=json.get("slasClientSecret"),
        site_id=json.get("siteId"),
        short_code=json.get("shortCode"),
        tenant_id=json.get("tenantId"),
        sandbox_api_host=json.get("sandboxApiHost"),
        realm=json.get("realm"),
        auto_upload=json.get("autoUpload"),
        cartridges=_parse_cartridges(json.get("cartridges")),
        import_set_exclude=json.get("importSetExclude"),
        content_library=json.get("contentLibrary"),
        catalogs=json.get("catalogs"),
        libraries=json.get("libraries"),
        asset_query=json.get("assetQuery"),
        cip_host=json.get("cipHost"),
        docs_categories=json.get("docsCategories"),
        instance_name=json.get("name"),
        auth_methods=auth_methods,
        account_manager_host=json.get("accountManagerHost"),
        mrt_project=json.get("mrtProject"),
        mrt_environment=json.get("mrtEnvironment"),
        mrt_api_key=json.get("mrtApiKey"),
        mrt_origin=json.get("mrtOrigin"),
        certificate=json.get("certificate"),
        certificate_passphrase=json.get("certificatePassphrase"),
        self_signed=json.get("selfSigned"),
        api_backend=json.get("apiBackend"),
        jwt_cert_path=json.get("jwtCertPath"),
        jwt_key_path=json.get("jwtKeyPath"),
        jwt_passphrase=json.get("jwtPassphrase"),
    )


# NormalizedConfig attribute -> dw.json camelCase key, for the reverse mapping.
_NORMALIZED_TO_DW_JSON: list[tuple[str, str]] = [
    ("hostname", "hostname"),
    ("webdav_hostname", "webdavHostname"),
    ("code_version", "codeVersion"),
    ("username", "username"),
    ("password", "password"),
    ("client_id", "clientId"),
    ("client_secret", "clientSecret"),
    ("scopes", "oauthScopes"),
    ("slas_client_id", "slasClientId"),
    ("slas_client_secret", "slasClientSecret"),
    ("site_id", "siteId"),
    ("short_code", "shortCode"),
    ("tenant_id", "tenantId"),
    ("auth_methods", "authMethods"),
    ("account_manager_host", "accountManagerHost"),
    ("auto_upload", "autoUpload"),
    ("cartridges", "cartridges"),
    ("import_set_exclude", "importSetExclude"),
    ("catalogs", "catalogs"),
    ("libraries", "libraries"),
    ("asset_query", "assetQuery"),
    ("cip_host", "cipHost"),
    ("docs_categories", "docsCategories"),
    ("mrt_project", "mrtProject"),
    ("mrt_environment", "mrtEnvironment"),
    ("mrt_origin", "mrtOrigin"),
    ("certificate", "certificate"),
    ("certificate_passphrase", "certificatePassphrase"),
    ("self_signed", "selfSigned"),
    ("api_backend", "apiBackend"),
    ("jwt_cert_path", "jwtCertPath"),
    ("jwt_key_path", "jwtKeyPath"),
    ("jwt_passphrase", "jwtPassphrase"),
    ("content_library", "contentLibrary"),
]


def _dw_json_library_value(libraries: list[str | LibraryEntry]) -> list[Any]:
    """Serialize a ``libraries`` list back to dw.json form (strings + ``{id,...}`` dicts)."""
    out: list[Any] = []
    for entry in libraries:
        if isinstance(entry, LibraryEntry):
            item: dict[str, Any] = {"id": entry.id}
            if entry.site_library:
                item["siteLibrary"] = True
            out.append(item)
        else:
            out.append(entry)
    return out


def map_normalized_config_to_dw_json(config: NormalizedConfig, name: str | None = None) -> dict[str, Any]:
    """Map a :class:`NormalizedConfig` to a dw.json (camelCase) dict.

    The reverse of :func:`map_dw_json_to_normalized_config`. Only fields with a
    non-``None`` value are included; ``name`` (if given) is written first.
    """
    result: dict[str, Any] = {}
    if name is not None:
        result["name"] = name
    for attr, dw_key in _NORMALIZED_TO_DW_JSON:
        value = getattr(config, attr)
        if value is None:
            continue
        if attr == "libraries":
            result[dw_key] = _dw_json_library_value(value)
        else:
            result[dw_key] = value
    return result


@dataclasses.dataclass
class MergeConfigOptions:
    """Options for :func:`merge_configs_with_protection`."""

    hostname_protection: bool | None = None
    client_id_protection: bool | None = None


@dataclasses.dataclass
class MergeConfigResult:
    """Result of :func:`merge_configs_with_protection`."""

    config: NormalizedConfig
    warnings: list[ConfigWarning]
    hostname_mismatch: bool
    client_id_mismatch: bool
    slas_client_id_mismatch: bool


# Fields merged field-by-field with ``overrides`` winning over ``base``.
_MERGE_FIELDS: list[str] = [
    "hostname",
    "webdav_hostname",
    "code_version",
    "username",
    "password",
    "client_id",
    # client_secret / slas_client_secret handled specially below
    "scopes",
    "slas_client_id",
    "site_id",
    "auth_methods",
    "account_manager_host",
    "short_code",
    "tenant_id",
    "auto_upload",
    "cartridges",
    "import_set_exclude",
    "content_library",
    "catalogs",
    "libraries",
    "asset_query",
    "cip_host",
    "sandbox_api_host",
    "realm",
    "instance_name",
    "project_directory",
    "working_directory",
    "mrt_project",
    "mrt_environment",
    "mrt_api_key",
    "mrt_origin",
    "certificate",
    "certificate_passphrase",
    "self_signed",
    "api_backend",
    "jwt_cert_path",
    "jwt_key_path",
    "jwt_passphrase",
]


def merge_configs_with_protection(
    overrides: NormalizedConfig,
    base: NormalizedConfig,
    options: MergeConfigOptions | None = None,
) -> MergeConfigResult:
    """Merge configs (overrides > base) with hostname/clientId mismatch protection.

    If hostname protection is enabled and the override hostname differs from the
    base hostname, the entire base config is ignored to prevent credential
    leakage between instances. If clientId protection is enabled and the override
    clientId (or slasClientId) differs from base, the corresponding stored secret
    is dropped.
    """
    options = options or MergeConfigOptions()
    warnings: list[ConfigWarning] = []
    hostname_protection = options.hostname_protection is not False
    client_id_protection = options.client_id_protection is not False

    hostname_explicit = bool(overrides.hostname)
    hostname_mismatch = hostname_explicit and bool(base.hostname) and overrides.hostname != base.hostname

    if hostname_mismatch and hostname_protection:
        warnings.append(
            ConfigWarning(
                code="HOSTNAME_MISMATCH",
                message=(
                    f'Server override "{overrides.hostname}" differs from config file '
                    f'"{base.hostname}". Config file values ignored.'
                ),
                details={"provided_hostname": overrides.hostname, "config_hostname": base.hostname},
            )
        )
        return MergeConfigResult(
            config=dataclasses.replace(overrides),
            warnings=warnings,
            hostname_mismatch=True,
            client_id_mismatch=False,
            slas_client_id_mismatch=False,
        )

    # OAuth clientId mismatch: a stored secret bound to a different client would
    # never validate, so drop the base secret.
    base_client_secret = base.client_secret
    client_id_mismatch = False
    if (
        client_id_protection
        and overrides.client_id is not None
        and base.client_id is not None
        and overrides.client_id != base.client_id
    ):
        client_id_mismatch = True
        if base.client_secret is not None:
            warnings.append(
                ConfigWarning(
                    code="CLIENT_ID_MISMATCH",
                    message=(
                        f'Client ID override "{overrides.client_id}" differs from config file '
                        f'"{base.client_id}". Ignoring stored clientSecret for the configured client.'
                    ),
                    details={"provided_client_id": overrides.client_id, "config_client_id": base.client_id},
                )
            )
        base_client_secret = None

    # Same protection for the SLAS client/secret pair.
    base_slas_client_secret = base.slas_client_secret
    slas_client_id_mismatch = False
    if (
        client_id_protection
        and overrides.slas_client_id is not None
        and base.slas_client_id is not None
        and overrides.slas_client_id != base.slas_client_id
    ):
        slas_client_id_mismatch = True
        if base.slas_client_secret is not None:
            warnings.append(
                ConfigWarning(
                    code="SLAS_CLIENT_ID_MISMATCH",
                    message=(
                        f'SLAS client ID override "{overrides.slas_client_id}" differs from config file '
                        f'"{base.slas_client_id}". Ignoring stored slasClientSecret for the configured client.'
                    ),
                    details={
                        "provided_slas_client_id": overrides.slas_client_id,
                        "config_slas_client_id": base.slas_client_id,
                    },
                )
            )
        base_slas_client_secret = None

    merged = NormalizedConfig()
    for attr in _MERGE_FIELDS:
        override_value = getattr(overrides, attr)
        merged_value = override_value if override_value is not None else getattr(base, attr)
        setattr(merged, attr, merged_value)
    merged.client_secret = overrides.client_secret if overrides.client_secret is not None else base_client_secret
    merged.slas_client_secret = (
        overrides.slas_client_secret if overrides.slas_client_secret is not None else base_slas_client_secret
    )

    return MergeConfigResult(
        config=merged,
        warnings=warnings,
        hostname_mismatch=False,
        client_id_mismatch=client_id_mismatch,
        slas_client_id_mismatch=slas_client_id_mismatch,
    )


def get_populated_fields(config: NormalizedConfig) -> list[str]:
    """Return the names of fields with non-empty values (mirrors ``getPopulatedFields``)."""
    fields: list[str] = []
    for f in dataclasses.fields(config):
        value = getattr(config, f.name)
        if value is not None and value != "":
            fields.append(f.name)
    return fields


def build_auth_config_from_normalized(config: NormalizedConfig) -> AuthConfig:
    """Build an :class:`AuthConfig` from a :class:`NormalizedConfig`."""
    auth_config = AuthConfig(auth_methods=config.auth_methods)

    if config.username and config.password:
        auth_config.basic = BasicAuthConfig(username=config.username, password=config.password)

    if config.client_id:
        auth_config.oauth = OAuthAuthConfig(
            client_id=config.client_id,
            client_secret=config.client_secret,
            scopes=config.scopes,
            account_manager_host=config.account_manager_host,
            jwt_cert_path=config.jwt_cert_path,
            jwt_key_path=config.jwt_key_path,
            jwt_passphrase=config.jwt_passphrase,
        )

    return auth_config


def create_instance_from_config(
    config: NormalizedConfig,
    options: CreateB2CInstanceOptions | None = None,
) -> B2CInstance:
    """Create a :class:`~b2c_tooling_sdk.instance.B2CInstance` from a :class:`NormalizedConfig`.

    Single source of truth for instance creation from resolved configuration —
    used by both :meth:`ResolvedConfigImpl.create_b2c_instance` and consumers such
    as CLI commands. TLS options are included only when a certificate or
    self-signed mode is configured. When ``options`` supplies a ``redirect_uri`` or
    ``open_browser``, they are injected into the OAuth config for browser flows.

    :raises ValueError: if ``config`` has no ``hostname``.
    """
    if not config.hostname:
        raise ValueError("Hostname is required. Set in dw.json or provide via overrides.")

    tls_options: TlsOptions | None = None
    if config.certificate or config.self_signed:
        tls_options = TlsOptions(
            certificate=config.certificate,
            passphrase=config.certificate_passphrase,
            reject_unauthorized=config.self_signed is not True,
        )

    instance_config = InstanceConfig(
        hostname=config.hostname,
        code_version=config.code_version,
        webdav_hostname=config.webdav_hostname,
        short_code=config.short_code,
        tenant_id=config.tenant_id,
        api_backend=config.api_backend,
        tls_options=tls_options,
    )

    auth_config = build_auth_config_from_normalized(config)

    # Inject implicit auth options into the OAuth config when present.
    if auth_config.oauth and options and (options.redirect_uri or options.open_browser):
        auth_config.oauth = dataclasses.replace(
            auth_config.oauth,
            redirect_uri=options.redirect_uri,
            open_browser=options.open_browser,
        )

    return B2CInstance(
        instance_config,
        auth_config,
        B2CInstanceOptions(oauth_strategy=options.oauth_strategy if options else None),
    )


__all__ = [
    "CONFIG_KEY_ALIASES",
    "MergeConfigOptions",
    "MergeConfigResult",
    "build_auth_config_from_normalized",
    "create_instance_from_config",
    "get_populated_fields",
    "kebab_to_camel_case",
    "map_dw_json_to_normalized_config",
    "map_normalized_config_to_dw_json",
    "merge_configs_with_protection",
    "normalize_config_keys",
    "normalize_origin_url",
    "resolve_library_entries",
]
