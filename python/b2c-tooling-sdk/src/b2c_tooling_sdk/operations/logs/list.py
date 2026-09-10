# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Log file listing operations.

Mirrors ``src/operations/logs/list.ts``.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from b2c_tooling_sdk.logging import get_logger
from b2c_tooling_sdk.operations.logs.types import ListLogsOptions, LogFile

if TYPE_CHECKING:
    from b2c_tooling_sdk.instance import B2CInstance

#: Known log file prefixes in B2C Commerce.
#: Used to extract the prefix from log file names.
_LOG_PREFIXES: tuple[str, ...] = (
    # Custom logs (must check first due to "custom" prefix)
    "customdebug",
    "custominfo",
    "customwarn",
    "customerror",
    "customfatal",
    # System logs
    "error",
    "warn",
    "info",
    "debug",
    "fatal",
    "api",
    "deprecation",
    "jobs",
    "staging",
    "quota",
    "sql",
    "service",
    "syslog",
    "security",
    "analytics",
    "migration",
    # Custom named logs (format: custom-<name>-...)
    "custom",
)

_CUSTOM_NAME_RE = re.compile(r"^(custom-[a-zA-Z0-9_]+)-")
_FALLBACK_PREFIX_RE = re.compile(r"^([a-zA-Z]+)[-_]")

#: Epoch fallback used when a WebDAV entry has no ``getlastmodified`` value.
_EPOCH = datetime.fromtimestamp(0, tz=timezone.utc)


def extract_prefix(filename: str) -> str:
    """Extract the log prefix from a filename.

    :param filename: Log file name (e.g., "error-blade1-20250125.log").
    :returns: The prefix (e.g., "error") or "unknown".

    >>> extract_prefix("error-blade1-20250125.log")
    'error'
    >>> extract_prefix("customerror-blade1-20250125.log")
    'customerror'
    >>> extract_prefix("custom-mylog-blade1-20250125.log")
    'custom-mylog'
    """
    # Handle custom-<name> pattern (e.g., custom-mylog-blade1-...)
    # Custom log names use word characters only (no dashes) to distinguish from hostname.
    custom_match = _CUSTOM_NAME_RE.match(filename)
    if custom_match:
        return custom_match[1]

    # Check known prefixes (order matters - longer matches first).
    for prefix in _LOG_PREFIXES:
        if filename.startswith(f"{prefix}-") or filename.startswith(f"{prefix}_"):
            return prefix

    # Fallback: extract first segment before dash or underscore.
    fallback_match = _FALLBACK_PREFIX_RE.match(filename)
    return fallback_match[1] if fallback_match else "unknown"


async def _list_log_files_in_dir(instance: B2CInstance, relative_dir: str) -> list[LogFile]:
    """List the ``.log`` files in a single Logs directory (depth 1, non-recursive).

    :param relative_dir: Directory relative to ``Logs/`` (e.g. "internal"); ``""``
        for the root Logs directory.
    :returns: Log files found directly in that directory.

    For nested directories the returned :attr:`LogFile.name` and
    :attr:`LogFile.path` include the relative directory so file identities stay
    unique across subdirectories (e.g. ``internal/server-...log``) and reads
    target the correct WebDAV path.
    """
    logger = get_logger("operations.logs")
    propfind_path = f"Logs/{relative_dir}" if relative_dir else "Logs"

    try:
        entries = await instance.webdav.propfind(propfind_path, "1")
    except Exception as error:  # noqa: BLE001 - a bad subdirectory should not abort the listing
        logger.debug("Failed to list log directory: %s (%s)", propfind_path, error)
        return []

    files: list[LogFile] = []
    for entry in entries:
        # Skip directories (including the listed directory itself).
        if entry.is_collection:
            continue

        # Skip if not a .log file.
        name = entry.display_name or entry.href.rstrip("/").rsplit("/", 1)[-1]
        if not name.endswith(".log"):
            continue

        relative_name = f"{relative_dir}/{name}" if relative_dir else name

        files.append(
            LogFile(
                name=relative_name,
                prefix=extract_prefix(name),
                size=entry.content_length or 0,
                last_modified=entry.last_modified or _EPOCH,
                path=f"Logs/{relative_name}",
            )
        )

    return files


