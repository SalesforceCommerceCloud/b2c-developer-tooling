# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""WebDAV client for B2C Commerce file operations.

Mirrors ``src/clients/webdav.ts``. Provides typed methods for common WebDAV
operations (upload, download, directory creation, listing, copy/move). Unlike
the openapi-fetch clients, WebDAV dispatches through the auth strategy's own
``fetch`` (which injects credentials and handles TLS/mTLS via a transport) and
applies only the registry's ``webdav`` middleware. PROPFIND XML is parsed with
``lxml``.

This client is typically accessed via :attr:`B2CInstance.webdav`.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from email.utils import parsedate_to_datetime

import httpx
from lxml import etree

from b2c_tooling_sdk.auth.types import AuthStrategy
from b2c_tooling_sdk.clients._core import (
    apply_request_middleware,
    apply_response_middleware,
)
from b2c_tooling_sdk.clients.middleware_registry import MiddlewareRegistry, global_middleware_registry
from b2c_tooling_sdk.errors.http_error import HttpError
from b2c_tooling_sdk.errors.network_error import wrap_network_error
from b2c_tooling_sdk.logging import get_logger

_PROPFIND_BODY = b"""<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:displayname/>
    <D:resourcetype/>
    <D:getcontentlength/>
    <D:getlastmodified/>
    <D:getcontenttype/>
  </D:prop>
</D:propfind>"""


@dataclass
class PropfindEntry:
    """A single entry returned by a PROPFIND (directory listing)."""

    href: str
    is_collection: bool
    display_name: str | None = None
    content_length: int | None = None
    last_modified: datetime | None = None
    content_type: str | None = None


