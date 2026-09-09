# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Logging for the B2C tooling SDK.

A thin wrapper over the standard library :mod:`logging` module, mirroring the
``getLogger`` / ``configureLogger`` surface of the TypeScript SDK. All SDK
loggers live under the ``b2c_tooling_sdk`` namespace so consumers can configure
them independently of their application logging.
"""

from __future__ import annotations

import logging

_ROOT_LOGGER_NAME = "b2c_tooling_sdk"

# The SDK is a library: attach a NullHandler so importing it never emits output
# unless the consuming application configures logging.
logging.getLogger(_ROOT_LOGGER_NAME).addHandler(logging.NullHandler())


def get_logger(name: str | None = None) -> logging.Logger:
    """Return an SDK logger.

    :param name: Optional dotted sub-name appended to the SDK root namespace.
    :returns: A :class:`logging.Logger` under ``b2c_tooling_sdk``.
    """
    if name:
        return logging.getLogger(f"{_ROOT_LOGGER_NAME}.{name}")
    return logging.getLogger(_ROOT_LOGGER_NAME)


def configure_logger(level: int | str = logging.WARNING, *, propagate: bool = True) -> logging.Logger:
    """Convenience helper to set the SDK root logger level.

    :param level: A :mod:`logging` level (int or name).
    :param propagate: Whether SDK logs propagate to the root logger.
    :returns: The SDK root logger.
    """
    logger = get_logger()
    logger.setLevel(level)
    logger.propagate = propagate
    return logger


__all__ = ["get_logger", "configure_logger"]
