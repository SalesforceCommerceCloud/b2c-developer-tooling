#
# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
#
"""Multi-environment config selection (async).

A single dw.json can carry a ``configs`` array of *named* environments. This
sample reads the bundled ``multi-env.example.json`` (pseudo values -- no network
needed) and shows how ``ResolveConfigOptions(instance=...)`` picks one.

Selection priority (same as the b2c CLI):
  1. the requested ``instance`` name, else
  2. the config marked ``active: true``, else
  3. the root-level config.

Each named config is self-contained: root-level keys are NOT merged into a
selected named entry, so give every environment its own full credentials.

Run:  python code/multi_env_async.py
"""

from __future__ import annotations

import asyncio
from pathlib import Path

from b2c_tooling_sdk import ResolveConfigOptions, resolve_config

# A multi-config dw.json bundled with the samples (kept out of the *dw.json*
# gitignore rule by its name). Point config_path at your own file the same way.
MULTI_ENV = Path(__file__).resolve().parent.parent / "multi-env.example.json"


async def main() -> None:
    print(f"Resolving named environments from {MULTI_ENV.name}\n")

    selections = [None, "staging", "production", "does-not-exist"]
    for selection in selections:
        config = await resolve_config(
            options=ResolveConfigOptions(config_path=str(MULTI_ENV), instance=selection)
        )
        values = config.values
        label = selection if selection is not None else "(default → active/root)"
        print(f"instance={label!r}")
        print(f"    hostname : {values.hostname}")
        print(f"    clientId : {values.client_id}")
        print()

    print("Tip: once a selection has real credentials, build an instance and call APIs:")
    print('    config = await resolve_config(options=ResolveConfigOptions(instance="production"))')
    print("    instance = config.create_b2c_instance()")


if __name__ == "__main__":
    asyncio.run(main())
