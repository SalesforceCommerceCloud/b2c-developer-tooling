#
# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
#
"""OAuth client-credentials -> OCAPI (async).

Reads ``clientId`` + ``clientSecret`` from ``dw.json``, builds an authenticated
``B2CInstance``, and lists the instance's code versions via OCAPI.

Run:  python code/oauth_ocapi_async.py
"""

from __future__ import annotations

import asyncio

from b2c_tooling_sdk import ResolveConfigOptions, list_code_versions, resolve_config

from _common import DW_JSON, load_raw, require


async def main() -> None:
    require(load_raw(), "hostname", "clientId", "clientSecret")

    # resolve_config reads our dw.json; clientId + clientSecret -> OAuth
    # client-credentials, which the OCAPI client uses automatically.
    config = await resolve_config(options=ResolveConfigOptions(config_path=str(DW_JSON)))
    instance = config.create_b2c_instance()

    versions = await list_code_versions(instance)
    print(f"Found {len(versions)} code version(s):")
    for version in versions:
        print(f"  {version.id}{'  (active)' if version.active else ''}")


if __name__ == "__main__":
    asyncio.run(main())
