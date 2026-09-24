# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""TLS/mTLS transport utilities for client-certificate authentication.

Mirrors ``src/clients/tls-dispatcher.ts``. The TypeScript SDK builds an undici
``Agent`` from a PKCS12 certificate for two-factor (client-certificate) auth or
self-signed instances. The httpx equivalent is an :class:`httpx.AsyncBaseTransport`
built from an :class:`ssl.SSLContext`; :func:`create_tls_transport` returns one
(or ``None`` when no TLS customization is needed).

The PKCS12 bundle is decoded with ``cryptography`` and loaded into the context
via a short-lived temp PEM file (``ssl`` only loads cert chains from disk). The
temp file holds the *decrypted* private key, so it is created ``0o600`` and
deleted immediately after load.
"""

from __future__ import annotations

import contextlib
import os
import ssl
import tempfile
from dataclasses import dataclass

import httpx
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.serialization import pkcs12

from b2c_tooling_sdk.logging import get_logger


@dataclass
class TlsOptions:
    """TLS options for creating a transport.

    :ivar certificate: Path to a PKCS12 (``.p12``/``.pfx``) certificate file.
    :ivar passphrase: Passphrase for the certificate, if encrypted.
    :ivar reject_unauthorized: Whether to reject invalid/self-signed server
        certificates. ``False`` disables verification (self-signed mode).
    """

    certificate: str | None = None
    passphrase: str | None = None
    reject_unauthorized: bool | None = None


def _load_pkcs12(pfx_data: bytes, passphrase: str | None, certificate_path: str) -> tuple[bytes, list[bytes]]:
    """Decode a PKCS12 bundle to PEM bytes, mapping load failures to friendly errors.

    :returns: ``(key_and_cert_pem, additional_cert_pems)``.
    :raises ValueError: with a user-facing message when the passphrase is wrong /
        missing or the file is not a valid PKCS12 certificate.
    """
    passphrase_bytes = passphrase.encode("utf-8") if passphrase else None
    try:
        key, cert, additional = pkcs12.load_key_and_certificates(pfx_data, passphrase_bytes)
    except (ValueError, TypeError) as error:
        message = str(error).lower()
        if "mac verify" in message or "decrypt" in message or "invalid password" in message:
            if passphrase:
                raise ValueError(
                    f'Invalid passphrase for certificate "{certificate_path}". The provided passphrase is incorrect.'
                ) from error
            raise ValueError(
                f'Certificate "{certificate_path}" requires a passphrase. '
                "Use the passphrase option to provide it, or set SFCC_CERTIFICATE_PASSPHRASE."
            ) from error
        raise ValueError(
            f'Invalid certificate file "{certificate_path}". '
            "The file does not appear to be a valid PKCS12 (.p12/.pfx) certificate."
        ) from error

    if key is None or cert is None:
        raise ValueError(
            f'Invalid certificate file "{certificate_path}". '
            "The PKCS12 bundle is missing a private key or client certificate."
        )

    key_pem = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    cert_pem = cert.public_bytes(serialization.Encoding.PEM)
    additional_pems = [c.public_bytes(serialization.Encoding.PEM) for c in (additional or [])]
    return key_pem + cert_pem, additional_pems


def create_tls_transport(options: TlsOptions) -> httpx.AsyncBaseTransport | None:
    """Create an httpx transport with custom TLS options for mTLS / self-signed certs.

    Returns ``None`` when no TLS customization is needed (no certificate and
    ``reject_unauthorized`` not explicitly ``False``), so callers fall back to
    the default transport.

    :raises ValueError: on unreadable or invalid certificate files, or a bad
        passphrase (see :func:`_load_pkcs12`).
    """
    logger = get_logger("clients.tls")
    certificate = options.certificate
    passphrase = options.passphrase
    reject_unauthorized = options.reject_unauthorized

    if not certificate and reject_unauthorized is not False:
        return None

    context = ssl.create_default_context()

    if reject_unauthorized is False:
        logger.debug("[TLS] Disabling SSL certificate verification (self-signed mode)")
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE

    if certificate:
        logger.debug("[TLS] Loading client certificate from: %s", certificate)
        try:
            with open(certificate, "rb") as fh:
                pfx_data = fh.read()
        except OSError as error:
            raise ValueError(f'Failed to read certificate file "{certificate}": {error}') from error

        combined_pem, additional_pems = _load_pkcs12(pfx_data, passphrase, certificate)
        _load_cert_chain_from_pem(context, combined_pem, additional_pems)

    return httpx.AsyncHTTPTransport(verify=context)


def _load_cert_chain_from_pem(context: ssl.SSLContext, combined_pem: bytes, additional_pems: list[bytes]) -> None:
    """Load a decrypted key+cert (plus any chain certs) into ``context`` via a temp file."""
    fd, path = tempfile.mkstemp(suffix=".pem")
    try:
        os.chmod(path, 0o600)
        with os.fdopen(fd, "wb") as fh:
            fh.write(combined_pem)
            for pem in additional_pems:
                fh.write(pem)
        context.load_cert_chain(certfile=path)
    finally:
        with contextlib.suppress(OSError):
            os.remove(path)


__all__ = ["TlsOptions", "create_tls_transport"]
