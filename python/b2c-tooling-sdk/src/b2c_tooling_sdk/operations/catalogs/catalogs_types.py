# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Shared types for the SCAPI/OCAPI catalogs dual backend.

Mirrors ``src/operations/catalogs/catalogs-types.ts``.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol, runtime_checkable

from b2c_tooling_sdk.clients.scapi_backend_utils import BackendBase


@dataclass
class CatalogInfo:
    """Normalized catalog summary, shared by both backends."""

    id: str
    name: str | None = None
    online: bool | None = None
    #: The raw backend-specific payload the summary was built from.
    raw: Any = None


@dataclass
class ListCatalogsOptions:
    """Options for :meth:`CatalogsBackend.list_catalogs`."""

    start: int | None = None
    count: int | None = None


@runtime_checkable
class CatalogsBackend(BackendBase, Protocol):
    """Common interface implemented by both catalogs backends."""

    async def list_catalogs(self, options: ListCatalogsOptions | None = None) -> list[CatalogInfo]:
        """List catalogs, paginating internally up to ``options.count`` (or all)."""
        ...


__all__ = [
    "CatalogInfo",
    "CatalogsBackend",
    "ListCatalogsOptions",
]
