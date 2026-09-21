#
# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
#
"""Reuse a CLI login session -> OCAPI (async).

Instead of a client secret, this reuses the token the B2C CLI stored in the
shared ``auth-sessions.json``. Log in once with the CLI first:

    b2c auth login <your clientId>

Then this sample finds that session by ``clientId`` and uses it (no secret in
dw.json). On 401 the session is cleared and you must log in again.

Run:  python code/cli_session_async.py
"""

from __future__ import annotations

import asyncio

from b2c_tooling_sdk import CreateB2CInstanceOptions, ResolveConfigOptions, list_code_versions, resolve_config
from b2c_tooling_sdk.auth import StatefulOAuthStrategy, StatefulOAuthStrategyOptions, find_auth_session

from _common import DW_JSON, load_raw, require


async def main() -> None:
    raw = load_raw()
    require(raw, "hostname", "clientId")
    client_id = raw["clientId"]
    account_manager_host = raw.get("accountManagerHost") or "account.demandware.com"

    session = find_auth_session(client_id)
    if session is None:
        print(f"No stored session for clientId {client_id}.")
        print(f"Log in first:  b2c auth login {client_id}")
        return

    strategy = StatefulOAuthStrategy(session, StatefulOAuthStrategyOptions(account_manager_host))
    config = await resolve_config(options=ResolveConfigOptions(config_path=str(DW_JSON)))
    instance = config.create_b2c_instance(CreateB2CInstanceOptions(oauth_strategy=strategy))

    versions = await list_code_versions(instance)
    print(f"Reused CLI session; found {len(versions)} code version(s):")
    for version in versions:
        print(f"  {version.id}{'  (active)' if version.active else ''}")


if __name__ == "__main__":
    asyncio.run(main())
