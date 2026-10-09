# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Scope-tier client manager for SCAPI domains with dual scopes.

Mirrors ``src/clients/scapi-scope-tier.ts``. Many SCAPI Admin APIs expose two
scopes — read-only and read-write (e.g. ``sfcc.jobs`` and ``sfcc.jobs.rw``). A
given API client may have only one of them configured in Account Manager. The
optimistic strategy is to request ``rw`` first and downgrade to read-only only
when ``invalid_scope`` is detected on a read operation.

:class:`ScopeTierManager` encapsulates that state machine so each SCAPI backend
doesn't have to reimplement it. Write operations always require ``rw``; if we
already know the client only has read scope, the manager raises a descriptive
error rather than making a doomed request.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Generic, Literal, TypeVar

from b2c_tooling_sdk.clients.scapi_backend_utils import (
    ScapiCapabilityUnsupportedError,
    is_invalid_scope_error,
)

ScopeTier = Literal["rw", "read-only"]

C = TypeVar("C")
R = TypeVar("R")


class ScopeTierManager(Generic[C]):
    """Lazy-initialized manager for clients at different scope tiers.

    - First read or write call builds the rw client and caches it.
    - If the caller detects an ``invalid_scope`` error on a read attempt, it
      calls :meth:`downgrade_to_read_only` and the next read uses the read-only
      client.
    - Once downgraded, write requests raise — the API client lacks rw scope.

    The same rw client serves both read and write while the rw scope is valid;
    a separate read-only client is only built after a downgrade.
    """

    def __init__(
        self,
        *,
        build_client: Callable[[list[str]], C],
        rw_scopes: list[str],
        read_scopes: list[str],
        domain_name: str,
    ) -> None:
        self._build_client = build_client
        self._rw_scopes = rw_scopes
        self._read_scopes = read_scopes
        self._domain_name = domain_name
        self._rw_client: C | None = None
        self._read_client: C | None = None
        self._resolved: ScopeTier | None = None

    @property
    def resolved_tier(self) -> ScopeTier | None:
        """The currently-resolved tier, or ``None`` before first use."""
        return self._resolved

    def get_client_for_write(self) -> C:
        """Return a client suitable for write operations.

        :raises ScapiCapabilityUnsupportedError: if we've already downgraded to
            read-only — the API client doesn't have the rw scope. Raising this
            (rather than a plain error) lets the SCAPI/OCAPI fallback wrapper
            recognize the capability gap and route the write through OCAPI in
            ``auto`` mode.
        """
        if self._resolved == "read-only":
            raise ScapiCapabilityUnsupportedError(
                f'SCAPI {self._domain_name} API requires the "{" ".join(self._rw_scopes)}" scope. '
                "Add this scope to your API client in Account Manager."
            )
        if self._rw_client is None:
            self._rw_client = self._build_client(self._rw_scopes)
        self._resolved = "rw"
        return self._rw_client

    def get_client_for_read(self) -> C:
        """Return a client suitable for read operations.

        Prefers the rw client if it's already been used successfully (rw scope
        grants read too).
        """
        if self._resolved == "read-only":
            # Already downgraded; read_client is built in downgrade_to_read_only().
            assert self._read_client is not None
            return self._read_client
        if self._rw_client is None:
            self._rw_client = self._build_client(self._rw_scopes)
        self._resolved = "rw"
        return self._rw_client

    def downgrade_to_read_only(self) -> None:
        """Mark the rw scope as unavailable and build a read-only client.

        Subsequent :meth:`get_client_for_write` calls will raise; reads use the
        read-only client.
        """
        self._resolved = "read-only"
        self._read_client = self._build_client(self._read_scopes)

    async def try_read(self, fn: Callable[[C], Awaitable[R]]) -> R:
        """Run a read operation, downgrading and retrying once on ``invalid_scope``.

        Backends should wrap their reads with this so an API client provisioned
        with only the read-only scope (e.g. ``sfcc.scripts``) can still read
        through SCAPI. Writes do not go through this helper — they always require
        rw, and :meth:`get_client_for_write` already raises after a downgrade.
        """
        client = self.get_client_for_read()
        try:
            return await fn(client)
        except Exception as error:
            if self._resolved == "read-only" or not is_invalid_scope_error(error):
                raise
            self.downgrade_to_read_only()
            assert self._read_client is not None
            return await fn(self._read_client)


__all__ = ["ScopeTier", "ScopeTierManager"]
