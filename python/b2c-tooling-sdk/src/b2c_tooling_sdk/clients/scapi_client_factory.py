# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Generic builder for SCAPI Admin API clients.

Mirrors ``src/clients/scapi-client-factory.ts``. The SCAPI clients (jobs,
scripts, merchant-users, merchant-roles, sites, catalogs, ...) each need
near-identical setup: build the HTTP client with a domain URL, install auth
middleware with merged scopes, install plugin middleware from the registry,
then rate-limit and logging. This module collapses that setup into one helper.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from b2c_tooling_sdk.auth.types import AuthStrategy
from b2c_tooling_sdk.clients._core import HttpClient
from b2c_tooling_sdk.clients.custom_apis import build_tenant_scope
from b2c_tooling_sdk.clients.middleware import (
    ScopeCascade,
    create_auth_middleware,
    create_logging_middleware,
    create_rate_limit_middleware,
    create_scapi_auth_middleware,
)
from b2c_tooling_sdk.clients.middleware_registry import (
    HttpClientType,
    MiddlewareRegistry,
    global_middleware_registry,
)
from b2c_tooling_sdk.clients.scapi_backend_utils import with_scopes


@dataclass
class BuildScapiClientOptions:
    """Domain-specific options for :func:`build_scapi_client`."""

    #: URL path segment after the SCAPI host root, e.g. ``"operation/jobs/v1"``.
    path_segment: str
    #: Middleware registry key, e.g. ``"scapi-jobs"``. Plugin middleware
    #: registered under this key gets installed on the client.
    domain_key: HttpClientType
    #: Logging/rate-limit prefix, e.g. ``"SCAPI-JOBS"``.
    log_prefix: str
    #: Per-operation scope cascade. When supplied, operations attach a
    #: ``x-b2c-scope-mode`` header (``"read"`` or ``"write"``) and the auth
    #: middleware walks the matching cascade until AM accepts one. Mutually
    #: exclusive with :attr:`default_scopes`; new domains should prefer this.
    scope_cascade: ScopeCascade | None = None
    #: Legacy: a single scope set requested for every operation. Used by domains
    #: that still rely on :class:`ScopeTierManager`. Mutually exclusive with
    #: :attr:`scope_cascade`.
    default_scopes: list[str] | None = None


@dataclass
class ScapiClientConfig:
    """Caller-supplied SCAPI coordinates and overrides."""

    short_code: str
    tenant_id: str
    #: Override the requested scopes. When omitted, defaults to
    #: ``[*default_scopes, build_tenant_scope(tenant_id)]``.
    scopes: list[str] | None = None
    #: Override the global middleware registry (mainly for tests).
    middleware_registry: MiddlewareRegistry | None = field(default=None)


def build_scapi_client(
    options: BuildScapiClientOptions,
    config: ScapiClientConfig,
    auth: AuthStrategy,
) -> HttpClient:
    """Build a typed HTTP client for a SCAPI Admin API.

    :param options: Domain-specific URL/key/scopes/log-prefix.
    :param config: Caller-supplied short code, tenant ID, optional overrides.
    :param auth: Auth strategy (scopes are merged via
        :func:`~b2c_tooling_sdk.clients.scapi_backend_utils.with_scopes`).
    :raises ValueError: if neither or both of ``scope_cascade``/``default_scopes``
        are provided.
    """
    registry = config.middleware_registry or global_middleware_registry

    if options.scope_cascade and options.default_scopes:
        raise ValueError(
            f"[build_scapi_client] {options.domain_key}: scope_cascade and default_scopes are mutually exclusive."
        )
    if not options.scope_cascade and not options.default_scopes:
        raise ValueError(
            f"[build_scapi_client] {options.domain_key}: must provide either scope_cascade or default_scopes."
        )

    client = HttpClient(
        f"https://{config.short_code}.api.commercecloud.salesforce.com/{options.path_segment}",
        client_type=options.domain_key,
    )

    if options.scope_cascade:
        # Cascade-aware path: bake the tenant scope into the auth strategy as a
        # "base scope" applied to every cascade attempt; the cascade itself only
        # varies the domain (rw/ro) scope per operation.
        tenant_base = config.scopes or [build_tenant_scope(config.tenant_id)]
        scoped_auth = with_scopes(auth, tenant_base)
        client.use(create_scapi_auth_middleware(scoped_auth, options.scope_cascade))
    else:
        # Legacy path: single static scope set requested for every operation.
        assert options.default_scopes is not None
        required_scopes = config.scopes or [*options.default_scopes, build_tenant_scope(config.tenant_id)]
        scoped_auth = with_scopes(auth, required_scopes)
        client.use(create_auth_middleware(scoped_auth))

    for middleware in registry.get_middleware(options.domain_key):
        client.use(middleware)

    client.use(create_rate_limit_middleware(prefix=options.log_prefix))
    client.use(create_logging_middleware(options.log_prefix))

    return client


__all__ = [
    "BuildScapiClientOptions",
    "ScapiClientConfig",
    "build_scapi_client",
]
