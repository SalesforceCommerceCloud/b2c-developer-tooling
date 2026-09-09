# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Shared types for log operations.

Mirrors ``src/operations/logs/types.ts``.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from datetime import datetime
from typing import Literal


@dataclass
class LogFile:
    """Represents a log file on a B2C Commerce instance."""

    #: File name (e.g., "error-blade1-20250125.log").
    name: str
    #: Log prefix/type (e.g., "error", "customerror", "debug").
    prefix: str
    #: File size in bytes.
    size: int
    #: Last modified date.
    last_modified: datetime
    #: Full WebDAV path to the file.
    path: str


@dataclass
class LogEntry:
    """Represents a parsed log entry."""

    #: File name this entry came from.
    file: str
    #: Log message (with path normalization applied if enabled).
    message: str
    #: Raw unprocessed log line.
    raw: str
    #: Log level (INFO, WARN, ERROR, DEBUG, etc.).
    level: str | None = None
    #: Timestamp string from the log entry.
    timestamp: str | None = None


@dataclass
class ListLogsOptions:
    """Options for listing log files."""

    #: Filter by log prefixes (e.g., ["error", "customerror"]).
    #:
    #: A filter containing a "/" (e.g. "internal/server") is treated as a path
    #: filter: it recurses into that subdirectory of ``Logs/`` and matches files
    #: by their path relative to ``Logs/``. Filters without a "/" match the
    #: top-level log-category prefix. If not specified, returns all top-level
    #: log files.
    prefixes: list[str] | None = None
    #: Sort field.
    sort_by: Literal["name", "date", "size"] = "date"
    #: Sort order.
    sort_order: Literal["asc", "desc"] = "desc"


@dataclass
class TailLogsCallbacks:
    """Callback functions for tail operation events."""

    #: Called for each new log entry.
    on_entry: Callable[[LogEntry], None] | None = None
    #: Called when an error occurs.
    on_error: Callable[[Exception], None] | None = None
    #: Called when a new log file is discovered.
    on_file_discovered: Callable[[LogFile], None] | None = None
    #: Called when file rotation is detected (file size decreased).
    on_file_rotated: Callable[[LogFile], None] | None = None


@dataclass
class TailLogsOptions(TailLogsCallbacks):
    """Options for tailing logs."""

    #: Filter by log prefixes (e.g., ["error", "customerror"]).
    prefixes: list[str] = field(default_factory=lambda: ["error", "customerror"])
    #: Polling interval in seconds.
    poll_interval: float = 3.0
    #: Number of recent entries to show per file on startup.
    #: Set to 0 to skip initial entries and only show new ones.
    last_entries: int = 1
    #: Maximum number of entries to collect before stopping. When set, the tail
    #: operation will automatically stop after collecting this many entries.
    #: Useful for programmatic access.
    max_entries: int | None = None
    #: Path normalizer function to convert remote paths to local paths. Called
    #: on each log message to make paths clickable in IDEs.
    path_normalizer: Callable[[str], str] | None = None


@dataclass
class TailLogsResult:
    """Result of a tail operation."""

    #: Stop the tailing operation.
    stop: Callable[[], Awaitable[None]]
    #: Currently tracked files.
    files: list[LogFile]
    #: Collected entries (when max_entries is set).
    entries: list[LogEntry]
    #: Resolves when tailing stops (via stop() or max_entries).
    done: Awaitable[None]


@dataclass
class GetRecentLogsOptions:
    """Options for getting recent logs (one-shot retrieval)."""

    #: Filter by log prefixes (e.g., ["error", "customerror"]).
    prefixes: list[str] = field(default_factory=lambda: ["error", "customerror"])
    #: Maximum number of entries to retrieve.
    max_entries: int = 100
    #: Maximum bytes to read from the end of each file.
    tail_bytes: int = 65536
    #: Path normalizer function to convert remote paths to local paths.
    path_normalizer: Callable[[str], str] | None = None


__all__ = [
    "GetRecentLogsOptions",
    "ListLogsOptions",
    "LogEntry",
    "LogFile",
    "TailLogsCallbacks",
    "TailLogsOptions",
    "TailLogsResult",
]
