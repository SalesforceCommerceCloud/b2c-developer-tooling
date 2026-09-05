#
# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
#
"""Interactive browser login (Authorization Code + PKCE) -> OCAPI (synchronous).

Blocking counterpart of ``browser_login_async.py``.

Unlike the other samples, the login factory (``create_user_auth_strategy``)
lives in the ``b2c_tooling_sdk.auth`` submodule, which the flat
``b2c_tooling_sdk.sync`` facade does not mirror -- so there is no ready-made
blocking twin for it. We drive that single ``get_token_response()`` coroutine
with ``asyncio.run(...)``, then reuse the resulting strategy through the
blocking sync facade (``resolve_config`` / ``list_code_versions``).

  !! This pops open a real browser window and waits for you to approve. !!

Run:  python code/browser_login_sync.py
"""

from __future__ import annotations

import asyncio

from b2c_tooling_sdk import CreateB2CInstanceOptions, ResolveConfigOptions
from b2c_tooling_sdk.auth import PkceOAuthConfig, create_user_auth_strategy, find_auth_session
from b2c_tooling_sdk.sync import list_code_versions, resolve_config

from _common import DW_JSON, load_raw, require


def main() -> None:
    raw = load_raw()
    require(raw, "hostname", "clientId")
    client_id = raw["clientId"]
    account_manager_host = raw.get("accountManagerHost") or "account.demandware.com"

    strategy = create_user_auth_strategy(
        PkceOAuthConfig(client_id=client_id, account_manager_host=account_manager_host)
    )

    print(f"Opening a browser to log in client {client_id} ...")
    token = asyncio.run(strategy.get_token_response())  # opens browser, waits, then persists the session
    print(f"Login succeeded. Token expires at {token.expires:%Y-%m-%d %H:%M:%S %Z}.")

    if find_auth_session(client_id) is not None:
        print("Session persisted to the shared auth-sessions store (reusable by the b2c CLI).")

    # The freshly-built strategy is reused directly by the blocking OCAPI call.
    config = resolve_config(options=ResolveConfigOptions(config_path=str(DW_JSON)))
    instance = config.create_b2c_instance(CreateB2CInstanceOptions(oauth_strategy=strategy))
    versions = list_code_versions(instance)
    print(f"Verified via OCAPI: {len(versions)} code version(s) on {raw['hostname']}.")


if __name__ == "__main__":
    main()
