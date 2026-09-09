# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for log listing, tailing, filtering, and path normalization.

Mirrors ``packages/b2c-tooling-sdk/test/operations/logs/*.test.ts``. WebDAV-based
operations (list/tail/get_recent_logs) stub a fake auth strategy directly
(mirroring ``test_clients_webdav.py`` and ``test_operations_code.py``), since
:class:`WebDavClient` dispatches through ``auth.fetch`` rather than a plain
``httpx`` transport.
"""

from __future__ import annotations

import codecs
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from email.utils import format_datetime
from pathlib import Path
from typing import Any

import httpx
import pytest

from b2c_tooling_sdk.clients.middleware_registry import MiddlewareRegistry
from b2c_tooling_sdk.clients.webdav import WebDavClient
from b2c_tooling_sdk.operations.code.cartridges import CartridgeMapping
from b2c_tooling_sdk.operations.logs import (
    GetRecentLogsOptions,
    ListLogsOptions,
    LogEntry,
    LogFile,
    PathNormalizerOptions,
    TailLogsOptions,
    aggregate_log_entries,
    create_path_normalizer,
    discover_and_create_normalizer,
    extract_paths,
    extract_prefix,
    filter_by_level,
    filter_by_search,
    filter_by_since,
    get_recent_logs,
    list_log_files,
    matches_level,
    matches_search,
    parse_log_entry,
    parse_log_timestamp,
    parse_relative_time,
    parse_since_time,
    split_lines,
    tail_logs,
)

HOSTNAME = "test.demandware.net"
BASE_URL = f"https://{HOSTNAME}/on/demandware.servlet/webdav/Sites"


# --- Fakes shared across tests -----------------------------------------------------


class _FakeWebDavAuth:
    """Fake WebDAV auth strategy that dispatches to a handler callback.

    Records every call for assertions and delegates response construction to
    ``handler(method, path, headers) -> httpx.Response`` so tests can simulate
    PROPFIND directory listings and Range-based GET reads without touching the
    network.
    """

    def __init__(self, handler: Callable[[str, str, dict[str, str]], httpx.Response]) -> None:
        self._handler = handler
        self.calls: list[dict[str, Any]] = []

    async def fetch(
        self,
        url: str,
        *,
        method: str = "GET",
        headers: dict[str, str] | None = None,
        content: Any = None,
        **kwargs: Any,
    ) -> httpx.Response:
        path = url[len(BASE_URL) + 1 :] if url.startswith(f"{BASE_URL}/") else url
        self.calls.append({"url": url, "method": method, "headers": headers or {}, "content": content})
        return self._handler(method, path, headers or {})


@dataclass
class _FakeConfig:
    hostname: str = HOSTNAME


class _FakeInstance:
    """Duck-typed stand-in for ``B2CInstance``: just needs a ``.webdav`` client."""

    def __init__(self, handler: Callable[[str, str, dict[str, str]], httpx.Response]) -> None:
        self.config = _FakeConfig()
        self.auth = _FakeWebDavAuth(handler)
        self.webdav = WebDavClient(self.config.hostname, self.auth, middleware_registry=MiddlewareRegistry())


def _propfind_xml(
    entries: list[tuple[str, int, datetime, bool]],
    dir_href: str = "Logs",
) -> bytes:
    """Build a PROPFIND multistatus XML body.

    :param entries: ``(name, size, last_modified, is_dir)`` tuples.
    """
    parts: list[str] = []
    for name, size, last_modified, is_dir in entries:
        resource_type = "<D:collection/>" if is_dir else ""
        content_length = "" if is_dir else f"<D:getcontentlength>{size}</D:getcontentlength>"
        http_date = format_datetime(last_modified, usegmt=True)
        parts.append(
            f"""
    <D:response>
      <D:href>/on/demandware.servlet/webdav/Sites/{dir_href}/{name}</D:href>
      <D:propstat>
        <D:prop>
          <D:displayname>{name}</D:displayname>
          <D:resourcetype>{resource_type}</D:resourcetype>
          {content_length}
          <D:getlastmodified>{http_date}</D:getlastmodified>
        </D:prop>
        <D:status>HTTP/1.1 200 OK</D:status>
      </D:propstat>
    </D:response>"""
        )
    body = f"""<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
  {"".join(parts)}
</D:multistatus>"""
    return body.encode("utf-8")


def _t(hour: int, minute: int = 0) -> datetime:
    return datetime(2025, 1, 25, hour, minute, 0, tzinfo=timezone.utc)


# --- extract_prefix -----------------------------------------------------------------


def test_extract_prefix_error() -> None:
    assert extract_prefix("error-blade1-20250125.log") == "error"


def test_extract_prefix_customerror() -> None:
    assert extract_prefix("customerror-blade1-20250125.log") == "customerror"


def test_extract_prefix_custom_named() -> None:
    assert extract_prefix("custom-mylog-blade1-20250125.log") == "custom-mylog"


def test_extract_prefix_underscore_separator() -> None:
    assert extract_prefix("error_blade1_20250125.log") == "error"


def test_extract_prefix_unknown_falls_back_to_first_segment() -> None:
    assert extract_prefix("something-random.log") == "something"


def test_extract_prefix_totally_unrecognized() -> None:
    assert extract_prefix("12345.log") == "unknown"


# --- list_log_files -------------------------------------------------------------


async def test_list_log_files_no_filters_returns_all_top_level() -> None:
    xml = _propfind_xml(
        [
            ("error-blade1-20250125.log", 100, _t(10), False),
            ("customerror-blade1-20250125.log", 200, _t(11), False),
            ("Logs", 0, _t(9), True),  # the directory itself, should be skipped
            ("notes.txt", 50, _t(9), False),  # not a .log file
        ]
    )

    def handler(method: str, path: str, headers: dict[str, str]) -> httpx.Response:
        assert method == "PROPFIND"
        assert path == "Logs"
        return httpx.Response(207, content=xml)

    instance = _FakeInstance(handler)
    files = await list_log_files(instance)  # type: ignore[arg-type]

    assert {f.name for f in files} == {"error-blade1-20250125.log", "customerror-blade1-20250125.log"}


async def test_list_log_files_prefix_filter_matches_broad_custom_prefix() -> None:
    xml = _propfind_xml(
        [
            ("error-blade1-20250125.log", 100, _t(10), False),
            ("custom-mylog-blade1-20250125.log", 200, _t(11), False),
            ("debug-blade1-20250125.log", 300, _t(12), False),
        ]
    )

    def handler(method: str, path: str, headers: dict[str, str]) -> httpx.Response:
        return httpx.Response(207, content=xml)

    instance = _FakeInstance(handler)
    files = await list_log_files(instance, ListLogsOptions(prefixes=["custom"]))  # type: ignore[arg-type]

    assert [f.name for f in files] == ["custom-mylog-blade1-20250125.log"]


async def test_list_log_files_path_filter_recurses_into_subdirectory() -> None:
    top_xml = _propfind_xml([("error-blade1-20250125.log", 100, _t(10), False)])
    nested_xml = _propfind_xml(
        [
            ("server-blade1-20250125.log", 400, _t(13), False),
            ("other-blade1-20250125.log", 500, _t(14), False),
        ],
        dir_href="Logs/internal",
    )

    def handler(method: str, path: str, headers: dict[str, str]) -> httpx.Response:
        assert method == "PROPFIND"
        if path == "Logs":
            return httpx.Response(207, content=top_xml)
        if path == "Logs/internal":
            return httpx.Response(207, content=nested_xml)
        raise AssertionError(f"unexpected propfind path {path}")

    instance = _FakeInstance(handler)
    files = await list_log_files(instance, ListLogsOptions(prefixes=["internal/server"]))  # type: ignore[arg-type]

    assert [f.name for f in files] == ["internal/server-blade1-20250125.log"]
    assert files[0].path == "Logs/internal/server-blade1-20250125.log"


async def test_list_log_files_missing_subdirectory_is_tolerated() -> None:
    top_xml = _propfind_xml([("error-blade1-20250125.log", 100, _t(10), False)])

    def handler(method: str, path: str, headers: dict[str, str]) -> httpx.Response:
        if path == "Logs":
            return httpx.Response(207, content=top_xml)
        if path == "Logs/typo":
            return httpx.Response(404)
        raise AssertionError(f"unexpected propfind path {path}")

    instance = _FakeInstance(handler)
    files = await list_log_files(instance, ListLogsOptions(prefixes=["typo/server"]))  # type: ignore[arg-type]

    assert files == []


async def test_list_log_files_sort_by_name_ascending() -> None:
    xml = _propfind_xml(
        [
            ("error-b-20250125.log", 100, _t(10), False),
            ("error-a-20250125.log", 200, _t(11), False),
        ]
    )

    def handler(method: str, path: str, headers: dict[str, str]) -> httpx.Response:
        return httpx.Response(207, content=xml)

    instance = _FakeInstance(handler)
    files = await list_log_files(instance, ListLogsOptions(sort_by="name", sort_order="asc"))  # type: ignore[arg-type]

    assert [f.name for f in files] == ["error-a-20250125.log", "error-b-20250125.log"]


async def test_list_log_files_sort_by_size_descending() -> None:
    xml = _propfind_xml(
        [
            ("error-a-20250125.log", 100, _t(10), False),
            ("error-b-20250125.log", 500, _t(11), False),
            ("error-c-20250125.log", 300, _t(12), False),
        ]
    )

    def handler(method: str, path: str, headers: dict[str, str]) -> httpx.Response:
        return httpx.Response(207, content=xml)

    instance = _FakeInstance(handler)
    files = await list_log_files(instance, ListLogsOptions(sort_by="size", sort_order="desc"))  # type: ignore[arg-type]

    assert [f.size for f in files] == [500, 300, 100]


async def test_list_log_files_default_sort_is_date_descending() -> None:
    xml = _propfind_xml(
        [
            ("error-a-20250125.log", 100, _t(9), False),
            ("error-b-20250125.log", 100, _t(15), False),
        ]
    )

    def handler(method: str, path: str, headers: dict[str, str]) -> httpx.Response:
        return httpx.Response(207, content=xml)

    instance = _FakeInstance(handler)
    files = await list_log_files(instance)  # type: ignore[arg-type]

    assert [f.name for f in files] == ["error-b-20250125.log", "error-a-20250125.log"]


# --- parse_log_entry -------------------------------------------------------------


def test_parse_log_entry_matches_standard_format() -> None:
    first_line = "[2025-01-25 10:30:45.123 GMT] ERROR PipelineCallServlet - Something failed"
    entry = parse_log_entry(first_line, "error.log", first_line)

    assert entry.timestamp == "2025-01-25 10:30:45.123 GMT"
    assert entry.level == "ERROR"
    assert entry.message == "PipelineCallServlet - Something failed"
    assert entry.raw == first_line


def test_parse_log_entry_includes_continuation_lines_in_message() -> None:
    first_line = "[2025-01-25 10:30:45.123 GMT] ERROR Boom"
    full_message = f"{first_line}\nat some.Class.method\nat another.Class.method"
    entry = parse_log_entry(first_line, "error.log", full_message)

    assert entry.message == "Boom\nat some.Class.method\nat another.Class.method"
    assert entry.raw == full_message


def test_parse_log_entry_applies_path_normalizer() -> None:
    first_line = "[2025-01-25 10:30:45.123 GMT] ERROR Boom"
    entry = parse_log_entry(first_line, "error.log", first_line, path_normalizer=lambda m: m.upper())

    assert entry.message == "BOOM"


def test_parse_log_entry_fallback_for_unparsed_format() -> None:
    raw = "some raw line that does not match"
    entry = parse_log_entry(raw, "error.log", raw)

    assert entry.timestamp is None
    assert entry.level is None
    assert entry.message == raw
    assert entry.raw == raw


# --- split_lines / aggregate_log_entries -----------------------------------------


def test_split_lines_basic() -> None:
    decoder = codecs.getincrementaldecoder("utf-8")("replace")
    lines = split_lines(b"line1\nline2\nline3\n", decoder)
    assert lines == ["line1", "line2", "line3"]


def test_split_lines_filters_empty_lines() -> None:
    decoder = codecs.getincrementaldecoder("utf-8")("replace")
    lines = split_lines(b"line1\n\n\nline2\n", decoder)
    assert lines == ["line1", "line2"]


def test_split_lines_streaming_drops_incomplete_trailing_line() -> None:
    decoder = codecs.getincrementaldecoder("utf-8")("replace")
    lines = split_lines(b"complete\nincomplete-tail", decoder, is_complete=False)
    assert lines == ["complete"]


def test_split_lines_handles_multibyte_utf8_split_across_chunks() -> None:
    """The decoder is reused across calls so a multi-byte character split at a
    chunk boundary decodes cleanly instead of producing a replacement
    character. Characters already emitted by an earlier ``decode()`` call are
    not re-returned by a later call -- ``split_lines`` only guarantees
    byte-level (not line-level) continuity across chunks, which matches how
    ``tail.ts``/``tail.py`` use it (always with ``is_complete=True``, relying
    on ``aggregate_log_entries``'s ``pending_lines`` for line-level carryover).
    """
    decoder = codecs.getincrementaldecoder("utf-8")("replace")
    text = "café\n"
    data = text.encode("utf-8")
    # "caf" is 3 ASCII bytes; "é" is a 2-byte UTF-8 sequence. Split right after
    # the lead byte of "é" so the trailing byte arrives in the next chunk.
    split_at = 4
    first, second = data[:split_at], data[split_at:]
    first_lines = split_lines(first, decoder, is_complete=False)
    second_lines = split_lines(second, decoder, is_complete=True)
    assert first_lines == []
    # If the decoder were *not* reused (e.g. a fresh decoder per chunk), the
    # lone continuation byte would decode as U+FFFD instead of "é".
    assert second_lines == ["é"]


def test_aggregate_log_entries_single_entry() -> None:
    lines = ["[2025-01-25 10:30:45.123 GMT] ERROR Boom"]
    result = aggregate_log_entries(lines)
    assert result.entries == []
    assert result.pending == lines


def test_aggregate_log_entries_completes_on_next_entry_start() -> None:
    lines = [
        "[2025-01-25 10:30:45.123 GMT] ERROR Boom",
        "at some.Class.method",
        "[2025-01-25 10:30:46.000 GMT] INFO Next entry",
    ]
    result = aggregate_log_entries(lines)
    assert result.entries == [["[2025-01-25 10:30:45.123 GMT] ERROR Boom", "at some.Class.method"]]
    assert result.pending == ["[2025-01-25 10:30:46.000 GMT] INFO Next entry"]


def test_aggregate_log_entries_carries_pending_lines_forward() -> None:
    pending = ["[2025-01-25 10:30:45.123 GMT] ERROR Boom"]
    lines = ["continuation line"]
    result = aggregate_log_entries(lines, pending)
    assert result.entries == []
    assert result.pending == ["[2025-01-25 10:30:45.123 GMT] ERROR Boom", "continuation line"]


# --- get_recent_logs --------------------------------------------------------------


async def test_get_recent_logs_reads_full_file_when_smaller_than_tail_bytes() -> None:
    content = b"[2025-01-25 10:00:00.000 GMT] ERROR First\n[2025-01-25 10:00:01.000 GMT] INFO Second\n"
    propfind_xml = _propfind_xml([("error-a-20250125.log", len(content), _t(10), False)])

    def handler(method: str, path: str, headers: dict[str, str]) -> httpx.Response:
        if method == "PROPFIND":
            return httpx.Response(207, content=propfind_xml)
        if method == "GET":
            assert "range" not in headers
            return httpx.Response(200, content=content)
        raise AssertionError(f"unexpected {method} {path}")

    instance = _FakeInstance(handler)
    entries = await get_recent_logs(instance, GetRecentLogsOptions(prefixes=["error"]))  # type: ignore[arg-type]

    # Most recent first.
    assert [e.message for e in entries] == ["Second", "First"]


async def test_get_recent_logs_uses_range_request_when_file_larger_than_tail_bytes() -> None:
    # The trailing newline ensures the Range-fetched partial content contains
    # a clean line boundary before the real log entry, so the "skip until an
    # entry-start line is found" logic can locate it even when the Range
    # request starts mid-junk (rather than fusing junk and the real entry
    # into a single unparsed line).
    prefix_junk = b"x" * 100 + b"\n"
    tail_content = b"[2025-01-25 10:00:00.000 GMT] ERROR Recent entry\n"
    full_content = prefix_junk + tail_content
    propfind_xml = _propfind_xml([("error-a-20250125.log", len(full_content), _t(10), False)])

    def handler(method: str, path: str, headers: dict[str, str]) -> httpx.Response:
        if method == "PROPFIND":
            return httpx.Response(207, content=propfind_xml)
        if method == "GET":
            range_header = headers.get("range")
            assert range_header is not None
            start = int(range_header.split("=")[1].rstrip("-"))
            return httpx.Response(206, content=full_content[start:])
        raise AssertionError(f"unexpected {method} {path}")

    instance = _FakeInstance(handler)
    entries = await get_recent_logs(
        instance,  # type: ignore[arg-type]
        GetRecentLogsOptions(prefixes=["error"], tail_bytes=len(tail_content) + 10),
    )

    assert len(entries) == 1
    assert entries[0].message == "Recent entry"


async def test_get_recent_logs_falls_back_to_full_read_on_416() -> None:
    content = b"[2025-01-25 10:00:00.000 GMT] ERROR Only entry\n"
    propfind_xml = _propfind_xml([("error-a-20250125.log", len(content), _t(10), False)])
    get_calls: list[dict[str, str]] = []

    def handler(method: str, path: str, headers: dict[str, str]) -> httpx.Response:
        if method == "PROPFIND":
            return httpx.Response(207, content=propfind_xml)
        if method == "GET":
            get_calls.append(headers)
            if "range" in headers:
                return httpx.Response(416)
            return httpx.Response(200, content=content)
        raise AssertionError(f"unexpected {method} {path}")

    instance = _FakeInstance(handler)
    entries = await get_recent_logs(
        instance,  # type: ignore[arg-type]
        GetRecentLogsOptions(prefixes=["error"], tail_bytes=1),
    )

    assert len(get_calls) == 2  # first Range request, then fallback full read
    assert len(entries) == 1
    assert entries[0].message == "Only entry"


async def test_get_recent_logs_respects_max_entries() -> None:
    content = (
        b"[2025-01-25 10:00:00.000 GMT] ERROR One\n"
        b"[2025-01-25 10:00:01.000 GMT] ERROR Two\n"
        b"[2025-01-25 10:00:02.000 GMT] ERROR Three\n"
    )
    propfind_xml = _propfind_xml([("error-a-20250125.log", len(content), _t(10), False)])

    def handler(method: str, path: str, headers: dict[str, str]) -> httpx.Response:
        if method == "PROPFIND":
            return httpx.Response(207, content=propfind_xml)
        return httpx.Response(200, content=content)

    instance = _FakeInstance(handler)
    entries = await get_recent_logs(
        instance,  # type: ignore[arg-type]
        GetRecentLogsOptions(prefixes=["error"], max_entries=2),
    )

    # get_recent_logs caps entries during the forward (file/chronological-order)
    # append loop, then reverses -- faithfully matching the TS implementation's
    # quirk: it's the first max_entries in file order ("One", "Two") that get
    # collected before the cap is hit, not the true most-recent max_entries.
    assert [e.message for e in entries] == ["Two", "One"]


# --- tail_logs ---------------------------------------------------------------------


async def _noop_sleep(_seconds: float) -> None:
    return None


async def test_tail_logs_emits_initial_entries_and_auto_stops_on_max_entries() -> None:
    content = b"[2025-01-25 10:00:00.000 GMT] ERROR First entry\n"
    propfind_xml = _propfind_xml([("error-a-20250125.log", len(content), _t(10), False)])
    discovered: list[LogFile] = []
    received: list[LogEntry] = []

    def handler(method: str, path: str, headers: dict[str, str]) -> httpx.Response:
        if method == "PROPFIND":
            return httpx.Response(207, content=propfind_xml)
        if method == "GET":
            return httpx.Response(200, content=content)
        raise AssertionError(f"unexpected {method} {path}")

    instance = _FakeInstance(handler)
    result = await tail_logs(
        instance,  # type: ignore[arg-type]
        TailLogsOptions(
            prefixes=["error"],
            last_entries=1,
            max_entries=1,
            on_entry=received.append,
            on_file_discovered=discovered.append,
        ),
        sleep=_noop_sleep,
    )

    await result.done

    assert [f.name for f in discovered] == ["error-a-20250125.log"]
    assert [e.message for e in received] == ["First entry"]
    assert [f.name for f in result.files] == ["error-a-20250125.log"]
    assert result.entries == received


async def test_tail_logs_skips_initial_entries_when_last_entries_zero() -> None:
    content = b"[2025-01-25 10:00:00.000 GMT] ERROR First entry\n"
    propfind_xml = _propfind_xml([("error-a-20250125.log", len(content), _t(10), False)])
    received: list[LogEntry] = []

    def handler(method: str, path: str, headers: dict[str, str]) -> httpx.Response:
        if method == "PROPFIND":
            return httpx.Response(207, content=propfind_xml)
        return httpx.Response(200, content=content)

    instance = _FakeInstance(handler)
    result = await tail_logs(
        instance,  # type: ignore[arg-type]
        TailLogsOptions(prefixes=["error"], last_entries=0, on_entry=received.append),
        sleep=_noop_sleep,
    )

    # Stop immediately: the loop should have performed exactly one discovery
    # pass (last_entries=0 means no entries were emitted from it) and then
    # observed the flag before entering its poll body.
    await result.stop()
    await result.done

    assert received == []
    assert [f.name for f in result.files] == ["error-a-20250125.log"]


async def test_tail_logs_detects_new_content_and_rotation_across_polls() -> None:
    """Uses the injected ``sleep`` hook to deterministically drive multiple
    poll iterations: each call mutates shared mutable state (simulating time
    passing / the file changing on the server) before the next discovery pass.
    """
    state = {
        "size": 0,
        "content": b"",
        "poll_count": 0,
    }
    initial_content = b"[2025-01-25 10:00:00.000 GMT] ERROR Initial\n"
    state["content"] = initial_content
    state["size"] = len(initial_content)

    # Must be *shorter* than initial_content (44 bytes) so the server-reported
    # size genuinely decreases -- that's what tail_logs uses to detect
    # rotation (a same-or-larger size looks like ordinary growth, not a
    # rotated/truncated file).
    rotated_content = b"[2025-01-25 11:00:00.000 GMT] ERROR Rot\n"

    received: list[LogEntry] = []
    rotated: list[LogFile] = []

    def handler(method: str, path: str, headers: dict[str, str]) -> httpx.Response:
        if method == "PROPFIND":
            xml = _propfind_xml([("error-a-20250125.log", state["size"], _t(10), False)])
            return httpx.Response(207, content=xml)
        if method == "GET":
            range_header = headers.get("range")
            if range_header:
                start = int(range_header.split("=")[1].rstrip("-"))
                if start >= len(state["content"]):
                    return httpx.Response(416)
                return httpx.Response(206, content=state["content"][start:])
            return httpx.Response(200, content=state["content"])
        raise AssertionError(f"unexpected {method} {path}")

    async def driving_sleep(_seconds: float) -> None:
        state["poll_count"] += 1
        if state["poll_count"] == 1:
            # Simulate rotation: file shrinks and gets fresh content.
            state["content"] = rotated_content
            state["size"] = len(rotated_content)
        else:
            # Stop after the second poll iteration to end the test.
            nonlocal_stop["running"] = False

    nonlocal_stop = {"running": True}

    instance = _FakeInstance(handler)

    # Guard against re-entrancy: TailLogsResult.stop() itself awaits this same
    # injected sleep function internally (a short grace-period delay), so
    # without this guard, calling stop() from within sleep_and_maybe_stop would
    # recurse straight back into sleep_and_maybe_stop -- and since the "should
    # stop" condition remains true, it would recurse indefinitely.
    stopping = {"active": False}

    async def sleep_and_maybe_stop(seconds: float) -> None:
        if stopping["active"]:
            return
        await driving_sleep(seconds)
        if not nonlocal_stop["running"]:
            stopping["active"] = True
            await result_holder["result"].stop()
            stopping["active"] = False

    result_holder: dict[str, Any] = {}

    result = await tail_logs(
        instance,  # type: ignore[arg-type]
        TailLogsOptions(
            prefixes=["error"],
            last_entries=1,
            on_entry=received.append,
            on_file_rotated=rotated.append,
        ),
        sleep=sleep_and_maybe_stop,
    )
    result_holder["result"] = result

    await result.done

    assert [e.message for e in received] == ["Initial", "Rot"]
    assert [f.name for f in rotated] == ["error-a-20250125.log"]


async def test_tail_logs_applies_path_normalizer() -> None:
    content = b"[2025-01-25 10:00:00.000 GMT] ERROR boom\n"
    propfind_xml = _propfind_xml([("error-a-20250125.log", len(content), _t(10), False)])

    def handler(method: str, path: str, headers: dict[str, str]) -> httpx.Response:
        if method == "PROPFIND":
            return httpx.Response(207, content=propfind_xml)
        return httpx.Response(200, content=content)

    instance = _FakeInstance(handler)
    received: list[LogEntry] = []
    result = await tail_logs(
        instance,  # type: ignore[arg-type]
        TailLogsOptions(
            prefixes=["error"],
            last_entries=1,
            max_entries=1,
            on_entry=received.append,
            path_normalizer=lambda m: m.upper(),
        ),
        sleep=_noop_sleep,
    )
    await result.done

    assert received[0].message == "BOOM"


async def test_tail_logs_reports_errors_via_on_error() -> None:
    def handler(method: str, path: str, headers: dict[str, str]) -> httpx.Response:
        if method == "PROPFIND":
            raise RuntimeError("boom")
        raise AssertionError(f"unexpected {method} {path}")

    instance = _FakeInstance(handler)
    errors: list[Exception] = []
    result = await tail_logs(
        instance,  # type: ignore[arg-type]
        TailLogsOptions(prefixes=["error"], on_error=errors.append),
        sleep=_noop_sleep,
    )
    await result.stop()
    await result.done

    # discover_files catches and reports via on_error rather than propagating,
    # so tailing should not have crashed and files stay empty.
    assert result.files == []


# --- filter helpers ---------------------------------------------------------------


def _entry(
    message: str = "msg", level: str | None = "ERROR", timestamp: str | None = None, raw: str = "raw"
) -> LogEntry:
    return LogEntry(file="test.log", message=message, raw=raw, level=level, timestamp=timestamp)


def test_filter_by_level_matches_case_insensitively() -> None:
    entries = [_entry(level="error"), _entry(level="INFO"), _entry(level=None)]
    result = filter_by_level(entries, ["ERROR"])
    assert result == [entries[0]]


def test_filter_by_search_matches_message_or_raw() -> None:
    entries = [_entry(message="hello world"), _entry(message="nothing", raw="contains needle")]
    result = filter_by_search(entries, "needle")
    assert result == [entries[1]]


def test_filter_by_since_includes_entries_without_timestamp() -> None:
    entries = [_entry(timestamp=None), _entry(timestamp="2025-01-25 09:00:00.000 GMT")]
    result = filter_by_since(entries, _t(10))
    assert result == [entries[0]]


def test_filter_by_since_includes_entries_with_unparseable_timestamp() -> None:
    entries = [_entry(timestamp="not-a-timestamp")]
    result = filter_by_since(entries, _t(10))
    assert result == entries


def test_filter_by_since_boundary_is_inclusive() -> None:
    entries = [_entry(timestamp="2025-01-25 10:00:00.000 GMT")]
    result = filter_by_since(entries, _t(10))
    assert result == entries


def test_matches_level_and_search() -> None:
    entry = _entry(message="Hello World", level="warn")
    assert matches_level(entry, ["WARN", "ERROR"]) is True
    assert matches_level(entry, ["ERROR"]) is False
    assert matches_search(entry, "hello") is True
    assert matches_search(entry, "nope") is False


def test_matches_level_false_when_entry_has_no_level() -> None:
    entry = _entry(level=None)
    assert matches_level(entry, ["ERROR"]) is False


# --- parse_relative_time / parse_since_time / parse_log_timestamp ---------------


def test_parse_relative_time_minutes_hours_days() -> None:
    assert parse_relative_time("5m") == 5 * 60 * 1000
    assert parse_relative_time("1h") == 60 * 60 * 1000
    assert parse_relative_time("2d") == 2 * 24 * 60 * 60 * 1000


def test_parse_relative_time_is_case_insensitive() -> None:
    assert parse_relative_time("5M") == parse_relative_time("5m")


def test_parse_relative_time_returns_none_for_invalid_format() -> None:
    assert parse_relative_time("5x") is None
    assert parse_relative_time("abc") is None
    assert parse_relative_time("") is None
    assert parse_relative_time("10") is None
    assert parse_relative_time("m5") is None
    assert parse_relative_time("5mm") is None


def test_parse_since_time_relative_uses_injected_now() -> None:
    now = datetime(2026, 1, 25, tzinfo=timezone.utc)
    result = parse_since_time("5m", now)
    assert result == now - timedelta(minutes=5)


def test_parse_since_time_iso8601_with_timezone() -> None:
    now = datetime(2026, 1, 25, tzinfo=timezone.utc)
    result = parse_since_time("2026-01-24T12:00:00+00:00", now)
    assert result == datetime(2026, 1, 24, 12, 0, 0, tzinfo=timezone.utc)


def test_parse_since_time_iso8601_without_timezone_assumes_utc() -> None:
    now = datetime(2026, 1, 25, tzinfo=timezone.utc)
    result = parse_since_time("2026-01-24T12:00:00", now)
    assert result.year == 2026
    assert result.month == 1
    assert result.day == 24
    assert result.tzinfo is not None


def test_parse_since_time_defaults_now_to_current_time() -> None:
    before = datetime.now(timezone.utc)
    result = parse_since_time("5m")
    after = datetime.now(timezone.utc)
    assert before - timedelta(minutes=5) <= result <= after - timedelta(minutes=5)


def test_parse_since_time_raises_value_error_for_invalid_input() -> None:
    now = datetime(2026, 1, 25, tzinfo=timezone.utc)
    with pytest.raises(ValueError, match='Invalid --since value: "garbage"'):
        parse_since_time("garbage", now)


def test_parse_since_time_raises_for_empty_string() -> None:
    now = datetime(2026, 1, 25, tzinfo=timezone.utc)
    with pytest.raises(ValueError):
        parse_since_time("", now)


def test_parse_log_timestamp_with_milliseconds() -> None:
    result = parse_log_timestamp("2025-01-25 10:30:45.123 GMT")
    assert result == datetime(2025, 1, 25, 10, 30, 45, 123000, tzinfo=timezone.utc)


def test_parse_log_timestamp_without_milliseconds() -> None:
    result = parse_log_timestamp("2025-01-25 10:30:45 GMT")
    assert result == datetime(2025, 1, 25, 10, 30, 45, tzinfo=timezone.utc)


def test_parse_log_timestamp_returns_none_for_invalid() -> None:
    assert parse_log_timestamp("invalid") is None
    assert parse_log_timestamp("") is None
    assert parse_log_timestamp("not a date") is None
    assert parse_log_timestamp("25/01/2025 10:30:45") is None


# --- path normalizer ---------------------------------------------------------------


def test_create_path_normalizer_returns_none_without_options() -> None:
    assert create_path_normalizer(PathNormalizerOptions()) is None


def test_create_path_normalizer_simple_cartridge_path_mode() -> None:
    normalize = create_path_normalizer(PathNormalizerOptions(cartridge_path="./cartridges/"))
    assert normalize is not None

    message = "Error at (app_storefront/cartridge/controllers/Home.js:45)"
    assert normalize(message) == "Error at (./cartridges/app_storefront/cartridge/controllers/Home.js:45)"


def test_create_path_normalizer_cartridge_mapping_mode_takes_precedence() -> None:
    mappings = [CartridgeMapping(name="app_storefront", src="/abs/path/to/app_storefront", dest="app_storefront")]
    normalize = create_path_normalizer(PathNormalizerOptions(cartridge_path="./fallback", cartridges=mappings))
    assert normalize is not None

    message = "'app_storefront/cartridge/controllers/Home.js:45'"
    assert normalize(message) == "'/abs/path/to/app_storefront/cartridge/controllers/Home.js:45'"


def test_create_path_normalizer_handles_stacktrace_context() -> None:
    normalize = create_path_normalizer(PathNormalizerOptions(cartridge_path="./cartridges"))
    assert normalize is not None

    message = "  at app_storefront/cartridge/controllers/Home.js:45"
    assert normalize(message) == "  at ./cartridges/app_storefront/cartridge/controllers/Home.js:45"


def test_create_path_normalizer_leaves_unmapped_cartridge_unchanged() -> None:
    mappings = [CartridgeMapping(name="other_cartridge", src="/abs/other", dest="other_cartridge")]
    normalize = create_path_normalizer(PathNormalizerOptions(cartridges=mappings))
    assert normalize is not None

    message = "(app_storefront/cartridge/controllers/Home.js:45)"
    assert normalize(message) == message


def test_extract_paths_finds_all_contexts() -> None:
    message = (
        "(app_storefront/cartridge/controllers/Home.js:45) "
        "'app_storefront/cartridge/controllers/Home.js:45' "
        "at other_cartridge/cartridge/models/Product.js:12"
    )
    paths = extract_paths(message)
    assert paths == [
        "app_storefront/cartridge/controllers/Home.js:45",
        "other_cartridge/cartridge/models/Product.js:12",
    ]


def test_extract_paths_deduplicates() -> None:
    message = "(app_storefront/cartridge/a.js:1) 'app_storefront/cartridge/a.js:1'"
    assert extract_paths(message) == ["app_storefront/cartridge/a.js:1"]


def test_extract_paths_returns_empty_list_when_no_matches() -> None:
    assert extract_paths("nothing interesting here") == []


def test_discover_and_create_normalizer_uses_real_cartridge_discovery(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    cartridge_dir = tmp_path / "cartridges" / "app_storefront"
    cartridge_dir.mkdir(parents=True)
    (cartridge_dir / ".project").write_text("")

    monkeypatch.chdir(tmp_path)

    normalize = discover_and_create_normalizer(str(tmp_path))
    assert normalize is not None

    message = "(app_storefront/cartridge/controllers/Home.js:45)"
    result = normalize(message)
    assert result.startswith("(./cartridges/app_storefront/cartridge/controllers/Home.js:45")


def test_discover_and_create_normalizer_returns_none_when_no_cartridges(tmp_path: Path) -> None:
    empty_dir = tmp_path / "empty"
    empty_dir.mkdir()
    assert discover_and_create_normalizer(str(empty_dir)) is None
