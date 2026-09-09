# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the User-Agent middleware providers.

Mirrors ``packages/b2c-tooling-sdk/test/clients/user-agent.test.ts``.
"""

from __future__ import annotations

from collections.abc import Iterator

import httpx
import pytest

from b2c_tooling_sdk.clients._core import MiddlewareRequestContext
from b2c_tooling_sdk.clients.middleware import create_user_agent_middleware
from b2c_tooling_sdk.clients.user_agent import (
    get_user_agent,
    reset_user_agent,
    set_user_agent,
    user_agent_auth_provider,
    user_agent_provider,
)
from b2c_tooling_sdk.version import SDK_USER_AGENT


@pytest.fixture(autouse=True)
def _reset_user_agent() -> Iterator[None]:
    yield
    reset_user_agent()


def _request_ctx() -> MiddlewareRequestContext:
    request = httpx.Request("GET", "https://example.com/ping")
    return MiddlewareRequestContext(request=request, client_type="ocapi")


# --- create_user_agent_middleware ----------------------------------------------


async def test_sets_user_agent_header_on_request() -> None:
    middleware = create_user_agent_middleware("test-agent/1.0.0")
    ctx = _request_ctx()
    result = await middleware.on_request(ctx)
    assert result is not None
    assert result.headers["User-Agent"] == "test-agent/1.0.0"


async def test_sets_sfdc_user_agent_header_with_same_value() -> None:
    middleware = create_user_agent_middleware("test-agent/1.0.0")
    ctx = _request_ctx()
    result = await middleware.on_request(ctx)
    assert result is not None
    assert result.headers["sfdc_user_agent"] == "test-agent/1.0.0"


async def test_overwrites_existing_user_agent_header() -> None:
    middleware = create_user_agent_middleware("new-agent/2.0.0")
    request = httpx.Request("GET", "https://example.com/ping", headers={"User-Agent": "old-agent/1.0.0"})
    ctx = MiddlewareRequestContext(request=request, client_type="ocapi")
    result = await middleware.on_request(ctx)
    assert result is not None
    assert result.headers["User-Agent"] == "new-agent/2.0.0"


# --- set/get/reset_user_agent --------------------------------------------------


def test_defaults_to_sdk_user_agent() -> None:
    assert get_user_agent() == SDK_USER_AGENT


def test_set_user_agent_changes_current() -> None:
    set_user_agent("b2c-cli/1.0.0")
    assert get_user_agent() == "b2c-cli/1.0.0"


def test_reset_user_agent_restores_default() -> None:
    set_user_agent("custom-agent/1.0.0")
    assert get_user_agent() == "custom-agent/1.0.0"
    reset_user_agent()
    assert get_user_agent() == SDK_USER_AGENT


# --- user_agent_provider (HTTP clients) ----------------------------------------


def test_provider_has_name_user_agent() -> None:
    assert user_agent_provider.name == "user-agent"


async def test_provider_returns_middleware_with_current_user_agent() -> None:
    set_user_agent("provider-test/1.0.0")
    middleware = user_agent_provider.get_middleware("ocapi")
    assert middleware is not None
    ctx = _request_ctx()
    result = await middleware.on_request(ctx)
    assert result is not None
    assert result.headers["User-Agent"] == "provider-test/1.0.0"


def test_provider_returns_middleware_for_all_client_types() -> None:
    for client_type in ("ocapi", "slas", "ods", "mrt", "webdav"):
        assert user_agent_provider.get_middleware(client_type) is not None


# --- user_agent_auth_provider (auth token requests) ----------------------------


def test_auth_provider_has_name_user_agent() -> None:
    assert user_agent_auth_provider.name == "user-agent"


async def test_auth_provider_middleware_sets_headers_on_request() -> None:
    set_user_agent("auth-test/1.0.0")
    middleware = user_agent_auth_provider.get_middleware()
    request = httpx.Request("POST", "https://account.demandware.com/dwsso/oauth2/access_token")
    result = await middleware.on_request(request)
    assert result is not None
    assert result.headers["User-Agent"] == "auth-test/1.0.0"
    assert result.headers["sfdc_user_agent"] == "auth-test/1.0.0"
