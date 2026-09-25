# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Shared utilities for SCAPI/OCAPI dual-backend domains.

Mirrors ``src/clients/scapi-backend-utils.ts``. Each domain that supports both
OCAPI (legacy) and SCAPI (modern) shares these utilities to keep behavior
consistent: backend preference resolution, scope-error detection, and the
canonical :data:`ApiBackendPreference` type.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal, Protocol, runtime_checkable

from b2c_tooling_sdk.auth.types import AuthStrategy
from b2c_tooling_sdk.clients.error_utils import get_api_error_message


@runtime_checkable
class BackendBase(Protocol):
    """Common base for every SCAPI/OCAPI dual backend.

    Mirrors the TypeScript ``BackendBase`` interface: a backend exposes a
    ``name`` identifying which transport it speaks so the fallback wrapper can
    report the currently-active backend.
    """

    @property
    def name(self) -> Literal["ocapi", "scapi"]:
        """Which transport this backend speaks."""
        ...


#: User-facing API backend preference.
#:
#: - ``"ocapi"``: force OCAPI (always use the legacy Data API).
#: - ``"scapi"``: force SCAPI (requires shortCode + tenantId; fails loudly if scopes missing).
#: - ``"auto"``: prefer SCAPI when configured, with temporary safe OCAPI fallback.
ApiBackendPreference = Literal["ocapi", "scapi", "auto"]

#: Platform release used when documenting currently-unavailable SCAPI capabilities.
SCAPI_CAPABILITY_BASELINE_RELEASE = "26.8"

#: HTTP statuses that prove SCAPI rejected a request before performing it.
#:
#: These are safe for the temporary ``auto`` compatibility mode to retry over
#: OCAPI. Ambiguous responses (``429``, ``5xx``) and network failures are
#: excluded because a mutating request might already have reached the platform.
SAFE_SCAPI_FALLBACK_STATUSES: frozenset[int] = frozenset({400, 401, 403, 404, 405, 406, 415})


class ScapiUserAuthUnsupportedError(Exception):
    """Raised when browser-based Account Manager user auth is passed to a SCAPI Admin client."""

    def __init__(self) -> None:
        super().__init__(
            "SCAPI Admin APIs do not currently support browser user authentication as of "
            f"B2C Commerce release {SCAPI_CAPABILITY_BASELINE_RELEASE}. "
            'Use client credentials or JWT Bearer authentication, or set apiBackend to "ocapi" '
            "(CLI: --api-backend ocapi) for now. The tooling will be updated when SCAPI support "
            "becomes available."
        )


def assert_scapi_admin_auth_supported(auth: AuthStrategy) -> None:
    """Reject browser user-auth strategies before a SCAPI request is attempted."""
    auth_method = getattr(auth, "auth_method", None)
    if auth_method in ("user", "implicit"):
        raise ScapiUserAuthUnsupportedError()


def with_scopes(auth: AuthStrategy, additional_scopes: list[str]) -> AuthStrategy:
    """Return a copy of ``auth`` with ``additional_scopes`` merged in.

    Falls back to the original ``auth`` if the strategy doesn't support scope
    merging (e.g. basic/api-key auth, or a stored-session strategy where scopes
    were fixed at acquisition). Centralized so SCAPI client factories don't have
    to keep extending an ``isinstance`` chain as new OAuth strategy types are added.
    """
    assert_scapi_admin_auth_supported(auth)
    merge = getattr(auth, "with_additional_scopes", None)
    if callable(merge):
        return merge(additional_scopes)  # type: ignore[no-any-return]
    return auth


def is_invalid_scope_error(error: object) -> bool:
    """Detect an Account Manager ``invalid_scope`` error.

    When a client's API client doesn't have the requested scope configured,
    Account Manager returns ``{"error":"invalid_scope", ...}`` on the token
    request. The OAuth strategy surfaces that as an exception whose message
    contains ``invalid_scope``. Used by fallback wrappers to decide whether to
    downgrade to OCAPI.
    """
    return isinstance(error, BaseException) and "invalid_scope" in str(error)


class ScapiCapabilityUnsupportedError(Exception):
    """Raised when a requested operation cannot be expressed on SCAPI.

    For example, toggling the ``disabled`` flag via the SCAPI Users PATCH, which
    the SCAPI schema does not include. The fallback wrapper recognizes this and
    falls back to OCAPI; in explicit ``scapi`` mode it propagates so the caller
    sees the limitation.
    """


def scapi_capability_unsupported_message(capability: str) -> str:
    """Build the canonical error message for a capability absent from live SCAPI schemas."""
    return (
        f"SCAPI does not currently support {capability} as of B2C Commerce release "
        f"{SCAPI_CAPABILITY_BASELINE_RELEASE}. "
        'Set apiBackend to "ocapi" (CLI: --api-backend ocapi) for now. '
        "The tooling will be updated when SCAPI support becomes available."
    )


