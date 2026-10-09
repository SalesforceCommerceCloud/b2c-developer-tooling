# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Encoding of OAuth client credentials for the HTTP Basic ``Authorization`` header.

Mirrors ``src/auth/client-credentials.ts``. The client id and secret are each
form-url-encoded per RFC 6749 Appendix B (the ``application/x-www-form-urlencoded``
rules, which is what the JS ``URLSearchParams`` serializer implements) *before*
being joined with a colon and Base64-encoded (RFC 7617 HTTP Basic). Skipping the
per-component encoding corrupts credentials containing ``+`` or ``%xx`` sequences.
"""

from __future__ import annotations

import base64
from urllib.parse import quote_plus


def _form_url_encode_component(value: str) -> str:
    """Encode a single value with ``application/x-www-form-urlencoded`` rules.

    Matches the WHATWG URLSearchParams serializer exactly: alphanumerics and
    ``* - . _`` pass through, space becomes ``+``, and everything else is
    percent-encoded. Python's :func:`urllib.parse.quote_plus` differs only in
    that it treats ``*`` as unsafe and ``~`` as safe, so we invert both:
    ``safe='*'`` keeps ``*`` and the explicit replacement escapes ``~``.
    """
    return quote_plus(value, safe="*").replace("~", "%7E")


def encode_basic_client_credentials(client_id: str, client_secret: str) -> str:
    """Build the Base64 payload for ``Authorization: Basic`` per RFC 6749 §2.3.1.

    :param client_id: The OAuth client identifier.
    :param client_secret: The OAuth client password/secret.
    :returns: The Base64 string to place after ``Basic `` in the header.
    """
    user_pass = f"{_form_url_encode_component(client_id)}:{_form_url_encode_component(client_secret)}"
    return base64.b64encode(user_pass.encode("utf-8")).decode("ascii")


__all__ = ["encode_basic_client_credentials"]
