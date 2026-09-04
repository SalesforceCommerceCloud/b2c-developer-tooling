#
# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
#
"""Basic auth -> WebDAV (synchronous).

The WebDAV client has no top-level operation, so it has no sync twin in
``b2c_tooling_sdk.sync``. This "sync" sample resolves config with the blocking
facade, then wraps the WebDAV I/O in a single ``asyncio.run(...)`` block.

Run:  python code/basic_webdav_sync.py
"""

from __future__ import annotations

import asyncio

from b2c_tooling_sdk import ResolveConfigOptions
from b2c_tooling_sdk.sync import resolve_config

from _common import DW_JSON, load_raw, require

TARGET = "Impex/src/instance/hello-from-python.txt"
PAYLOAD = "Hello from the B2C Tooling SDK for Python.\n"


def main() -> None:
    require(load_raw(), "hostname", "username", "password")

    config = resolve_config(options=ResolveConfigOptions(config_path=str(DW_JSON)))  # blocks
    instance = config.create_b2c_instance()
    webdav = instance.webdav

    async def round_trip() -> None:
        await webdav.put(TARGET, PAYLOAD, content_type="text/plain")
        print(f"Uploaded {TARGET}")
        data = await webdav.get(TARGET)
        print(f"Read back {len(data)} bytes: {data.decode().strip()!r}")
        await webdav.delete(TARGET)
        print(f"Deleted {TARGET}")

    asyncio.run(round_trip())


if __name__ == "__main__":
    main()
