# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Metrics operations for B2C Commerce (Observability).

Mirrors ``src/operations/metrics/index.ts``. Provides typed, high-level
functions for retrieving operational time-series metrics from the SCAPI
Observability Metrics API (``observability/metrics/v1``). Each metric *category*
has its own function; all return the same metrics-data-response envelope (as raw
JSON ``dict``).

Categories:

- :func:`get_overall_metrics` — overall application metrics
- :func:`get_sales_metrics` — sales metrics
- :func:`get_ecdn_metrics` — embedded CDN metrics
- :func:`get_third_party_metrics` — third-party service call metrics
- :func:`get_scapi_metrics` — SCAPI request metrics
- :func:`get_scapi_hooks_metrics` — SCAPI hook execution metrics
- :func:`get_mrt_metrics` — Managed Runtime metrics
- :func:`get_controller_metrics` — controller/pipeline metrics
- :func:`get_ocapi_metrics` — OCAPI request metrics

:func:`get_metrics_by_category` dispatches to the correct function by category
name.

The Metrics API wire format is epoch **seconds**; these operations convert
millisecond inputs to seconds on the way out and normalize response timestamps
back to **milliseconds** on the way in.

Authentication requires OAuth client-credentials with the ``sfcc.metrics`` admin
scope, attached automatically by :func:`create_metrics_client`.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

from b2c_tooling_sdk.clients import MetricsClient, get_api_error_message
from b2c_tooling_sdk.clients._core import ClientResult
from b2c_tooling_sdk.clients.custom_apis import to_organization_id
from b2c_tooling_sdk.logging import get_logger
from b2c_tooling_sdk.operations.logs.filter import parse_relative_time, parse_since_time
from b2c_tooling_sdk.operations.metrics.tags import (
    MetricSeriesTags,
    MetricsTagContext,
    MetricsTaggedResponse,
    enrich_metrics_tags,
    parse_series_tags,
)

