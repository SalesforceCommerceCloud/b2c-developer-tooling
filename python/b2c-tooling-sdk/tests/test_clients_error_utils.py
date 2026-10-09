# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the API error-message extractor and OCAPI-deprecation helpers.

Mirrors ``packages/b2c-tooling-sdk/test/clients/error-utils.test.ts``.
"""

from __future__ import annotations

from dataclasses import dataclass

import pytest

from b2c_tooling_sdk.clients.error_utils import (
    OCAPI_DEPRECATED_MESSAGE,
    OcapiDeprecatedError,
    get_api_error_message,
    is_ocapi_deprecated_fault,
    ocapi_deprecated_message,
    throw_ocapi_error,
)


@dataclass
class _MockResponse:
    """Minimal response exposing the fields the fallback message needs."""

    status_code: int
    reason_phrase: str


def _response(status: int, reason: str) -> _MockResponse:
    return _MockResponse(status_code=status, reason_phrase=reason)


# --- get_api_error_message: ODS/SLAS pattern -----------------------------------


def test_extracts_message_from_error_message_structure() -> None:
    error = {"error": {"message": "Sandbox not found"}}
    assert get_api_error_message(error, _response(404, "Not Found")) == "Sandbox not found"


def test_ignores_error_error_if_message_not_string() -> None:
    error = {"error": {"message": 123}}
    assert get_api_error_message(error, _response(500, "Internal Server Error")) == "HTTP 500 Internal Server Error"


def test_ignores_error_error_if_message_empty() -> None:
    error = {"error": {"message": ""}}
    assert get_api_error_message(error, _response(500, "Internal Server Error")) == "HTTP 500 Internal Server Error"


# --- get_api_error_message: OCAPI fault pattern --------------------------------


def test_extracts_message_from_fault_structure() -> None:
    error = {"fault": {"type": "NotFoundException", "message": "Site not found"}}
    assert get_api_error_message(error, _response(404, "Not Found")) == "Site not found"


def test_ignores_fault_if_message_not_string() -> None:
    error = {"fault": {"type": "Error", "message": None}}
    assert get_api_error_message(error, _response(500, "Internal Server Error")) == "HTTP 500 Internal Server Error"


# --- get_api_error_message: SCAPI/Problem+JSON pattern -------------------------


def test_extracts_detail_from_detail_structure() -> None:
    error = {"type": "NotFound", "title": "Resource Not Found", "detail": "The requested schema was not found"}
    assert get_api_error_message(error, _response(404, "Not Found")) == "The requested schema was not found"


def test_falls_back_to_title_if_detail_missing() -> None:
    error = {"type": "NotFound", "title": "Resource Not Found"}
    assert get_api_error_message(error, _response(404, "Not Found")) == "Resource Not Found"


def test_ignores_detail_if_empty() -> None:
    error = {"title": "Some Title", "detail": ""}
    assert get_api_error_message(error, _response(400, "Bad Request")) == "Some Title"


# --- get_api_error_message: standard pattern -----------------------------------


def test_extracts_message_from_message_structure() -> None:
    error = {"message": "Something went wrong"}
    assert get_api_error_message(error, _response(500, "Internal Server Error")) == "Something went wrong"


# --- get_api_error_message: HTTP status fallback -------------------------------


def test_returns_http_status_when_error_is_none() -> None:
    assert get_api_error_message(None, _response(521, "Web Server Is Down")) == "HTTP 521 Web Server Is Down"


def test_returns_http_status_when_error_not_an_object() -> None:
    assert get_api_error_message("some string error", _response(500, "Internal Server Error")) == (
        "HTTP 500 Internal Server Error"
    )
    assert get_api_error_message(123, _response(500, "Internal Server Error")) == "HTTP 500 Internal Server Error"


def test_returns_http_status_when_no_recognized_fields() -> None:
    error = {"someField": "value", "html": "<html>...</html>"}
    assert get_api_error_message(error, _response(521, "Sandbox Down")) == "HTTP 521 Sandbox Down"


def test_does_not_include_html_content() -> None:
    error = {"body": "<!DOCTYPE html><html><body>Error page</body></html>"}
    message = get_api_error_message(error, _response(521, "Web Server Is Down"))
    assert message == "HTTP 521 Web Server Is Down"
    assert "<html>" not in message


# --- get_api_error_message: priority order -------------------------------------


def test_prioritizes_error_error_message() -> None:
    error = {
        "error": {"message": "ODS message"},
        "fault": {"message": "OCAPI message"},
        "detail": "SCAPI detail",
        "message": "Standard message",
    }
    assert get_api_error_message(error, _response(500, "Error")) == "ODS message"


def test_prioritizes_fault_message_over_scapi_and_standard() -> None:
    error = {"fault": {"message": "OCAPI message"}, "detail": "SCAPI detail", "message": "Standard message"}
    assert get_api_error_message(error, _response(500, "Error")) == "OCAPI message"


def test_prioritizes_detail_over_title_and_standard() -> None:
    error = {"title": "Error Title", "detail": "Error Detail", "message": "Standard message"}
    assert get_api_error_message(error, _response(500, "Error")) == "Error Detail"


def test_prioritizes_title_over_standard() -> None:
    error = {"title": "Error Title", "message": "Standard message"}
    assert get_api_error_message(error, _response(500, "Error")) == "Error Title"


# --- OCAPI deprecation detection -----------------------------------------------

_DEPRECATED_FAULT = {
    "fault": {
        "type": "OcapiDeprecatedException",
        "message": "OCAPI has been deprecated. Access is not available for this instance.",
    }
}


def test_is_ocapi_deprecated_fault_matches() -> None:
    assert is_ocapi_deprecated_fault(_DEPRECATED_FAULT) is True


def test_is_ocapi_deprecated_fault_false_for_others() -> None:
    assert is_ocapi_deprecated_fault({"fault": {"type": "NotFoundException", "message": "x"}}) is False
    assert is_ocapi_deprecated_fault({"fault": {"type": "InvalidAccessTokenException"}}) is False
    assert is_ocapi_deprecated_fault(None) is False
    assert is_ocapi_deprecated_fault("string") is False
    assert is_ocapi_deprecated_fault({}) is False


def test_get_api_error_message_is_pure_extractor_for_deprecation() -> None:
    message = get_api_error_message(_DEPRECATED_FAULT, _response(403, "Forbidden"))
    assert message == "OCAPI has been deprecated. Access is not available for this instance."


# --- ocapi_deprecated_message --------------------------------------------------


def test_deprecated_message_generic_phrasing() -> None:
    msg = ocapi_deprecated_message()
    assert msg == OCAPI_DEPRECATED_MESSAGE
    assert "OCAPI is deprecated" in msg
    assert "the required sfcc.* scopes" in msg
    assert "#scapi-authentication" in msg


def test_deprecated_message_single_scope() -> None:
    msg = ocapi_deprecated_message(["sfcc.scripts.rw"])
    assert 'the "sfcc.scripts.rw" scope' in msg


def test_deprecated_message_multiple_scopes_with_or() -> None:
    msg = ocapi_deprecated_message(["sfcc.scripts", "sfcc.scripts.rw"])
    assert 'the "sfcc.scripts" or "sfcc.scripts.rw" scope' in msg


# --- throw_ocapi_error ----------------------------------------------------------


def test_throw_raises_deprecated_error_naming_operation_scope() -> None:
    fault = {"fault": {"type": "OcapiDeprecatedException", "message": "deprecated"}}
    with pytest.raises(OcapiDeprecatedError) as excinfo:
        throw_ocapi_error(
            fault, _response(403, "Forbidden"), "Failed to list code versions", ["sfcc.scripts", "sfcc.scripts.rw"]
        )
    err = excinfo.value
    assert 'the "sfcc.scripts" or "sfcc.scripts.rw" scope' in str(err)
    assert err.cause == fault
    assert err.required_scopes == ["sfcc.scripts", "sfcc.scripts.rw"]


def test_throw_uses_generic_message_without_scopes() -> None:
    fault = {"fault": {"type": "OcapiDeprecatedException", "message": "deprecated"}}
    with pytest.raises(OcapiDeprecatedError) as excinfo:
        throw_ocapi_error(fault, _response(403, "Forbidden"), "Failed to search users")
    assert "the required sfcc.* scopes" in str(excinfo.value)


def test_throw_prefixes_non_deprecation_errors() -> None:
    fault = {"fault": {"type": "NotFoundException", "message": "Site not found"}}
    with pytest.raises(RuntimeError) as excinfo:
        throw_ocapi_error(fault, _response(404, "Not Found"), "Failed to list code versions")
    err = excinfo.value
    assert not isinstance(err, OcapiDeprecatedError)
    assert str(err) == "Failed to list code versions: Site not found"
