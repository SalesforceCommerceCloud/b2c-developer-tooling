# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Project-scoped ``.env`` loading.

Mirrors ``src/config/project-environment.ts``. Reads a project's ``.env`` file
without mutating the ambient environment, and merges it with the ambient
environment (ambient wins).
"""

from __future__ import annotations

import os
from pathlib import Path


def _parse_env(content: str) -> dict[str, str]:
    """Parse ``KEY=VALUE`` lines from a ``.env`` file (Node ``util.parseEnv`` analog).

    Blank lines and ``#`` comments are ignored. A leading ``export`` is stripped.
    Surrounding single or double quotes on the value are removed.
    """
    result: dict[str, str] = {}
    for raw_line in content.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[len("export ") :].lstrip()
        if "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        if not key:
            continue
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
            value = value[1:-1]
        result[key] = value
    return result


def read_project_environment(project_directory: str | None = None) -> dict[str, str] | None:
    """Read all variables from a project's ``.env`` file, or ``None`` if absent."""
    if not project_directory:
        return None
    environment_path = Path(project_directory) / ".env"
    if not environment_path.exists():
        return None
    return _parse_env(environment_path.read_text(encoding="utf-8"))


def merge_project_environment(
    project_environment: dict[str, str] | None = None,
    ambient_environment: dict[str, str] | None = None,
) -> dict[str, str]:
    """Merge project variables with the ambient environment (ambient wins)."""
    ambient = ambient_environment if ambient_environment is not None else dict(os.environ)
    merged: dict[str, str] = {}
    if project_environment:
        merged.update(project_environment)
    merged.update(ambient)
    return merged


__all__ = ["merge_project_environment", "read_project_environment"]