#: All metric categories exposed by the Metrics API, in a stable, documented
#: order. Values match the API path segments (e.g. ``overall`` ->
#: ``/metrics/overall``).
METRIC_CATEGORIES: tuple[str, ...] = (
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

#: A metric category name. One of :data:`METRIC_CATEGORIES`.
MetricCategory = Literal[
    "overall",
    "sales",
    "ecdn",
    "third-party",
    "scapi",
    "scapi-hooks",
    "mrt",
    "controller",
    "ocapi",
]

#: A metrics bound as accepted from a CLI flag or MCP argument: a
#: :class:`datetime`, epoch **milliseconds**, or a human string — a relative
#: duration (``5m``, ``1h``, ``2d``, interpreted as "ago") or an ISO 8601
#: timestamp.
MetricsBoundInput = datetime | int | float | str

#: How far back the Metrics API retains data: ``from`` must be no older than
#: ``server_now - 30 days``, or the API returns 400. Value in milliseconds.
METRICS_RETENTION_MS = 30 * 24 * 60 * 60 * 1000

#: Default (and maximum) width of a metrics time window: 24 hours, in
#: milliseconds.
METRICS_DEFAULT_WINDOW_MS = 24 * 60 * 60 * 1000

#: Safety margin (milliseconds) kept *inside* the retention window when clamping
#: ``from``. 5 minutes comfortably covers latency and typical clock skew.
METRICS_RETENTION_SAFETY_MARGIN_MS = 5 * 60 * 1000


@dataclass
class MetricsTimeWindow:
    """Time-window options common to every metrics operation.

    Accepts either a :class:`datetime` or a number of **epoch milliseconds** (the
    same unit as ``Date.now()``) for both ``from_`` and ``to``. Both optional;
    when omitted the API applies its default window.
    """

    #: Start of the window — a :class:`datetime` or epoch milliseconds (inclusive).
    from_: datetime | int | float | None = None
    #: End of the window — a :class:`datetime` or epoch milliseconds (inclusive).
    to: datetime | int | float | None = None


@dataclass
class ThirdPartyMetricsOptions(MetricsTimeWindow):
    """Options for :func:`get_third_party_metrics`: time window plus a service filter."""

    #: Restrict results to a single third-party service by its id.
    third_party_service_id: str | None = None


@dataclass
class ScapiMetricsOptions(MetricsTimeWindow):
    """Options for :func:`get_scapi_metrics`: time window plus optional SCAPI filters."""

    #: Restrict results to a SCAPI API family (e.g. ``product``, ``checkout``).
    api_family: str | None = None
    #: Restrict results to a SCAPI API name (e.g. ``shopper-products``).
    api_name: str | None = None


@dataclass
class OcapiMetricsOptions(MetricsTimeWindow):
    """Options for :func:`get_ocapi_metrics`: time window plus optional OCAPI filters."""

    #: Restrict results to an OCAPI category (e.g. ``shop``, ``data``).
    ocapi_category: str | None = None
    #: Restrict results to a specific OCAPI API.
    ocapi_api: str | None = None


@dataclass
class MetricsQueryOptions(MetricsTimeWindow):
    """Union of every option shape accepted by :func:`get_metrics_by_category`."""

    #: Third-party service filter.
    third_party_service_id: str | None = None
    #: SCAPI API family filter.
    api_family: str | None = None
    #: SCAPI API name filter.
    api_name: str | None = None
    #: OCAPI category filter.
    ocapi_category: str | None = None
    #: OCAPI API filter.
    ocapi_api: str | None = None


@dataclass
class MetricsWindowInput:
    """Raw ``from``/``to``/``window`` inputs before resolution. Any subset may be provided."""

    #: Start bound (datetime, epoch ms, relative like ``7d``, or ISO 8601).
    from_: MetricsBoundInput | None = None
    #: End bound (datetime, epoch ms, relative like ``6h``, or ISO 8601).
    to: MetricsBoundInput | None = None
    #: Window duration as a relative string (``1h``, ``30m``, ``2d``) or a number
    #: of **milliseconds**.
    window: int | str | None = None


@dataclass
class ResolvedMetricsWindow:
    """A resolved metrics window. Both ``from_`` and ``to`` are always present."""

    #: Resolved start bound.
    from_: datetime
    #: Resolved end bound.
    to: datetime
    #: ISO 8601 form of :attr:`from_`.
    from_iso: str
    #: ISO 8601 form of :attr:`to`.
    to_iso: str
    #: Epoch **seconds** form of :attr:`from_` (the API wire unit).
    from_epoch_seconds: int
    #: Epoch **seconds** form of :attr:`to` (the API wire unit).
    to_epoch_seconds: int
    #: True when ``from_`` was clamped forward to stay inside the retention window.
    clamped_from: bool
    #: True when a bound was derived from the 24-hour default window rather than
    #: supplied by the caller.
    defaulted_window: bool


def _now_or_default(now: datetime | None) -> datetime:
    """Return ``now`` if supplied, else the current timezone-aware UTC time."""
    return now if now is not None else datetime.now(timezone.utc)


def parse_metrics_bound(value: MetricsBoundInput, now: datetime | None = None) -> datetime:
    """Parse a single metrics time bound (``from`` or ``to``) into a :class:`datetime`.

    Resolves a single bound in isolation; deriving the companion bound and
    applying the 24-hour default window is the job of :func:`resolve_metrics_window`.

    :param value: The bound: a :class:`datetime`, epoch milliseconds, a relative
        duration (``5m``/``1h``/``2d``, relative to ``now``), or an ISO 8601
        timestamp.
    :param now: Reference time for relative durations (defaults to the current
        time; injectable for deterministic tests).
    :raises ValueError: if a string value is neither a valid relative duration
        nor a parseable ISO 8601 timestamp.
    """
    reference = _now_or_default(now)
    if isinstance(value, datetime):
        return value
    if isinstance(value, bool):  # pragma: no cover - defensive; bool is an int subclass
        raise TypeError("Metrics bound cannot be a bool")
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value / 1000, tz=timezone.utc)
    return parse_since_time(value, reference)


