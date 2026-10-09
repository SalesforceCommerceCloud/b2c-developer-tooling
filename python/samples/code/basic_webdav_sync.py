#
# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
#
"""Basic auth -> WebDAV (synchronous).

The WebDAV client has no dedicated top-level operation, but the synchronous
facade proxies the *whole* object graph: because ``resolve_config`` is imported
from ``b2c_tooling_sdk.sync``, the resolved config, the ``B2CInstance`` it
builds, and that instance's ``webdav`` client are all blocking proxies. So the
WebDAV calls here are plain blocking calls -- no ``await``, no ``asyncio``.

Run:  python code/basic_webdav_sync.py
"""

from __future__ import annotations

from b2c_tooling_sdk import ResolveConfigOptions
from b2c_tooling_sdk.sync import resolve_config

from _common import DW_JSON, load_raw, require

TARGET = "Impex/src/instance/hello-from-python.txt"
PAYLOAD = "Hello from the B2C Tooling SDK for Python.\n"


def main() -> None:
    require(load_raw(), "hostname", "username", "password")

    config = resolve_config(options=ResolveConfigOptions(config_path=str(DW_JSON)))  # blocks
    instance = config.create_b2c_instance()
    webdav = instance.webdav  # Basic auth is preferred automatically when set.

    webdav.put(TARGET, PAYLOAD, content_type="text/plain")
    print(f"Uploaded {TARGET}")

    data = webdav.get(TARGET)
    print(f"Read back {len(data)} bytes: {data.decode().strip()!r}")

    webdav.delete(TARGET)
    print(f"Deleted {TARGET}")


if __name__ == "__main__":
    main()
