# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for JWT decode/scope/validity helpers."""

from __future__ import annotations

import time

import pytest

from b2c_tooling_sdk.auth.jwt_utils import (
    decode_jwt,
    decode_jwt_token_info,
    extract_jwt_scopes,
    is_jwt_token_valid,
)
from tests.helpers.jwt import make_jwt


def test_decode_jwt_returns_header_and_payload() -> None:
    token = make_jwt(sub="user@example.com", scope="a b", expires_in=3600)
    decoded = decode_jwt(token)
    assert decoded.header["alg"] == "RS256"
    assert decoded.payload["sub"] == "user@example.com"


def test_decode_jwt_rejects_malformed() -> None:
    with pytest.raises(ValueError, match="Invalid JWT format"):
        decode_jwt("not-a-jwt")


def test_extract_scopes_from_string() -> None:
    assert extract_jwt_scopes({"scope": "sfcc.jobs sfcc.sites"}) == ["sfcc.jobs", "sfcc.sites"]


def test_extract_scopes_from_list() -> None:
    assert extract_jwt_scopes({"scope": ["a", "b"]}) == ["a", "b"]


def test_extract_scopes_missing() -> None:
    assert extract_jwt_scopes({}) == []


def test_decode_jwt_token_info() -> None:
    token = make_jwt(exp=1_700_000_000, scope="a b")
    expires, scopes = decode_jwt_token_info(token)
    assert int(expires.timestamp()) == 1_700_000_000
    assert scopes == ["a", "b"]


def test_is_jwt_token_valid_true() -> None:
    token = make_jwt(expires_in=3600, scope="a b")
    assert is_jwt_token_valid(token, ["a"]) is True


def test_is_jwt_token_valid_expired() -> None:
    token = make_jwt(exp=int(time.time()) - 10)
    assert is_jwt_token_valid(token) is False


def test_is_jwt_token_valid_within_buffer() -> None:
    # Expires in 30s but the default 60s buffer treats it as expired.
    token = make_jwt(expires_in=30)
    assert is_jwt_token_valid(token) is False


def test_is_jwt_token_valid_missing_scope() -> None:
    token = make_jwt(expires_in=3600, scope="a")
    assert is_jwt_token_valid(token, ["b"]) is False


def test_is_jwt_token_valid_empty_token() -> None:
    assert is_jwt_token_valid("") is False


def test_is_jwt_token_valid_non_jwt() -> None:
    assert is_jwt_token_valid("garbage") is False
