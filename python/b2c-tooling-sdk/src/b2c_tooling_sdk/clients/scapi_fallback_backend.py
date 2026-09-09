# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Generic fallback wrapper for SCAPI/OCAPI dual backends.

Mirrors ``src/clients/scapi-fallback-backend.ts``. The TypeScript version builds
a ``Proxy`` that implements the same interface as the underlying backends. Python
has no ``Proxy``, so :func:`create_fallback_backend` returns a wrapper object whose
``__getattr__`` intercepts attribute access: async methods route through
:func:`_with_fallback` (try SCAPI first; on a recognized safe fallback trigger,
fall back to OCAPI for that call and re-pin), while the ``name`` property reflects
the currently-active backend.

A successful SCAPI call pins *softly* — a later call that trips a fallback trigger
still routes to OCAPI and re-pins, so a flow that reads under a read-only scope and
then needs to write isn't stuck. Once pinned to OCAPI, calls stay there.
"""

from __future__ import annotations

from typing import Any, TypeVar, cast

from b2c_tooling_sdk.clients.scapi_backend_utils import BackendBase, is_fallback_trigger
from b2c_tooling_sdk.logging import get_logger

T = TypeVar("T", bound=BackendBase)


class _FallbackBackend:
    """Wraps ``scapi`` + ``ocapi`` backends, routing method calls through fallback.

    Presents the same interface as the wrapped backends via ``__getattr__``.
    Each instance holds its own resolution state.
    """

    def __init__(self, scapi: BackendBase, ocapi: BackendBase, domain_name: str) -> None:
        self._scapi = scapi
        self._ocapi = ocapi
        self._domain_name = domain_name
        self._resolved: BackendBase | None = None

    @property
    def name(self) -> str:
        """The currently-active backend's name ('scapi' until a call resolves)."""
        return (self._resolved or self._scapi).name

    async def _with_fallback(self, method: str, args: tuple[Any, ...], kwargs: dict[str, Any]) -> Any:
        # Once we've fallen back to OCAPI, stay there — there's no SCAPI surface
        # to re-attempt. Errors propagate from OCAPI directly.
        if self._resolved is self._ocapi:
            return await getattr(self._ocapi, method)(*args, **kwargs)

        # Either unresolved (first call) or already pinned to SCAPI by a prior
        # successful call. Try SCAPI; a fallback-trigger error routes this call
        # through OCAPI and re-pins (handles read-then-write after a read-only
        # scope downgrade).
        target = self._resolved or self._scapi
        try:
            result = await getattr(target, method)(*args, **kwargs)
            if self._resolved is None:
                self._resolved = self._scapi
            return result
        except Exception as error:  # noqa: BLE001 - inspected by is_fallback_trigger
            if is_fallback_trigger(error):
                get_logger().info(f"SCAPI {self._domain_name} unavailable for this operation, falling back to OCAPI")
                self._resolved = self._ocapi
                return await getattr(self._ocapi, method)(*args, **kwargs)
            raise

    def __getattr__(self, name: str) -> Any:
        # __getattr__ only fires for attributes not found normally (so `name`,
        # the private fields, and methods defined on this class are unaffected).
        # Guard private/dunder names to avoid recursion before __init__ finishes.
        if name.startswith("_"):
            raise AttributeError(name)

        value = getattr(self._scapi, name)

        # Non-callables (constants, cached getters): return as-is from SCAPI.
        if not callable(value):
            return value

        # If the method is missing from OCAPI (a SCAPI-only capability), don't
        # attempt a fallback — call SCAPI directly. Callers should use a
        # capability guard before invoking such a method.
        if not callable(getattr(self._ocapi, name, None)):
            return value

        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            return await self._with_fallback(name, args, kwargs)

        return wrapper


def create_fallback_backend(scapi: T, ocapi: T, domain_name: str) -> T:
    """Create a fallback wrapper over ``scapi`` and ``ocapi`` backends.

    The returned object presents the same interface as ``T``. Method calls are
    intercepted: the first call tries SCAPI; on a safe fallback trigger it falls
    back to OCAPI and re-pins. The ``name`` property reflects the resolved backend.

    :param scapi: Primary (SCAPI) backend implementation.
    :param ocapi: Fallback (OCAPI) backend implementation.
    :param domain_name: Used in fallback log messages, e.g. ``"jobs"``.
    :returns: A wrapper over ``scapi`` whose methods route through fallback logic.
    """
    return cast("T", _FallbackBackend(scapi, ocapi, domain_name))


__all__ = ["create_fallback_backend"]
