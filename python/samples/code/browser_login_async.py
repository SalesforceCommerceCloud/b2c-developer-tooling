#
# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
#
"""Interactive browser login (Authorization Code + PKCE) -> OCAPI (async).

This is the SDK equivalent of the CLI's ``b2c auth login <clientId>``: it opens
your browser, runs the Authorization Code + PKCE flow against Account Manager,
and *persists the session* to the shared ``auth-sessions.json`` store. Because
it's the same store the CLI uses, the session minted here is interchangeable
with a ``b2c auth login`` session (and with the ``cli_session`` sample).

Needs only ``clientId`` in dw.json (no client secret). The client's registered
redirect URI must include ``http://localhost:8080`` (the default local port).

  !! This pops open a real browser window and waits for you to approve. !!

Run:  python code/browser_login_async.py
"""

from __future__ import annotations

import asyncio

from b2c_tooling_sdk import CreateB2CInstanceOptions, ResolveConfigOptions, list_code_versions, resolve_config
from b2c_tooling_sdk.auth import PkceOAuthConfig, create_user_auth_strategy, find_auth_session

from _common import DW_JSON, load_raw, require


async def main() -> None:
    raw = load_raw()
    require(raw, "hostname", "clientId")
    client_id = raw["clientId"]
    account_manager_host = raw.get("accountManagerHost") or "account.demandware.com"

    # Build the browser-based "user" strategy (PKCE, with implicit fallback for
    # clients not registered for PKCE) -- the same primitive `b2c auth login` uses.
    strategy = create_user_auth_strategy(
        PkceOAuthConfig(client_id=client_id, account_manager_host=account_manager_host)
    )

    print(f"Opening a browser to log in client {client_id} ...")
    token = await strategy.get_token_response()  # opens browser, waits, then persists the session
    print(f"Login succeeded. Token expires at {token.expires:%Y-%m-%d %H:%M:%S %Z}.")

    # The session is now saved and reusable -- by this SDK, by the CLI, or by the
    # cli_session sample. Confirm it landed in the shared store.
    if find_auth_session(client_id) is not None:
        print("Session persisted to the shared auth-sessions store (reusable by the b2c CLI).")

    # Prove the fresh session works with a real OCAPI call.
    config = await resolve_config(options=ResolveConfigOptions(config_path=str(DW_JSON)))
    instance = config.create_b2c_instance(CreateB2CInstanceOptions(oauth_strategy=strategy))
    versions = await list_code_versions(instance)
    print(f"Verified via OCAPI: {len(versions)} code version(s) on {raw['hostname']}.")


if __name__ == "__main__":
    asyncio.run(main())
