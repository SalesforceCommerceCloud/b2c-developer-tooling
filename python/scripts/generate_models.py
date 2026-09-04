# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Generate Pydantic v2 models from the vendored OpenAPI specs.

Python analog of the TypeScript SDK's ``generate:types`` npm script (which runs
``openapi-typescript`` per spec into ``src/clients/*.generated.ts``). Here we run
``datamodel-code-generator`` per spec into ``src/b2c_tooling_sdk/clients/models/*.py``.

The spec -> module mapping mirrors the TS ``*.generated.ts`` base names so the two
SDKs stay aligned (e.g. ``data-api.json`` -> ``ocapi``, ``operations-jobs-v1.yaml``
-> ``scapi_jobs``).

Wire field names are preserved verbatim; ``datamodel-code-generator`` adds field
aliases automatically where a JSON key is not a valid Python identifier. Output is
deterministic (timestamps disabled) so the checked-in models produce no diff after a
clean regeneration.

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
SPECS_DIR = PACKAGE_ROOT / "specs"
MODELS_DIR = PACKAGE_ROOT / "src" / "b2c_tooling_sdk" / "clients" / "models"


def _codegen_bin() -> str:
    """Prefer the venv-local datamodel-codegen; fall back to PATH."""
    candidate = PACKAGE_ROOT / ".venv" / "bin" / "datamodel-codegen"
    return str(candidate) if candidate.exists() else "datamodel-codegen"


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
        "--formatters",
        "black",
        "--formatters",
        "isort",
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
    """Apply post-generation fixups needed for pydantic v2 to build the models."""
    text = output.read_text()
    fixed = _DISCRIMINATOR_RE.sub("", text)
    if fixed != text:
        output.write_text(fixed)


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
        'Do not edit by hand; regenerate from ``specs/`` instead."""\n',
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
