# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""PKCE (Proof Key for Code Exchange) helpers for SLAS authentication.

Mirrors ``src/slas/pkce.ts``. Byte-for-byte identical to the TypeScript SDK:
the verifier is 96 random bytes base64url-encoded (128 characters) and the S256
challenge is the base64url-encoded SHA-256 digest of the ASCII verifier (43
characters). base64url encoding omits ``=`` padding per RFC 7636, matching the
Node ``base64url`` buffer encoding used by the TS source.
"""

from __future__ import annotations

import base64
import hashlib
import secrets

#: Number of random bytes in a PKCE code verifier (96 bytes -> 128 base64url chars).
CODE_VERIFIER_BYTES = 96


def _base64url(data: bytes) -> str:
    """Encode ``data`` as an unpadded base64url string (RFC 7636)."""
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def generate_code_verifier(random_bytes: bytes | None = None) -> str:
    """Generate a cryptographically random PKCE code verifier.

    :param random_bytes: Optional raw random bytes to encode (for deterministic
        tests). When omitted, :func:`secrets.token_bytes` supplies
        :data:`CODE_VERIFIER_BYTES` bytes.
    :returns: A 128-character base64url-encoded random string.
    """
    raw = random_bytes if random_bytes is not None else secrets.token_bytes(CODE_VERIFIER_BYTES)
    return _base64url(raw)


def generate_code_challenge(verifier: str) -> str:
    """Generate a PKCE code challenge from a code verifier using S256.

    :param verifier: The code verifier to hash.
    :returns: The base64url-encoded (unpadded) SHA-256 hash of the verifier.
    """
    return _base64url(hashlib.sha256(verifier.encode("ascii")).digest())


__all__ = ["generate_code_challenge", "generate_code_verifier", "CODE_VERIFIER_BYTES"]
