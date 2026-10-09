# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Client-side dimension extraction for Metrics API series.

Mirrors ``src/operations/metrics/tags.ts``.

The Metrics API returns each series as ``{id, name, data}``, where ``id``/``name``
pack every identifying dimension into a single display string using inconsistent
delimiters — e.g. ``bdpx.product`` (realm ``.`` apiFamily), ``bdpx.product HIT``
(realm ``.`` family `` `` cacheStatus), ``2xx bdpx.host`` (status class *before*
the realm), or ``bdpx.host.socketReadTimeout`` (realm ``.`` host — whose own dots
are ambiguous — ``.`` exceptionType). This makes the strings effectively
unparseable in general and awkward to chart, group, or merge across realms.

This module derives a structured, InfluxDB/Prometheus-style ``tags`` map for each
series so consumers can group and filter by dimension instead of regexing display
strings. Two design rules keep it robust:

1. **Identity comes from the request, not the string.** ``realm`` and
   ``environment`` are derived from the tenant/organization the request targeted
   (``f_ecom_bdpx_prd`` -> ``realm=bdpx``, ``environment=prd``), never scraped
   from the packed id.
2. **Never throw, never drop data.** An id that matches no known pattern still
   gets ``{realm, environment}`` plus the unrecognized remainder under ``series``,
   so enrichment only ever adds information.

This is an interim client-side convenience.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from re import IGNORECASE
from re import compile as re_compile
from typing import TYPE_CHECKING, Any

from b2c_tooling_sdk.clients.custom_apis import normalize_tenant_id
from b2c_tooling_sdk.logging import get_logger

if TYPE_CHECKING:
    from b2c_tooling_sdk.operations.metrics import MetricCategory

#: A flat map of a series' identifying dimensions (str -> str), following the
#: InfluxDB/Prometheus/CloudWatch "tag"/"label"/"dimension" convention.
#:
#: Always contains ``realm`` and ``environment`` (derived from the request
#: context). Category-specific keys (``apiFamily``, ``host``, ``cacheStatus``,
#: ``statusClass``, ``ocapiCategory``, ``controller``, ``exceptionType``) are
#: added when recognized. A rollup/aggregation series carries ``aggregation``.
#: An unrecognized remainder is preserved under ``series``.
MetricSeriesTags = dict[str, str]

#: A metrics response whose series carry the structured ``MetricSeriesTags``.
#: Structurally a superset of ``MetricsDataResponse`` (represented as raw JSON).
MetricsTaggedResponse = dict[str, Any]


@dataclass
class MetricsTagContext:
    """The request identity and applied filters used to derive authoritative tags.

    ``realm``/``environment`` are parsed from ``tenant_id``. The optional filter
    fields mirror the Metrics API's category filters; when a filter was sent, that
    dimension is *known from the request* and is stamped onto every series as an
    authoritative tag — rather than being (mis)parsed from a drilled-down series
    id.
    """

    #: Tenant or organization id the request targeted (with or without ``f_ecom_``).
    tenant_id: str
    #: The ``apiFamily`` filter sent with a scapi request, if any.
    api_family: str | None = None
    #: The ``apiName`` filter sent with a scapi request, if any.
    api_name: str | None = None
    #: The ``ocapiCategory`` filter sent with an ocapi request, if any.
    ocapi_category: str | None = None
    #: The ``ocapiApi`` filter sent with an ocapi request, if any.
    ocapi_api: str | None = None
    #: The ``thirdPartyServiceId`` filter sent with a third-party request, if any.
    third_party_service_id: str | None = None


#: Maps a :class:`MetricsTagContext` filter field to the tag key it authoritatively
#: sets when present. These override any value the string heuristics would infer.
FILTER_TAG_KEYS: list[tuple[str, str]] = [
    ("api_family", "apiFamily"),
    ("api_name", "apiName"),
    ("ocapi_category", "ocapiCategory"),
    ("ocapi_api", "ocapiApi"),
    ("third_party_service_id", "thirdPartyServiceId"),
]

_STATUS_CLASS_RE = re_compile(r"^[1-5]xx$")
_OVERALL_RE = re_compile(r"overall", IGNORECASE)


