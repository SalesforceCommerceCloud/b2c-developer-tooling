# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Log tailing operations for B2C Commerce.

Mirrors ``src/operations/logs/tail.ts``.

**Deviation from the TypeScript SDK**: :func:`tail_logs` takes an injectable
``sleep`` keyword-only parameter (``Callable[[float], Awaitable[None]]``,
defaulting to :func:`asyncio.sleep`) that is not part of the TS API surface.
This lets tests drive the poll loop instantly instead of waiting on real
wall-clock time, while keeping the flag-based stop/poll structure (rather than
task cancellation) faithful to the TS implementation: :meth:`TailLogsResult.stop`
flips a running flag and awaits a short grace period, exactly like the TS
``stop()``; the poll loop observes the flag between iterations and, on exit,
resolves :attr:`TailLogsResult.done`.
"""

from __future__ import annotations

import asyncio
import codecs
import re
from collections.abc import Awaitable, Callable
from typing import TYPE_CHECKING, NamedTuple

from b2c_tooling_sdk.logging import get_logger
from b2c_tooling_sdk.operations.logs.list import list_log_files
from b2c_tooling_sdk.operations.logs.types import (
    GetRecentLogsOptions,
    ListLogsOptions,
    LogEntry,
    LogFile,
    TailLogsOptions,
    TailLogsResult,
)

if TYPE_CHECKING:
    from b2c_tooling_sdk.instance import B2CInstance

#: Default log prefixes to tail.
_DEFAULT_PREFIXES = ["error", "customerror"]

#: Default polling interval, in seconds.
_DEFAULT_POLL_INTERVAL = 3.0

#: Default max entries for get_recent_logs.
_DEFAULT_MAX_ENTRIES = 100

#: Default bytes to read from end of file for get_recent_logs.
_DEFAULT_TAIL_BYTES = 65536  # 64KB

#: Regex to detect the start of a new log entry.
#: Matches: [YYYY-MM-DD HH:MM:SS.mmm GMT]
_LOG_ENTRY_START = re.compile(r"^\[\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d+\s+\w+\]")

#: Matches the standard B2C log format: [timestamp GMT] LEVEL message
_LOG_ENTRY_RE = re.compile(r"^\[([^\]]+)\]\s+(INFO|WARN|ERROR|DEBUG|FATAL|TRACE)\s+(.*)$", re.DOTALL)


def _new_decoder() -> codecs.IncrementalDecoder:
    """Create a UTF-8 incremental decoder that replaces invalid sequences
    instead of raising (mirroring ``new TextDecoder('utf-8', {fatal: false})``).
    """
    return codecs.getincrementaldecoder("utf-8")("replace")


def parse_log_entry(
    first_line: str,
    file: str,
    full_message: str,
    path_normalizer: Callable[[str], str] | None = None,
) -> LogEntry:
    """Parse the first line of a log entry to extract timestamp, level, and message.

    Expected format: ``[timestamp GMT] LEVEL context - message``.
    Example: ``[2025-01-25 10:30:45.123 GMT] ERROR PipelineCallServlet|... - Error message``.

    The message field will contain:

    - The content portion from the first line (after LEVEL)
    - Plus any continuation lines (stack traces, etc.)

    If the standard B2C log format is not matched, returns an unparsed entry
    with only the file, message, and raw fields. The timestamp and level
    fields will be ``None`` in this case, but the raw log line is preserved
    for debugging or recovery purposes.

    :param first_line: First line of the log entry.
    :param file: File name the entry came from.
    :param full_message: Complete raw message including all lines.
    :param path_normalizer: Optional function to normalize paths in the message.
    """
    match = _LOG_ENTRY_RE.match(first_line)

    if match:
        timestamp, level, first_line_content = match[1], match[2], match[3]

        # Build the message: first line content + continuation lines.
        lines = full_message.split("\n")
        continuation_lines = lines[1:]
        message = "\n".join([first_line_content, *continuation_lines]) if continuation_lines else first_line_content

        if path_normalizer:
            message = path_normalizer(message)

        return LogEntry(file=file, timestamp=timestamp, level=level, message=message, raw=full_message)

    # Fallback: return as unparsed entry.
    message = full_message
    if path_normalizer:
        message = path_normalizer(message)

    return LogEntry(file=file, message=message, raw=full_message)


def split_lines(content: bytes, decoder: codecs.IncrementalDecoder, is_complete: bool = True) -> list[str]:
    """Split content into lines, handling incomplete lines at boundaries.

    Uses a UTF-8 incremental decoder (reused across calls for streaming) for
    proper multi-byte character handling.

    :param content: Raw bytes read from a log file.
    :param decoder: Incremental decoder instance (should be reused for streaming).
    :param is_complete: Whether this is the final chunk (flush the decoder).
    :returns: Complete lines (without a trailing incomplete line).
    """
    text = decoder.decode(content, final=is_complete)

    # Split by newlines, keeping track of whether last line is complete.
    lines = re.split(r"\r?\n", text)

    # If the text doesn't end with a newline, the last line is incomplete.
    # We should not include it in the results (it will be completed on the next read).
    if not is_complete and lines and not text.endswith("\n"):
        lines.pop()

    # Filter out empty lines.
    return [line for line in lines if line.strip()]


class AggregatedLogEntries(NamedTuple):
    """Result of :func:`aggregate_log_entries`."""

    #: Complete multi-line entries.
    entries: list[list[str]]
    #: Lines carried over to the next chunk (incomplete entry).
    pending: list[str]


def aggregate_log_entries(lines: list[str], pending_lines: list[str] | None = None) -> AggregatedLogEntries:
    """Aggregate lines into multi-line log entries.

    B2C log entries can span multiple lines. A new entry starts when a line
    begins with a timestamp pattern: ``[YYYY-MM-DD HH:MM:SS.mmm GMT]``.

    :param lines: Individual lines.
    :param pending_lines: Lines carried over from the previous chunk (incomplete entry).
    :returns: Complete entries and any pending lines for the next chunk.
    """
    entries: list[list[str]] = []
    current_entry: list[str] = list(pending_lines) if pending_lines else []

    for line in lines:
        if _LOG_ENTRY_START.match(line):
            # This line starts a new entry.
            if current_entry:
                entries.append(current_entry)
            current_entry = [line]
        else:
            # Continuation line - add to current entry.
            current_entry.append(line)

    # Return complete entries and any pending lines.
    return AggregatedLogEntries(entries=entries, pending=current_entry)


async def tail_logs(
    instance: B2CInstance,
    options: TailLogsOptions | None = None,
    *,
    sleep: Callable[[float], Awaitable[None]] = asyncio.sleep,
) -> TailLogsResult:
    """Tail log files on a B2C Commerce instance.

    Continuously polls for new log content using HTTP Range requests for
    efficiency. Calls the ``on_entry`` callback for each new log line.

    :param instance: B2C instance to tail logs from.
    :param options: Tailing options (filters, callbacks, polling interval).
    :param sleep: Injectable sleep function (Python-only, see module docstring).
    :returns: Tail result with ``stop()`` control and a ``done`` awaitable.
    """
    logger = get_logger("operations.logs")
    opts = options or TailLogsOptions()
    prefixes = opts.prefixes or list(_DEFAULT_PREFIXES)
    poll_interval = opts.poll_interval if opts.poll_interval is not None else _DEFAULT_POLL_INTERVAL
    last_entries = opts.last_entries
    max_entries = opts.max_entries
    path_normalizer = opts.path_normalizer
    on_entry = opts.on_entry
    on_error = opts.on_error
    on_file_discovered = opts.on_file_discovered
    on_file_rotated = opts.on_file_rotated

    # Track file positions and collected entries.
    file_positions: dict[str, int] = {}
    file_sizes: dict[str, int] = {}
    tracked_files: list[LogFile] = []
    collected_entries: list[LogEntry] = []

    # Control state (dict for mutability from nested closures).
    state = {"running": True}
    loop = asyncio.get_running_loop()
    done_future: asyncio.Future[None] = loop.create_future()

    # Incremental decoders for proper UTF-8 handling (one per file for streaming).
    decoders: dict[str, codecs.IncrementalDecoder] = {}

    # Pending lines for multi-line entry aggregation (per file).
    pending_lines: dict[str, list[str]] = {}

    async def stop() -> None:
        """Stop the tailing operation."""
        state["running"] = False
        # Give a small delay to allow any in-flight requests to complete.
        await sleep(0.1)

    def get_decoder(filename: str) -> codecs.IncrementalDecoder:
        """Get or create a decoder for a file."""
        decoder = decoders.get(filename)
        if decoder is None:
            decoder = _new_decoder()
            decoders[filename] = decoder
        return decoder

    def _report_error(error: Exception) -> None:
        if on_error:
            on_error(error)

    async def fetch_last_entries(file: LogFile, count: int) -> list[LogEntry]:
        """Fetch the last N entries from a file's tail."""
        if count <= 0 or file.size == 0:
            return []

        try:
            # Read last ~64KB of the file to find recent entries.
            tail_bytes = min(file.size, _DEFAULT_TAIL_BYTES)
            start_byte = max(0, file.size - tail_bytes)

            if start_byte == 0:
                # Read entire file.
                content = await instance.webdav.get(file.path)
            else:
                # Use Range request for tail.
                response = await instance.webdav.request(
                    file.path, method="GET", headers={"Range": f"bytes={start_byte}-"}
                )

                if response.status_code == 416:
                    # File might be smaller than expected, read entire file.
                    content = await instance.webdav.get(file.path)
                elif not response.is_success and response.status_code != 206:
                    raise RuntimeError(f"Failed to read {file.name}: {response.status_code}")
                else:
                    content = response.content

            # Parse lines and aggregate into multi-line entries.
            lines = split_lines(content, _new_decoder(), True)

            # If we started mid-file, skip lines until we find an entry start.
            start_index = 0
            if start_byte > 0:
                for i, line in enumerate(lines):
                    if _LOG_ENTRY_START.match(line):
                        start_index = i
                        break

            # Aggregate lines into entries.
            raw_entries, pending = aggregate_log_entries(lines[start_index:], [])

            # Include pending as the last entry if it has content.
            all_raw_entries = [*raw_entries, pending] if pending else raw_entries

            entries: list[LogEntry] = [
                parse_log_entry(entry_lines[0], file.name, "\n".join(entry_lines), path_normalizer)
                for entry_lines in all_raw_entries
            ]

            # Return only the last N entries (most recent).
            return entries[-count:]
        except Exception as error:  # noqa: BLE001 - reported via on_error, tailing continues
            logger.error("Error fetching last entries from %s: %s", file.name, error)
            _report_error(error if isinstance(error, Exception) else RuntimeError(str(error)))
            return []

    async def discover_files() -> None:
        """Discover and track log files matching the prefix filters."""
        try:
            files = await list_log_files(
                instance, ListLogsOptions(prefixes=prefixes, sort_by="date", sort_order="desc")
            )

            for file in files:
                if file.name not in file_positions:
                    # New file discovered.
                    logger.debug("Discovered log file: %s", file.name)

                    tracked_files.append(file)
                    file_sizes[file.name] = file.size

                    # Notify about discovery first.
                    if on_file_discovered:
                        on_file_discovered(file)

                    # Fetch and emit last N entries if requested.
                    if last_entries > 0:
                        recent_entries = await fetch_last_entries(file, last_entries)
                        for entry in recent_entries:
                            if on_entry:
                                on_entry(entry)
                            if max_entries is not None:
                                collected_entries.append(entry)
                                if len(collected_entries) >= max_entries:
                                    state["running"] = False
                                    return

                    # Set position to end of file to only tail new content.
                    file_positions[file.name] = file.size
                else:
                    # Check for file rotation (size decreased).
                    previous_size = file_sizes.get(file.name, 0)
                    if file.size < previous_size:
                        logger.debug("File rotated: %s (previous=%d, new=%d)", file.name, previous_size, file.size)

                        # Reset position to start of new file.
                        file_positions[file.name] = 0
                        file_sizes[file.name] = file.size

                        # Create fresh decoder and clear pending lines.
                        decoders[file.name] = _new_decoder()
                        pending_lines.pop(file.name, None)

                        if on_file_rotated:
                            on_file_rotated(file)
                    else:
                        file_sizes[file.name] = file.size
        except Exception as error:  # noqa: BLE001 - reported via on_error, tailing continues
            logger.error("Error discovering log files: %s", error)
            _report_error(error if isinstance(error, Exception) else RuntimeError(str(error)))

    async def read_new_content(file: LogFile) -> None:
        """Read new content from a file using a Range request."""
        position = file_positions.get(file.name, 0)
        current_size = file_sizes.get(file.name, 0)

        # No new content.
        if position >= current_size:
            return

        try:
            # Use Range header to get only new content.
            response = await instance.webdav.request(file.path, method="GET", headers={"Range": f"bytes={position}-"})

            # Handle different response statuses.
            if response.status_code == 416:
                # Range Not Satisfiable - position is at or past end of file.
                # This can happen due to race conditions, just skip.
                return

            if not response.is_success and response.status_code != 206:
                raise RuntimeError(f"Failed to read {file.name}: {response.status_code} {response.reason_phrase}")

            content = response.content
            decoder = get_decoder(file.name)

            # Update position based on content received.
            content_length = len(content)
            file_positions[file.name] = position + content_length

            # Parse lines and aggregate into multi-line entries.
            lines = split_lines(content, decoder, True)
            raw_entries, pending = aggregate_log_entries(lines, pending_lines.get(file.name, []))

            # Check if we've caught up to the end of the file.
            new_position = position + content_length
            at_end_of_file = new_position >= current_size

            # If we're at the end of the file, flush pending as a complete entry
            # (the entry is complete for now, more content may arrive later).
            if at_end_of_file and pending:
                all_entries = [*raw_entries, pending]
                pending_lines[file.name] = []
            else:
                all_entries = raw_entries
                pending_lines[file.name] = pending

            # Process complete entries.
            for entry_lines in all_entries:
                entry = parse_log_entry(entry_lines[0], file.name, "\n".join(entry_lines), path_normalizer)

                if on_entry:
                    on_entry(entry)

                if max_entries is not None:
                    collected_entries.append(entry)
                    if len(collected_entries) >= max_entries:
                        state["running"] = False
                        return
        except Exception as error:  # noqa: BLE001 - reported via on_error, tailing continues
            logger.error("Error reading %s: %s", file.name, error)
            _report_error(error if isinstance(error, Exception) else RuntimeError(str(error)))

    async def poll() -> None:
        """Main polling loop."""
        # Initial file discovery.
        await discover_files()

        while state["running"]:
            # Read new content from all tracked files.
            for file in list(tracked_files):
                if not state["running"]:
                    break
                await read_new_content(file)

            if not state["running"]:
                break

            # Wait for next poll.
            await sleep(poll_interval)

            # Check for new files.
            await discover_files()

        if not done_future.done():
            done_future.set_result(None)

    def _on_poll_task_done(task: asyncio.Task[None]) -> None:
        if task.cancelled():
            return
        error = task.exception()
        if error is None:
            return
        wrapped = error if isinstance(error, Exception) else RuntimeError(str(error))
        logger.error("Polling error: %s", wrapped)
        _report_error(wrapped)
        if not done_future.done():
            done_future.set_result(None)

    # Start polling (fire-and-forget - runs in the background).
    poll_task = asyncio.ensure_future(poll())
    poll_task.add_done_callback(_on_poll_task_done)

    return TailLogsResult(stop=stop, files=tracked_files, entries=collected_entries, done=done_future)


