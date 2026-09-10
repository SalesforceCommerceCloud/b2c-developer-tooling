# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Utilities for extracting error messages from API responses.

Mirrors ``src/clients/error-utils.ts``. Provides :func:`get_api_error_message`
(a tolerant extractor covering ODS/SLAS, OCAPI, SCAPI/Problem+JSON, and plain
``{message}`` error shapes) plus the OCAPI-deprecation helpers used by the
operations layer to convert an opaque OCAPI 403 into actionable SCAPI-setup
guidance.
"""

from __future__ import annotations

from typing import Any, Protocol, runtime_checkable

#: The OCAPI ``fault.type`` returned (with HTTP 403) when an instance has OCAPI
#: disabled. The platform is progressively deprecating OCAPI; on a deprecated
#: instance every Data API call fails with this fault regardless of scopes or
#: credentials. SCAPI is the supported path forward.
OCAPI_DEPRECATED_FAULT_TYPE = "OcapiDeprecatedException"

#: Doc anchor users are directed to when OCAPI is deprecated for an instance.
SCAPI_SETUP_DOC_URL = (
    "https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/authentication.html#scapi-authentication"
)


@runtime_checkable
class StatusLike(Protocol):
    """Minimal response shape needed for the HTTP-status fallback message."""

    @property
    def status_code(self) -> int: ...

    @property
    def reason_phrase(self) -> str: ...


def _scope_clause(required_scopes: list[str] | None) -> str:
    """Render the scope portion of the deprecation message.

    When the operation has a SCAPI equivalent, names the exact scope(s) that
    unlock it (e.g. ``the "sfcc.scripts" or "sfcc.scripts.rw" scope``); otherwise
    falls back to the generic ``sfcc.*`` phrasing.
    """
    if not required_scopes:
        return "the required sfcc.* scopes"
    quoted = [f'"{s}"' for s in required_scopes]
    joined = quoted[0] if len(quoted) == 1 else f"{', '.join(quoted[:-1])} or {quoted[-1]}"
    return f"the {joined} scope"


def ocapi_deprecated_message(required_scopes: list[str] | None = None) -> str:
    """Build the user-facing guidance shown when an instance has OCAPI deprecated.

    Pass the SCAPI scope(s) the failed operation requires to name them in the
    message. Omit ``required_scopes`` for operations that have no SCAPI
    equivalent — the message then uses the generic ``sfcc.*`` phrasing.
    """
    return (
        "OCAPI is deprecated and disabled for this instance. "
        f"Configure SCAPI access (shortCode, tenantId, and {_scope_clause(required_scopes)}) "
        "on your Account Manager API client to continue. "
        f"See: {SCAPI_SETUP_DOC_URL}"
    )


#: Generic OCAPI deprecation message (no specific scope named). Convenience for
#: call sites that surface the guidance directly without an operation scope.
OCAPI_DEPRECATED_MESSAGE = ocapi_deprecated_message()


def is_ocapi_deprecated_fault(error: Any) -> bool:
    """Return ``True`` if an API error object is an OCAPI deprecation fault.

    Detection keys off the structured ``fault.type``, not the message text, so it
    is robust to message wording changes.
    """
    if not error or not isinstance(error, dict):
        return False
    fault = error.get("fault")
    if not isinstance(fault, dict):
        return False
    return fault.get("type") == OCAPI_DEPRECATED_FAULT_TYPE


class OcapiDeprecatedError(Exception):
    """Raised when an OCAPI operation fails because OCAPI is deprecated.

    Carries actionable SCAPI-setup guidance — including the exact scope the
    failed operation needs, when supplied — so callers surface a helpful message
    instead of an opaque "Failed to ..." line. The original error is attached as
    ``__cause__`` (via ``raise ... from``) at the throw site.
    """

    def __init__(self, *, cause: Any = None, required_scopes: list[str] | None = None) -> None:
        super().__init__(ocapi_deprecated_message(required_scopes))
        self.name = "OcapiDeprecatedError"
        self.required_scopes = required_scopes
        self.cause = cause


def get_api_error_message(error: Any, response: StatusLike) -> str:
    """Extract a clean error message from an API error response.

    Handles multiple API error patterns and falls back to HTTP status so HTML
    response bodies (like error pages) are never surfaced. Supported patterns:

    - ODS/SLAS: ``{"error": {"message": "..."}}``
    - OCAPI: ``{"fault": {"message": "..."}}``
    - SCAPI/Problem+JSON: ``{"detail": "...", "title": "..."}``
    - Standard: ``{"message": "..."}``
    """
    if isinstance(error, dict):
        nested = error.get("error")
        if isinstance(nested, dict):
            message = nested.get("message")
            if isinstance(message, str) and message:
                return message

        fault = error.get("fault")
        if isinstance(fault, dict):
            message = fault.get("message")
            if isinstance(message, str) and message:
                return message

        detail = error.get("detail")
        if isinstance(detail, str) and detail:
            return detail
        title = error.get("title")
        if isinstance(title, str) and title:
            return title

        message = error.get("message")
        if isinstance(message, str) and message:
            return message

    return f"HTTP {response.status_code} {response.reason_phrase}"


def throw_ocapi_error(
    error: Any,
    response: StatusLike,
    prefix: str,
    required_scopes: list[str] | None = None,
) -> None:
    """Raise a well-formed error for a failed OCAPI call.

    OCAPI deprecation faults become an :class:`OcapiDeprecatedError` with
    actionable SCAPI-setup guidance; everything else raises a plain
    ``RuntimeError`` of the form ``"{prefix}: {message}"``. Always raises.
    """
    if is_ocapi_deprecated_fault(error):
        raise OcapiDeprecatedError(cause=error, required_scopes=required_scopes)
    raise RuntimeError(f"{prefix}: {get_api_error_message(error, response)}")


__all__ = [
    "OCAPI_DEPRECATED_FAULT_TYPE",
    "OCAPI_DEPRECATED_MESSAGE",
    "SCAPI_SETUP_DOC_URL",
    "OcapiDeprecatedError",
    "StatusLike",
    "get_api_error_message",
    "is_ocapi_deprecated_fault",
    "ocapi_deprecated_message",
    "throw_ocapi_error",
]
