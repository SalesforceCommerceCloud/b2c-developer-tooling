# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the WebDAV client.

Mirrors ``packages/b2c-tooling-sdk/test/clients/webdav.test.ts``. Unlike the
openapi-fetch clients, :class:`WebDavClient` dispatches through the auth
strategy's own ``fetch`` (which injects credentials + TLS), so these tests stub a
fake auth strategy directly rather than mocking the network with ``respx``.
"""

from __future__ import annotations

from typing import Any

import httpx
import pytest

from b2c_tooling_sdk.clients.middleware_registry import MiddlewareRegistry
from b2c_tooling_sdk.clients.webdav import PropfindEntry, WebDavClient, _parse_propfind_response
from b2c_tooling_sdk.errors.http_error import HttpError

HOSTNAME = "example.demandware.net"
BASE_URL = f"https://{HOSTNAME}/on/demandware.servlet/webdav/Sites"


class FakeAuth:
    """Records fetch calls and returns queued responses."""

    def __init__(self, *responses: httpx.Response) -> None:
        self._responses = list(responses)
        self.calls: list[dict[str, Any]] = []

    async def fetch(
        self,
        url: str,
        *,
        method: str = "GET",
        headers: dict[str, str] | None = None,
        content: Any = None,
        **kwargs: Any,
    ) -> httpx.Response:
        self.calls.append(
            {
                "url": url,
                "method": method,
                "headers": headers or {},
                "content": content,
                "dispatcher": kwargs.get("dispatcher"),
            }
        )
        if not self._responses:
            raise AssertionError("FakeAuth.fetch called more times than responses provided")
        return self._responses.pop(0)


def _client(*responses: httpx.Response) -> tuple[WebDavClient, FakeAuth]:
    auth = FakeAuth(*responses)
    # Use a fresh empty registry so no globally-registered middleware perturbs headers.
    client = WebDavClient(HOSTNAME, auth, middleware_registry=MiddlewareRegistry())  # type: ignore[arg-type]
    return client, auth


# --- build_url ------------------------------------------------------------------


def test_build_url_without_leading_slash() -> None:
    client, _ = _client()
    assert client.build_url("Cartridges/v1") == f"{BASE_URL}/Cartridges/v1"


def test_build_url_with_leading_slash() -> None:
    client, _ = _client()
    assert client.build_url("/Cartridges/v1") == f"{BASE_URL}/Cartridges/v1"


# --- mkcol ----------------------------------------------------------------------


async def test_mkcol_success() -> None:
    client, auth = _client(httpx.Response(201))
    await client.mkcol("Cartridges/v1")
    assert auth.calls[0]["method"] == "MKCOL"
    assert auth.calls[0]["url"] == f"{BASE_URL}/Cartridges/v1"


async def test_mkcol_tolerates_405_already_exists() -> None:
    client, _ = _client(httpx.Response(405))
    await client.mkcol("Cartridges/v1")  # should not raise


async def test_mkcol_raises_on_other_error() -> None:
    client, _ = _client(httpx.Response(500))
    with pytest.raises(HttpError) as exc:
        await client.mkcol("Cartridges/v1")
    assert exc.value.method == "MKCOL"


# --- put ------------------------------------------------------------------------


async def test_put_success_sets_content_type() -> None:
    client, auth = _client(httpx.Response(201))
    await client.put("Cartridges/v1/app.zip", b"data", content_type="application/zip")
    call = auth.calls[0]
    assert call["method"] == "PUT"
    assert call["headers"]["content-type"] == "application/zip"
    assert call["content"] == b"data"


async def test_put_string_content() -> None:
    client, auth = _client(httpx.Response(200))
    await client.put("file.txt", "hello")
    assert auth.calls[0]["content"] == "hello"


async def test_put_413_includes_sandbox_hint() -> None:
    client, _ = _client(httpx.Response(413))
    with pytest.raises(HttpError) as exc:
        await client.put("file.txt", b"x")
    assert "sandbox may be stopped" in str(exc.value)


async def test_put_raises_on_failure() -> None:
    client, _ = _client(httpx.Response(500))
    with pytest.raises(HttpError):
        await client.put("file.txt", b"x")


# --- get ------------------------------------------------------------------------


async def test_get_returns_bytes() -> None:
    client, _ = _client(httpx.Response(200, content=b"file-content"))
    assert await client.get("file.txt") == b"file-content"


async def test_get_raises_when_not_found() -> None:
    client, _ = _client(httpx.Response(404))
    with pytest.raises(HttpError) as exc:
        await client.get("missing.txt")
    assert exc.value.method == "GET"


# --- delete ---------------------------------------------------------------------


async def test_delete_success() -> None:
    client, auth = _client(httpx.Response(204))
    await client.delete("file.txt")
    assert auth.calls[0]["method"] == "DELETE"


async def test_delete_raises_on_failure() -> None:
    client, _ = _client(httpx.Response(404))
    with pytest.raises(HttpError):
        await client.delete("missing.txt")


# --- propfind -------------------------------------------------------------------

_MULTISTATUS = b"""<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>/on/demandware.servlet/webdav/Sites/Cartridges/</D:href>
    <D:propstat>
      <D:prop>
        <D:displayname>Cartridges</D:displayname>
        <D:resourcetype><D:collection/></D:resourcetype>
        <D:getlastmodified>Tue, 15 Nov 2022 12:45:26 GMT</D:getlastmodified>
        <D:getcontenttype>null</D:getcontenttype>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
  <D:response>
    <D:href>/on/demandware.servlet/webdav/Sites/Cartridges/app.zip</D:href>
    <D:propstat>
      <D:prop>
        <D:displayname>app.zip</D:displayname>
        <D:resourcetype/>
        <D:getcontentlength>2048</D:getcontentlength>
        <D:getlastmodified>Wed, 16 Nov 2022 08:00:00 GMT</D:getlastmodified>
        <D:getcontenttype>application/zip</D:getcontenttype>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
