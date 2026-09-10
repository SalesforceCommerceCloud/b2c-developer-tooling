# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Log entry filtering helpers.

Mirrors ``src/operations/logs/filter.ts``.

:func:`parse_since_time` and :func:`parse_relative_time` are also consumed by
the ``metrics`` operation, so their signatures are kept faithful to the TS:
``now`` is an injectable reference time (defaulting to the current time) so
callers get deterministic behavior in tests without needing to patch
:func:`datetime.now`.
"""

from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone

from b2c_tooling_sdk.operations.logs.types import LogEntry

_RELATIVE_TIME_RE = re.compile(r"^(\d+)([mhd])$", re.IGNORECASE)


def parse_relative_time(time_str: str) -> int | None:
    """Parse a relative time string (e.g., "5m", "1h", "2d") into milliseconds.

    :returns: The duration in milliseconds, or ``None`` if ``time_str`` is not a
        valid relative time format.
    """
    match = _RELATIVE_TIME_RE.match(time_str)
    if not match:
        return None

    value = int(match[1])
    unit = match[2].lower()

    if unit == "d":
        return value * 24 * 60 * 60 * 1000
    if unit == "h":
        return value * 60 * 60 * 1000
    if unit == "m":
        return value * 60 * 1000
    return None  # pragma: no cover - unreachable, regex only matches m/h/d


def parse_since_time(since_str: str, now: datetime | None = None) -> datetime:
    """Parse a ``since`` value into a :class:`datetime`.

    Supports:

    - Relative times: "5m", "1h", "2d"
    - ISO 8601: "2026-01-25T10:00:00"

    :param since_str: The value to parse.
    :param now: Reference time for relative values (defaults to the current,
        timezone-aware UTC time). Injectable so callers that resolve several
        bounds together, or that need deterministic behavior in tests, can pin
        a single "now". If a naive (tzinfo-less) value is passed, it is used
        as-is for relative-time arithmetic.
    :raises ValueError: if ``since_str`` is neither a valid relative time nor a
        valid ISO 8601 timestamp.
    """
    reference = now if now is not None else datetime.now(timezone.utc)

    relative_ms = parse_relative_time(since_str)
    if relative_ms is not None:
        return reference - timedelta(milliseconds=relative_ms)

    parsed = _parse_iso8601(since_str)
    if parsed is None:
        raise ValueError(
            f'Invalid --since value: "{since_str}". Use relative time (e.g., "5m", "1h", "2d") '
            'or ISO 8601 (e.g., "2026-01-25T10:00:00")'
        )

    # Log timestamps parsed elsewhere (parse_log_timestamp) are always
    # timezone-aware (UTC, from the "GMT" suffix), so normalize a naive ISO
    # 8601 input the same way to keep comparisons (e.g. in filter_by_since)
    # well-defined.
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)

    return parsed


def _parse_iso8601(value: str) -> datetime | None:
    """Parse an ISO 8601 timestamp, returning ``None`` on failure."""
    text = value.strip()
    if not text:
        return None
    # datetime.fromisoformat (3.11+) accepts "Z"; support older behavior too.
    candidate = text[:-1] + "+00:00" if text.endswith("Z") else text
    try:
        return datetime.fromisoformat(candidate)
    except ValueError:
        return None


def parse_log_timestamp(timestamp: str) -> datetime | None:
    """Parse a B2C log timestamp into a :class:`datetime`.

    Expected format: "2025-01-25 10:30:45.123 GMT".
    """
    iso_format = timestamp.replace(" GMT", "Z").replace(" ", "T", 1)
    parsed = _parse_iso8601(iso_format)
    return parsed


def filter_by_since(entries: list[LogEntry], since: datetime) -> list[LogEntry]:
    """Filter entries by timestamp."""

    def _keep(entry: LogEntry) -> bool:
        if not entry.timestamp:
            return True
        entry_date = parse_log_timestamp(entry.timestamp)
        return entry_date is None or entry_date >= since

    return [entry for entry in entries if _keep(entry)]


def filter_by_level(entries: list[LogEntry], levels: list[str]) -> list[LogEntry]:
    """Filter entries by log level."""
    upper_levels = {level.upper() for level in levels}
    return [entry for entry in entries if entry.level and entry.level.upper() in upper_levels]


def filter_by_search(entries: list[LogEntry], search: str) -> list[LogEntry]:
    """Filter entries by text search (case-insensitive substring match)."""
    lower_search = search.lower()
    return [entry for entry in entries if lower_search in entry.message.lower() or lower_search in entry.raw.lower()]


def matches_level(entry: LogEntry, levels: list[str]) -> bool:
    """Check if a single entry matches the specified log levels.

    Used for streaming/tail scenarios where entries are filtered one at a time.
    """
    if not entry.level:
        return False
    upper_levels = {level.upper() for level in levels}
    return entry.level.upper() in upper_levels


def matches_search(entry: LogEntry, search: str) -> bool:
    """Check if a single entry matches the search text (case-insensitive).

    Used for streaming/tail scenarios where entries are filtered one at a time.
    """
    lower_search = search.lower()
    return lower_search in entry.message.lower() or lower_search in entry.raw.lower()


__all__ = [
    "filter_by_level",
    "filter_by_search",
    "filter_by_since",
    "matches_level",
    "matches_search",
    "parse_log_timestamp",
    "parse_relative_time",
    "parse_since_time",
]
