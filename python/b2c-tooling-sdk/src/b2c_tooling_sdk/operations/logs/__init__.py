# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Log operations for B2C Commerce instances.

Mirrors ``src/operations/logs/index.ts``. Provides functions for listing,
tailing, and analyzing log files on B2C Commerce instances via WebDAV.

Example - list log files::

    from b2c_tooling_sdk.operations.logs import list_log_files, ListLogsOptions

    files = await list_log_files(
        instance, ListLogsOptions(prefixes=["error", "customerror"], sort_by="date", sort_order="desc")
    )

    for file in files:
        print(f"{file.name} ({file.size} bytes)")

Example - tail logs in real-time::

    from b2c_tooling_sdk.operations.logs import (
        tail_logs, TailLogsOptions, create_path_normalizer, PathNormalizerOptions,
    )

    normalizer = create_path_normalizer(PathNormalizerOptions(cartridge_path="./cartridges"))

    result = await tail_logs(
        instance,
        TailLogsOptions(
            prefixes=["error", "customerror"],
            path_normalizer=normalizer,
            on_entry=lambda entry: print(f"[{entry.file}] {entry.level}: {entry.message}"),
            on_error=lambda err: print(f"Error: {err}"),
        ),
    )

    # Stop after 30 seconds.
    await asyncio.sleep(30)
    await result.stop()
    await result.done

Example - get recent logs (one-shot)::

    from b2c_tooling_sdk.operations.logs import get_recent_logs, GetRecentLogsOptions

    entries = await get_recent_logs(instance, GetRecentLogsOptions(prefixes=["error"], max_entries=50))

    for entry in entries:
        print(f"[{entry.timestamp}] {entry.message}")
"""

from __future__ import annotations

# Filtering helpers
from b2c_tooling_sdk.operations.logs.filter import (
    filter_by_level,
    filter_by_search,
    filter_by_since,
    matches_level,
    matches_search,
    parse_log_timestamp,
    parse_relative_time,
    parse_since_time,
)

# List operations
from b2c_tooling_sdk.operations.logs.list import extract_prefix, list_log_files

# Path normalization
from b2c_tooling_sdk.operations.logs.path_normalizer import (
    PathNormalizerOptions,
    create_path_normalizer,
    discover_and_create_normalizer,
    extract_paths,
)

# Tail operations
from b2c_tooling_sdk.operations.logs.tail import (
    aggregate_log_entries,
    get_recent_logs,
    parse_log_entry,
    split_lines,
    tail_logs,
)

# Types
from b2c_tooling_sdk.operations.logs.types import (
    GetRecentLogsOptions,
    ListLogsOptions,
    LogEntry,
    LogFile,
    TailLogsCallbacks,
    TailLogsOptions,
    TailLogsResult,
)

__all__ = [
    "GetRecentLogsOptions",
    "ListLogsOptions",
    "LogEntry",
    "LogFile",
    "PathNormalizerOptions",
    "TailLogsCallbacks",
    "TailLogsOptions",
    "TailLogsResult",
    "aggregate_log_entries",
    "create_path_normalizer",
    "discover_and_create_normalizer",
    "extract_paths",
    "extract_prefix",
    "filter_by_level",
    "filter_by_search",
    "filter_by_since",
    "get_recent_logs",
    "list_log_files",
    "matches_level",
    "matches_search",
    "parse_log_entry",
    "parse_log_timestamp",
    "parse_relative_time",
    "parse_since_time",
    "split_lines",
    "tail_logs",
]
