# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the zip-slip guard in ``operations/util/zip.py``."""

from __future__ import annotations

import os

import pytest

from b2c_tooling_sdk.operations.util.zip import resolve_zip_entry_path


def test_resolve_zip_entry_path_joins_within_base(tmp_path: object) -> None:
    result = resolve_zip_entry_path(str(tmp_path), "cartridge", "file.js")
    assert result == os.path.join(os.path.abspath(str(tmp_path)), "cartridge", "file.js")


def test_resolve_zip_entry_path_rejects_relative_traversal(tmp_path: object) -> None:
    with pytest.raises(ValueError, match="escapes extraction directory"):
        resolve_zip_entry_path(str(tmp_path), "..", "..", "etc", "passwd")


def test_resolve_zip_entry_path_rejects_traversal_within_single_part(tmp_path: object) -> None:
    with pytest.raises(ValueError, match="escapes extraction directory"):
        resolve_zip_entry_path(str(tmp_path), "../../../etc/passwd")


def test_resolve_zip_entry_path_rejects_absolute_path(tmp_path: object) -> None:
    with pytest.raises(ValueError, match="escapes extraction directory"):
        resolve_zip_entry_path(str(tmp_path), "/etc/passwd")


def test_resolve_zip_entry_path_allows_sibling_named_like_prefix(tmp_path: object) -> None:
    # "outputs-evil" starts with the same characters as "output" but is a
    # sibling directory, not a subdirectory - must not be treated as "within".
    base = os.path.join(str(tmp_path), "output")
    escaping = os.path.join(str(tmp_path), "output-evil", "file.js")
    relative = os.path.relpath(escaping, base)
    with pytest.raises(ValueError, match="escapes extraction directory"):
        resolve_zip_entry_path(base, relative)
