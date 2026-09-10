# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the shared client middleware (``clients/middleware.py``).

Mirrors ``packages/b2c-tooling-sdk/test/clients/middleware.test.ts`` (excluding
the safety middleware, which is out of scope for the Python port): auth 401
retry, the SCAPI scope-cascade handshake, rate-limit retries (Retry-After /
backoff), logging, User-Agent, and extra-params middleware.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable

import httpx
import pytest

from b2c_tooling_sdk.clients import middleware as mw
from b2c_tooling_sdk.clients._core import MiddlewareRequestContext, MiddlewareResponseContext

BASE_URL = "https://example.test/api"


class _Recorder:
    """A ``ctx.fetch`` stand-in returning queued responses and recording requests."""

    def __init__(self, responses: list[httpx.Response]) -> None:
        self._responses = responses
        self.requests: list[httpx.Request] = []

    async def __call__(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request)
        return self._responses.pop(0)


def _req(headers: dict[str, str] | None = None, method: str = "GET") -> httpx.Request:
    return httpx.Request(method, BASE_URL, headers=headers)


def _req_ctx(request: httpx.Request, fetch: Callable[[httpx.Request], Awaitable[httpx.Response]] | None = None):
    return MiddlewareRequestContext(request=request, client_type="ocapi", schema_path="/api", fetch=fetch)


def _resp_ctx(request: httpx.Request, response: httpx.Response, fetch=None) -> MiddlewareResponseContext:
    return MiddlewareResponseContext(
        request=request, response=response, client_type="ocapi", schema_path="/api", fetch=fetch
    )


# --- auth middleware ------------------------------------------------------------


class _FakeAuth:
    def __init__(self) -> None:
        self.header = "Bearer t1"
        self.invalidated = 0

    async def get_authorization_header(self) -> str:
        return self.header

    def invalidate_token(self) -> None:
        self.invalidated += 1
        self.header = "Bearer t2"


async def test_auth_middleware_injects_authorization_header() -> None:
    auth = _FakeAuth()
    middleware = mw.create_auth_middleware(auth)
    request = _req()

    await middleware.on_request(_req_ctx(request))

    assert request.headers["Authorization"] == "Bearer t1"


async def test_auth_middleware_retries_once_on_401_after_prior_success() -> None:
    auth = _FakeAuth()
    middleware = mw.create_auth_middleware(auth)
    request = _req({"Authorization": "Bearer t1"})
    fetch = _Recorder([httpx.Response(200, json={"ok": True})])

    # A prior non-401 marks the strategy as having succeeded.
    await middleware.on_response(_resp_ctx(request, httpx.Response(200), fetch=fetch))
    # Now a 401 should trigger a single invalidate + retry.
    result = await middleware.on_response(_resp_ctx(request, httpx.Response(401), fetch=fetch))

    assert auth.invalidated == 1
    assert result is not None and result.status_code == 200
    assert fetch.requests[-1].headers["Authorization"] == "Bearer t2"


async def test_auth_middleware_does_not_retry_401_without_prior_success() -> None:
    auth = _FakeAuth()
    middleware = mw.create_auth_middleware(auth)
    request = _req({"Authorization": "Bearer t1"})
    fetch = _Recorder([httpx.Response(200)])

    result = await middleware.on_response(_resp_ctx(request, httpx.Response(401), fetch=fetch))

    assert auth.invalidated == 0
    assert result is not None and result.status_code == 401
    assert fetch.requests == []


# --- SCAPI scope-cascade auth ---------------------------------------------------


class _FakeCascadeAuth:
    def __init__(self) -> None:
        self.cascades: list[list[list[str]]] = []
        self.invalidated = 0

    async def get_access_token_for_cascade(self, candidates: list[list[str]]) -> str:
        self.cascades.append(candidates)
        return "cascade-token"

    def invalidate_token(self) -> None:
        self.invalidated += 1


def _cascade() -> mw.ScopeCascade:
    return mw.ScopeCascade(read=[["sfcc.read"]], write=[["sfcc.rw"]])


async def test_scapi_auth_picks_read_cascade_and_strips_scope_mode_header() -> None:
    auth = _FakeCascadeAuth()
    middleware = mw.create_scapi_auth_middleware(auth, _cascade())
    request = _req({mw.SCOPE_MODE_HEADER: "read"})

    await middleware.on_request(_req_ctx(request))

    assert auth.cascades == [[["sfcc.read"]]]
    assert request.headers["Authorization"] == "Bearer cascade-token"
    assert mw.SCOPE_MODE_HEADER not in request.headers


async def test_scapi_auth_picks_write_cascade() -> None:
    auth = _FakeCascadeAuth()
    middleware = mw.create_scapi_auth_middleware(auth, _cascade())
    request = _req({mw.SCOPE_MODE_HEADER: "write"})

    await middleware.on_request(_req_ctx(request))

    assert auth.cascades == [[["sfcc.rw"]]]


async def test_scapi_auth_retries_401_at_same_tier() -> None:
    auth = _FakeCascadeAuth()
    middleware = mw.create_scapi_auth_middleware(auth, _cascade())
    request = _req({mw.SCOPE_MODE_HEADER: "read"})
    await middleware.on_request(_req_ctx(request))

    fetch = _Recorder([httpx.Response(200)])
    await middleware.on_response(_resp_ctx(request, httpx.Response(200), fetch=fetch))
    result = await middleware.on_response(_resp_ctx(request, httpx.Response(401), fetch=fetch))

    assert auth.invalidated == 1
    assert result is not None and result.status_code == 200
    # read tier was resolved on the original request and again on retry.
    assert auth.cascades[-1] == [["sfcc.read"]]