def _split_realm_environment(tenant_id: str) -> tuple[str, str | None]:
    """Split a normalized tenant id (``bdpx_prd``) into its realm and environment.

    The environment is the final underscore-delimited segment; everything before
    it is the realm. Ids without an underscore yield just a realm.
    """
    normalized = normalize_tenant_id(tenant_id)
    last_underscore = normalized.rfind("_")
    if last_underscore <= 0 or last_underscore == len(normalized) - 1:
        return normalized, None
    return normalized[:last_underscore], normalized[last_underscore + 1 :]


def _strip_realm_prefix(series_id: str, realm: str) -> str:
    """Strip a leading ``realm.`` or ``realm `` prefix from a packed series id, if present.

    Returns the input unchanged when no realm prefix matches.
    """
    if series_id.startswith(f"{realm}."):
        return series_id[len(realm) + 1 :]
    if series_id.startswith(f"{realm} "):
        return series_id[len(realm) + 1 :]
    return series_id


#: A category/metric-specific rule that extracts dimension tags from the portion
#: of a series id remaining after the realm prefix is stripped.
#:
#: Called with ``(remainder, raw_id, realm)`` and returns a map of extracted
#: dimension tags (may be empty).
SeriesTagExtractor = Callable[[str, str, str], MetricSeriesTags]


def _scapi_family_or_status(remainder: str, _raw_id: str, _realm: str) -> MetricSeriesTags:
    """Extract a bare API family, an HTTP status class (``2xx``), or the fallback id."""
    if _STATUS_CLASS_RE.match(remainder):
        return {"statusClass": remainder}
    return {"apiFamily": remainder}


def _scapi_request_latency(remainder: str, _raw_id: str, _realm: str) -> MetricSeriesTags:
    """``Average overall latency`` is a rollup, not a per-family series."""
    if _OVERALL_RE.search(remainder):
        return {"aggregation": "overall"}
    return {"apiFamily": remainder}


def _scapi_errors_4xx(remainder: str, _raw_id: str, _realm: str) -> MetricSeriesTags:
    return {"apiFamily": remainder}


def _scapi_cache_hit_rate(remainder: str, _raw_id: str, _realm: str) -> MetricSeriesTags:
    """``bdpx.product HIT`` / ``bdpx.custom MISS`` -> apiFamily + cacheStatus."""
    space_idx = remainder.rfind(" ")
    if space_idx > 0:
        return {"apiFamily": remainder[:space_idx], "cacheStatus": remainder[space_idx + 1 :]}
    return {"apiFamily": remainder}


def _ocapi_category(remainder: str, _raw_id: str, _realm: str) -> MetricSeriesTags:
    """``bdpx.shop`` -> ocapiCategory=shop."""
    return {"ocapiCategory": remainder}


def _controller(remainder: str, _raw_id: str, _realm: str) -> MetricSeriesTags:
    """``bdpx.Home-Show`` -> controller=Home-Show (applies to every controller metric)."""
    return {"controller": remainder}


def _third_party_host(remainder: str, _raw_id: str, _realm: str) -> MetricSeriesTags:
    """``bdpx.login.salesforce.com`` -> host; the host itself contains dots."""
    return {"host": remainder}


def _third_party_remote_exceptions(remainder: str, _raw_id: str, _realm: str) -> MetricSeriesTags:
    """``bdpx.host.socketReadTimeout`` -> host + exceptionType.

    The exception type is the final dot-segment; everything before it is the
    (dotted) host. Only unambiguous because we key on the remoteExceptions metric.
    """
    last_dot = remainder.rfind(".")
    if last_dot > 0:
        return {"host": remainder[:last_dot], "exceptionType": remainder[last_dot + 1 :]}
    return {"host": remainder}


def _ecdn_success_and_error(_remainder: str, raw_id: str, realm: str) -> MetricSeriesTags:
    """``2xx bdpx.host`` (status class BEFORE the realm) -> statusClass + host.

    Other eCDN metrics are just ``bdpx.host`` -> host. Operates on the raw id
    because the realm is not a leading prefix here.
    """
    space_idx = raw_id.find(" ")
    if space_idx > 0:
        status_class = raw_id[:space_idx]
        host = _strip_realm_prefix(raw_id[space_idx + 1 :], realm)
        return {"statusClass": status_class, "host": host}
    return {"host": _strip_realm_prefix(raw_id, realm)}


def _ecdn_host(remainder: str, _raw_id: str, _realm: str) -> MetricSeriesTags:
    return {"host": remainder}


