# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Shared fakes for the ``operations/jobs`` test suite.

Not a test module (leading underscore keeps it out of pytest collection). Provides
duck-typed stand-ins for the HTTP client (``openapi-fetch`` analog), the WebDAV
client, and a B2C instance, plus an injectable clock so polling loops run
instantly.
"""

from __future__ import annotations

import inspect
import io
import zipfile
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

import httpx

from b2c_tooling_sdk.clients._core import ClientResult
from b2c_tooling_sdk.clients.webdav import PropfindEntry
from b2c_tooling_sdk.errors.http_error import HttpError


def make_request(method: str = "GET", url: str = "https://example.test/") -> httpx.Request:
    """Build a throwaway :class:`httpx.Request` for attaching to fake responses."""
    return httpx.Request(method, url)


def ok(data: Any) -> ClientResult:
    """A successful :class:`ClientResult` carrying ``data`` (2xx)."""
    return ClientResult(data=data, error=None, response=httpx.Response(200, request=make_request()))


def err(status: int, body: Any = None, *, text: str | None = None) -> ClientResult:
    """A failed :class:`ClientResult`: ``body`` in ``error`` and a response of ``status``.

    ``text`` sets the raw response body (used by the OCAPI already-running path,
    which inspects ``response.text``).
    """
    if text is not None:
        response = httpx.Response(status, text=text, request=make_request())
    else:
        response = httpx.Response(status, request=make_request())
    return ClientResult(data=None, error=body, response=response)


async def noop_sleep(_seconds: float) -> None:
    """An injectable async sleep that returns immediately."""
    return None


class FakeClock:
    """A controllable monotonic clock; :meth:`sleep` advances time instead of waiting."""

    def __init__(self) -> None:
        self.now = 0.0

    def monotonic(self) -> float:
        return self.now

    async def sleep(self, seconds: float) -> None:
        self.now += seconds


class FakeHttpClient:
    """Duck-typed :class:`~b2c_tooling_sdk.clients._core.HttpClient` driven by a handler.

    ``handler(method, path, options)`` returns (or awaits to) a
    :class:`ClientResult`. Every call is recorded in :attr:`calls`.
    """

    def __init__(self, handler: Callable[[str, str, dict[str, Any]], Any]) -> None:
        self._handler = handler
        self.calls: list[tuple[str, str, dict[str, Any]]] = []

    async def _call(self, method: str, path: str, options: dict[str, Any] | None) -> ClientResult:
        options = options or {}
        self.calls.append((method, path, options))
        result = self._handler(method, path, options)
        if inspect.isawaitable(result):
            result = await result
        return result  # type: ignore[return-value]

    async def get(self, path: str, options: dict[str, Any] | None = None) -> ClientResult:
        return await self._call("GET", path, options)

    async def post(self, path: str, options: dict[str, Any] | None = None) -> ClientResult:
        return await self._call("POST", path, options)

    async def put(self, path: str, options: dict[str, Any] | None = None) -> ClientResult:
        return await self._call("PUT", path, options)

    async def delete(self, path: str, options: dict[str, Any] | None = None) -> ClientResult:
        return await self._call("DELETE", path, options)


class FakeWebDav:
    """In-memory WebDAV serving both the simple API (``put``/``get``/``delete``) used
    by site-archive and the rich API (``request``/``propfind``) used by import-set."""

    def __init__(self, default_get_content: bytes = b"") -> None:
        self.dirs: set[str] = set()
        self.files: dict[str, bytes] = {}
        self.default_get_content = default_get_content
        self.put_calls: list[tuple[str, bytes, str | None]] = []
        self.deleted: list[str] = []
        self.requests: list[tuple[str, str, Any, Any]] = []

    # --- simple API (site_archive) ---
    async def put(self, path: str, content: bytes | str, content_type: str | None = None) -> None:
        body = content.encode("utf-8") if isinstance(content, str) else bytes(content)
        self.put_calls.append((path, body, content_type))
        self.files[path] = body

    async def get(self, path: str) -> bytes:
        return self.files.get(path, self.default_get_content)

    async def delete(self, path: str) -> None:
        self.deleted.append(path)
        self.files.pop(path, None)

    # --- rich API (import_set) ---
    def _resp(self, status: int, content: bytes = b"", method: str = "GET", path: str = "") -> httpx.Response:
        return httpx.Response(
            status, content=content, request=make_request(method, f"https://dav.test/{path.lstrip('/')}")
        )

    async def request(
        self,
        path: str,
        *,
        method: str = "GET",
        headers: Any = None,
        content: Any = None,
    ) -> httpx.Response:
        self.requests.append((method.upper(), path, headers, content))
        m = method.upper()
        if m == "MKCOL":
            if path in self.dirs or path in self.files:
                return self._resp(405, method=m, path=path)
            self.dirs.add(path)
            return self._resp(201, method=m, path=path)
        if m == "GET":
            if path in self.files:
                return self._resp(200, content=self.files[path], method=m, path=path)
            return self._resp(404, method=m, path=path)
        if m == "PUT":
            body = content.encode("utf-8") if isinstance(content, str) else bytes(content or b"")
            self.files[path] = body
            return self._resp(201, method=m, path=path)
        if m == "DELETE":
            existed = self.files.pop(path, None) is not None
            for stored in list(self.dirs):
                if stored == path or stored.startswith(f"{path}/"):
                    self.dirs.discard(stored)
                    existed = True
            for stored_file in list(self.files):
                if stored_file.startswith(f"{path}/"):
                    del self.files[stored_file]
                    existed = True
            self.deleted.append(path)
            return self._resp(204 if existed else 404, method=m, path=path)
        if m == "HEAD":
            exists = path in self.dirs or path in self.files
            return self._resp(200 if exists else 404, method=m, path=path)
        return self._resp(405, method=m, path=path)

    async def propfind(self, path: str, depth: str = "1") -> list[PropfindEntry]:
        if path in self.dirs:
            return [PropfindEntry(href=path, is_collection=True)]
        if path in self.files:
            return [PropfindEntry(href=path, is_collection=False)]
        raise HttpError(f"PROPFIND {path}: 404", self._resp(404, method="PROPFIND", path=path), "PROPFIND")


@dataclass
class FakeScapiConfig:
    """Duck-typed ``ScapiClientConfig`` (short_code/tenant_id/auth)."""

    short_code: str = "abcd1234"
    tenant_id: str = "zzxy_prd"
    auth: Any = None


class FakeInstance:
    """Duck-typed :class:`~b2c_tooling_sdk.instance.B2CInstance` exposing only the
    attributes the jobs operations touch."""

    def __init__(
        self,
        *,
        ocapi: Any = None,
        webdav: Any = None,
        api_backend: str = "auto",
        scapi_client_config: Any = None,
    ) -> None:
        self.ocapi = ocapi
        self.webdav = webdav
        self.api_backend = api_backend
        self.scapi_client_config = scapi_client_config


def zip_bytes(entries: dict[str, bytes]) -> bytes:
    """Build an in-memory zip archive from ``{arcname: content}``."""
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, content in entries.items():
            archive.writestr(name, content)
    return buffer.getvalue()