class WebDavClient:
    """WebDAV client for B2C Commerce instance file operations.

    :param hostname: WebDAV hostname (may differ from the API hostname).
    :param auth: Authentication strategy used for requests (its ``fetch`` injects
        credentials and handles TLS/mTLS).
    :param middleware_registry: Registry supplying ``webdav`` middleware
        (defaults to the global registry).
    :param transport: Optional TLS/mTLS transport passed through to ``auth.fetch``.
    """

    def __init__(
        self,
        hostname: str,
        auth: AuthStrategy,
        *,
        middleware_registry: MiddlewareRegistry | None = None,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self.base_url = f"https://{hostname}/on/demandware.servlet/webdav/Sites"
        self._auth = auth
        self._middleware_registry = middleware_registry or global_middleware_registry
        self._transport = transport

    def build_url(self, path: str) -> str:
        """Build the full URL for a WebDAV ``path`` (relative to ``/webdav/Sites/``)."""
        clean_path = path[1:] if path.startswith("/") else path
        return f"{self.base_url}/{clean_path}"

    async def request(
        self,
        path: str,
        *,
        method: str = "GET",
        headers: dict[str, str] | None = None,
        content: bytes | str | None = None,
    ) -> httpx.Response:
        """Make a raw WebDAV request, applying ``webdav`` middleware and auth.

        :raises NetworkError: on transport-level failures.
        """
        logger = get_logger("clients.webdav")
        url = self.build_url(path)
        middleware = self._middleware_registry.get_middleware("webdav")

        request = httpx.Request(method, url, headers=headers, content=content)
        request = await apply_request_middleware(request, middleware, client_type="webdav", schema_path=path)

        logger.debug("[WebDAV REQ] %s %s", request.method, request.url)

        try:
            response = await self._auth.fetch(
                str(request.url),
                method=request.method,
                headers=dict(request.headers),
                content=content,
                dispatcher=self._transport,
            )
        except Exception as err:  # noqa: BLE001 - wrapped with WebDAV context
            host = httpx.URL(self.base_url).host
            raise wrap_network_error(err, operation=f"WebDAV {request.method}", host=host) from err

        response = await apply_response_middleware(
            request, response, middleware, client_type="webdav", schema_path=path
        )
        logger.debug("[WebDAV RESP] %s %s %s", request.method, request.url, response.status_code)
        return response

    async def mkcol(self, path: str) -> None:
        """Create a directory (collection). Tolerates 405 (already exists)."""
        response = await self.request(path, method="MKCOL")
        if not response.is_success and response.status_code != 405:
            raise HttpError(f"MKCOL failed: {response.status_code} {response.reason_phrase}", response, "MKCOL")

    async def put(self, path: str, content: bytes | str, content_type: str | None = None) -> None:
        """Upload a file to ``path``."""
        headers: dict[str, str] = {}
        if content_type:
            headers["Content-Type"] = content_type
        response = await self.request(path, method="PUT", headers=headers, content=content)
        if not response.is_success:
            hint = " (sandbox may be stopped or unavailable)" if response.status_code == 413 else ""
            raise HttpError(f"PUT failed: {response.status_code} {response.reason_phrase}{hint}", response, "PUT")

    async def get(self, path: str) -> bytes:
        """Download a file, returning its content as bytes."""
        response = await self.request(path, method="GET")
        if not response.is_success:
            raise HttpError(f"GET failed: {response.status_code} {response.reason_phrase}", response, "GET")
        return response.content

    async def delete(self, path: str) -> None:
        """Delete a file or directory."""
        response = await self.request(path, method="DELETE")
        if not response.is_success:
            raise HttpError(f"DELETE failed: {response.status_code} {response.reason_phrase}", response, "DELETE")

    async def propfind(self, path: str, depth: str = "1") -> list[PropfindEntry]:
        """List directory contents via PROPFIND (``depth`` is ``"0"``, ``"1"``, or ``"infinity"``)."""
        response = await self.request(
            path,
            method="PROPFIND",
            headers={"Depth": depth, "Content-Type": "application/xml"},
            content=_PROPFIND_BODY,
        )
        if not response.is_success:
            raise HttpError(f"PROPFIND failed: {response.status_code} {response.reason_phrase}", response, "PROPFIND")
        return _parse_propfind_response(response.content)

    async def copy(self, source: str, destination: str, overwrite: bool = True) -> None:
        """Copy a file or directory from ``source`` to ``destination``."""
        dest_path = httpx.URL(self.build_url(destination)).path
        response = await self.request(
            source,
            method="COPY",
            headers={"Destination": dest_path, "Overwrite": "T" if overwrite else "F"},
        )
        if not response.is_success:
            raise HttpError(f"COPY failed: {response.status_code} {response.reason_phrase}", response, "COPY")

    async def move(self, source: str, destination: str, overwrite: bool = True) -> None:
        """Move (rename) a file or directory from ``source`` to ``destination``."""
        dest_path = httpx.URL(self.build_url(destination)).path
        response = await self.request(
            source,
            method="MOVE",
            headers={"Destination": dest_path, "Overwrite": "T" if overwrite else "F"},
        )
        if not response.is_success:
            raise HttpError(f"MOVE failed: {response.status_code} {response.reason_phrase}", response, "MOVE")

    async def exists(self, path: str) -> bool:
        """Return ``True`` if ``path`` exists (via a HEAD request)."""
        response = await self.request(path, method="HEAD")
        return response.is_success


def _local_name(tag: object) -> str:
    """Return an element's namespace-stripped local tag name."""
    if not isinstance(tag, str):
        return ""
    return tag.rsplit("}", 1)[-1]


def _find_child(element: etree._Element, name: str) -> etree._Element | None:
    """Find the first direct child with the given local (namespace-stripped) name."""
    for child in element:
        if _local_name(child.tag) == name:
            return child
    return None


def _child_text(element: etree._Element | None, name: str) -> str | None:
    """Return the text of a named child element, or ``None`` when absent/empty."""
    if element is None:
        return None
    child = _find_child(element, name)
    if child is None or child.text is None:
        return None
    text = child.text.strip()
    return text or None


def _parse_propfind_response(xml: bytes) -> list[PropfindEntry]:
    """Parse a PROPFIND multistatus XML body into :class:`PropfindEntry` objects."""
    entries: list[PropfindEntry] = []
    if not xml:
        return entries
    try:
        root = etree.fromstring(xml)
    except etree.XMLSyntaxError:
        return entries

    if _local_name(root.tag) != "multistatus":
        return entries

    for response in root:
        if _local_name(response.tag) != "response":
            continue
        href = _child_text(response, "href") or ""
        propstat = _find_child(response, "propstat")
        prop = _find_child(propstat, "prop") if propstat is not None else None
        if prop is None:
            continue

        resourcetype = _find_child(prop, "resourcetype")
        is_collection = resourcetype is not None and _find_child(resourcetype, "collection") is not None

        content_length_text = _child_text(prop, "getcontentlength")
        last_modified_text = _child_text(prop, "getlastmodified")
        content_type = _child_text(prop, "getcontenttype")

        entries.append(
            PropfindEntry(
                href=href,
                is_collection=is_collection,
                display_name=_child_text(prop, "displayname"),
                content_length=int(content_length_text) if content_length_text else None,
                last_modified=_parse_http_date(last_modified_text),
                content_type=content_type if content_type and content_type != "null" else None,
            )
        )

    return entries


def _parse_http_date(value: str | None) -> datetime | None:
    """Parse an HTTP-date string into a datetime, or ``None`` on failure."""
    if not value:
        return None
    try:
        return parsedate_to_datetime(value)
    except (TypeError, ValueError):
        return None


__all__ = ["PropfindEntry", "WebDavClient"]
