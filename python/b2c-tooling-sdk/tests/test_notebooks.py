# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Execute every example notebook headless and assert no cell raises.

Guarantees the runnable examples in ``docs/notebooks`` stay green. Each notebook
is fully self-contained and offline (HTTP mocked with respx, all state in temp
dirs), so this needs no real network, credentials, or user files.
"""

from __future__ import annotations

from pathlib import Path

import nbformat
import pytest
from nbclient import NotebookClient

_NOTEBOOKS_DIR = Path(__file__).resolve().parent.parent / "docs" / "notebooks"
_NOTEBOOKS = sorted(_NOTEBOOKS_DIR.glob("*.ipynb"))


@pytest.mark.parametrize("notebook_path", _NOTEBOOKS, ids=lambda p: p.name)
def test_notebook_runs_without_error(notebook_path: Path) -> None:
    """Run a notebook top-to-bottom; NotebookClient raises if any cell errors."""
    nb = nbformat.read(str(notebook_path), as_version=4)
    client = NotebookClient(
        nb,
        timeout=120,
        kernel_name="python3",
        resources={"metadata": {"path": str(notebook_path.parent)}},
    )
    client.execute()


def test_notebooks_discovered() -> None:
    """Sanity check that the six example notebooks are present and discovered."""
    names = {p.name for p in _NOTEBOOKS}
    expected = {
        "01-authenticate.ipynb",
        "02-resolve-config-from-dw-json.ipynb",
        "03-share-session-with-cli.ipynb",
        "04-run-and-poll-a-job.ipynb",
        "05-webdav-upload.ipynb",
        "06-list-sites-and-catalogs.ipynb",
    }
    assert expected <= names