def _parse_window_ms(window: int | str) -> int:
    """Parse a ``window``/``for`` duration into milliseconds.

    Accepts a relative string (``1h``, ``30m``, ``2d``) or a raw number of
    milliseconds.

    :raises ValueError: if a string is not a valid relative duration.
    """
    if isinstance(window, bool):  # pragma: no cover - defensive; bool is an int subclass
        raise TypeError("Window duration cannot be a bool")
    if isinstance(window, int):
        return window
    ms = parse_relative_time(window)
    if ms is None:
        raise ValueError(f'Invalid window duration: "{window}". Use a relative duration like "30m", "1h", or "2d".')
    return ms


def resolve_metrics_window(
    input: MetricsWindowInput | None = None,
    now: datetime | None = None,
) -> ResolvedMetricsWindow:
    """Resolve ``from``/``to``/``window`` inputs into concrete bounds for the Metrics API.

    Always produces an explicit ``from_``+``to`` pair. Resolution rules:

    - ``from`` + ``to`` — used as given; ``window`` must NOT also be set.
    - ``from`` + ``window`` — ``to = from + window``.
    - ``to`` + ``window`` — ``from = to - window``.
    - ``window`` only — the last ``window``: ``to = now``, ``from = now - window``.
    - ``from`` only — a 24-hour window forward: ``to = min(from + 24h, now)``.
    - ``to`` only — a 24-hour window back: ``from = to - 24h``.
    - nothing — the last 24 hours.

    A ``from`` at or beyond the 30-day retention floor is clamped *forward* to
    ``now - 30 days + margin`` so requests like ``--from 30d`` are not rejected by
    the server's slightly-later clock.

    :param input: The raw ``from``/``to``/``window`` inputs.
    :param now: Reference time for relative bounds, default/window modes, and the
        retention clamp (defaults to the current time; injectable for tests).
    :raises ValueError: if a bound or the window string is unparseable, if all
        three are supplied, or if the resolved ``from`` is after ``to``.
    """
    resolved_input = input if input is not None else MetricsWindowInput()
    reference = _now_or_default(now)

    has_from = resolved_input.from_ is not None and resolved_input.from_ != ""
    has_to = resolved_input.to is not None and resolved_input.to != ""
    has_window = resolved_input.window is not None and resolved_input.window != ""

    if has_from and has_to and has_window:
        raise ValueError("Specify at most two of from, to, and window — not all three.")

    # Clamp a `from` forward if it predates the retention floor, to survive the
    # server evaluating retention against its own (slightly later) clock.
    earliest_safe = reference - timedelta(milliseconds=METRICS_RETENTION_MS - METRICS_RETENTION_SAFETY_MARGIN_MS)
    clamped_flag = {"value": False}

    def clamp_from(d: datetime) -> datetime:
        if d < earliest_safe:
            clamped_flag["value"] = True
            return earliest_safe
        return d

    # Clamp a provided `from` up front so a window derived from it stays inside
    # retention (and a full-width window fits).
    from_: datetime | None = (
        clamp_from(parse_metrics_bound(resolved_input.from_, reference)) if has_from else None  # type: ignore[arg-type]
    )
    to: datetime | None = parse_metrics_bound(resolved_input.to, reference) if has_to else None  # type: ignore[arg-type]
    defaulted_window = False

    if has_window:
        window_ms = _parse_window_ms(resolved_input.window)  # type: ignore[arg-type]
        delta = timedelta(milliseconds=window_ms)
        if from_ is not None and to is None:
            to = from_ + delta
        elif to is not None and from_ is None:
            from_ = to - delta
        else:
            # window alone -> the last {window}
            to = reference
            from_ = reference - delta
    elif not (from_ is not None and to is not None):
        # No explicit window and at least one bound open -> fill it from the
        # 24-hour default window.
        defaulted_window = True
        default_delta = timedelta(milliseconds=METRICS_DEFAULT_WINDOW_MS)
        if from_ is not None and to is None:
            # A window forward from `from`, but never past `now` (no future data).
            to = min(from_ + default_delta, reference)
        elif to is not None and from_ is None:
            from_ = to - default_delta
        else:
            # Nothing supplied -> the last 24 hours.
            to = reference
            from_ = reference - default_delta

    # A `from` derived from `to` (via window or the default) may itself predate
    # retention; clamp it forward too. Idempotent for an already-clamped bound.
    assert from_ is not None
    assert to is not None
    from_ = clamp_from(from_)

    if from_ > to:
        raise ValueError(f"Invalid time window: from ({from_.isoformat()}) must be before to ({to.isoformat()}).")

    return ResolvedMetricsWindow(
        from_=from_,
        to=to,
        from_iso=from_.isoformat(),
        to_iso=to.isoformat(),
        from_epoch_seconds=_to_epoch_seconds(from_),
        to_epoch_seconds=_to_epoch_seconds(to),
        clamped_from=clamped_flag["value"],
        defaulted_window=defaulted_window,
    )


