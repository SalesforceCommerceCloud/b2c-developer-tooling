# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Recursive directory-to-ZIP helper.

Mirrors ``src/operations/util/zip.ts``. The TypeScript version recurses into a
``JSZip`` "folder" object (``zip.folder(name)``); Python's :mod:`zipfile` has no
equivalent nested-folder object, so this instead walks the directory tree and
writes each file directly into the (flat) archive using a ``zip_path`` prefix
that's extended as we descend — the on-disk archive layout is identical.
"""

from __future__ import annotations

import os
import zipfile


def resolve_zip_entry_path(base_dir: str, *parts: str) -> str:
    """Join ``parts`` (from a ZIP entry name) onto ``base_dir``, guarding against zip-slip.

    A malicious archive entry name containing ``..`` segments or an absolute
    path could otherwise make ``os.path.join`` resolve outside ``base_dir``
    when extracting. Raises :class:`ValueError` if the resolved path would
    escape ``base_dir``.
    """
    base = os.path.abspath(base_dir)
    target = os.path.abspath(os.path.join(base, *parts))
    try:
        is_within = os.path.commonpath([base, target]) == base
    except ValueError:
        # Raised e.g. on Windows when paths are on different drives.
        is_within = False
    if not is_within:
        raise ValueError(f"Zip entry path escapes extraction directory: {os.path.join(*parts)!r}")
    return target


def add_directory_to_zip(zip_file: zipfile.ZipFile, dir_path: str, zip_path: str = "") -> None:
    """Recursively add the contents of ``dir_path`` to ``zip_file`` under ``zip_path``.

    :param zip_file: An open, writable :class:`zipfile.ZipFile`.
    :param dir_path: Absolute or relative filesystem path of the directory to add.
    :param zip_path: Prefix within the archive to nest the directory's contents under
        (empty string writes directly at the archive root).
    """
    for entry in sorted(os.listdir(dir_path)):
        entry_path = os.path.join(dir_path, entry)
        entry_zip_path = f"{zip_path}/{entry}" if zip_path else entry

        if os.path.isdir(entry_path):
            add_directory_to_zip(zip_file, entry_path, entry_zip_path)
        else:
            zip_file.write(entry_path, entry_zip_path)


__all__ = ["add_directory_to_zip", "resolve_zip_entry_path"]
