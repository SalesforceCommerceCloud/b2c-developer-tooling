# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""SLAS Shopper Login token retrieval.

Mirrors the TypeScript ``@salesforce/b2c-tooling-sdk/slas`` subpath export.
Provides functions to obtain shopper access tokens from the SLAS Shopper Login
service, supporting public (PKCE) and private (``client_credentials`` / HTTP
Basic) client flows for both guest and registered customers.

This subpackage is intentionally NOT re-exported from the top-level
``b2c_tooling_sdk`` package; import it directly::

    from b2c_tooling_sdk.slas import get_guest_token
"""

from __future__ import annotations

from b2c_tooling_sdk.slas.pkce import generate_code_challenge, generate_code_verifier
from b2c_tooling_sdk.slas.token import get_guest_token, get_registered_token
from b2c_tooling_sdk.slas.types import SlasRegisteredLoginConfig, SlasTokenConfig, SlasTokenResponse

__all__ = [
    "SlasTokenConfig",
    "SlasTokenResponse",
    "SlasRegisteredLoginConfig",
    "generate_code_challenge",
    "generate_code_verifier",
    "get_guest_token",
    "get_registered_token",
]
