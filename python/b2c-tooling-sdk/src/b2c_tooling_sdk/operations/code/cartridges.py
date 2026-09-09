# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Local cartridge discovery.

Mirrors ``src/operations/code/cartridges.ts``. The TypeScript version uses the
``glob`` package (``globSync``/``globIterateSync``) with an ``ignore`` list and
an optional ``maxDepth``. Python has no bundled fast-glob equivalent with the
same depth-limiting/streaming semantics, so this walks the tree with
:func:`os.walk`, pruning ignored directory names and depth in-place (which
gives us the early-exit behavior ``firstMatchOnly`` needs without pulling in a
third-party dependency).
"""

from __future__ import annotations

import os
from collections.abc import Iterator
from dataclasses import dataclass, field

#: Directory names skipped during cartridge discovery to keep it fast on broad
#: search roots (e.g. an MCP server's working directory).
_IGNORED_DIR_NAMES = frozenset(
    {
        "node_modules",
        ".git",
        "dist",
        "build",
        "coverage",
        ".cache",
        "tmp",
        "temp",
    }
)


@dataclass
class CartridgeMapping:
    """A discovered cartridge in the local filesystem."""

    #: Cartridge name (directory name containing ``.project``).
    name: str
    #: Absolute path to the cartridge directory.
    src: str
    #: Destination name (same as ``name``, used for the WebDAV path).
    dest: str


@dataclass
class FindCartridgesOptions:
    """Options for :func:`find_cartridges`."""

    #: Cartridge names to include (if empty, all are included).
    include: list[str] = field(default_factory=list)
    #: Cartridge names to exclude.
    exclude: list[str] = field(default_factory=list)
    #: Maximum directory depth to recurse when searching for ``.project`` files,
    #: counted in path segments relative to the search directory (so a cartridge
    #: at ``cartridges/<name>/.project`` is depth 3). ``None`` (default) means
    #: unbounded.
    max_depth: int | None = None
    #: When ``True``, stop at the first matching cartridge and return only that
    #: one. Filters from ``include``/``exclude`` are applied while scanning, so
    #: the returned cartridge always satisfies them.
    first_match_only: bool = False


def _matches(cartridge: CartridgeMapping, options: FindCartridgesOptions) -> bool:
    if options.include and cartridge.name not in options.include:
        return False
    return not (options.exclude and cartridge.name in options.exclude)


def _iter_project_dirs(search_dir: str, max_depth: int | None) -> Iterator[str]:
    """Yield absolute directory paths (relative to ``search_dir``) containing ``.project``."""
    for root, dirnames, filenames in os.walk(search_dir):
        depth = 0 if root == search_dir else root[len(search_dir) :].count(os.sep)

        # Prune ignored directories and depth in-place so os.walk doesn't descend
        # into them at all (mirrors glob's `ignore` + `maxDepth` pruning).
        dirnames[:] = [d for d in dirnames if d not in _IGNORED_DIR_NAMES]
        if max_depth is not None and depth + 1 >= max_depth:
            dirnames[:] = []

        if ".project" in filenames:
            yield root


def find_cartridges(
    directory: str | None = None, options: FindCartridgesOptions | None = None
) -> list[CartridgeMapping]:
    """Find cartridges recursively in a directory.

    Cartridges are identified by the presence of a ``.project`` file (Eclipse
    project marker commonly used in SFCC development).

    :param directory: Directory to search for cartridges (defaults to the
        current working directory).
    :param options: Filter options for including/excluding cartridges.
    :returns: List of discovered cartridge mappings.
    """
    opts = options or FindCartridgesOptions()
    search_dir = os.path.abspath(directory) if directory else os.getcwd()

    cartridges: list[CartridgeMapping] = []
    for project_dir in _iter_project_dirs(search_dir, opts.max_depth):
        name = os.path.basename(project_dir)
        cartridge = CartridgeMapping(name=name, src=project_dir, dest=name)
        if not _matches(cartridge, opts):
            continue
        if opts.first_match_only:
            return [cartridge]
        cartridges.append(cartridge)

    return cartridges


__all__ = ["CartridgeMapping", "FindCartridgesOptions", "find_cartridges"]
