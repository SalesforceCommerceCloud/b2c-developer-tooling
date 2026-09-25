#
# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
#
"""Shared helpers for the code samples.

Every sample reuses the connection info in ``samples/dw.json`` (a sibling of
this ``code/`` directory). That file is git-ignored — copy ``dw.example.json`` to
``dw.json`` and fill in your own values first.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

# ``samples/dw.json`` lives one directory up from this ``code/`` folder.
DW_JSON = Path(__file__).resolve().parent.parent / "dw.json"


def load_raw() -> dict[str, Any]:
    """Return the raw ``dw.json`` as a dict (camelCase keys, as written on disk).

    Used by samples that need fields the normalized config model does not carry
    (e.g. the SLAS ``organizationId`` / ``slasRedirectUri``).
    """
    if not DW_JSON.exists():
        raise SystemExit(
            f"Missing {DW_JSON}.\n"
            "Copy dw.example.json to dw.json and fill in your instance details first."
        )
    return json.loads(DW_JSON.read_text())


def require(raw: dict[str, Any], *keys: str) -> None:
    """Exit with a friendly message if any required field is blank/missing."""
    missing = [k for k in keys if not raw.get(k)]
    if missing:
        raise SystemExit(
            f"The following field(s) are empty in {DW_JSON}: {', '.join(missing)}.\n"
            "Fill them in (see dw.example.json) and re-run."
        )
