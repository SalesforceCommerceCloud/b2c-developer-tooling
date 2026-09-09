# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Path normalization for B2C Commerce log files.

Mirrors ``src/operations/logs/path-normalizer.ts``. Converts remote cartridge
paths in log messages to local paths for IDE click-to-open functionality.
"""

from __future__ import annotations

import os
import re
from collections.abc import Callable
from dataclasses import dataclass, field
from re import Match

from b2c_tooling_sdk.operations.code.cartridges import CartridgeMapping, find_cartridges


@dataclass
class PathNormalizerOptions:
    """Options for creating a path normalizer."""

    #: Local path to the cartridges directory (simple mode). All cartridge
    #: references will be prefixed with this path.
    #: Example: "./cartridges" or "/Users/dev/project/cartridges".
    cartridge_path: str | None = None
    #: Discovered cartridge mappings (precise mode). Each cartridge is mapped
    #: to its actual local path. Takes precedence over ``cartridge_path`` for
    #: known cartridges.
    cartridges: list[CartridgeMapping] = field(default_factory=list)


@dataclass(frozen=True)
class _PathPattern:
    """A path pattern to match in log messages."""

    #: Compiled regular expression pattern.
    pattern: re.Pattern[str]
    #: Extract the remote path from a match.
    extract_path: Callable[[Match[str]], str]
    #: Build the replacement text given the match and normalized local path.
    build_replacement: Callable[[Match[str], str], str]


#: Patterns for matching cartridge paths in various contexts.
#:
#: B2C Commerce log files can contain paths in various formats:
#:
#: - In parentheses: ``(app_storefront/cartridge/controllers/Home.js:45)``
#: - In quotes: ``'app_storefront/cartridge/controllers/Home.js:45'``
#: - In stack traces: ``at app_storefront/cartridge/controllers/Home.js:45``
#: - Plain paths: ``app_storefront/cartridge/controllers/Home.js:45``
_PATH_PATTERNS: list[_PathPattern] = [
    # Parentheses: (cartridge_name/cartridge/path/file.js:line)
    _PathPattern(
        pattern=re.compile(r"\(([a-zA-Z0-9_-]+/cartridge/[^)]+)\)"),
        extract_path=lambda m: m[1],
        build_replacement=lambda m, normalized: f"({normalized})",
    ),
    # Single quotes: 'cartridge_name/cartridge/path/file.js:line'
    _PathPattern(
        pattern=re.compile(r"'([a-zA-Z0-9_-]+/cartridge/[^']+)'"),
        extract_path=lambda m: m[1],
        build_replacement=lambda m, normalized: f"'{normalized}'",
    ),
    # Double quotes: "cartridge_name/cartridge/path/file.js:line"
    _PathPattern(
        pattern=re.compile(r'"([a-zA-Z0-9_-]+/cartridge/[^"]+)"'),
        extract_path=lambda m: m[1],
        build_replacement=lambda m, normalized: f'"{normalized}"',
    ),
    # Stack trace: at cartridge_name/cartridge/path/file.js:line
    _PathPattern(
        pattern=re.compile(r"at\s+([a-zA-Z0-9_-]+/cartridge/[^\s]+)"),
        extract_path=lambda m: m[1],
        build_replacement=lambda m, normalized: f"at {normalized}",
    ),
]


def create_path_normalizer(options: PathNormalizerOptions) -> Callable[[str], str] | None:
    """Create a path normalizer function for converting remote cartridge paths
    to local paths in log messages.

    Supports two modes:

    1. **Cartridge mappings** (precise): Uses discovered cartridges to map each
       cartridge name to its actual local path. Best for projects with
       cartridges in different locations.
    2. **Cartridge path** (simple): Prefixes all paths with a base directory.
       Best when all cartridges are in a single directory.

    :param options: Normalizer options.
    :returns: Function that normalizes paths in a message string, or ``None``
        if no options were provided.

    >>> cartridges = find_cartridges('./my-project')
    >>> normalize = create_path_normalizer(PathNormalizerOptions(cartridges=cartridges))
    >>> # Or, using a simple cartridge path:
    >>> normalize = create_path_normalizer(PathNormalizerOptions(cartridge_path='./cartridges'))
    >>> # Input: "(app_storefront/cartridge/controllers/Home.js:45)"
    >>> # Output: "(./cartridges/app_storefront/cartridge/controllers/Home.js:45)"
    """
    cartridge_path = options.cartridge_path
    cartridges = options.cartridges

    # If no options provided, return None.
    if not cartridge_path and not cartridges:
        return None

    # Build a map of cartridge names to their local paths.
    cartridge_map: dict[str, str] = {c.name: c.src for c in cartridges}

    # Normalize the fallback cartridge path (remove trailing slash).
    normalized_cartridge_path = cartridge_path.rstrip("/") if cartridge_path else None

    def _normalize(message: str) -> str:
        result = message

        for path_pattern in _PATH_PATTERNS:

            def _replace(match: Match[str], path_pattern: _PathPattern = path_pattern) -> str:
                remote_path = path_pattern.extract_path(match)

                # Extract cartridge name from the path (first segment before /cartridge/).
                cartridge_name = remote_path.split("/")[0]
                rest_of_path = remote_path[len(cartridge_name) :]

                # Try to find the cartridge in our mappings.
                local_cartridge_path = cartridge_map.get(cartridge_name)

                if local_cartridge_path:
                    # Use the discovered cartridge's actual path.
                    local_path = f"{local_cartridge_path}{rest_of_path}"
                elif normalized_cartridge_path:
                    # Fall back to simple prefix mode.
                    local_path = f"{normalized_cartridge_path}/{remote_path}"
                else:
                    # No mapping and no fallback - return original.
                    return match[0]

                return path_pattern.build_replacement(match, local_path)

            result = path_pattern.pattern.sub(_replace, result)

        return result

    return _normalize


def discover_and_create_normalizer(directory: str | None = None) -> Callable[[str], str] | None:
    """Discover cartridges and create a path normalizer automatically.

    Convenience function that combines :func:`find_cartridges` with
    :func:`create_path_normalizer` for easy setup. Cartridge paths are
    converted to relative paths from the current project directory.

    :param directory: Directory to search for cartridges (defaults to cwd).
    :returns: Path normalizer function, or ``None`` if no cartridges were
        found.

    >>> normalize = discover_and_create_normalizer()
    >>> normalize = discover_and_create_normalizer('./my-project')
    """
    search_dir = directory if directory is not None else os.getcwd()
    cwd = os.getcwd()
    cartridges = find_cartridges(search_dir)

    if not cartridges:
        return None

    # Convert absolute paths to relative paths from cwd.
    relative_cartridges = [
        CartridgeMapping(name=c.name, src="./" + os.path.relpath(c.src, cwd), dest=c.dest) for c in cartridges
    ]

    return create_path_normalizer(PathNormalizerOptions(cartridges=relative_cartridges))


def extract_paths(message: str) -> list[str]:
    """Extract all cartridge paths from a message.

    Useful for testing or analysis of log messages.

    :param message: Log message to extract paths from.
    :returns: List of extracted paths.

    >>> extract_paths("Error at (app_storefront/cartridge/controllers/Home.js:45)")
    ['app_storefront/cartridge/controllers/Home.js:45']
    """
    paths: list[str] = []

    for path_pattern in _PATH_PATTERNS:
        for match in path_pattern.pattern.finditer(message):
            path = path_pattern.extract_path(match)
            if path not in paths:
                paths.append(path)

    return paths


__all__ = [
    "PathNormalizerOptions",
    "create_path_normalizer",
    "discover_and_create_normalizer",
    "extract_paths",
]
