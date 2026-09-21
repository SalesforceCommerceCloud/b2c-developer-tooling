# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Persistent-loop runner backing the synchronous facade.

A single background daemon thread runs one ``asyncio`` event loop for the whole
process. Every synchronous call submits its coroutine to that loop via
:func:`asyncio.run_coroutine_threadsafe` and blocks on the result.

Using *one* persistent loop (rather than :func:`asyncio.run` per call) is
deliberate: SDK service objects hold loop-bound resources (a persistent
``httpx.AsyncClient`` per client, single-flight token-minting locks/tasks), so a
fresh loop per call would raise ``RuntimeError: ... attached to a different
loop`` on the second call. Reusing one loop preserves those semantics exactly.

Calling the facade from inside an already-running event loop (e.g. your own
async code) blocks *that* loop's thread until the call completes rather than
deadlocking - this is deliberately tolerated because it is also what every
Jupyter cell does (ipykernel always executes cell code inside a running loop,
awaited or not; the "frictionless" sync facade in notebooks depends on this
working). :func:`run_sync` emits a :class:`RuntimeWarning` in that case, since
serializing concurrent async work this way is usually a mistake outside a
single-cell/single-request context, but it does not raise.

Do not mix direct ``await`` use of an SDK object with sync-facade use of that
*same* object in one process - once an object has run a coroutine on a given
loop, its loop-bound resources (a persistent ``httpx.AsyncClient``, etc.) are
pinned to it; :func:`run_sync` re-raises the resulting cross-loop
``RuntimeError`` with an actionable hint rather than the bare asyncio message.
"""

from __future__ import annotations

import asyncio
import atexit
import threading
import warnings
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


_CROSS_LOOP_HINT = (
    " This SDK service object appears to have been created or previously awaited "
    "on a different asyncio event loop (for example, your own async code, or a "
    "distinct process-level loop). Do not mix direct `await` use of an SDK object "
    "with the `b2c_tooling_sdk.sync` facade for that *same* object within one "
    "process - pick one calling convention per object."
)


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
        coro.close()
        msg = "run_sync() must not be called from within the SDK sync event-loop thread"
        raise RuntimeError(msg)

    try:
        asyncio.get_running_loop()
    except RuntimeError:
        pass
    else:
        # The calling thread is itself inside a running event loop (e.g. async
        # code, or - harmlessly - any Jupyter cell). Blocking on future.result()
        # below stalls that loop until the background coroutine finishes; fine
        # for a single notebook cell, but silently serializes real concurrent
        # work if the caller is, say, an async web handler. Warn rather than
        # raise, since Jupyter's loop-per-cell design makes this path routine.
        warnings.warn(
            "b2c_tooling_sdk.sync was called from inside a running event loop; "
            "this blocks that loop until the call completes. If you are inside "
            "async code with other concurrent work pending, use the async "
            "b2c_tooling_sdk API directly instead.",
            RuntimeWarning,
            stacklevel=2,
        )

    future = asyncio.run_coroutine_threadsafe(coro, loop)
    try:
        return future.result()
    except RuntimeError as error:
        if "different loop" in str(error) or "different event loop" in str(error):
            raise RuntimeError(str(error) + _CROSS_LOOP_HINT) from error
        raise
