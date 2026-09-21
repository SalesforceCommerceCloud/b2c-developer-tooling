#
# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
#
"""Basic auth -> WebDAV (async).

Uploads a small text file to the instance's WebDAV ``Impex`` area, reads it back,
then deletes it. Basic auth uses ``username`` + ``password`` from dw.json (a
WebDAV user / access key).

Run:  python code/basic_webdav_async.py
"""

from __future__ import annotations

import asyncio

from b2c_tooling_sdk import ResolveConfigOptions, resolve_config

from _common import DW_JSON, load_raw, require

TARGET = "Impex/src/instance/hello-from-python.txt"
PAYLOAD = "Hello from the B2C Tooling SDK for Python.\n"


async def main() -> None:
    require(load_raw(), "hostname", "username", "password")

    config = await resolve_config(options=ResolveConfigOptions(config_path=str(DW_JSON)))
    instance = config.create_b2c_instance()
    webdav = instance.webdav  # Basic auth is preferred automatically when set.

    await webdav.put(TARGET, PAYLOAD, content_type="text/plain")
    print(f"Uploaded {TARGET}")

    data = await webdav.get(TARGET)
    print(f"Read back {len(data)} bytes: {data.decode().strip()!r}")

    await webdav.delete(TARGET)
    print(f"Deleted {TARGET}")


if __name__ == "__main__":
    asyncio.run(main())