async def get_recent_logs(instance: B2CInstance, options: GetRecentLogsOptions | None = None) -> list[LogEntry]:
    """Get recent log entries (one-shot retrieval).

    Useful for MCP server integration or programmatic access without
    continuous tailing. Reads the tail end of log files and returns parsed
    entries.

    :param instance: B2C instance to get logs from.
    :param options: Retrieval options.
    :returns: Recent log entries.
    """
    logger = get_logger("operations.logs")
    opts = options or GetRecentLogsOptions()
    prefixes = opts.prefixes or list(_DEFAULT_PREFIXES)
    max_entries = opts.max_entries if opts.max_entries is not None else _DEFAULT_MAX_ENTRIES
    tail_bytes = opts.tail_bytes if opts.tail_bytes is not None else _DEFAULT_TAIL_BYTES
    path_normalizer = opts.path_normalizer

    logger.debug("Getting recent logs (prefixes=%s, max_entries=%d, tail_bytes=%d)", prefixes, max_entries, tail_bytes)

    # Get log files.
    files = await list_log_files(instance, ListLogsOptions(prefixes=prefixes, sort_by="date", sort_order="desc"))

    all_entries: list[LogEntry] = []

    # Read from files until we have enough entries.
    for file in files:
        if len(all_entries) >= max_entries:
            break

        try:
            # Calculate range to read (tail end of file).
            start_byte = max(0, file.size - tail_bytes)

            if start_byte == 0:
                # Read entire file.
                content = await instance.webdav.get(file.path)
            else:
                # Use Range request for tail.
                response = await instance.webdav.request(
                    file.path, method="GET", headers={"Range": f"bytes={start_byte}-"}
                )

                if response.status_code == 416:
                    # File might be smaller than expected, read entire file.
                    content = await instance.webdav.get(file.path)
                elif not response.is_success and response.status_code != 206:
                    raise RuntimeError(f"Failed to read {file.name}: {response.status_code}")
                else:
                    content = response.content

            # Parse lines and aggregate into multi-line entries.
            lines = split_lines(content, _new_decoder(), True)

            # If we started mid-file, skip lines until we find an entry start.
            start_index = 0
            if start_byte > 0:
                for i, line in enumerate(lines):
                    if _LOG_ENTRY_START.match(line):
                        start_index = i
                        break

            # Aggregate lines into entries.
            raw_entries, pending = aggregate_log_entries(lines[start_index:], [])

            # Process complete entries (ignore pending -- we're reading a snapshot).
            # Also include pending as the last entry if it has content.
            all_raw_entries = [*raw_entries, pending] if pending else raw_entries

            for entry_lines in all_raw_entries:
                entry = parse_log_entry(entry_lines[0], file.name, "\n".join(entry_lines), path_normalizer)
                all_entries.append(entry)

                if len(all_entries) >= max_entries:
                    break
        except Exception as error:  # noqa: BLE001 - continue to next file instead of failing completely
            logger.error("Error reading %s: %s", file.name, error)

    # Return entries in reverse order (most recent first).
    return list(reversed(all_entries))[:max_entries]


__all__ = ["aggregate_log_entries", "get_recent_logs", "parse_log_entry", "split_lines", "tail_logs"]
