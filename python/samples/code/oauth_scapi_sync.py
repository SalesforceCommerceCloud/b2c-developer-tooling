#
# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
#
"""OAuth client-credentials -> SCAPI (synchronous).

Same as ``oauth_scapi_async.py`` using ``b2c_tooling_sdk.sync``. The sync
``create_catalogs_backend`` returns a backend whose methods block.

Run:  python code/oauth_scapi_sync.py
"""

from __future__ import annotations

from b2c_tooling_sdk import CatalogsBackendConfig, ListCatalogsOptions, ResolveConfigOptions
from b2c_tooling_sdk.sync import create_catalogs_backend, resolve_config

from _common import DW_JSON, load_raw, require


def main() -> None:
    require(load_raw(), "hostname", "clientId", "clientSecret", "shortCode", "tenantId")

    config = resolve_config(options=ResolveConfigOptions(config_path=str(DW_JSON)))  # blocks
    instance = config.create_b2c_instance()

    backend = create_catalogs_backend(CatalogsBackendConfig(instance=instance, preference="scapi"))
    catalogs = backend.list_catalogs(ListCatalogsOptions(count=50))  # blocks
    print(f"Found {len(catalogs)} catalog(s) via SCAPI:")
    for catalog in catalogs:
        print(f"  {catalog.id}{f'  — {catalog.name}' if catalog.name else ''}")


if __name__ == "__main__":
    main()
