# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the TLS/mTLS transport factory.

Mirrors ``packages/b2c-tooling-sdk/test/clients/tls-dispatcher.test.ts`` (adapting
the undici ``Agent`` assertions to the httpx transport equivalent).
"""

from __future__ import annotations

import datetime
from pathlib import Path

import httpx
import pytest
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.x509.oid import NameOID

from b2c_tooling_sdk.clients.tls import TlsOptions, create_tls_transport


def _make_pkcs12(passphrase: str | None) -> bytes:
    """Build a self-signed cert + key and serialize it as a PKCS12 bundle."""
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = issuer = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "test-client")])
    not_before = datetime.datetime(2020, 1, 1, tzinfo=datetime.timezone.utc)
    not_after = datetime.datetime(2030, 1, 1, tzinfo=datetime.timezone.utc)
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(not_before)
        .not_valid_after(not_after)
        .sign(key, hashes.SHA256())
    )
    encryption = (
        serialization.BestAvailableEncryption(passphrase.encode("utf-8"))
        if passphrase
        else serialization.NoEncryption()
    )
    return pkcs12.serialize_key_and_certificates(b"test", key, cert, None, encryption)


def test_returns_none_when_no_tls_options_needed() -> None:
    assert create_tls_transport(TlsOptions()) is None


def test_returns_none_when_only_reject_unauthorized_true() -> None:
    assert create_tls_transport(TlsOptions(reject_unauthorized=True)) is None


def test_returns_transport_when_reject_unauthorized_false() -> None:
    transport = create_tls_transport(TlsOptions(reject_unauthorized=False))
    assert isinstance(transport, httpx.AsyncBaseTransport)


def test_raises_when_certificate_file_missing() -> None:
    with pytest.raises(ValueError, match="Failed to read certificate file"):
        create_tls_transport(TlsOptions(certificate="/nonexistent/path/to/cert.p12"))


def test_raises_friendly_error_for_invalid_pkcs12(tmp_path: Path) -> None:
    cert_path = tmp_path / "invalid.p12"
    cert_path.write_bytes(b"not a real certificate")

    with pytest.raises(ValueError, match="does not appear to be a valid PKCS12"):
        create_tls_transport(TlsOptions(certificate=str(cert_path)))


def test_loads_unencrypted_pkcs12(tmp_path: Path) -> None:
    cert_path = tmp_path / "plain.p12"
    cert_path.write_bytes(_make_pkcs12(None))

    transport = create_tls_transport(TlsOptions(certificate=str(cert_path)))
    assert isinstance(transport, httpx.AsyncBaseTransport)


def test_loads_encrypted_pkcs12_with_passphrase(tmp_path: Path) -> None:
    cert_path = tmp_path / "encrypted.p12"
    cert_path.write_bytes(_make_pkcs12("s3cret"))

    transport = create_tls_transport(TlsOptions(certificate=str(cert_path), passphrase="s3cret"))
    assert isinstance(transport, httpx.AsyncBaseTransport)


def test_raises_invalid_passphrase_for_wrong_passphrase(tmp_path: Path) -> None:
    cert_path = tmp_path / "encrypted.p12"
    cert_path.write_bytes(_make_pkcs12("s3cret"))

    with pytest.raises(ValueError, match="passphrase.*is incorrect|Invalid passphrase"):
        create_tls_transport(TlsOptions(certificate=str(cert_path), passphrase="wrong"))


def test_raises_requires_passphrase_when_missing(tmp_path: Path) -> None:
    cert_path = tmp_path / "encrypted.p12"
    cert_path.write_bytes(_make_pkcs12("s3cret"))

    with pytest.raises(ValueError, match="requires a passphrase|does not appear to be a valid PKCS12"):
        create_tls_transport(TlsOptions(certificate=str(cert_path)))
