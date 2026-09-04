# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Generic factory for SCAPI/OCAPI dual backends.

Mirrors ``src/clients/dual-backend-factory.ts``. Replaces the per-domain
``create_*_backend()`` functions (jobs, scripts, users, roles, ...) which were
structurally identical: each supplies its SCAPI/OCAPI backend constructors and a
config, then delegates to :func:`create_dual_backend`.

- Explicit ``"ocapi"`` returns an OCAPI backend.
- Explicit ``"scapi"`` returns a SCAPI backend (raises if SCAPI config missing).
- ``"auto"`` returns a fallback wrapper that tries SCAPI first and falls back to
  OCAPI on safe capability/auth/request rejections.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Generic, TypeVar

from b2c_tooling_sdk.clients.scapi_backend_utils import (
    ApiBackendPreference,
    BackendBase,
    ResolveBackendOptions,
    resolve_scapi_or_ocapi,
)
from b2c_tooling_sdk.clients.scapi_fallback_backend import create_fallback_backend

if TYPE_CHECKING:
    from collections.abc import Callable

    from b2c_tooling_sdk.auth.types import AuthStrategy
    from b2c_tooling_sdk.instance import B2CInstance

T = TypeVar("T", bound=BackendBase)


@dataclass
class DualBackendConfig:
    """Common input shape of every dual-backend factory.

    SCAPI coordinates and the scope-flexible auth strategy are sourced from the
    instance via :attr:`B2CInstance.scapi_client_config`. A backend is
    "SCAPI-capable" iff that getter returns a value. ``preference`` is optional:
    when ``None`` it falls back to the instance's own :attr:`B2CInstance.api_backend`
    (default ``"auto"``).
    """

    instance: B2CInstance
    preference: ApiBackendPreference | None = None


@dataclass
class ScapiBackendCtorConfig:
    """Configuration passed to a SCAPI backend constructor.

    Domains may read additional data off ``instance`` (log/WebDAV access) but
    always receive ``short_code`` + ``tenant_id`` + ``auth``.
    """

    short_code: str
    tenant_id: str
    auth: AuthStrategy
    instance: B2CInstance


@dataclass
class DualBackendCtors(Generic[T]):
    """Constructors needed to build a dual-backend instance.

    Each domain plugs in its own SCAPI/OCAPI backend factories; the generic
    factory wires them together. ``scapi`` receives a :class:`ScapiBackendCtorConfig`;
    ``ocapi`` receives the :class:`B2CInstance` directly.
    """

    domain_name: str
    scapi: Callable[[ScapiBackendCtorConfig], T]
    ocapi: Callable[[B2CInstance], T]


def create_dual_backend(config: DualBackendConfig, ctors: DualBackendCtors[T]) -> T:
    """Resolve a preference + config availability into a concrete backend instance.

    :param config: The instance + optional backend preference.
    :param ctors: Per-domain SCAPI/OCAPI constructors and domain name.
    :raises ValueError: when explicit SCAPI is requested without SCAPI config.
    """
    instance = config.instance
    preference: ApiBackendPreference = config.preference or instance.api_backend
    scapi_client_config = instance.scapi_client_config
    resolved = resolve_scapi_or_ocapi(
        ResolveBackendOptions(
            preference=preference,
            has_scapi_config=scapi_client_config is not None,
            domain_name=ctors.domain_name,
        )
    )

    if resolved == "ocapi":
        return ctors.ocapi(instance)

    assert scapi_client_config is not None  # resolve_scapi_or_ocapi guarantees this for "scapi"
    scapi_backend = ctors.scapi(
        ScapiBackendCtorConfig(
            short_code=scapi_client_config.short_code,
            tenant_id=scapi_client_config.tenant_id,
            auth=scapi_client_config.auth,
            instance=instance,
        )
    )

    if preference == "scapi":
        return scapi_backend

    # Auto mode: wrap with fallback.
    ocapi_backend = ctors.ocapi(instance)
    return create_fallback_backend(scapi_backend, ocapi_backend, ctors.domain_name.lower())


__all__ = [
    "DualBackendConfig",
    "DualBackendCtors",
    "ScapiBackendCtorConfig",
    "create_dual_backend",
]