</D:multistatus>"""


async def test_propfind_lists_contents() -> None:
    client, auth = _client(httpx.Response(207, content=_MULTISTATUS))
    entries = await client.propfind("Cartridges")

    assert auth.calls[0]["method"] == "PROPFIND"
    assert auth.calls[0]["headers"]["depth"] == "1"
    assert len(entries) == 2

    directory, file = entries
    assert directory.is_collection is True
    assert directory.display_name == "Cartridges"
    assert directory.content_length is None
    assert directory.content_type is None  # "null" normalizes to None
    assert directory.last_modified is not None

    assert file.is_collection is False
    assert file.display_name == "app.zip"
    assert file.content_length == 2048
    assert file.content_type == "application/zip"
    assert file.last_modified is not None


async def test_propfind_uses_specified_depth() -> None:
    client, auth = _client(httpx.Response(207, content=_MULTISTATUS))
    await client.propfind("Cartridges", depth="0")
    assert auth.calls[0]["headers"]["depth"] == "0"


async def test_propfind_raises_on_failure() -> None:
    client, _ = _client(httpx.Response(500))
    with pytest.raises(HttpError) as exc:
        await client.propfind("Cartridges")
    assert exc.value.method == "PROPFIND"


# --- _parse_propfind_response (direct unit tests) -------------------------------


def test_parse_propfind_response_parses_entries() -> None:
    entries = _parse_propfind_response(_MULTISTATUS)
    assert [e.display_name for e in entries] == ["Cartridges", "app.zip"]
    assert isinstance(entries[1], PropfindEntry)


def test_parse_propfind_response_empty_bytes() -> None:
    assert _parse_propfind_response(b"") == []


def test_parse_propfind_response_non_multistatus() -> None:
    assert _parse_propfind_response(b"<?xml version='1.0'?><other/>") == []


def test_parse_propfind_response_invalid_xml() -> None:
    assert _parse_propfind_response(b"not xml at all <") == []


# --- copy / move ----------------------------------------------------------------


async def test_copy_sets_destination_and_overwrite() -> None:
    client, auth = _client(httpx.Response(201))
    await client.copy("a/file.txt", "b/file.txt", overwrite=True)
    call = auth.calls[0]
    assert call["method"] == "COPY"
    assert call["headers"]["destination"] == "/on/demandware.servlet/webdav/Sites/b/file.txt"
    assert call["headers"]["overwrite"] == "T"


async def test_copy_overwrite_false() -> None:
    client, auth = _client(httpx.Response(201))
    await client.copy("a.txt", "b.txt", overwrite=False)
    assert auth.calls[0]["headers"]["overwrite"] == "F"


async def test_copy_raises_on_failure() -> None:
    client, _ = _client(httpx.Response(409))
    with pytest.raises(HttpError) as exc:
        await client.copy("a.txt", "b.txt")
    assert exc.value.method == "COPY"


async def test_move_sets_destination_and_overwrite() -> None:
    client, auth = _client(httpx.Response(201))
    await client.move("a/file.txt", "b/file.txt")
    call = auth.calls[0]
    assert call["method"] == "MOVE"
    assert call["headers"]["destination"] == "/on/demandware.servlet/webdav/Sites/b/file.txt"
    assert call["headers"]["overwrite"] == "T"


async def test_move_raises_on_failure() -> None:
    client, _ = _client(httpx.Response(409))
    with pytest.raises(HttpError) as exc:
        await client.move("a.txt", "b.txt")
    assert exc.value.method == "MOVE"


# --- exists ---------------------------------------------------------------------


async def test_exists_true() -> None:
    client, auth = _client(httpx.Response(200))
    assert await client.exists("file.txt") is True
    assert auth.calls[0]["method"] == "HEAD"


async def test_exists_false() -> None:
    client, _ = _client(httpx.Response(404))
    assert await client.exists("missing.txt") is False


# --- transport passthrough ------------------------------------------------------


async def test_transport_forwarded_as_dispatcher() -> None:
    sentinel = object()
    auth = FakeAuth(httpx.Response(200))
    client = WebDavClient(HOSTNAME, auth, middleware_registry=MiddlewareRegistry(), transport=sentinel)  # type: ignore[arg-type]
    await client.exists("file.txt")
    assert auth.calls[0]["dispatcher"] is sentinel
