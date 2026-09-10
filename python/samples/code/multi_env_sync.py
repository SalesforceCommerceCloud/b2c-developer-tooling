#
# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
#
"""Multi-environment config selection (synchronous).

Blocking twin of ``multi_env_async.py`` -- imports ``resolve_config`` from
``b2c_tooling_sdk.sync`` and drops ``await``. See that file for the selection
priority and why each named config must be self-contained.

Run:  python code/multi_env_sync.py
"""

from __future__ import annotations

from pathlib import Path

from b2c_tooling_sdk import ResolveConfigOptions
from b2c_tooling_sdk.sync import resolve_config

MULTI_ENV = Path(__file__).resolve().parent.parent / "multi-env.example.json"


def main() -> None:
    print(f"Resolving named environments from {MULTI_ENV.name}\n")

    selections = [None, "staging", "production", "does-not-exist"]
    for selection in selections:
        config = resolve_config(options=ResolveConfigOptions(config_path=str(MULTI_ENV), instance=selection))
        values = config.values
        label = selection if selection is not None else "(default → active/root)"
        print(f"instance={label!r}")
        print(f"    hostname : {values.hostname}")
        print(f"    clientId : {values.client_id}")
        print()

    print("Tip: once a selection has real credentials, build an instance and call APIs:")
    print('    config = resolve_config(options=ResolveConfigOptions(instance="production"))')
    print("    instance = config.create_b2c_instance()")


if __name__ == "__main__":
    main()