async def list_log_files(instance: B2CInstance, options: ListLogsOptions | None = None) -> list[LogFile]:
    """List log files on a B2C Commerce instance.

    Filters in :attr:`ListLogsOptions.prefixes` are matched in one of two ways:

    - **Prefix filters** (no ``/``, e.g. ``"error"``) match the extracted
      log-category prefix of files in the top-level ``Logs/`` directory.
    - **Path filters** (contain a ``/``, e.g. ``"internal/server"``) recurse into
      the named subdirectory of ``Logs/`` and match against each file's path
      relative to ``Logs/``. This is the only case that lists subdirectories —
      by default only the top-level ``Logs/`` directory is scanned.

    :param instance: B2C instance to list logs from.
    :param options: Listing options (filters, sorting).
    :returns: List of log files.
    """
    logger = get_logger("operations.logs")
    opts = options or ListLogsOptions()
    prefixes = opts.prefixes
    sort_by = opts.sort_by
    sort_order = opts.sort_order

    logger.debug("Listing log files (prefixes=%s, sort_by=%s, sort_order=%s)", prefixes, sort_by, sort_order)

    # Partition filters: path-like filters (containing "/") select files in a
    # subdirectory by relative path; the rest match the top-level category prefix.
    all_filters = prefixes or []
    path_filters = [p for p in all_filters if "/" in p]
    prefix_filters = [p for p in all_filters if "/" not in p]

    # Always scan the top-level Logs directory.
    top_level = await _list_log_files_in_dir(instance, "")

    # Recurse only when a path-like filter is present, and only into the
    # subdirectory that filter names (the segment before its last "/").
    sub_dirs = {p[: p.rindex("/")] for p in path_filters if p[: p.rindex("/")]}
    nested: list[LogFile] = []
    for sub_dir in sub_dirs:
        nested.extend(await _list_log_files_in_dir(instance, sub_dir))

    # Filter by prefix and/or path if any filters were specified.
    if not all_filters:
        filtered = top_level
    else:
        prefix_set = {p.lower() for p in prefix_filters}
        path_set = [p.lower() for p in path_filters]

        # Top-level files match by category prefix (exact or startswith, e.g. "custom" -> "custom-mylog").
        matched_top_level = [
            f
            for f in top_level
            if f.prefix.lower() in prefix_set or any(f.prefix.lower().startswith(p) for p in prefix_set)
        ]

        # Nested files match by relative path (exact or startswith, e.g. "internal/server").
        matched_nested = [
            f for f in nested if any(f.name.lower() == p or f.name.lower().startswith(p) for p in path_set)
        ]

        # Dedupe by path in case multiple filters select the same file.
        by_path: dict[str, LogFile] = {}
        for f in [*matched_top_level, *matched_nested]:
            by_path[f.path] = f
        filtered = list(by_path.values())

    # Sort the results. Python's ``sort``/``sorted`` is stable and, per the
    # documentation, ``reverse=True`` preserves the original relative order of
    # equal elements (rather than reversing them) -- matching the TS
    # comparator's ``comparison === 0`` behavior under a stable sort for both
    # ascending and descending order.
    if sort_by == "name":
        filtered.sort(key=lambda f: f.name, reverse=(sort_order == "desc"))
    elif sort_by == "size":
        filtered.sort(key=lambda f: f.size, reverse=(sort_order == "desc"))
    else:
        filtered.sort(key=lambda f: f.last_modified, reverse=(sort_order == "desc"))

    logger.debug("Found %d log files", len(filtered))

    return filtered


__all__ = ["extract_prefix", "list_log_files"]
