# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the SCAPI/OCAPI dual-backend utilities (``clients/scapi_backend_utils.py``).

Mirrors ``packages/b2c-tooling-sdk/test/clients/scapi-backend-utils.test.ts``:
backend preference resolution, scope-error detection, capability guards, the
``with_scopes`` merge, and the safe-fallback status/trigger policy.
"""

from __future__ import annotations

import httpx
import pytest

from b2c_tooling_sdk.clients.scapi_backend_utils import (
    SAFE_SCAPI_FALLBACK_STATUSES,
    ResolveBackendOptions,
    ScapiCapabilityUnsupportedError,
    ScapiRequestError,
    ScapiUserAuthUnsupportedError,
    assert_ocapi_compatibility_allowed,
    assert_scapi_admin_auth_supported,
    create_scapi_request_error,
    is_fallback_trigger,
    is_invalid_scope_error,
    resolve_scapi_or_ocapi,
    scapi_unavailable_message,
    with_scopes,
)

# --- auth guards ----------------------------------------------------------------


class _PlainAuth:
    async def fetch(self, url: str, **kwargs: object) -> httpx.Response:
        return httpx.Response(200)


class _UserAuth(_PlainAuth):
    auth_method = "user"


class _ImplicitAuth(_PlainAuth):
    auth_method = "implicit"


class _ScopedAuth(_PlainAuth):
    def __init__(self) -> None:
        self.merged: list[str] | None = None

    def with_additional_scopes(self, scopes: list[str]) -> _ScopedAuth:
        self.merged = scopes
        return self


def test_assert_scapi_admin_auth_supported_allows_stateless_auth() -> None:
    assert_scapi_admin_auth_supported(_PlainAuth())  # type: ignore[arg-type]


def test_assert_scapi_admin_auth_supported_rejects_user_auth() -> None:
    with pytest.raises(ScapiUserAuthUnsupportedError):
        assert_scapi_admin_auth_supported(_UserAuth())  # type: ignore[arg-type]


def test_assert_scapi_admin_auth_supported_rejects_implicit_auth() -> None:
    with pytest.raises(ScapiUserAuthUnsupportedError):
        assert_scapi_admin_auth_supported(_ImplicitAuth())  # type: ignore[arg-type]


def test_with_scopes_merges_when_supported() -> None:
    auth = _ScopedAuth()
    result = with_scopes(auth, ["sfcc.jobs.rw"])  # type: ignore[arg-type]
    assert result is auth
    assert auth.merged == ["sfcc.jobs.rw"]


def test_with_scopes_passthrough_when_unsupported() -> None:
    auth = _PlainAuth()
    result = with_scopes(auth, ["sfcc.jobs.rw"])  # type: ignore[arg-type]
    assert result is auth


def test_with_scopes_rejects_user_auth_before_merge() -> None:
    with pytest.raises(ScapiUserAuthUnsupportedError):
        with_scopes(_UserAuth(), ["sfcc.jobs.rw"])  # type: ignore[arg-type]


# --- scope-error detection ------------------------------------------------------


def test_is_invalid_scope_error_true_for_matching_message() -> None:
    assert is_invalid_scope_error(Exception("token failed: invalid_scope requested"))


def test_is_invalid_scope_error_false_for_other_errors() -> None:
    assert not is_invalid_scope_error(Exception("network down"))
    assert not is_invalid_scope_error("invalid_scope")  # not an exception instance


# --- capability guards ----------------------------------------------------------


def test_assert_ocapi_compatibility_allowed_blocks_explicit_scapi() -> None:
    with pytest.raises(ScapiCapabilityUnsupportedError):
        assert_ocapi_compatibility_allowed("scapi", "toggling disabled")


@pytest.mark.parametrize("preference", ["ocapi", "auto", None])
def test_assert_ocapi_compatibility_allowed_permits_non_scapi(preference: str | None) -> None:
    assert_ocapi_compatibility_allowed(preference, "toggling disabled")  # type: ignore[arg-type]


# --- structured request errors + fallback policy --------------------------------


def test_create_scapi_request_error_uses_formatter_and_status() -> None:
    response = httpx.Response(404, json={"detail": "not found"})
    error = create_scapi_request_error({"detail": "not found"}, response, "fallback")
    assert isinstance(error, ScapiRequestError)
    assert error.status == 404
    assert "not found" in str(error)


def test_create_scapi_request_error_falls_back_when_no_error() -> None:
    response = httpx.Response(500)
    error = create_scapi_request_error(None, response, "fallback message")
    assert error.status == 500
    assert str(error) == "fallback message"


def test_is_fallback_trigger_for_invalid_scope() -> None:
    assert is_fallback_trigger(Exception("invalid_scope"))


def test_is_fallback_trigger_for_capability_unsupported() -> None:
    assert is_fallback_trigger(ScapiCapabilityUnsupportedError("nope"))


def test_is_fallback_trigger_for_safe_status() -> None:
    for status in SAFE_SCAPI_FALLBACK_STATUSES:
        assert is_fallback_trigger(ScapiRequestError("x", status))


def test_is_fallback_trigger_false_for_ambiguous_status() -> None:
    assert not is_fallback_trigger(ScapiRequestError("x", 429))
    assert not is_fallback_trigger(ScapiRequestError("x", 503))
    assert not is_fallback_trigger(Exception("random"))


def test_safe_fallback_statuses_exact_set() -> None:
    assert frozenset({400, 401, 403, 404, 405, 406, 415}) == SAFE_SCAPI_FALLBACK_STATUSES


# --- backend resolution ---------------------------------------------------------


def test_resolve_explicit_ocapi_always_ocapi() -> None:
    assert (
        resolve_scapi_or_ocapi(ResolveBackendOptions(preference="ocapi", has_scapi_config=False, domain_name="Jobs"))
        == "ocapi"
    )


def test_resolve_explicit_scapi_requires_config() -> None:
    assert (
        resolve_scapi_or_ocapi(ResolveBackendOptions(preference="scapi", has_scapi_config=True, domain_name="Jobs"))
        == "scapi"
    )


def test_resolve_explicit_scapi_without_config_raises() -> None:
    with pytest.raises(ValueError, match="Jobs SCAPI backend requires"):
        resolve_scapi_or_ocapi(ResolveBackendOptions(preference="scapi", has_scapi_config=False, domain_name="Jobs"))


def test_resolve_auto_prefers_scapi_when_configured() -> None:
    assert (
        resolve_scapi_or_ocapi(ResolveBackendOptions(preference="auto", has_scapi_config=True, domain_name="Jobs"))
        == "scapi"
    )


def test_resolve_auto_falls_back_to_ocapi_without_config() -> None:
    assert (
        resolve_scapi_or_ocapi(ResolveBackendOptions(preference="auto", has_scapi_config=False, domain_name="Jobs"))
        == "ocapi"
    )


def test_scapi_unavailable_message_names_domain() -> None:
    message = scapi_unavailable_message("Scripts")
    assert message.startswith("Scripts SCAPI backend requires")
    assert "26.8" in message
