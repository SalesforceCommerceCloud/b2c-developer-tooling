#
# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
#
"""OAuth client-credentials -> OCAPI (synchronous).

Identical to ``oauth_ocapi_async.py`` but imports the blocking twins from
``b2c_tooling_sdk.sync`` and drops ``await``.

Run:  python code/oauth_ocapi_sync.py
"""

from __future__ import annotations

from b2c_tooling_sdk import ResolveConfigOptions
from b2c_tooling_sdk.sync import list_code_versions, resolve_config

from _common import DW_JSON, load_raw, require


def main() -> None:
    require(load_raw(), "hostname", "clientId", "clientSecret")

    config = resolve_config(options=ResolveConfigOptions(config_path=str(DW_JSON)))  # blocks
    instance = config.create_b2c_instance()

    versions = list_code_versions(instance)  # blocks
    print(f"Found {len(versions)} code version(s):")
    for version in versions:
        print(f"  {version.id}{'  (active)' if version.active else ''}")


if __name__ == "__main__":
    main()
