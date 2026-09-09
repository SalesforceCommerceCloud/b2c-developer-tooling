# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Site operations for B2C Commerce instances.

Mirrors ``src/operations/sites/index.ts``. Provides functions for managing
site cartridge paths on B2C Commerce instances. Operations use SCAPI first,
with temporary OCAPI and site-archive fallbacks. Business Manager
(``Sites-Site``) is supported via the import/export mechanism.

## Cartridge Path Functions

- :func:`get_cartridge_path` - Get the current cartridge path for a site
- :func:`add_cartridge` - Add a cartridge at a specific position
- :func:`remove_cartridge` - Remove a cartridge from the path
- :func:`set_cartridge_path` - Replace the entire cartridge path

## Usage

.. code-block:: python

    from b2c_tooling_sdk.operations.sites import get_cartridge_path, add_cartridge, set_cartridge_path
    from b2c_tooling_sdk.config import resolve_config

    config = resolve_config()
    instance = config.create_b2c_instance()

    # List cartridge path
    result = await get_cartridge_path(instance, "RefArch")
    print(result.cartridge_list)

    # Add a cartridge
    await add_cartridge(instance, "RefArch", AddCartridgeOptions(name="my_cartridge", position="first"))

    # Business Manager
    await add_cartridge(instance, "Sites-Site", AddCartridgeOptions(name="bm_ext", position="first"))

## Authentication

Cartridge path operations require OAuth authentication. For SCAPI direct
updates, grant ``sfcc.sites.rw``; for OCAPI grant POST/PUT/DELETE on
``/sites/*/cartridges``. For import/export fallback, grant job execution
permissions and WebDAV write access.
"""

from __future__ import annotations

from b2c_tooling_sdk.operations.sites.cartridges import (
    BM_SITE_ID,
    AddCartridgeOptions,
    CartridgePathResult,
    CartridgeUpdateOptions,
    add_cartridge,
    get_cartridge_path,
    remove_cartridge,
    set_cartridge_path,
)
from b2c_tooling_sdk.operations.sites.ocapi_sites_backend import OcapiSitesBackend
from b2c_tooling_sdk.operations.sites.scapi_sites_backend import ScapiSitesBackend

# Site read operations (list/get) — SCAPI with OCAPI fallback
from b2c_tooling_sdk.operations.sites.sites_backend import SitesBackendConfig, create_sites_backend
from b2c_tooling_sdk.operations.sites.sites_types import CartridgePosition, ListSitesOptions, SiteInfo, SitesBackend

__all__ = [
    "BM_SITE_ID",
    "AddCartridgeOptions",
    "CartridgePathResult",
    "CartridgePosition",
    "CartridgeUpdateOptions",
    "ListSitesOptions",
    "OcapiSitesBackend",
    "ScapiSitesBackend",
    "SiteInfo",
    "SitesBackend",
    "SitesBackendConfig",
    "add_cartridge",
    "create_sites_backend",
    "get_cartridge_path",
    "remove_cartridge",
    "set_cartridge_path",
]
