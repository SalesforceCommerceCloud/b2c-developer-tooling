# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Configuration types for the B2C SDK.

Mirrors ``src/config/types.ts``. Defines the canonical normalized configuration
format (:class:`NormalizedConfig`) that every configuration source maps to, plus
the interfaces used by the resolution system.

The ``safety`` block from the TypeScript SDK is intentionally omitted from this
port (the safety-middleware policy layer is out of scope).
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Literal, Protocol, TypeAlias, TypeVar, Union, runtime_checkable

from b2c_tooling_sdk.auth.types import AuthMethod

if TYPE_CHECKING:
    from b2c_tooling_sdk.auth.types import AuthStrategy

_T = TypeVar("_T")

#: A value that may be returned synchronously or as an awaitable. Config sources
#: may implement ``load`` either way; the resolver normalizes both with ``await``.
MaybePromise: TypeAlias = Union[_T, Awaitable[_T]]  # noqa: UP007


@dataclass
class LibraryEntry:
    """A configured content library entry.

    The simpler ``str`` form (an ID alone) is equivalent to
    ``LibraryEntry(id=..., site_library=False)``.
    """

    id: str
    #: True if this library is site-private (lookup uses the site-library API).
    site_library: bool = False


@dataclass
class NormalizedConfig:
    """Normalized B2C configuration with snake_case fields.

    The canonical intermediate format that all configuration sources map to,
    regardless of their on-disk format (dw.json kebab/camelCase, env vars, etc.).
    """

    # Instance fields
    hostname: str | None = None
    webdav_hostname: str | None = None
    code_version: str | None = None

    # Auth fields (Basic)
    username: str | None = None
    password: str | None = None

    # Auth fields (OAuth)
    client_id: str | None = None
    client_secret: str | None = None
    scopes: list[str] | None = None
    auth_methods: list[AuthMethod] | None = None
    account_manager_host: str | None = None

    # Auth fields (JWT Bearer)
    jwt_cert_path: str | None = None
    jwt_key_path: str | None = None
    jwt_passphrase: str | None = None

    # SLAS Shopper
    slas_client_id: str | None = None
    slas_client_secret: str | None = None
    site_id: str | None = None

    # SCAPI
    short_code: str | None = None
    tenant_id: str | None = None

    # ODS (On-Demand Sandbox)
    sandbox_api_host: str | None = None
    realm: str | None = None

    # MRT fields
    mrt_project: str | None = None
    mrt_environment: str | None = None
    mrt_api_key: str | None = None
    mrt_origin: str | None = None

    # Code upload
    auto_upload: bool | None = None

    # Cartridges
    cartridges: list[str] | None = None
    import_set_exclude: list[str] | None = None

    # Content
    content_library: str | None = None
    catalogs: list[str] | None = None
    libraries: list[str | LibraryEntry] | None = None
    asset_query: list[str] | None = None

    # CIP
    cip_host: str | None = None

    # Docs
    docs_categories: list[str] | None = None

    # Metadata
    instance_name: str | None = None
    project_directory: str | None = None
    #: Deprecated: use :attr:`project_directory` instead.
    working_directory: str | None = None

    # TLS/mTLS
    certificate: str | None = None
    certificate_passphrase: str | None = None
    self_signed: bool | None = None

    # API backend
    api_backend: Literal["ocapi", "scapi", "auto"] | None = None


#: Warning codes for configuration resolution.
ConfigWarningCode = Literal[
    "HOSTNAME_MISMATCH",
    "CLIENT_ID_MISMATCH",
    "SLAS_CLIENT_ID_MISMATCH",
    "DEPRECATED_FIELD",
    "MISSING_REQUIRED",
    "SOURCE_ERROR",
]


@dataclass
class ConfigWarning:
    """A warning generated during configuration resolution."""

    code: ConfigWarningCode
    message: str
    details: dict[str, Any] | None = None


@dataclass
class ConfigCatalogFile:
    """A dw.json file participating in the effective instance catalog."""

    location: str
    scope: Literal["global", "primary"]
    selected: bool


