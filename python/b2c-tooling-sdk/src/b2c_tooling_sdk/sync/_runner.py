# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Persistent-loop runner backing the synchronous facade.

A single background daemon thread runs one ``asyncio`` event loop for the whole
process. Every synchronous call submits its coroutine to that loop via
:func:`asyncio.run_coroutine_threadsafe` and blocks on the result.

Using *one* persistent loop (rather than :func:`asyncio.run` per call) is
deliberate: the async SDK caches tokens with module-level ``asyncio.Future``
objects and locks (single-flight token minting). Those primitives are bound to
the loop that created them, so a fresh loop per call would raise
``RuntimeError: ... bound to a different event loop`` on the second call. Reusing
one loop preserves the async API's caching/single-flight semantics exactly.
"""

from __future__ import annotations

import asyncio
import atexit
import threading
from typing import TYPE_CHECKING, TypeVar

if TYPE_CHECKING:
    from collections.abc import Coroutine
    from typing import Any

T = TypeVar("T")

_SHUTDOWN_JOIN_TIMEOUT = 5.0

_loop: asyncio.AbstractEventLoop | None = None
_thread: threading.Thread | None = None
_lock = threading.Lock()


def _start_loop() -> asyncio.AbstractEventLoop:
    """Lazily start (once) the background loop thread and return the loop.

    Thread-safe: guarded by a module-level lock so concurrent first calls create
    a single loop.
    """
    global _loop, _thread

    with _lock:
        if _loop is not None:
            return _loop

        loop = asyncio.new_event_loop()

        def _run() -> None:
            asyncio.set_event_loop(loop)
            loop.run_forever()

        thread = threading.Thread(target=_run, name="b2c-sdk-sync-loop", daemon=True)
        thread.start()

        _loop = loop
        _thread = thread
        atexit.register(_shutdown)
        return loop


def _shutdown() -> None:
    """Stop the background loop and join its thread (registered via ``atexit``)."""
    global _loop, _thread

    with _lock:
        loop = _loop
        thread = _thread
        _loop = None
        _thread = None

    if loop is None:
        return

    loop.call_soon_threadsafe(loop.stop)
    if thread is not None:
        thread.join(timeout=_SHUTDOWN_JOIN_TIMEOUT)
    # The loop has stopped (run_forever returned); closing it now is safe.
    if not loop.is_closed():
        loop.close()


def run_sync(coro: Coroutine[Any, Any, T]) -> T:
    """Run ``coro`` on the persistent background loop and block for its result.

    Exceptions raised inside the coroutine propagate synchronously to the caller
    unchanged (``concurrent.futures.Future.result()`` re-raises), so the SDK's
    typed exceptions surface exactly as they do in the async API.
    """
    loop = _loop
    if loop is None:
        loop = _start_loop()

    if threading.current_thread() is _thread:
        # Submitting to our own loop and blocking on the result would deadlock.
        # This should never happen: sync-facade coroutines run *on* this loop and
        # therefore never re-enter run_sync. Guard defensively regardless.
        msg = "run_sync() must not be called from within the SDK sync event-loop thread"
        raise RuntimeError(msg)

    future = asyncio.run_coroutine_threadsafe(coro, loop)
    return future.result()
