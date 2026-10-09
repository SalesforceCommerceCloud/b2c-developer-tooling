#
# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
#
"""SLAS guest shopper token (async).

Mints a guest shopper access token via SLAS for a *public* client (no secret).
This is the storefront/shopper flow — distinct from the admin auth used by the
other samples. Reads the ``slas*`` / ``organizationId`` / ``siteId`` /
``shortCode`` fields directly from dw.json (they are not part of the normalized
admin config).

Feed the resulting token to SCAPI Shopper APIs (see ``PythonSDKTest`` for a
Shopper Search example that uses a guest token like this one).

Run:  python code/slas_shopper_async.py
"""

from __future__ import annotations

import asyncio

from b2c_tooling_sdk.slas import SlasTokenConfig, get_guest_token

from _common import load_raw, require


async def main() -> None:
    raw = load_raw()
    require(raw, "shortCode", "organizationId", "slasClientId", "siteId", "slasRedirectUri")

    config = SlasTokenConfig(
        short_code=raw["shortCode"],
        organization_id=raw["organizationId"],
        slas_client_id=raw["slasClientId"],
        site_id=raw["siteId"],
        redirect_uri=raw["slasRedirectUri"],
        # slas_client_secret=None -> public client (PKCE guest flow).
    )

    token = await get_guest_token(config)
    print("Minted a guest shopper token:")
    print(f"  access_token: {token.access_token[:12]}... (expires in {token.expires_in}s)")
    print(f"  usid:         {token.usid}")
    print(f"  customer_id:  {token.customer_id}")


if __name__ == "__main__":
    asyncio.run(main())
