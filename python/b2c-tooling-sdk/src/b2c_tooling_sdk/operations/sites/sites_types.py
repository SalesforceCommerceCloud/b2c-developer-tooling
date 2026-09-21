# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Canonical types and backend interface for site read operations.

Mirrors ``src/operations/sites/sites-types.ts``.

The OCAPI Data API (``/sites``) and the SCAPI Sites API (``site/sites/v1``)
both expose site listing and per-site detail (including the cartridge path).
We expose a single canonical shape here so operation code is agnostic to which
backend serves the request.

SCAPI Sites v1.3 exposes dedicated custom-cartridge read/write operations;
OCAPI remains as the temporary compatibility backend.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal, Protocol, runtime_checkable

from b2c_tooling_sdk.clients.scapi_backend_utils import BackendBase

#: Position at which a cartridge is inserted into (or located within) the path.
CartridgePosition = Literal["first", "last", "before", "after"]


@dataclass
class SiteInfo:
    """Canonical site.

    CamelCase-ish fields match SCAPI; the OCAPI backend maps from snake_case.
    ``display_name`` is the default-locale display name (both APIs return a
    locale map; we surface the default for table output and keep the full
    object on ``raw``).
    """

    id: str
    display_name: str | None = None
    storefront_status: str | None = None
    cartridges: str | None = None
    #: Original backend response, for advanced consumers.
    raw: Any = None


@dataclass
class ListSitesOptions:
    """Options for listing sites."""

    #: Max sites to return (SCAPI ``limit``; OCAPI ``count``).
    count: int | None = None
    #: Offset (SCAPI ``offset``; OCAPI ``start``).
    start: int | None = None


@runtime_checkable
class SitesBackend(BackendBase, Protocol):
    """Backend contract for site read operations.

    Cartridge-path methods model the SCAPI v1.3 custom-cartridges resource and
    the equivalent OCAPI Data API resource.
    """

    async def list_sites(self, options: ListSitesOptions | None = None) -> list[SiteInfo]: ...

    async def get_site(self, site_id: str) -> SiteInfo: ...

    async def get_cartridge_path(self, site_id: str) -> str: ...

    async def set_cartridge_path(self, site_id: str, cartridges: str) -> str: ...

    async def add_cartridge(
        self, site_id: str, name: str, position: CartridgePosition, target: str | None = None
    ) -> str: ...

    async def remove_cartridge(self, site_id: str, name: str) -> str: ...


__all__ = [
    "CartridgePosition",
    "ListSitesOptions",
    "SiteInfo",
    "SitesBackend",
]