def assert_ocapi_compatibility_allowed(preference: ApiBackendPreference | None, capability: str) -> None:
    """Prevent an OCAPI-only compatibility operation from running under explicit SCAPI.

    ``auto`` remains eligible for the temporary compatibility path, while
    explicit OCAPI is always allowed.
    """
    if preference == "scapi":
        raise ScapiCapabilityUnsupportedError(scapi_capability_unsupported_message(capability))


class ScapiRequestError(Exception):
    """A structured SCAPI response failure.

    Backends must retain the response ``status`` so the shared fallback policy
    can distinguish a definite rejection from an ambiguous transport/server
    failure.
    """

    def __init__(self, message: str, status: int, *, cause: object = None) -> None:
        super().__init__(message)
        self.status = status
        if isinstance(cause, BaseException):
            self.__cause__ = cause


def create_scapi_request_error(
    error: object,
    response: Any,
    fallback_message: str,
) -> ScapiRequestError:
    """Create a structured SCAPI error using the repository's common formatter.

    :param response: An object exposing ``status`` (and optionally ``status_text``),
        e.g. an :class:`httpx.Response` or a lightweight status holder.
    """
    message = get_api_error_message(error, response) if error else fallback_message
    status = getattr(response, "status_code", None)
    if status is None:
        status = getattr(response, "status", 0)
    return ScapiRequestError(message or fallback_message, int(status or 0), cause=error)


def is_fallback_trigger(error: object) -> bool:
    """Detect whether an error should trigger an OCAPI fallback.

    Currently:
      - :func:`is_invalid_scope_error`: AM rejected the requested scope.
      - :class:`ScapiCapabilityUnsupportedError`: the SCAPI surface lacks the
        capability the caller asked for.
      - :class:`ScapiRequestError`: SCAPI definitively rejected the request with
        a safe client-error status.
    """
    return (
        is_invalid_scope_error(error)
        or isinstance(error, ScapiCapabilityUnsupportedError)
        or (isinstance(error, ScapiRequestError) and error.status in SAFE_SCAPI_FALLBACK_STATUSES)
    )


@dataclass
class ResolveBackendOptions:
    """Inputs to :func:`resolve_scapi_or_ocapi`."""

    #: User preference (from ``--api-backend`` flag or ``apiBackend`` config).
    preference: ApiBackendPreference
    #: True iff shortCode + tenantId + auth are all available.
    has_scapi_config: bool
    #: Domain name used in error messages, e.g. ``"Jobs"``, ``"Scripts"``.
    domain_name: str


def scapi_unavailable_message(domain_name: str) -> str:
    """Message for when explicit SCAPI is requested but the instance can't reach it.

    Names both reasons the SCAPI client config can be unavailable — missing
    coordinates OR an auth flow that can't request scopes.
    """
    return (
        f"{domain_name} SCAPI backend requires shortCode, tenantId, and a stateless OAuth flow "
        "(client-credentials or JWT Bearer) that can request the required scopes. "
        "Browser user auth (Authorization Code + PKCE or implicit) is not supported by SCAPI Admin APIs "
        f"as of B2C Commerce release {SCAPI_CAPABILITY_BASELINE_RELEASE} and is currently OCAPI/WebDAV-only; "
        "fixed-token stored sessions cannot request SCAPI scopes — "
        "use client-credentials/JWT, or set --api-backend ocapi for now. "
        "The tooling will be updated when SCAPI support becomes available."
    )


def resolve_scapi_or_ocapi(opts: ResolveBackendOptions) -> Literal["ocapi", "scapi"]:
    """Resolve a user preference + config availability into a concrete backend choice.

    - Explicit ``"ocapi"`` always returns ``"ocapi"``.
    - Explicit ``"scapi"`` requires SCAPI config and raises if missing.
    - ``"auto"`` returns ``"scapi"`` if SCAPI config is available, otherwise ``"ocapi"``.

    :raises ValueError: when explicit SCAPI is requested without the required
        configuration.
    """
    if opts.preference == "ocapi":
        return "ocapi"

    if opts.preference == "scapi":
        if not opts.has_scapi_config:
            raise ValueError(scapi_unavailable_message(opts.domain_name))
        return "scapi"

    # auto
    return "scapi" if opts.has_scapi_config else "ocapi"


__all__ = [
    "SAFE_SCAPI_FALLBACK_STATUSES",
    "SCAPI_CAPABILITY_BASELINE_RELEASE",
    "ApiBackendPreference",
    "BackendBase",
    "ResolveBackendOptions",
    "ScapiCapabilityUnsupportedError",
    "ScapiRequestError",
    "ScapiUserAuthUnsupportedError",
    "assert_ocapi_compatibility_allowed",
    "assert_scapi_admin_auth_supported",
    "create_scapi_request_error",
    "is_fallback_trigger",
    "is_invalid_scope_error",
    "resolve_scapi_or_ocapi",
    "scapi_capability_unsupported_message",
    "scapi_unavailable_message",
    "with_scopes",
]
