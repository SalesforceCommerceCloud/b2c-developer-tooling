# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Network-layer error classification and wrapping.

Wraps low-level transport failures (connection resets, timeouts, DNS failures,
TLS errors, ...) with actionable context about the operation, the target host,
and remediation hints. Mirrors ``errors/network-error.ts``; the
:data:`NetworkErrorKind` vocabulary is identical, while classification inspects
:mod:`httpx` / :mod:`ssl` / :class:`OSError` instead of undici error codes.
"""

from __future__ import annotations

import errno as _errno
import socket
import ssl
from typing import Literal

import httpx

NetworkErrorKind = Literal[
    "timeout",
    "connection-reset",
    "connection-refused",
    "dns",
    "tls",
    "aborted",
    "unknown",
]


class NetworkError(Exception):
    """Raised when a network-layer request fails.

    :ivar kind: Classified network error kind.
    :ivar operation: Description of the operation that failed.
    :ivar host: Target hostname.
    """

    def __init__(
        self,
        message: str,
        *,
        kind: NetworkErrorKind,
        operation: str | None = None,
        host: str | None = None,
        cause: BaseException | None = None,
    ) -> None:
        super().__init__(message)
        self.kind: NetworkErrorKind = kind
        self.operation = operation
        self.host = host
        if cause is not None:
            self.__cause__ = cause


def _iter_causes(err: BaseException) -> list[BaseException]:
    """Return ``err`` and its ``__cause__``/``__context__`` chain (depth-first)."""
    seen: list[BaseException] = []
    current: BaseException | None = err
    while current is not None and current not in seen:
        seen.append(current)
        current = current.__cause__ or current.__context__
    return seen


def classify_network_error(err: BaseException) -> NetworkErrorKind:
    """Classify a transport failure into a :data:`NetworkErrorKind`."""
    for cause in _iter_causes(err):
        if isinstance(cause, ssl.SSLError):
            return "tls"
        if isinstance(cause, socket.gaierror):
            return "dns"
        if isinstance(cause, (TimeoutError, httpx.TimeoutException)):
            return "timeout"
        if isinstance(cause, (ConnectionResetError, BrokenPipeError)):
            return "connection-reset"
        if isinstance(cause, ConnectionRefusedError):
            return "connection-refused"
        if isinstance(cause, httpx.ConnectError):
            # ConnectError with no more specific OS cause: infer from message.
            msg = str(cause).lower()
            if "refused" in msg:
                return "connection-refused"
            if "name or service not known" in msg or "nodename nor servname" in msg:
                return "dns"
        if isinstance(cause, (httpx.ReadError, httpx.WriteError, httpx.RemoteProtocolError)):
            return "connection-reset"
        if isinstance(cause, OSError) and cause.errno is not None:
            if cause.errno in (_errno.ECONNRESET, _errno.EPIPE):
                return "connection-reset"
            if cause.errno == _errno.ECONNREFUSED:
                return "connection-refused"
            if cause.errno == _errno.ETIMEDOUT:
                return "timeout"

    message = (str(err) or "").lower()
    if "socket hang up" in message or "connection reset" in message:
        return "connection-reset"
    if "timed out" in message or "timeout" in message:
        return "timeout"
    return "unknown"


def is_network_error(err: BaseException) -> bool:
    """Return ``True`` for transport-level failures; ``False`` for HTTP/application errors.

    :class:`~b2c_tooling_sdk.errors.http_error.HttpError` always returns ``False``
    so it passes through :func:`wrap_network_error` untouched.
    """
    if err.__class__.__name__ == "HttpError":
        return False
    if isinstance(err, (httpx.TransportError, ssl.SSLError, socket.gaierror)):
        return True
    return isinstance(err, OSError)


def describe_network_error_kind(kind: NetworkErrorKind) -> tuple[str, str]:
    """Return a ``(summary, hint)`` pair for a network error kind."""
    descriptions: dict[NetworkErrorKind, tuple[str, str]] = {
        "timeout": (
            "the request timed out",
            "The server or an intermediary (proxy/load balancer/WAF) may have closed an idle connection. "
            "Large or slow server-side operations can exceed network idle limits — retrying or checking the "
            "instance status may help.",
        ),
        "connection-reset": (
            "the connection was reset (socket hang up)",
            "The server, proxy, or load balancer closed the connection unexpectedly. This often happens when "
            "the sandbox is processing a long-running operation server-side (e.g., code activation) or when a "
            "network intermediary drops an idle connection. Retrying may succeed.",
        ),
        "connection-refused": (
            "the connection was refused",
            "The host is unreachable or not listening on the expected port. Check that the instance hostname is "
            "correct and that the instance is running (not stopped).",
        ),
        "dns": (
            "the hostname could not be resolved",
            "DNS lookup failed for the configured instance hostname. Verify the hostname in your dw.json or "
            "config, and check your network connection.",
        ),
        "tls": (
            "a TLS/certificate error occurred",
            "There was a problem establishing a secure connection. Check client certificate configuration "
            "(mTLS), certificate validity, or trusted CA certificates if using self-signed certs.",
        ),
        "aborted": (
            "the operation was aborted",
            "The request was canceled, likely due to a client-side timeout or explicit cancellation.",
        ),
        "unknown": (
            "a network error occurred",
            "An unexpected network failure occurred. Check your connection, instance availability, and any "
            "proxy or firewall settings.",
        ),
    }
    return descriptions[kind]


def wrap_network_error(
    err: BaseException,
    *,
    operation: str | None = None,
    host: str | None = None,
) -> BaseException:
    """Wrap a transport failure in a :class:`NetworkError` with actionable context.

    Returns the wrapped error (or the original error unchanged if it is not a
    network error, or already a fully-contextualized :class:`NetworkError`).
    This function does **not** raise — the caller must raise the result.
    """
    if isinstance(err, NetworkError):
        if operation and not err.operation:
            return NetworkError(
                str(err), kind=err.kind, operation=operation, host=err.host or host, cause=err.__cause__
            )
        if host and not err.host:
            return NetworkError(
                str(err), kind=err.kind, operation=err.operation or operation, host=host, cause=err.__cause__
            )
        return err

    if not is_network_error(err):
        return err

    kind = classify_network_error(err)
    summary, hint = describe_network_error_kind(kind)
    op = operation or "Network request"
    host_part = f" to {host}" if host else ""
    message = f"{op}{host_part} failed: {summary}. {hint}"
    return NetworkError(message, kind=kind, operation=operation, host=host, cause=err)
