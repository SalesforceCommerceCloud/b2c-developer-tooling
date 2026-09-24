#
# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
#
"""Reuse a CLI login session -> OCAPI (synchronous).

Same as ``cli_session_async.py``. The session-store lookup and strategy
construction are already synchronous; only ``resolve_config`` and
``list_code_versions`` come from ``b2c_tooling_sdk.sync``.

Run:  python code/cli_session_sync.py
"""

from __future__ import annotations

from b2c_tooling_sdk import CreateB2CInstanceOptions, ResolveConfigOptions
from b2c_tooling_sdk.auth import StatefulOAuthStrategy, StatefulOAuthStrategyOptions, find_auth_session
from b2c_tooling_sdk.sync import list_code_versions, resolve_config

from _common import DW_JSON, load_raw, require


def main() -> None:
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
    config = resolve_config(options=ResolveConfigOptions(config_path=str(DW_JSON)))  # blocks
    instance = config.create_b2c_instance(CreateB2CInstanceOptions(oauth_strategy=strategy))

    versions = list_code_versions(instance)  # blocks
    print(f"Reused CLI session; found {len(versions)} code version(s):")
    for version in versions:
        print(f"  {version.id}{'  (active)' if version.active else ''}")


if __name__ == "__main__":
    main()
