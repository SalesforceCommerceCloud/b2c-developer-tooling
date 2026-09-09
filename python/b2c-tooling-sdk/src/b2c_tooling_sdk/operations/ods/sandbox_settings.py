# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Builds the sandbox ``settings`` object for OCAPI/WebDAV permission grants.

Mirrors ``src/operations/ods/sandbox-settings.ts``. The ODS/OCAPI/WebDAV JSON
shapes use ``snake_case`` keys over the wire (``client_id``, ``resource_id``,
``read_attributes``, ...), so the dicts below are built with those exact keys
rather than being converted to a Python-side naming convention.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

#: Default OCAPI resources to grant the client ID access to.
#: These enable common CI/CD operations like code deployment and job execution.
DEFAULT_OCAPI_RESOURCES: list[dict[str, Any]] = [
    {"resource_id": "/code_versions", "methods": ["get"], "read_attributes": "(**)", "write_attributes": "(**)"},
    {
        "resource_id": "/code_versions/*",
        "methods": ["patch", "delete"],
        "read_attributes": "(**)",
        "write_attributes": "(**)",
    },
    {
        "resource_id": "/jobs/*/executions",
        "methods": ["post"],
        "read_attributes": "(**)",
        "write_attributes": "(**)",
    },
    {
        "resource_id": "/jobs/*/executions/*",
        "methods": ["get"],
        "read_attributes": "(**)",
        "write_attributes": "(**)",
    },
    {
        "resource_id": "/sites/*/cartridges",
        "methods": ["post"],
        "read_attributes": "(**)",
        "write_attributes": "(**)",
    },
]

#: Default WebDAV permissions to grant the client ID.
#: These enable common operations like code upload and data import/export.
DEFAULT_WEBDAV_PERMISSIONS: list[dict[str, Any]] = [
    {"path": "/impex", "operations": ["read_write"]},
    {"path": "/cartridges", "operations": ["read_write"]},
    {"path": "/static", "operations": ["read_write"]},
]


@dataclass
class BuildSandboxSettingsOptions:
    """Options for :func:`build_sandbox_settings`."""

    #: Client ID to grant default OCAPI/WebDAV permissions. When provided (and no
    #: custom settings are supplied), the defaults are applied for this client.
    client_id: str | None = None
    #: Custom OCAPI settings array that fully replaces :data:`DEFAULT_OCAPI_RESOURCES`.
    ocapi_settings: list[dict[str, Any]] | None = None
    #: Custom WebDAV settings array that fully replaces :data:`DEFAULT_WEBDAV_PERMISSIONS`.
    webdav_settings: list[dict[str, Any]] | None = None


def build_sandbox_settings(options: BuildSandboxSettingsOptions) -> dict[str, Any] | None:
    """Build the sandbox ``settings`` object granting OCAPI and WebDAV permissions to a client ID.

    New sandboxes have no API permissions by default, so the client used to
    create the sandbox (e.g. for code deployment) must be granted access
    explicitly or subsequent operations will fail with authorization errors.

    When ``ocapi_settings``/``webdav_settings`` are provided they fully replace
    the defaults. Otherwise, when a ``client_id`` is provided, the client is
    granted the default resources/permissions.

    :param options: The settings to build.
    :returns: The settings dict, or ``None`` when there is nothing to set (no
        client ID and no custom settings).

    :example:
        >>> settings = build_sandbox_settings(BuildSandboxSettingsOptions(client_id=config.values.client_id))
        >>> await ods_client.post("/sandboxes", {"body": {"realm": realm, "ttl": ttl, "settings": settings}})
    """
    has_custom_ocapi = options.ocapi_settings is not None
    has_custom_webdav = options.webdav_settings is not None
    client_id = options.client_id

    # Nothing to apply: no custom settings and no client ID for defaults.
    if not has_custom_ocapi and not has_custom_webdav and not client_id:
        return None

    if has_custom_ocapi:
        ocapi = options.ocapi_settings
    elif client_id:
        ocapi = [{"client_id": client_id, "resources": DEFAULT_OCAPI_RESOURCES}]
    else:
        ocapi = []

    if has_custom_webdav:
        webdav = options.webdav_settings
    elif client_id:
        webdav = [{"client_id": client_id, "permissions": DEFAULT_WEBDAV_PERMISSIONS}]
    else:
        webdav = []

    return {"ocapi": ocapi, "webdav": webdav}


__all__ = [
    "DEFAULT_OCAPI_RESOURCES",
    "DEFAULT_WEBDAV_PERMISSIONS",
    "BuildSandboxSettingsOptions",
    "build_sandbox_settings",
]
