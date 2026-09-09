# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the Basic and API-key authentication strategies."""

from __future__ import annotations

import base64

import httpx
import respx

from b2c_tooling_sdk.auth.api_key import ApiKeyStrategy
from b2c_tooling_sdk.auth.basic import BasicAuthStrategy

URL = "https://webdav.example.demandware.net/on/demandware.servlet/webdav/Sites/foo"


@respx.mock
async def test_basic_auth_sets_header() -> None:
    route = respx.get(URL).mock(return_value=httpx.Response(200))
    await BasicAuthStrategy("user", "key").fetch(URL)
    expected = base64.b64encode(b"user:key").decode()
    assert route.calls.last.request.headers["Authorization"] == f"Basic {expected}"


async def test_basic_auth_header_value() -> None:
    header = await BasicAuthStrategy("user", "key").get_authorization_header()
    assert header == f"Basic {base64.b64encode(b'user:key').decode()}"


@respx.mock
async def test_api_key_default_header() -> None:
    route = respx.get(URL).mock(return_value=httpx.Response(200))
    await ApiKeyStrategy("my-key").fetch(URL)
    assert route.calls.last.request.headers["x-api-key"] == "my-key"


@respx.mock
async def test_api_key_authorization_uses_bearer() -> None:
    route = respx.get(URL).mock(return_value=httpx.Response(200))
    await ApiKeyStrategy("my-key", "Authorization").fetch(URL)
    assert route.calls.last.request.headers["Authorization"] == "Bearer my-key"


async def test_api_key_header_value_bearer() -> None:
    assert await ApiKeyStrategy("k", "Authorization").get_authorization_header() == "Bearer k"


async def test_api_key_header_value_direct() -> None:
    assert await ApiKeyStrategy("k", "x-api-key").get_authorization_header() == "k"
