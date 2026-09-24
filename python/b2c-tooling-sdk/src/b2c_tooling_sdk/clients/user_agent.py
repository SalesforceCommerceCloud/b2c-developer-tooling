# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""User-Agent middleware providers for HTTP + auth clients.

Mirrors ``src/clients/user-agent.ts``. Maintains a module-global User-Agent
string (defaulting to :data:`~b2c_tooling_sdk.version.SDK_USER_AGENT`) that the
CLI can override to include both CLI and SDK versions. Two providers are
registered on import: one with the global HTTP middleware registry (for the
typed clients + WebDAV) and one with the global auth middleware registry (so
OAuth token requests also carry the User-Agent).
"""

from __future__ import annotations

import httpx

from b2c_tooling_sdk.auth.middleware import AuthMiddleware, global_auth_middleware_registry
from b2c_tooling_sdk.clients.middleware import create_user_agent_middleware
from b2c_tooling_sdk.clients.middleware_registry import (
    HttpClientType,
    UnifiedMiddleware,
    global_middleware_registry,
)
from b2c_tooling_sdk.version import SDK_USER_AGENT

# Current User-Agent string — defaults to the SDK User-Agent.
_current_user_agent = SDK_USER_AGENT


def set_user_agent(user_agent: str) -> None:
    """Set the User-Agent string used for all HTTP + auth requests.

    Call early in an application to override the default SDK User-Agent (the CLI
    uses this to set a combined CLI+SDK User-Agent).
    """
    global _current_user_agent
    _current_user_agent = user_agent


def get_user_agent() -> str:
    """Return the current User-Agent string."""
    return _current_user_agent


def reset_user_agent() -> None:
    """Reset the User-Agent to the default SDK value (primarily for testing)."""
    global _current_user_agent
    _current_user_agent = SDK_USER_AGENT


class _UserAgentProvider:
    """HTTP middleware provider supplying User-Agent middleware for every client type."""

    name = "user-agent"

    def get_middleware(self, client_type: HttpClientType) -> UnifiedMiddleware | None:
        """Return User-Agent middleware carrying the current User-Agent."""
        return create_user_agent_middleware(_current_user_agent)


class _UserAgentAuthMiddleware:
    """Auth middleware that sets User-Agent headers on OAuth token requests."""

    async def on_request(self, request: httpx.Request) -> httpx.Request | None:
        """Set ``User-Agent`` and ``sfdc_user_agent`` on the token request."""
        request.headers["User-Agent"] = _current_user_agent
        request.headers["sfdc_user_agent"] = _current_user_agent
        return request

    async def on_response(self, request: httpx.Request, response: httpx.Response) -> httpx.Response | None:
        """Pass the response through unchanged."""
        return response


class _UserAgentAuthProvider:
    """Auth middleware provider supplying User-Agent middleware for token requests."""

    name = "user-agent"

    def get_middleware(self) -> AuthMiddleware:
        """Return the auth-request User-Agent middleware."""
        return _UserAgentAuthMiddleware()


#: User-Agent middleware provider for HTTP clients (auto-registered on import).
user_agent_provider = _UserAgentProvider()

#: User-Agent middleware provider for auth requests (auto-registered on import).
user_agent_auth_provider = _UserAgentAuthProvider()

# Auto-register with the global middleware registries on module import.
global_middleware_registry.register(user_agent_provider)
global_auth_middleware_registry.register(user_agent_auth_provider)


__all__ = [
    "get_user_agent",
    "reset_user_agent",
    "set_user_agent",
    "user_agent_auth_provider",
    "user_agent_provider",
]
