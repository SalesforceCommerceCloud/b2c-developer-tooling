# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Low-level authenticated fetch helper.

Mirrors ``src/auth/dispatch-fetch.ts``. In the TypeScript SDK this exists to
route requests carrying an undici ``dispatcher`` (mTLS / self-signed TLS agent)
through undici's own ``fetch`` rather than the Node-bundled one. In Python the
equivalent knob is an :class:`httpx.AsyncBaseTransport` (built from a TLS/mTLS
:class:`ssl.SSLContext`); when present we create a client bound to that transport,
otherwise we use a default client. Either way, transport failures are wrapped in
a :class:`~b2c_tooling_sdk.errors.network_error.NetworkError` with host context.
"""

from __future__ import annotations

from typing import Any

import httpx

from b2c_tooling_sdk.errors.network_error import wrap_network_error


async def dispatch_fetch(
    url: str,
    *,
    method: str = "GET",
    headers: dict[str, str] | None = None,
    content: Any = None,
    dispatcher: httpx.AsyncBaseTransport | None = None,
    timeout: Any = httpx.USE_CLIENT_DEFAULT,
    **kwargs: Any,
) -> httpx.Response:
    """Perform an HTTP request, routing through ``dispatcher`` (a TLS/mTLS transport) if given.

    :param url: Request URL.
    :param method: HTTP method.
    :param headers: Request headers.
    :param content: Raw request body (bytes/str/iterable), passed to httpx ``content``.
    :param dispatcher: Optional transport carrying client-certificate / TLS configuration.
    :raises NetworkError: on transport-level failures (connection reset, timeout, DNS, TLS).
    """
    client_kwargs: dict[str, Any] = {}
    if dispatcher is not None:
        client_kwargs["transport"] = dispatcher
    try:
        async with httpx.AsyncClient(**client_kwargs) as client:
            return await client.request(
                method,
                url,
                headers=headers,
                content=content,
                timeout=timeout,
                **kwargs,
            )
    except Exception as err:  # noqa: BLE001 - re-raised (wrapped only if network-level)
        host = httpx.URL(url).host
        raise wrap_network_error(err, operation="HTTPS request", host=host) from err


__all__ = ["dispatch_fetch"]