#: Per-category, per-metric extraction rules. Keyed by ``category`` then
#: ``metricId``; a category-level ``*`` entry applies to any metric not explicitly
#: listed. Rules operate on the realm-stripped remainder; returning ``{}`` means
#: "no extra dimensions, just the context tags."
EXTRACTORS: dict[str, dict[str, SeriesTagExtractor]] = {
    "scapi": {
        "totalCalls": _scapi_family_or_status,
        "requestLatency": _scapi_request_latency,
        "responseCount": _scapi_family_or_status,
        "errors4xx": _scapi_errors_4xx,
        "cacheHitRate": _scapi_cache_hit_rate,
    },
    "ocapi": {
        "totalCalls": _ocapi_category,
        "callsMean": _ocapi_category,
    },
    "controller": {
        "*": _controller,
    },
    "third-party": {
        "callsCount": _third_party_host,
        "callsP95": _third_party_host,
        "remoteExceptions": _third_party_remote_exceptions,
    },
    "ecdn": {
        "successAndError": _ecdn_success_and_error,
        "*": _ecdn_host,
    },
}


def parse_series_tags(
    *,
    category: MetricCategory,
    metric_id: str,
    series_id: str,
    context: MetricsTagContext,
) -> MetricSeriesTags:
    """Extract the dimension tags for a single series id.

    Combines three tiers, most-authoritative last:

    1. **Request identity** — ``realm``/``environment`` from the tenant id.
    2. **String heuristics** — category/metric-specific dimensions parsed from the
       packed id, or the raw remainder under ``series`` when no rule matches.
    3. **Applied filters** — any filter that was sent with the request
       (:class:`MetricsTagContext`) is stamped last, overriding a heuristic guess.

    The result is always a superset of the request context and never throws.
    """
    realm, environment = _split_realm_environment(context.tenant_id)

    tags: MetricSeriesTags = {"realm": realm}
    if environment:
        tags["environment"] = environment

    category_rules = EXTRACTORS.get(category)
    extractor: SeriesTagExtractor | None = None
    if category_rules is not None:
        extractor = category_rules.get(metric_id) or category_rules.get("*")
    remainder = _strip_realm_prefix(series_id, realm)

    if extractor is not None:
        tags.update(extractor(remainder, series_id, realm))
    elif remainder and remainder != metric_id:
        # No rule for this category/metric. Preserve the (realm-stripped)
        # remainder so nothing is lost, unless it is just the metric id echoed
        # back (a value-less fallback series).
        tags["series"] = remainder

    # Applied filters are authoritative — stamp them last so they override any
    # heuristic guess from a drilled-down id.
    for field_name, key in FILTER_TAG_KEYS:
        value = getattr(context, field_name)
        if value:
            tags[key] = value

    return tags


def enrich_metrics_tags(
    response: dict[str, Any],
    category: MetricCategory,
    context: MetricsTagContext,
) -> MetricsTaggedResponse:
    """Enrich a metrics response by adding a structured ``tags`` map to every series.

    Returns a new response (the input is not mutated). Walks every metric and
    series and attaches ``series["tags"]`` derived from the series id, the metric
    id, the category, and the request context. Existing fields (``id``, ``name``,
    ``data``) are preserved exactly, so the enriched response is a structural
    superset. The category must be supplied because a metrics response does not
    carry it (it is implied by the endpoint that produced the response).
    """
    unparsed = 0
    data: list[dict[str, Any]] = []
    for metric in response.get("data") or []:
        new_series: list[dict[str, Any]] = []
        for series in metric.get("dataSeries") or []:
            tags = parse_series_tags(
                category=category,
                metric_id=metric["metricId"],
                series_id=series["id"],
                context=context,
            )
            # Count series where no dimension beyond identity was recovered, to
            # log once about incomplete coverage without failing.
            has_dimension = any(k not in ("realm", "environment") for k in tags)
            if not has_dimension:
                unparsed += 1
            new_series.append({**series, "tags": tags})
        data.append({**metric, "dataSeries": new_series})

    if unparsed > 0:
        get_logger("operations.metrics").debug(
            "enrichMetricsTags: %d series yielded only identity tags "
            "(no category dimensions) for category=%s tenant=%s",
            unparsed,
            category,
            context.tenant_id,
        )

    return {**response, "data": data}


__all__ = [
    "EXTRACTORS",
    "FILTER_TAG_KEYS",
    "MetricSeriesTags",
    "MetricsTagContext",
    "MetricsTaggedResponse",
    "SeriesTagExtractor",
    "enrich_metrics_tags",
    "parse_series_tags",
]
