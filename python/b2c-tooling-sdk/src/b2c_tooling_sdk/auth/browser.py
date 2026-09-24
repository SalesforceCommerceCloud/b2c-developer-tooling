# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Default browser opener for interactive OAuth flows.

Mirrors the ``openBrowserDefault`` helper in ``oauth-pkce.ts`` / ``oauth-implicit.ts``,
which dynamically imports the ``open`` npm package. The Python analog uses the
stdlib :mod:`webbrowser` module, run in a thread so it never blocks the event
loop. Failures are swallowed — the authorization URL is always also logged so the
user can copy/paste it manually.
"""

from __future__ import annotations

import asyncio
import webbrowser

from b2c_tooling_sdk.logging import get_logger


async def open_browser_default(url: str) -> None:
    """Open ``url`` in the system default browser, ignoring failures."""
    try:
        await asyncio.to_thread(webbrowser.open, url)
    except Exception:  # noqa: BLE001 - opening the browser is best-effort
        get_logger("auth.browser").debug("Could not automatically open browser")


__all__ = ["open_browser_default"]