def _to_epoch_seconds(value: datetime | int | float) -> int:
    """Convert a millisecond time input (datetime or epoch ms) to epoch **seconds**."""
    ms = value.timestamp() * 1000 if isinstance(value, datetime) else value
    return math.floor(ms / 1000)


def _time_window_query(options: MetricsTimeWindow | None) -> dict[str, int | None]:
    """Normalize an optional time-window into a query object of epoch-second bounds."""
    query: dict[str, int | None] = {}
    if options is not None and options.from_ is not None:
        query["from"] = _to_epoch_seconds(options.from_)
    if options is not None and options.to is not None:
        query["to"] = _to_epoch_seconds(options.to)
    return query


def _normalize_response(data: dict[str, Any]) -> dict[str, Any]:
    """Rewrite every data point timestamp from epoch seconds to epoch milliseconds.

    Returns a new response object; the input is not mutated.
    """
    metrics: list[dict[str, Any]] = []
    for metric in data.get("data") or []:
        series_list: list[dict[str, Any]] = []
        for series in metric.get("dataSeries") or []:
            points = [{**point, "timestamp": point["timestamp"] * 1000} for point in series.get("data") or []]
            series_list.append({**series, "data": points})
        metrics.append({**metric, "dataSeries": series_list})
    return {**data, "data": metrics}


def _ensure_ok(result: ClientResult, category: MetricCategory) -> dict[str, Any]:
    """Raise a descriptive error on failure, else return the normalized response."""
    if result.error or result.data is None:
        response = result.response
        assert response is not None
        raise RuntimeError(f"Failed to get {category} metrics: {get_api_error_message(result.error, response)}")
    return _normalize_response(result.data)


async def get_overall_metrics(
    client: MetricsClient,
    tenant_id: str,
    options: MetricsTimeWindow | None = None,
) -> dict[str, Any]:
    """Retrieve overall application metrics for an organization.

    :raises RuntimeError: if the request fails.
    """
    get_logger("operations.metrics").debug("Fetching overall metrics (tenant=%s)", tenant_id)
    result = await client.get(
        "/organizations/{organizationId}/metrics/overall",
        {"params": {"path": {"organizationId": to_organization_id(tenant_id)}, "query": _time_window_query(options)}},
    )
    return _ensure_ok(result, "overall")


async def get_sales_metrics(
    client: MetricsClient,
    tenant_id: str,
    options: MetricsTimeWindow | None = None,
) -> dict[str, Any]:
    """Retrieve sales metrics for an organization.

    :raises RuntimeError: if the request fails.
    """
    get_logger("operations.metrics").debug("Fetching sales metrics (tenant=%s)", tenant_id)
    result = await client.get(
        "/organizations/{organizationId}/metrics/sales",
        {"params": {"path": {"organizationId": to_organization_id(tenant_id)}, "query": _time_window_query(options)}},
    )
    return _ensure_ok(result, "sales")


