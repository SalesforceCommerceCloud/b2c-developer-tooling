# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for OAuth client-credential Basic-header encoding (parity with the TS SDK)."""

from __future__ import annotations

import base64

import pytest

from b2c_tooling_sdk.auth.client_credentials import encode_basic_client_credentials


def _decode(encoded: str) -> str:
    return base64.b64decode(encoded).decode("utf-8")


def test_simple_credentials() -> None:
    # base64("id:sec")
    assert encode_basic_client_credentials("id", "sec") == "aWQ6c2Vj"


def test_roundtrip_plain() -> None:
    assert _decode(encode_basic_client_credentials("client", "secret")) == "client:secret"


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("a b", "a+b"),  # space -> +
        ("a+b", "a%2Bb"),  # plus escaped
        ("a%b", "a%25b"),  # percent escaped
        ("a~b", "a%7Eb"),  # tilde escaped (differs from Python quote_plus default)
        ("a*b", "a*b"),  # asterisk preserved (differs from Python quote_plus default)
        ("a!b(c)", "a%21b%28c%29"),
        ("a/b", "a%2Fb"),
    ],
)
def test_form_url_encoding_matches_urlsearchparams(raw: str, expected: str) -> None:
    # The encoded secret segment (after the colon) must match WHATWG URLSearchParams.
    encoded = _decode(encode_basic_client_credentials("id", raw))
    assert encoded == f"id:{expected}"


def test_plus_in_secret_is_encoded() -> None:
    # A raw '+' would be read as a space by a form-url-decoder if not encoded.
    decoded = _decode(encode_basic_client_credentials("my+client", "my+secret"))
    assert decoded == "my%2Bclient:my%2Bsecret"