@dataclass
class ConfigSourceInfo:
    """Information about a configuration source that participated in resolution."""

    name: str
    fields: list[str]
    scope: Literal["global"] | None = None
    location: str | None = None
    fields_ignored: list[str] | None = None
    instance_catalog: list[ConfigCatalogFile] | None = None


@dataclass
class ConfigResolutionResult:
    """Result of configuration resolution."""

    config: NormalizedConfig
    warnings: list[ConfigWarning]
    sources: list[ConfigSourceInfo]


@dataclass
class ConfigLoadResult:
    """Result of loading configuration from a single source."""

    config: NormalizedConfig
    scope: Literal["global"] | None = None
    instance_catalog: list[ConfigCatalogFile] | None = None
    location: str | None = None


@dataclass
class InstanceInfo:
    """Information about a configured instance."""

    name: str
    source: str
    hostname: str | None = None
    active: bool | None = None
    location: str | None = None


@dataclass
class CreateInstanceOptions:
    """Options for creating an instance in a dw.json-style source.

    Flattens the TypeScript ``CreateInstanceOptions & ResolveConfigOptions``
    intersection: it carries the instance ``name``/``config`` plus the subset of
    resolution fields a dw.json source needs to locate the target file.
    """

    name: str
    config: NormalizedConfig
    set_active: bool = False
    config_path: str | None = None
    project_directory: str | None = None
    working_directory: str | None = None
    default_config_path: str | None = None


@dataclass
class CreateOAuthOptions:
    """Options for creating an OAuth auth strategy."""

    allowed_methods: list[AuthMethod] | None = None
    scopes: list[str] | None = None
    redirect_uri: str | None = None
    open_browser: Callable[[str], Awaitable[None]] | None = None


@dataclass
class CreateB2CInstanceOptions:
    """Options for constructing a B2C instance from resolved configuration."""

    redirect_uri: str | None = None
    open_browser: Callable[[str], Awaitable[None]] | None = None
    #: Pre-resolved OAuth strategy, or a lazy factory for one.
    oauth_strategy: AuthStrategy | Callable[[], AuthStrategy] | None = None


@dataclass
class ResolveConfigOptions:
    """Options for configuration resolution."""

    instance: str | None = None
    config_path: str | None = None
    default_config_path: str | None = None
    project_directory: str | None = None
    working_directory: str | None = None
    hostname_protection: bool | None = None
    client_id_protection: bool | None = None
    cloud_origin: str | None = None
    credentials_file: str | None = None
    account_manager_host: str | None = None
    sources_before: list[ConfigSource] | None = None
    sources_after: list[ConfigSource] | None = None
    replace_default_sources: bool = False


@runtime_checkable
class ConfigSource(Protocol):
    """A configuration source that can contribute config values.

    Implement this protocol to create custom configuration sources. The required
    surface is ``name`` and ``load``. Sources may optionally implement the
    instance-management and credential-storage methods; consumers probe for them
    with ``getattr`` / ``hasattr`` at runtime.
    """

    #: Human-readable name for diagnostics.
    name: str

    def load(self, options: ResolveConfigOptions) -> MaybePromise[ConfigLoadResult | None]:
        """Load configuration from this source (may be sync or async)."""
        ...


def source_priority(source: ConfigSource) -> int:
    """Return a source's priority (lower = higher priority; default 0)."""
    return int(getattr(source, "priority", 0) or 0)


__all__ = [
    "MaybePromise",
    "LibraryEntry",
    "NormalizedConfig",
    "ConfigWarningCode",
    "ConfigWarning",
    "ConfigCatalogFile",
    "ConfigSourceInfo",
    "ConfigResolutionResult",
    "ConfigLoadResult",
    "InstanceInfo",
    "CreateInstanceOptions",
    "CreateOAuthOptions",
    "CreateB2CInstanceOptions",
    "ResolveConfigOptions",
    "ConfigSource",
    "source_priority",
]
