# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Object-wrapping proxy for the synchronous facade.

Many public callables return *objects* whose methods are coroutines (clients,
backends, ``B2CInstance``, auth strategies, ``ConfigResolver``,
``ResolvedConfigImpl``). Wrapping only the free function is not enough: the
returned object's coroutine methods must also block. :class:`SyncProxy` wraps
such an object so that:

* a coroutine method → a blocking wrapper that runs it on the persistent loop
  and recursively :func:`syncify`-s the result (so chained objects stay sync);
* a plain sync method → called through, its result recursively synced;
* a plain attribute / property value → recursively synced (a nested SDK service
  object becomes a proxy; plain data passes through untouched).

Async generators are out of scope; accessing one yields a callable that raises
:class:`NotImplementedError` rather than attempting to sync-ify streaming.

Arguments that are themselves :class:`SyncProxy` instances are transparently
unwrapped to their async target before being handed to async code, so the sync
surface composes (e.g. a synced auth strategy can be passed to a sync client
factory).
"""

from __future__ import annotations

import dataclasses
import enum
import functools
import inspect
from typing import TYPE_CHECKING, Any

from b2c_tooling_sdk.sync._runner import run_sync

if TYPE_CHECKING:
    from collections.abc import Callable

_SDK_ROOT = "b2c_tooling_sdk"


def _is_sdk_service(obj: object) -> bool:
    """Return ``True`` if ``obj`` is an SDK *service* object that should be proxied.

    Service objects are the non-data instances defined in the SDK (clients,
    backends, ``B2CInstance``, auth strategies, config resolver/resolved config).
    Data — dataclasses, enums, exceptions, primitives, dicts/lists — and classes
    themselves are left untouched so ``isinstance`` and equality keep working.
    """
    module = getattr(type(obj), "__module__", "") or ""
    if not module.startswith(_SDK_ROOT):
        return False
    if isinstance(obj, type):
        return False
    if isinstance(obj, BaseException):
        return False
    if isinstance(obj, enum.Enum):
        return False
    return not dataclasses.is_dataclass(obj)


def _unwrap(value: Any) -> Any:
    """Unwrap a :class:`SyncProxy` back to its async target; pass others through."""
    if isinstance(value, SyncProxy):
        return object.__getattribute__(value, "_async_target")
    return value


def _unwrap_args(args: tuple[Any, ...], kwargs: dict[str, Any]) -> tuple[tuple[Any, ...], dict[str, Any]]:
    return tuple(_unwrap(a) for a in args), {k: _unwrap(v) for k, v in kwargs.items()}


def syncify(obj: Any) -> Any:
    """Wrap an SDK service object in a :class:`SyncProxy`; return anything else as-is."""
    if isinstance(obj, SyncProxy):
        return obj
    if _is_sdk_service(obj):
        return SyncProxy(obj)
    return obj


class SyncProxy:
    """Blocking proxy over an async SDK object.

    The underlying async object is available via the private ``_async_target``
    attribute for ``isinstance`` checks and escape hatches.
    """

    __slots__ = ("_async_target",)

    def __init__(self, target: Any) -> None:
        object.__setattr__(self, "_async_target", target)

    def __repr__(self) -> str:
        target = object.__getattribute__(self, "_async_target")
        return f"SyncProxy({target!r})"

    def __getattr__(self, name: str) -> Any:
        target = object.__getattribute__(self, "_async_target")
        attr = getattr(target, name)

        if inspect.iscoroutinefunction(attr):

            @functools.wraps(attr)
            def coroutine_method(*args: Any, **kwargs: Any) -> Any:
                pos, kw = _unwrap_args(args, kwargs)
                return syncify(run_sync(attr(*pos, **kw)))

            return coroutine_method

        if inspect.isasyncgenfunction(attr):

            def async_gen_stub(*_args: Any, **_kwargs: Any) -> Any:
                msg = f"{name!r} is an async generator; streaming APIs are not supported by the synchronous facade"
                raise NotImplementedError(msg)

            return async_gen_stub

        if callable(attr) and not inspect.isclass(attr):

            @functools.wraps(attr)
            def sync_method(*args: Any, **kwargs: Any) -> Any:
                pos, kw = _unwrap_args(args, kwargs)
                result = attr(*pos, **kw)
                if inspect.iscoroutine(result):
                    return syncify(run_sync(result))
                return syncify(result)

            return sync_method

        # Plain attribute / property value.
        return syncify(attr)


def _wrap_callable(async_fn: Callable[..., Any]) -> Callable[..., Any]:
    """Wrap a coroutine function as a blocking function that syncifies its result."""

    @functools.wraps(async_fn)
    def sync_fn(*args: Any, **kwargs: Any) -> Any:
        pos, kw = _unwrap_args(args, kwargs)
        return syncify(run_sync(async_fn(*pos, **kw)))

    return sync_fn


def _wrap_sync_factory(factory: Callable[..., Any]) -> Callable[..., Any]:
    """Wrap a synchronous factory so its (non-awaited) return value is syncified.

    The factory itself is not run on the loop (it is already synchronous), but
    the object it returns typically exposes coroutine methods, so its result is
    passed through :func:`syncify`.
    """

    @functools.wraps(factory)
    def sync_fn(*args: Any, **kwargs: Any) -> Any:
        pos, kw = _unwrap_args(args, kwargs)
        return syncify(factory(*pos, **kw))

    return sync_fn
