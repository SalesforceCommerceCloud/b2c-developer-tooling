#
# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
#
"""SLAS guest shopper token (synchronous).

Same as ``slas_shopper_async.py`` using ``b2c_tooling_sdk.sync`` — the config
dataclass passes through unchanged and ``get_guest_token`` blocks.

Run:  python code/slas_shopper_sync.py
"""

from __future__ import annotations

from b2c_tooling_sdk.sync import SlasTokenConfig, get_guest_token

from _common import load_raw, require


def main() -> None:
    raw = load_raw()
    require(raw, "shortCode", "organizationId", "slasClientId", "siteId", "slasRedirectUri")

    config = SlasTokenConfig(
        short_code=raw["shortCode"],
        organization_id=raw["organizationId"],
        slas_client_id=raw["slasClientId"],
        site_id=raw["siteId"],
        redirect_uri=raw["slasRedirectUri"],
    )

    token = get_guest_token(config)  # blocks
    print("Minted a guest shopper token:")
    print(f"  access_token: {token.access_token[:12]}... (expires in {token.expires_in}s)")
    print(f"  usid:         {token.usid}")
    print(f"  customer_id:  {token.customer_id}")


if __name__ == "__main__":
    main()
