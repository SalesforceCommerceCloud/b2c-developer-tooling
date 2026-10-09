# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Resolved configuration implementation.

Mirrors ``src/config/resolved-config.ts``. :class:`ResolvedConfigImpl` wraps a
resolved :class:`NormalizedConfig` with validation predicates and auth-strategy
factory methods.
"""

from __future__ import annotations

from b2c_tooling_sdk.auth.api_key import ApiKeyStrategy
from b2c_tooling_sdk.auth.basic import BasicAuthStrategy
from b2c_tooling_sdk.auth.resolve import resolve_auth_strategy
from b2c_tooling_sdk.auth.types import AuthCredentials, AuthStrategy
from b2c_tooling_sdk.config.mapping import create_instance_from_config
from b2c_tooling_sdk.config.types import (
    ConfigSourceInfo,
    ConfigWarning,
    CreateB2CInstanceOptions,
    CreateOAuthOptions,
    NormalizedConfig,
)
from b2c_tooling_sdk.instance import B2CInstance


class ResolvedConfigImpl:
    """Resolved configuration with validation and auth-strategy factories."""

    def __init__(
        self,
        values: NormalizedConfig,
        warnings: list[ConfigWarning],
        sources: list[ConfigSourceInfo],
    ) -> None:
        self.values = values
        self.warnings = warnings
        self.sources = sources

    # Validation methods

    def has_b2c_instance_config(self) -> bool:
        """Whether a B2C instance can be created (requires a hostname)."""
        return bool(self.values.hostname)

    def has_mrt_config(self) -> bool:
        """Whether MRT credentials are available (requires an MRT API key)."""
        return bool(self.values.mrt_api_key)

    def has_oauth_config(self) -> bool:
        """Whether OAuth can be used (requires a client id)."""
        return bool(self.values.client_id)

    def has_basic_auth_config(self) -> bool:
        """Whether basic auth can be used (requires username and password)."""
        return bool(self.values.username and self.values.password)

    # Factory methods

    def create_b2c_instance(self, options: CreateB2CInstanceOptions | None = None) -> B2CInstance:
        """Create a :class:`~b2c_tooling_sdk.instance.B2CInstance` from the resolved config.

        :raises ValueError: if no hostname is available (see
            :meth:`has_b2c_instance_config`).
        """
        if not self.has_b2c_instance_config():
            raise ValueError("B2C instance requires hostname")
        return create_instance_from_config(self.values, options)

    def create_basic_auth(self) -> AuthStrategy:
        """Create a :class:`BasicAuthStrategy` from the resolved credentials."""
        if not self.has_basic_auth_config():
            raise ValueError("Basic auth requires username and password")
        assert self.values.username is not None and self.values.password is not None
        return BasicAuthStrategy(self.values.username, self.values.password)

    def create_oauth(self, options: CreateOAuthOptions | None = None) -> AuthStrategy:
        """Create an OAuth strategy, merging any additional scopes over config scopes."""
        if not self.has_oauth_config():
            raise ValueError("OAuth requires clientId")

        config_scopes = self.values.scopes or []
        additional_scopes = (options.scopes if options else None) or []
        if additional_scopes:
            # Preserve order while de-duplicating (config scopes first).
            merged_scopes = list(dict.fromkeys([*config_scopes, *additional_scopes]))
        else:
            merged_scopes = config_scopes

        credentials = AuthCredentials(
            client_id=self.values.client_id,
            client_secret=self.values.client_secret,
            scopes=merged_scopes or None,
            account_manager_host=self.values.account_manager_host,
            redirect_uri=options.redirect_uri if options else None,
            open_browser=options.open_browser if options else None,
        )
        return resolve_auth_strategy(credentials, allowed_methods=options.allowed_methods if options else None)

    def create_mrt_auth(self) -> AuthStrategy:
        """Create an :class:`ApiKeyStrategy` for MRT (``Authorization`` header)."""
        if not self.has_mrt_config():
            raise ValueError("MRT auth requires mrtApiKey")
        assert self.values.mrt_api_key is not None
        return ApiKeyStrategy(self.values.mrt_api_key, "Authorization")

    def create_webdav_auth(self) -> AuthStrategy:
        """Create the best available WebDAV auth strategy (basic preferred, else OAuth)."""
        if self.has_basic_auth_config():
            return self.create_basic_auth()
        if self.has_oauth_config():
            return self.create_oauth()
        raise ValueError("WebDAV auth requires basic auth (username/password) or OAuth (clientId)")


#: Alias matching the TS ``ResolvedB2CConfig`` type name.
ResolvedB2CConfig = ResolvedConfigImpl

__all__ = ["ResolvedB2CConfig", "ResolvedConfigImpl"]