# --- rate limit -----------------------------------------------------------------


def test_parse_retry_after_seconds() -> None:
    assert mw._parse_retry_after("2") == 2000.0


def test_parse_retry_after_none_when_missing() -> None:
    assert mw._parse_retry_after(None) is None


def test_parse_retry_after_http_date() -> None:
    # A date far in the past clamps to 0 (never negative).
    assert mw._parse_retry_after("Wed, 21 Oct 2015 07:28:00 GMT") == 0.0


def test_compute_backoff_delay_includes_jitter_and_is_capped() -> None:
    first = mw._compute_backoff_delay_ms(0, 1000, 30000)
    assert 1000 <= first <= 1200
    capped = mw._compute_backoff_delay_ms(10, 1000, 30000)
    assert capped == 30000


async def test_rate_limit_retries_429_then_succeeds(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _no_sleep(_seconds: float) -> None:
        return None

    monkeypatch.setattr(mw.asyncio, "sleep", _no_sleep)
    middleware = mw.create_rate_limit_middleware(max_retries=3)
    request = _req()
    fetch = _Recorder([httpx.Response(429, headers={"Retry-After": "1"}), httpx.Response(200)])

    result = await middleware.on_response(_resp_ctx(request, httpx.Response(429), fetch=fetch))

    assert result is not None and result.status_code == 200
    assert len(fetch.requests) == 2


async def test_rate_limit_stops_after_max_retries(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _no_sleep(_seconds: float) -> None:
        return None

    monkeypatch.setattr(mw.asyncio, "sleep", _no_sleep)
    middleware = mw.create_rate_limit_middleware(max_retries=2)
    request = _req()
    fetch = _Recorder([httpx.Response(429), httpx.Response(429)])

    result = await middleware.on_response(_resp_ctx(request, httpx.Response(429), fetch=fetch))

    assert result is not None and result.status_code == 429
    assert len(fetch.requests) == 2


async def test_rate_limit_ignores_non_rate_limited_response() -> None:
    middleware = mw.create_rate_limit_middleware()
    request = _req()
    fetch = _Recorder([])

    result = await middleware.on_response(_resp_ctx(request, httpx.Response(200), fetch=fetch))

    assert result is not None and result.status_code == 200
    assert fetch.requests == []


# --- logging --------------------------------------------------------------------


def test_mask_body_masks_configured_keys() -> None:
    masked = mw._mask_body({"password": "secret", "user": "me"}, ["password"])
    assert masked == {"password": "...", "user": "me"}


def test_mask_body_noop_for_non_dict() -> None:
    assert mw._mask_body("plain", ["password"]) == "plain"


async def test_logging_middleware_passes_request_and_response_through() -> None:
    middleware = mw.create_logging_middleware("OCAPI")
    request = _req()
    out_req = await middleware.on_request(_req_ctx(request))
    response = httpx.Response(200)
    out_resp = await middleware.on_response(_resp_ctx(request, response))

    assert out_req is request
    assert out_resp is response


async def test_logging_middleware_accepts_config_dict() -> None:
    middleware = mw.create_logging_middleware({"prefix": "OCAPI", "mask_body_keys": ["password"]})
    request = httpx.Request("POST", BASE_URL, headers={"Content-Type": "application/json"}, content=b'{"password":"x"}')
    out = await middleware.on_request(_req_ctx(request))
    assert out is request


# --- user agent -----------------------------------------------------------------


async def test_user_agent_middleware_sets_headers() -> None:
    middleware = mw.create_user_agent_middleware("MyUA/1.0")
    request = _req()

    await middleware.on_request(_req_ctx(request))

    assert request.headers["User-Agent"] == "MyUA/1.0"
    assert request.headers["sfdc_user_agent"] == "MyUA/1.0"


async def test_user_agent_middleware_response_passthrough() -> None:
    middleware = mw.create_user_agent_middleware("MyUA/1.0")
    response = httpx.Response(200)
    out = await middleware.on_response(_resp_ctx(_req(), response))
    assert out is response


# --- extra params ---------------------------------------------------------------


async def test_extra_params_adds_headers_and_query() -> None:
    middleware = mw.create_extra_params_middleware(headers={"X-Extra": "1"}, query={"debug": "true"})
    request = _req()

    result = await middleware.on_request(_req_ctx(request))

    assert result is not None
    assert result.headers["X-Extra"] == "1"
    assert result.url.params.get("debug") == "true"


async def test_extra_params_merges_json_body() -> None:
    middleware = mw.create_extra_params_middleware(body={"added": True})
    request = httpx.Request("POST", BASE_URL, headers={"Content-Type": "application/json"}, content=b'{"name":"x"}')

    result = await middleware.on_request(_req_ctx(request))

    assert result is not None
    import json

    assert json.loads(result.content) == {"name": "x", "added": True}


async def test_extra_params_response_passthrough() -> None:
    middleware = mw.create_extra_params_middleware(headers={"X-Extra": "1"})
    response = httpx.Response(200)
    out = await middleware.on_response(_resp_ctx(_req(), response))
    assert out is response
