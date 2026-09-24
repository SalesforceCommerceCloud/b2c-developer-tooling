#
# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
#
"""OAuth client-credentials -> SCAPI (async).

Uses the SCAPI catalogs backend to list catalogs. SCAPI requires ``shortCode`` +
``tenantId`` in dw.json plus client-credentials OAuth (the SDK derives the
per-request ``sfcc.*`` scopes for you).

Run:  python code/oauth_scapi_async.py
"""

from __future__ import annotations

import asyncio

from b2c_tooling_sdk import (
    CatalogsBackendConfig,
    ListCatalogsOptions,
    ResolveConfigOptions,
    create_catalogs_backend,
    resolve_config,
)

from _common import DW_JSON, load_raw, require


async def main() -> None:
    require(load_raw(), "hostname", "clientId", "clientSecret", "shortCode", "tenantId")

    config = await resolve_config(options=ResolveConfigOptions(config_path=str(DW_JSON)))
    instance = config.create_b2c_instance()

    # preference="scapi" forces the SCAPI backend (raises if the instance is not
    # SCAPI-capable). Use "auto" to prefer SCAPI with an OCAPI fallback.
    backend = create_catalogs_backend(CatalogsBackendConfig(instance=instance, preference="scapi"))

    catalogs = await backend.list_catalogs(ListCatalogsOptions(count=50))
    print(f"Found {len(catalogs)} catalog(s) via SCAPI:")
    for catalog in catalogs:
        print(f"  {catalog.id}{f'  — {catalog.name}' if catalog.name else ''}")


if __name__ == "__main__":
    asyncio.run(main())
