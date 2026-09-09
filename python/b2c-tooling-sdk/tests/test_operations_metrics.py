# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the metrics operations (``operations/metrics``).

Mirrors ``packages/b2c-tooling-sdk/test/operations/metrics/*``: the category
fetch functions, the by-category dispatcher, the bound/window resolution math
(with an injected fixed ``now`` for determinism), and the client-side tag
enrichment.
"""

from __future__ import annotations

from collections.abc import Callable, Coroutine
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
import pytest
import respx

from b2c_tooling_sdk.clients.custom_apis import to_organization_id
from b2c_tooling_sdk.clients.metrics import MetricsClientConfig, create_metrics_client
from b2c_tooling_sdk.operations.metrics import (
    METRIC_CATEGORIES,
    METRICS_DEFAULT_WINDOW_MS,
    METRICS_RETENTION_MS,
    METRICS_RETENTION_SAFETY_MARGIN_MS,
    MetricsQueryOptions,
    MetricsTagContext,
    MetricsWindowInput,
    ScapiMetricsOptions,
    ThirdPartyMetricsOptions,
    enrich_metrics_tags,
    get_controller_metrics,
    get_ecdn_metrics,
    get_metrics_by_category,
    get_mrt_metrics,
    get_ocapi_metrics,
    get_overall_metrics,
    get_sales_metrics,
    get_scapi_hooks_metrics,
    get_scapi_metrics,
    get_third_party_metrics,
    parse_metrics_bound,
    parse_series_tags,
    resolve_metrics_window,
)

SHORT_CODE = "kv7kzm78"
TENANT_ID = "bdpx_prd"
FIXED_NOW = datetime(2026, 1, 25, 12, 0, 0, tzinfo=timezone.utc)


class _FakeAuth:
    """Minimal SCAPI-capable auth strategy for building a metrics client."""

    def __init__(self) -> None:
        self.merged: list[str] | None = None

    def with_additional_scopes(self, scopes: list[str]) -> _FakeAuth:
        self.merged = scopes
        return self

    async def get_authorization_header(self) -> str:
        return "Bearer metrics-token"

    def invalidate_token(self) -> None:  # pragma: no cover - not exercised
        pass

    async def get_access_token_for_cascade(self, candidates: list[str]) -> str:  # pragma: no cover
        return "metrics-token"


def _make_client() -> Any:
    return create_metrics_client(
        MetricsClientConfig(short_code=SHORT_CODE, tenant_id=TENANT_ID),
        _FakeAuth(),  # type: ignore[arg-type]
    )


def _metric_body(timestamp_seconds: int = 1_700_000_000) -> dict[str, Any]:
    """A minimal metrics response body with a single series data point (in seconds)."""
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


def _url(segment: str) -> str:
    org = to_organization_id(TENANT_ID)
    base = f"https://{SHORT_CODE}.api.commercecloud.salesforce.com/observability/metrics/v1"
    return f"{base}/organizations/{org}/metrics/{segment}"


# category value -> fetch function (path segment equals category value)
GetFn = Callable[..., Coroutine[Any, Any, dict[str, Any]]]
CATEGORY_FUNCS: dict[str, GetFn] = {
    "overall": get_overall_metrics,
    "sales": get_sales_metrics,
    "ecdn": get_ecdn_metrics,
    "third-party": get_third_party_metrics,
    "scapi": get_scapi_metrics,
    "scapi-hooks": get_scapi_hooks_metrics,
    "mrt": get_mrt_metrics,
    "controller": get_controller_metrics,
    "ocapi": get_ocapi_metrics,
}


# --- METRIC_CATEGORIES ----------------------------------------------------------


def test_metric_categories_stable_order() -> None:
    assert METRIC_CATEGORIES == (
        "overall",
        "sales",
        "ecdn",
        "third-party",
        "scapi",
        "scapi-hooks",
        "mrt",
        "controller",
        "ocapi",
    )
    # Every category has a corresponding fetch function.
    assert set(CATEGORY_FUNCS) == set(METRIC_CATEGORIES)


# --- get_* success + error ------------------------------------------------------


@pytest.mark.parametrize("category", list(METRIC_CATEGORIES))
@respx.mock
async def test_get_metrics_success_normalizes_timestamps(category: str) -> None:
    client = _make_client()
    route = respx.get(_url(category)).mock(return_value=httpx.Response(200, json=_metric_body(1_700_000_000)))

    result = await CATEGORY_FUNCS[category](client, TENANT_ID)

    assert route.called
    assert route.calls.last.request.headers["Authorization"] == "Bearer metrics-token"
    # Seconds -> milliseconds normalization on the way in.
    point = result["data"][0]["dataSeries"][0]["data"][0]
    assert point["timestamp"] == 1_700_000_000 * 1000
    assert point["value"] == 1.0


@pytest.mark.parametrize("category", list(METRIC_CATEGORIES))
@respx.mock
async def test_get_metrics_error_raises(category: str) -> None:
    client = _make_client()
    respx.get(_url(category)).mock(return_value=httpx.Response(400, json={"detail": "bad window", "title": "Invalid"}))

    with pytest.raises(RuntimeError) as excinfo:
        await CATEGORY_FUNCS[category](client, TENANT_ID)

    assert f"Failed to get {category} metrics" in str(excinfo.value)
    assert "bad window" in str(excinfo.value)


@respx.mock
async def test_get_metrics_time_window_query_in_seconds() -> None:
    client = _make_client()
    route = respx.get(_url("overall")).mock(return_value=httpx.Response(200, json=_metric_body()))

    from_ms = int(FIXED_NOW.timestamp() * 1000)
    to_dt = FIXED_NOW + timedelta(hours=1)
    await get_overall_metrics(client, TENANT_ID, _time_window(from_ms, to_dt))

    params = route.calls.last.request.url.params
    assert params["from"] == str(int(FIXED_NOW.timestamp()))
    assert params["to"] == str(int(to_dt.timestamp()))


def _time_window(from_: Any, to: Any) -> MetricsQueryOptions:
    return MetricsQueryOptions(from_=from_, to=to)


@respx.mock
async def test_get_third_party_metrics_passes_filter() -> None:
    client = _make_client()
    route = respx.get(_url("third-party")).mock(return_value=httpx.Response(200, json=_metric_body()))

    await get_third_party_metrics(client, TENANT_ID, ThirdPartyMetricsOptions(third_party_service_id="svc-1"))

    assert route.calls.last.request.url.params["thirdPartyServiceId"] == "svc-1"


@respx.mock
async def test_get_scapi_metrics_passes_filters() -> None:
    client = _make_client()
    route = respx.get(_url("scapi")).mock(return_value=httpx.Response(200, json=_metric_body()))

    await get_scapi_metrics(client, TENANT_ID, ScapiMetricsOptions(api_family="product", api_name="shopper-products"))

    params = route.calls.last.request.url.params
    assert params["apiFamily"] == "product"
    assert params["apiName"] == "shopper-products"


# --- get_metrics_by_category ----------------------------------------------------


@pytest.mark.parametrize("category", list(METRIC_CATEGORIES))
@respx.mock
async def test_get_metrics_by_category_dispatches(category: str) -> None:
    client = _make_client()
    route = respx.get(_url(category)).mock(return_value=httpx.Response(200, json=_metric_body()))

    result = await get_metrics_by_category(client, TENANT_ID, category)  # type: ignore[arg-type]

    assert route.called
    assert result["data"][0]["metricId"] == "totalCalls"


@respx.mock
async def test_get_metrics_by_category_forwards_scapi_filters() -> None:
    client = _make_client()
    route = respx.get(_url("scapi")).mock(return_value=httpx.Response(200, json=_metric_body()))

    await get_metrics_by_category(client, TENANT_ID, "scapi", MetricsQueryOptions(api_family="checkout"))

    assert route.calls.last.request.url.params["apiFamily"] == "checkout"


@respx.mock
async def test_get_metrics_by_category_forwards_ocapi_filters() -> None:
    client = _make_client()
    route = respx.get(_url("ocapi")).mock(return_value=httpx.Response(200, json=_metric_body()))

    await get_metrics_by_category(client, TENANT_ID, "ocapi", MetricsQueryOptions(ocapi_category="shop"))

    assert route.calls.last.request.url.params["ocapiCategory"] == "shop"


async def test_get_metrics_by_category_unknown_raises() -> None:
    client = _make_client()
    with pytest.raises(ValueError, match="Unknown metric category"):
        await get_metrics_by_category(client, TENANT_ID, "bogus")  # type: ignore[arg-type]


# --- parse_metrics_bound --------------------------------------------------------


def test_parse_metrics_bound_relative() -> None:
    assert parse_metrics_bound("2d", FIXED_NOW) == FIXED_NOW - timedelta(days=2)


def test_parse_metrics_bound_iso() -> None:
    assert parse_metrics_bound("2026-01-20T00:00:00Z", FIXED_NOW) == datetime(2026, 1, 20, 0, 0, 0, tzinfo=timezone.utc)


def test_parse_metrics_bound_epoch_ms() -> None:
    ms = int(FIXED_NOW.timestamp() * 1000)
    assert parse_metrics_bound(ms, FIXED_NOW) == FIXED_NOW


def test_parse_metrics_bound_datetime_passthrough() -> None:
    dt = datetime(2025, 6, 1, tzinfo=timezone.utc)
    assert parse_metrics_bound(dt, FIXED_NOW) is dt


def test_parse_metrics_bound_invalid_raises() -> None:
    with pytest.raises(ValueError):
        parse_metrics_bound("not-a-time", FIXED_NOW)


# --- resolve_metrics_window -----------------------------------------------------


def test_resolve_window_default_24h() -> None:
    w = resolve_metrics_window(None, FIXED_NOW)
    assert w.to == FIXED_NOW
    assert w.from_ == FIXED_NOW - timedelta(milliseconds=METRICS_DEFAULT_WINDOW_MS)
    assert w.defaulted_window is True
    assert w.clamped_from is False


def test_resolve_window_explicit_from_to() -> None:
    from_dt = FIXED_NOW - timedelta(hours=3)
    to_dt = FIXED_NOW - timedelta(hours=1)
    w = resolve_metrics_window(MetricsWindowInput(from_=from_dt, to=to_dt), FIXED_NOW)
    assert w.from_ == from_dt
    assert w.to == to_dt
    assert w.defaulted_window is False


def test_resolve_window_from_plus_window() -> None:
    from_dt = FIXED_NOW - timedelta(days=7)
    w = resolve_metrics_window(MetricsWindowInput(from_=from_dt, window="1h"), FIXED_NOW)
    assert w.to == from_dt + timedelta(hours=1)
    assert w.defaulted_window is False


def test_resolve_window_to_plus_window() -> None:
    to_dt = FIXED_NOW - timedelta(hours=1)
    w = resolve_metrics_window(MetricsWindowInput(to=to_dt, window="30m"), FIXED_NOW)
    assert w.from_ == to_dt - timedelta(minutes=30)


def test_resolve_window_window_only() -> None:
    w = resolve_metrics_window(MetricsWindowInput(window="2h"), FIXED_NOW)
    assert w.to == FIXED_NOW
    assert w.from_ == FIXED_NOW - timedelta(hours=2)


def test_resolve_window_from_only_never_exceeds_now() -> None:
    # `from` 1h ago; forward 24h would exceed now, so `to` is clamped to now.
    from_dt = FIXED_NOW - timedelta(hours=1)
    w = resolve_metrics_window(MetricsWindowInput(from_=from_dt), FIXED_NOW)
    assert w.to == FIXED_NOW
    assert w.defaulted_window is True


def test_resolve_window_to_only() -> None:
    to_dt = FIXED_NOW - timedelta(hours=2)
    w = resolve_metrics_window(MetricsWindowInput(to=to_dt), FIXED_NOW)
    assert w.from_ == to_dt - timedelta(milliseconds=METRICS_DEFAULT_WINDOW_MS)
    assert w.defaulted_window is True


def test_resolve_window_retention_clamp_with_safety_margin() -> None:
    # `from` 40 days ago predates the 30-day retention floor -> clamped forward.
    w = resolve_metrics_window(MetricsWindowInput(from_="40d"), FIXED_NOW)
    earliest_safe = FIXED_NOW - timedelta(milliseconds=METRICS_RETENTION_MS - METRICS_RETENTION_SAFETY_MARGIN_MS)
    assert w.from_ == earliest_safe
    assert w.clamped_from is True


def test_resolve_window_no_clamp_inside_retention() -> None:
    w = resolve_metrics_window(MetricsWindowInput(from_="2d"), FIXED_NOW)
    assert w.clamped_from is False


def test_resolve_window_all_three_raises() -> None:
    with pytest.raises(ValueError, match="at most two"):
        resolve_metrics_window(MetricsWindowInput(from_="2d", to=FIXED_NOW, window="1h"), FIXED_NOW)


def test_resolve_window_from_after_to_raises() -> None:
    with pytest.raises(ValueError, match="must be before"):
        resolve_metrics_window(MetricsWindowInput(from_=FIXED_NOW, to=FIXED_NOW - timedelta(hours=1)), FIXED_NOW)


def test_resolve_window_epoch_seconds_echoes() -> None:
    from_dt = FIXED_NOW - timedelta(hours=2)
    to_dt = FIXED_NOW
    w = resolve_metrics_window(MetricsWindowInput(from_=from_dt, to=to_dt), FIXED_NOW)
    assert w.from_epoch_seconds == int(from_dt.timestamp())
    assert w.to_epoch_seconds == int(to_dt.timestamp())
    assert w.from_iso == from_dt.isoformat()


def test_resolve_window_epoch_ms_input_converted_to_seconds() -> None:
    from_ms = int((FIXED_NOW - timedelta(hours=1)).timestamp() * 1000)
    to_ms = int(FIXED_NOW.timestamp() * 1000)
    w = resolve_metrics_window(MetricsWindowInput(from_=from_ms, to=to_ms), FIXED_NOW)
    assert w.from_epoch_seconds == from_ms // 1000
    assert w.to_epoch_seconds == to_ms // 1000


def test_resolve_window_invalid_window_raises() -> None:
    with pytest.raises(ValueError, match="Invalid window duration"):
        resolve_metrics_window(MetricsWindowInput(window="nope"), FIXED_NOW)


# --- parse_series_tags ----------------------------------------------------------


def test_parse_series_tags_scapi_cache_hit_rate() -> None:
    tags = parse_series_tags(
        category="scapi",
        metric_id="cacheHitRate",
        series_id="bdpx.product HIT",
        context=MetricsTagContext(tenant_id="f_ecom_bdpx_prd"),
    )
    assert tags == {"realm": "bdpx", "environment": "prd", "apiFamily": "product", "cacheStatus": "HIT"}


def test_parse_series_tags_scapi_status_class() -> None:
    tags = parse_series_tags(
        category="scapi",
        metric_id="totalCalls",
        series_id="bdpx 2xx",
        context=MetricsTagContext(tenant_id="f_ecom_bdpx_prd"),
    )
    assert tags["statusClass"] == "2xx"
    assert "apiFamily" not in tags


def test_parse_series_tags_ecdn_status_before_realm() -> None:
    tags = parse_series_tags(
        category="ecdn",
        metric_id="successAndError",
        series_id="2xx bdpx.www.example.com",
        context=MetricsTagContext(tenant_id="f_ecom_bdpx_prd"),
    )
    assert tags["statusClass"] == "2xx"
    assert tags["host"] == "www.example.com"


def test_parse_series_tags_third_party_remote_exceptions() -> None:
    tags = parse_series_tags(
        category="third-party",
        metric_id="remoteExceptions",
        series_id="bdpx.login.salesforce.com.socketReadTimeout",
        context=MetricsTagContext(tenant_id="f_ecom_bdpx_prd"),
    )
    assert tags["host"] == "login.salesforce.com"
    assert tags["exceptionType"] == "socketReadTimeout"


def test_parse_series_tags_filter_overrides_heuristic() -> None:
    # Drill-down id `bdpx.shopper.auth.v1` with apiFamily filter -> filter wins.
    tags = parse_series_tags(
        category="scapi",
        metric_id="totalCalls",
        series_id="bdpx.shopper.auth.v1",
        context=MetricsTagContext(tenant_id="f_ecom_bdpx_prd", api_family="shopper"),
    )
    assert tags["apiFamily"] == "shopper"


def test_parse_series_tags_unrecognized_preserved_as_series() -> None:
    tags = parse_series_tags(
        category="sales",
        metric_id="revenue",
        series_id="bdpx.someDimension",
        context=MetricsTagContext(tenant_id="f_ecom_bdpx_prd"),
    )
    assert tags["series"] == "someDimension"


def test_parse_series_tags_realm_without_environment() -> None:
    tags = parse_series_tags(
        category="controller",
        metric_id="responseTime",
        series_id="bdpx.Home-Show",
        context=MetricsTagContext(tenant_id="bdpx"),
    )
    assert tags == {"realm": "bdpx", "controller": "Home-Show"}


# --- enrich_metrics_tags --------------------------------------------------------


def test_enrich_metrics_tags_adds_tags_and_preserves_fields() -> None:
    response = {
        "data": [
            {
                "metricId": "cacheHitRate",
                "title": "Cache Hit Rate",
                "description": "desc",
                "dataSeries": [
                    {"id": "bdpx.product HIT", "name": "bdpx.product HIT", "data": [{"timestamp": 1, "value": 2.0}]}
                ],
            }
        ]
    }
    enriched = enrich_metrics_tags(response, "scapi", MetricsTagContext(tenant_id="f_ecom_bdpx_prd"))

    series = enriched["data"][0]["dataSeries"][0]
    assert series["tags"] == {
        "realm": "bdpx",
        "environment": "prd",
        "apiFamily": "product",
        "cacheStatus": "HIT",
    }
    # Original fields preserved and input not mutated.
    assert series["id"] == "bdpx.product HIT"
    assert series["data"] == [{"timestamp": 1, "value": 2.0}]
    assert "tags" not in response["data"][0]["dataSeries"][0]


def test_enrich_metrics_tags_identity_only_series() -> None:
    # A series whose remainder equals the metric id yields only identity tags.
    response = {
        "data": [
            {
                "metricId": "someMetric",
                "title": "t",
                "description": "d",
                "dataSeries": [{"id": "bdpx.someMetric", "name": "bdpx.someMetric", "data": []}],
            }
        ]
    }
    enriched = enrich_metrics_tags(response, "sales", MetricsTagContext(tenant_id="f_ecom_bdpx_prd"))
    assert enriched["data"][0]["dataSeries"][0]["tags"] == {"realm": "bdpx", "environment": "prd"}