async def get_ecdn_metrics(
    client: MetricsClient,
    tenant_id: str,
    options: MetricsTimeWindow | None = None,
) -> dict[str, Any]:
    """Retrieve embedded CDN (eCDN) metrics for an organization.

    :raises RuntimeError: if the request fails.
    """
    get_logger("operations.metrics").debug("Fetching ecdn metrics (tenant=%s)", tenant_id)
    result = await client.get(
        "/organizations/{organizationId}/metrics/ecdn",
        {"params": {"path": {"organizationId": to_organization_id(tenant_id)}, "query": _time_window_query(options)}},
    )
    return _ensure_ok(result, "ecdn")


async def get_third_party_metrics(
    client: MetricsClient,
    tenant_id: str,
    options: ThirdPartyMetricsOptions | None = None,
) -> dict[str, Any]:
    """Retrieve third-party service call metrics for an organization.

    :raises RuntimeError: if the request fails.
    """
    get_logger("operations.metrics").debug("Fetching third-party metrics (tenant=%s)", tenant_id)
    result = await client.get(
        "/organizations/{organizationId}/metrics/third-party",
        {
            "params": {
                "path": {"organizationId": to_organization_id(tenant_id)},
                "query": {
                    **_time_window_query(options),
                    "thirdPartyServiceId": options.third_party_service_id if options else None,
                },
            }
        },
    )
    return _ensure_ok(result, "third-party")


async def get_scapi_metrics(
    client: MetricsClient,
    tenant_id: str,
    options: ScapiMetricsOptions | None = None,
) -> dict[str, Any]:
    """Retrieve SCAPI request metrics for an organization.

    :raises RuntimeError: if the request fails.
    """
    get_logger("operations.metrics").debug("Fetching scapi metrics (tenant=%s)", tenant_id)
    result = await client.get(
        "/organizations/{organizationId}/metrics/scapi",
        {
            "params": {
                "path": {"organizationId": to_organization_id(tenant_id)},
                "query": {
                    **_time_window_query(options),
                    "apiFamily": options.api_family if options else None,
                    "apiName": options.api_name if options else None,
                },
            }
        },
    )
    return _ensure_ok(result, "scapi")


async def get_scapi_hooks_metrics(
    client: MetricsClient,
    tenant_id: str,
    options: MetricsTimeWindow | None = None,
) -> dict[str, Any]:
    """Retrieve SCAPI hook execution metrics for an organization.

    :raises RuntimeError: if the request fails.
    """
    get_logger("operations.metrics").debug("Fetching scapi-hooks metrics (tenant=%s)", tenant_id)
    result = await client.get(
        "/organizations/{organizationId}/metrics/scapi-hooks",
        {"params": {"path": {"organizationId": to_organization_id(tenant_id)}, "query": _time_window_query(options)}},
    )
    return _ensure_ok(result, "scapi-hooks")


async def get_mrt_metrics(
    client: MetricsClient,
    tenant_id: str,
    options: MetricsTimeWindow | None = None,
) -> dict[str, Any]:
    """Retrieve Managed Runtime (MRT) metrics for an organization.

    :raises RuntimeError: if the request fails.
    """
    get_logger("operations.metrics").debug("Fetching mrt metrics (tenant=%s)", tenant_id)
    result = await client.get(
        "/organizations/{organizationId}/metrics/mrt",
        {"params": {"path": {"organizationId": to_organization_id(tenant_id)}, "query": _time_window_query(options)}},
    )
    return _ensure_ok(result, "mrt")


async def get_controller_metrics(
    client: MetricsClient,
    tenant_id: str,
    options: MetricsTimeWindow | None = None,
) -> dict[str, Any]:
    """Retrieve controller/pipeline metrics for an organization.

    :raises RuntimeError: if the request fails.
    """
    get_logger("operations.metrics").debug("Fetching controller metrics (tenant=%s)", tenant_id)
    result = await client.get(
        "/organizations/{organizationId}/metrics/controller",
        {"params": {"path": {"organizationId": to_organization_id(tenant_id)}, "query": _time_window_query(options)}},
    )
    return _ensure_ok(result, "controller")


