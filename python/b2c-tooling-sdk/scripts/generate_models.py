# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Generate Pydantic v2 models from the JS SDK's OpenAPI specs.

Python analog of the TypeScript SDK's ``generate:types`` npm script (which runs
``openapi-typescript`` per spec into ``src/clients/*.generated.ts``). Here we run
``datamodel-code-generator`` per spec into ``src/b2c_tooling_sdk/clients/models/*.py``.

The specs are read from the sibling JS package (``packages/b2c-tooling-sdk/specs``)
so there is a single source of truth -- the Python package does not vendor its own
copy. Codegen is a monorepo-only dev activity, and the generated models are
committed, so end users never need the specs.

The spec -> module mapping mirrors the TS ``*.generated.ts`` base names so the two
SDKs stay aligned (e.g. ``data-api.json`` -> ``ocapi``, ``operations-jobs-v1.yaml``
-> ``scapi_jobs``).

Wire field names are preserved verbatim; ``datamodel-code-generator`` adds field
aliases automatically where a JSON key is not a valid Python identifier.

Formatting is done by the project's own ``ruff`` (``ruff format`` + import sort),
not by ``datamodel-code-generator``'s built-in black/isort integration. That
integration silently no-ops on recent black/Python combinations, which made
regeneration non-deterministic. Driving generation with the ``builtin`` formatter
and finalizing with the pinned project ``ruff`` keeps output stable and identical
to how every other file in the tree is formatted, so a clean regeneration produces
no diff (timestamps are also disabled).

Usage::

    ./.venv/bin/python scripts/generate_models.py
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

# Some specs declare an OpenAPI ``discriminator`` on a single-variant union. The
# generator emits ``Field(..., discriminator="x")`` where the discriminator field
# is typed ``str`` (not ``Literal``); pydantic v2 rejects that at class-build time.
# The discriminator adds no value for a single-member union, so we strip the kwarg.
_DISCRIMINATOR_RE = re.compile(r',\s*discriminator="[^"]*"')

# spec filename -> generated module name (mirrors TS *.generated.ts base names).
SPEC_TO_MODULE: dict[str, str] = {
    "data-api.json": "ocapi",
    "slas-admin-v1.yaml": "slas_admin",
    "ods-api-v1.json": "ods",
    "mrt-api-v1.json": "mrt",
    "mrt-b2c.json": "mrt_b2c",
    "custom-apis-v1.yaml": "custom_apis",
    "scapi-schemas-v1.yaml": "scapi_schemas",
    "cdn-zones-v1.yaml": "cdn_zones",
    "am-users-api-v1.yaml": "am_users_api",
    "am-roles-api-v1.yaml": "am_roles_api",
    "am-apiclients-api-v1.yaml": "am_apiclients_api",
    "granular-replications-v1.yaml": "granular_replications",
    "operations-jobs-v1.yaml": "scapi_jobs",
    "dx-scripts-v1.yaml": "scapi_scripts",
    "merchant-users-v1.yaml": "scapi_merchant_users",
    "merchant-roles-v1.yaml": "scapi_merchant_roles",
    "site-sites-v1.yaml": "scapi_sites",
    "product-catalogs-v1.yaml": "scapi_catalogs",
    "preferences-v1.yaml": "preferences",
    "metrics-v1.json": "metrics",
}

HEADER = (
    "# Copyright (c) 2025, Salesforce, Inc.\n"
    "# SPDX-License-Identifier: Apache-2.0\n"
    "# For full license text, see the LICENSE file in the repo root"
    " or http://www.apache.org/licenses/LICENSE-2.0\n"
)

PACKAGE_ROOT = Path(__file__).resolve().parent.parent
# Single source of truth for the OpenAPI specs: the JS SDK's checked-in copy.
# Codegen is a monorepo-only dev activity, so the sibling package is always
# present; we deliberately do NOT vendor a second copy under python/specs.
# The generated models under MODELS_DIR are committed, so end users never need
# the specs at install/runtime.
SPECS_DIR = PACKAGE_ROOT.parent / "packages" / "b2c-tooling-sdk" / "specs"
MODELS_DIR = PACKAGE_ROOT / "src" / "b2c_tooling_sdk" / "clients" / "models"


def _codegen_bin() -> str:
    """Prefer the venv-local datamodel-codegen; fall back to PATH."""
    candidate = PACKAGE_ROOT / ".venv" / "bin" / "datamodel-codegen"
    return str(candidate) if candidate.exists() else "datamodel-codegen"


def _ruff_bin() -> str:
    """Prefer the venv-local ruff; fall back to PATH."""
    candidate = PACKAGE_ROOT / ".venv" / "bin" / "ruff"
    return str(candidate) if candidate.exists() else "ruff"


def generate_one(spec: Path, module: str) -> None:
    output = MODELS_DIR / f"{module}.py"
    cmd = [
        _codegen_bin(),
        "--input",
        str(spec),
        "--input-file-type",
        "openapi",
        "--output",
        str(output),
        "--output-model-type",
        "pydantic_v2.BaseModel",
        "--target-python-version",
        "3.10",
        # Use the dependency-free builtin formatter here; the project's ruff does
        # the real formatting in _fixup_generated (see module docstring).
        "--formatters",
        "builtin",
        "--use-standard-collections",
        "--use-union-operator",
        "--field-constraints",
        "--use-double-quotes",
        "--disable-timestamp",
        "--use-schema-description",
        "--collapse-root-models",
        "--custom-file-header",
        HEADER.rstrip("\n"),
    ]
    print(f"  {spec.name} -> models/{module}.py")
    subprocess.run(cmd, check=True)
    _fixup_generated(output)


def _fixup_generated(output: Path) -> None:
    """Apply post-generation fixups, then format with the project's own ruff.

    The discriminator strip must happen before formatting so ruff sees valid,
    pydantic-buildable source. Formatting with the pinned project ruff (rather
    than datamodel-code-generator's built-in black/isort, which no-ops on recent
    toolchains) keeps regeneration deterministic and diff-free.
    """
    text = output.read_text()
    fixed = _DISCRIMINATOR_RE.sub("", text)
    if fixed != text:
        output.write_text(fixed)

    ruff = _ruff_bin()
    # Import sort first (ruff check --select I --fix), then format.
    subprocess.run([ruff, "check", "--select", "I", "--fix", "--quiet", str(output)], check=True)
    subprocess.run([ruff, "format", "--quiet", str(output)], check=True)


def main() -> int:
    if not SPECS_DIR.is_dir():
        print(f"specs directory not found: {SPECS_DIR}", file=sys.stderr)
        return 1
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Generating Pydantic models into {MODELS_DIR}")
    for spec_name, module in SPEC_TO_MODULE.items():
        spec = SPECS_DIR / spec_name
        if not spec.exists():
            print(f"  WARNING: missing spec {spec_name}, skipping", file=sys.stderr)
            continue
        generate_one(spec, module)

    _write_package_init()
    print("Done.")
    return 0


def _write_package_init() -> None:
    """Write ``models/__init__.py`` re-exporting each generated module."""
    modules = sorted(SPEC_TO_MODULE.values())
    lines = [
        HEADER,
        '"""Generated Pydantic v2 models for the B2C Commerce OpenAPI specs.\n\n'
        "This package is produced by ``scripts/generate_models.py`` and checked in.\n"
        'Do not edit by hand; run ``scripts/generate_models.py`` to regenerate."""\n',
        "from __future__ import annotations\n",
    ]
    for module in modules:
        lines.append(f"from b2c_tooling_sdk.clients.models import {module} as {module}")
    lines.append("")
    lines.append("__all__ = [")
    for module in modules:
        lines.append(f'    "{module}",')
    lines.append("]")
    (MODELS_DIR / "__init__.py").write_text("\n".join(lines) + "\n")


if __name__ == "__main__":
    raise SystemExit(main())
