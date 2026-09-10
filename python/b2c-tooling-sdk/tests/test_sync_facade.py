# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the synchronous facade (``b2c_tooling_sdk.sync``).

Covers the persistent-loop runner, the object-wrapping proxy, and the barrel's
per-symbol classification (async wrap vs. sync-factory wrap vs. pass-through).
HTTP is mocked with ``respx``; the module-level token cache is reset per test by
the shared conftest, so the persistent-loop behaviour is what these assertions
actually exercise.
"""

from __future__ import annotations

import asyncio
from typing import Any

import httpx
import pytest
import respx

from b2c_tooling_sdk import resolve_config as async_resolve_config
from b2c_tooling_sdk import sync
from b2c_tooling_sdk.auth.oauth import OAuthConfig, OAuthStrategy
from b2c_tooling_sdk.clients.custom_apis import to_organization_id
from b2c_tooling_sdk.clients.metrics import MetricsClientConfig, create_metrics_client
from b2c_tooling_sdk.operations.metrics import get_overall_metrics as async_get_overall_metrics
from b2c_tooling_sdk.sync._proxy import SyncProxy, syncify
from b2c_tooling_sdk.sync._runner import run_sync
from tests.helpers.jwt import make_jwt

TOKEN_URL = "https://account.demandware.com/dwsso/oauth2/access_token"
SHORT_CODE = "kv7kzm78"
TENANT_ID = "bdpx_prd"


# --- helpers --------------------------------------------------------------------


def _token_response(scope: str = "sfcc.products", expires_in: int = 3600) -> httpx.Response:
    return httpx.Response(
        200,
        json={
            "access_token": make_jwt(expires_in=expires_in, scope=scope),
            "expires_in": expires_in,
            "scope": scope,
        },
    )


def _strategy(scopes: list[str] | None = None) -> OAuthStrategy:
    return OAuthStrategy(OAuthConfig(client_id="cid", client_secret="secret", scopes=scopes or ["sfcc.products"]))


class _FakeAuth:
    """Minimal SCAPI-capable auth strategy for building a metrics client."""

    def with_additional_scopes(self, scopes: list[str]) -> _FakeAuth:
        return self

    async def get_authorization_header(self) -> str:
        return "Bearer metrics-token"

    def invalidate_token(self) -> None:  # pragma: no cover - not exercised
        pass

    async def get_access_token_for_cascade(self, candidates: list[str]) -> str:  # pragma: no cover
        return "metrics-token"


def _metrics_url(segment: str) -> str:
    org = to_organization_id(TENANT_ID)
    base = f"https://{SHORT_CODE}.api.commercecloud.salesforce.com/observability/metrics/v1"
    return f"{base}/organizations/{org}/metrics/{segment}"


def _metric_body(timestamp_seconds: int = 1_700_000_000) -> dict[str, Any]:
    return {
        "data": [
            {
                "metricId": "totalCalls",
                "title": "Total Calls",
                "description": "desc",
                "unit": None,
                "dataSeries": [
                    {
                        "id": "bdpx.product",
                        "name": "bdpx.product",
                        "data": [{"timestamp": timestamp_seconds, "value": 1.0}],
                    }
                ],
            }
        ]
    }


def _make_sync_metrics_client() -> Any:
    return sync.create_metrics_client(
        MetricsClientConfig(short_code=SHORT_CODE, tenant_id=TENANT_ID),
        _FakeAuth(),
    )


# --- 1. run_sync: value + exception propagation ---------------------------------


def test_run_sync_returns_coroutine_value() -> None:
    async def coro() -> int:
        await asyncio.sleep(0)
        return 42

    assert run_sync(coro()) == 42


def test_run_sync_reraises_exception_synchronously() -> None:
    async def boom() -> None:
        await asyncio.sleep(0)
        raise ValueError("kaboom")

    with pytest.raises(ValueError, match="kaboom"):
        run_sync(boom())


# --- 2. persistent loop: no "bound to a different event loop" --------------------


@respx.mock
def test_same_token_path_twice_reuses_cache_no_loop_error() -> None:
    """Two mints of the same key hit the cache; a single persistent loop is proven
    by the second call not raising a cross-loop RuntimeError."""
    route = respx.post(TOKEN_URL).mock(return_value=_token_response())

    strategy = syncify(_strategy())
    first = strategy.get_token_response()
    second = strategy.get_token_response()

    assert route.call_count == 1  # cached
    assert not asyncio.iscoroutine(first)
    assert not asyncio.iscoroutine(second)


@respx.mock
def test_two_distinct_mints_reuse_persistent_loop() -> None:
    """Two mints with different cache keys each touch the module-level, loop-bound
    single-flight primitives; with asyncio.run-per-call the second would raise
    'bound to a different event loop'."""
    route = respx.post(TOKEN_URL).mock(side_effect=[_token_response("sfcc.products"), _token_response("sfcc.orders")])

    a = syncify(_strategy(["sfcc.products"]))
    b = syncify(_strategy(["sfcc.orders"]))
    header_a = a.get_authorization_header()
    header_b = b.get_authorization_header()

    assert route.call_count == 2
    assert header_a.startswith("Bearer ")
    assert header_b.startswith("Bearer ")


# --- 3. free function returns exactly what awaiting the async twin returns -------


@respx.mock
def test_metrics_free_function_matches_async() -> None:
    respx.get(_metrics_url("overall")).mock(return_value=httpx.Response(200, json=_metric_body()))

    sync_client = _make_sync_metrics_client()
    sync_result = sync.get_overall_metrics(sync_client, TENANT_ID)

    raw_client = create_metrics_client(
        MetricsClientConfig(short_code=SHORT_CODE, tenant_id=TENANT_ID),
        _FakeAuth(),  # type: ignore[arg-type]
    )
    async_result = run_sync(async_get_overall_metrics(raw_client, TENANT_ID))

    assert not asyncio.iscoroutine(sync_result)
    assert sync_result == async_result
    point = sync_result["data"][0]["dataSeries"][0]["data"][0]
    assert point["timestamp"] == 1_700_000_000 * 1000  # seconds -> ms normalization


def test_resolve_config_matches_async() -> None:
    sync_rc = sync.resolve_config()
    async_rc = run_sync(async_resolve_config())

    assert isinstance(sync_rc, SyncProxy)
    # ResolvedConfigImpl is a service object -> proxied; its sync methods still work.
    assert sync_rc.has_oauth_config() == async_rc.has_oauth_config()
    assert isinstance(sync_rc._async_target, type(async_rc))


# --- 4. factory-returned object's method blocks ---------------------------------


@respx.mock
def test_factory_object_method_blocks() -> None:
    org = to_organization_id(TENANT_ID)
    route = respx.get(_metrics_url("overall")).mock(return_value=httpx.Response(200, json={"ok": True}))

    client = _make_sync_metrics_client()
    assert isinstance(client, SyncProxy)

    result = client.get(f"/organizations/{org}/metrics/overall")

    assert route.called
    assert not asyncio.iscoroutine(result)
    assert result.data == {"ok": True}  # ClientResult is a dataclass -> passed through


# --- 5. pure-sync passthrough helpers work unwrapped ----------------------------


def test_pkce_passthrough_helpers() -> None:
    verifier = sync.generate_code_verifier()
    challenge = sync.generate_code_challenge(verifier)

    assert isinstance(verifier, str)
    assert isinstance(challenge, str)
    assert challenge  # non-empty derived challenge
    # Same underlying callables as the async package (re-exported as-is).
    assert sync.generate_code_challenge is __import__("b2c_tooling_sdk.slas", fromlist=["x"]).generate_code_challenge


def test_types_are_identical_objects() -> None:
    import b2c_tooling_sdk as async_sdk

    # Types/exceptions are the *same* objects so isinstance/error handling works.
    assert sync.OAuthStrategy is async_sdk.OAuthStrategy
    assert sync.MetricsClientConfig is async_sdk.MetricsClientConfig
    assert sync.to_organization_id is async_sdk.to_organization_id


# --- 6. typed SDK exception propagates synchronously ----------------------------


@respx.mock
def test_operation_error_propagates_synchronously() -> None:
    respx.get(_metrics_url("overall")).mock(
        return_value=httpx.Response(400, json={"detail": "bad window", "title": "Invalid"})
    )

    client = _make_sync_metrics_client()

    with pytest.raises(RuntimeError):
        sync.get_overall_metrics(client, TENANT_ID)