async def get_ocapi_metrics(
    client: MetricsClient,
    tenant_id: str,
    options: OcapiMetricsOptions | None = None,
) -> dict[str, Any]:
    """Retrieve OCAPI request metrics for an organization.

    :raises RuntimeError: if the request fails.
    """
    get_logger("operations.metrics").debug("Fetching ocapi metrics (tenant=%s)", tenant_id)
    result = await client.get(
        "/organizations/{organizationId}/metrics/ocapi",
        {
            "params": {
                "path": {"organizationId": to_organization_id(tenant_id)},
                "query": {
                    **_time_window_query(options),
                    "ocapiCategory": options.ocapi_category if options else None,
                    "ocapiApi": options.ocapi_api if options else None,
                },
            }
        },
    )
    return _ensure_ok(result, "ocapi")


async def get_metrics_by_category(
    client: MetricsClient,
    tenant_id: str,
    category: MetricCategory,
    options: MetricsQueryOptions | None = None,
) -> dict[str, Any]:
    """Retrieve metrics for a category by name, dispatching to the category-specific function.

    Category-specific filters are applied only for the categories that support
    them and ignored otherwise.

    :raises RuntimeError: if the request fails.
    :raises ValueError: if the category is unknown.
    """
    if category == "overall":
        return await get_overall_metrics(client, tenant_id, options)
    if category == "sales":
        return await get_sales_metrics(client, tenant_id, options)
    if category == "ecdn":
        return await get_ecdn_metrics(client, tenant_id, options)
    if category == "third-party":
        return await get_third_party_metrics(
            client,
            tenant_id,
            ThirdPartyMetricsOptions(
                from_=options.from_ if options else None,
                to=options.to if options else None,
                third_party_service_id=options.third_party_service_id if options else None,
            )
            if options
            else None,
        )
    if category == "scapi":
        return await get_scapi_metrics(
            client,
            tenant_id,
            ScapiMetricsOptions(
                from_=options.from_ if options else None,
                to=options.to if options else None,
                api_family=options.api_family if options else None,
                api_name=options.api_name if options else None,
            )
            if options
            else None,
        )
    if category == "scapi-hooks":
        return await get_scapi_hooks_metrics(client, tenant_id, options)
    if category == "mrt":
        return await get_mrt_metrics(client, tenant_id, options)
    if category == "controller":
        return await get_controller_metrics(client, tenant_id, options)
    if category == "ocapi":
        return await get_ocapi_metrics(
            client,
            tenant_id,
            OcapiMetricsOptions(
                from_=options.from_ if options else None,
                to=options.to if options else None,
                ocapi_category=options.ocapi_category if options else None,
                ocapi_api=options.ocapi_api if options else None,
            )
            if options
            else None,
        )
    raise ValueError(f"Unknown metric category: {category}")


__all__ = [
    "METRICS_DEFAULT_WINDOW_MS",
    "METRICS_RETENTION_MS",
    "METRICS_RETENTION_SAFETY_MARGIN_MS",
    "METRIC_CATEGORIES",
    "MetricCategory",
    "MetricSeriesTags",
    "MetricsBoundInput",
    "MetricsQueryOptions",
    "MetricsTagContext",
    "MetricsTaggedResponse",
    "MetricsTimeWindow",
    "MetricsWindowInput",
    "OcapiMetricsOptions",
    "ResolvedMetricsWindow",
    "ScapiMetricsOptions",
    "ThirdPartyMetricsOptions",
    "enrich_metrics_tags",
    "get_controller_metrics",
    "get_ecdn_metrics",
    "get_metrics_by_category",
    "get_mrt_metrics",
    "get_ocapi_metrics",
    "get_overall_metrics",
    "get_sales_metrics",
    "get_scapi_hooks_metrics",
    "get_scapi_metrics",
    "get_third_party_metrics",
    "parse_metrics_bound",
    "parse_series_tags",
    "resolve_metrics_window",
]
