# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for config resolution (ConfigResolver / create_config_resolver / resolve_config).

Mirrors ``packages/b2c-tooling-sdk/test/config/resolver.test.ts``.
"""

from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path

import pytest

from b2c_tooling_sdk.config.config_source_registry import global_config_source_registry
from b2c_tooling_sdk.config.resolver import ConfigResolver, create_config_resolver, resolve_config
from b2c_tooling_sdk.config.types import (
    ConfigLoadResult,
    ConfigSource,
    NormalizedConfig,
    ResolveConfigOptions,
)
from b2c_tooling_sdk.instance import B2CInstance


class MockSource:
    """Mock config source mirroring the TS ``MockSource`` test helper."""

    def __init__(
        self,
        name: str,
        config: NormalizedConfig | None,
        location: str | None = None,
        priority: int | None = None,
    ) -> None:
        self.name = name
        self.priority = priority
        self._config = config
        self._location = location

    def load(self, _options: ResolveConfigOptions) -> ConfigLoadResult | None:
        if self._config is None:
            return None
        return ConfigLoadResult(config=self._config, location=self._location)


class ThrowingSource:
    """A config source whose ``load`` raises synchronously."""

    def __init__(self, name: str, message: str, priority: int | None = None) -> None:
        self.name = name
        self.priority = priority
        self._message = message

    def load(self, _options: ResolveConfigOptions) -> ConfigLoadResult | None:
        raise RuntimeError(self._message)


@pytest.fixture(autouse=True)
def _isolate_cwd_and_home(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Point cwd/HOME at an empty temp dir so default sources never see real files."""
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("HOME", str(tmp_path))
    monkeypatch.setenv("USERPROFILE", str(tmp_path))


@pytest.fixture(autouse=True)
def _clear_global_registry() -> Iterator[None]:
    global_config_source_registry.clear()
    yield
    global_config_source_registry.clear()


# --- ConfigResolver.resolve ---------------------------------------------------


async def test_resolve_from_single_source() -> None:
    source = MockSource("test", NormalizedConfig(hostname="example.demandware.net", code_version="v1"))
    resolver = ConfigResolver([source])

    result = await resolver.resolve()

    assert result.config.hostname == "example.demandware.net"
    assert result.config.code_version == "v1"
    assert len(result.warnings) == 0
    assert len(result.sources) == 1
    assert result.sources[0].name == "test"


async def test_resolve_tenant_id_from_source() -> None:
    source = MockSource("test", NormalizedConfig(hostname="example.demandware.net", tenant_id="test_prd"))
    resolver = ConfigResolver([source])

    result = await resolver.resolve()

    assert result.config.tenant_id == "test_prd"


async def test_allows_overrides_to_take_precedence_for_tenant_id() -> None:
    source = MockSource("test", NormalizedConfig(hostname="example.demandware.net", tenant_id="source_prd"))
    resolver = ConfigResolver([source])

    result = await resolver.resolve(NormalizedConfig(tenant_id="override_prd"))

    assert result.config.tenant_id == "override_prd"


async def test_applies_overrides_with_highest_priority() -> None:
    source = MockSource(
        "test",
        NormalizedConfig(
            hostname="source.demandware.net",
            code_version="v1",
            client_id="source-client",
        ),
    )
    resolver = ConfigResolver([source])

    result = await resolver.resolve(
        NormalizedConfig(hostname="source.demandware.net", code_version="v2"),
    )

    assert result.config.hostname == "source.demandware.net"
    assert result.config.code_version == "v2"
    assert result.config.client_id == "source-client"


async def test_resolve_from_multiple_sources_with_priority_order() -> None:
    source1 = MockSource("first", NormalizedConfig(hostname="first.demandware.net", code_version="v1"))
    source2 = MockSource(
        "second",
        NormalizedConfig(hostname="second.demandware.net", code_version="v2", client_id="second-client"),
    )
    resolver = ConfigResolver([source1, source2])

    result = await resolver.resolve()

    # First source wins for hostname and codeVersion.
    assert result.config.hostname == "first.demandware.net"
    assert result.config.code_version == "v1"
    # Second source contributes clientId (not in first source).
    assert result.config.client_id == "second-client"
    assert len(result.sources) == 2


async def test_tracks_source_locations_when_available() -> None:
    source = MockSource("test", NormalizedConfig(hostname="example.demandware.net"), "/path/to/dw.json")
    resolver = ConfigResolver([source])

    result = await resolver.resolve()

    assert result.sources[0].location == "/path/to/dw.json"


async def test_tracks_which_fields_each_source_provided() -> None:
    source1 = MockSource("first", NormalizedConfig(hostname="example.demandware.net"))
    source2 = MockSource("second", NormalizedConfig(client_id="test-client", client_secret="test-secret"))
    resolver = ConfigResolver([source1, source2])

    result = await resolver.resolve()

    assert result.sources[0].fields == ["hostname"]
    assert result.sources[0].fields_ignored is None
    assert set(result.sources[1].fields) == {"client_id", "client_secret"}
    assert result.sources[1].fields_ignored is None


async def test_tracks_fields_ignored_when_higher_priority_source_provides_same_fields() -> None:
    source1 = MockSource(
        "higher-priority",
        NormalizedConfig(hostname="example.demandware.net", client_id="higher-client", client_secret="higher-secret"),
    )
    source2 = MockSource("lower-priority", NormalizedConfig(client_id="lower-client", client_secret="lower-secret"))
    resolver = ConfigResolver([source1, source2])

    result = await resolver.resolve()

    # Higher priority source provides and uses all its fields.
    assert set(result.sources[0].fields) == {"hostname", "client_id", "client_secret"}
    assert result.sources[0].fields_ignored is None

    # Lower priority source provides fields but they are ignored.
    assert set(result.sources[1].fields) == {"client_id", "client_secret"}
    assert set(result.sources[1].fields_ignored or []) == {"client_id", "client_secret"}

    # Final config uses higher priority values.
    assert result.config.client_id == "higher-client"
    assert result.config.client_secret == "higher-secret"


async def test_skips_sources_that_return_none() -> None:
    source1 = MockSource("empty", None)
    source2 = MockSource("valid", NormalizedConfig(hostname="example.demandware.net"))
    resolver = ConfigResolver([source1, source2])

    result = await resolver.resolve()

    assert result.config.hostname == "example.demandware.net"
    assert len(result.sources) == 1
    assert result.sources[0].name == "valid"


async def test_skips_sources_that_return_empty_config() -> None:
    source1 = MockSource("empty", NormalizedConfig())
    source2 = MockSource("valid", NormalizedConfig(hostname="example.demandware.net"))
    resolver = ConfigResolver([source1, source2])

    result = await resolver.resolve()

    assert len(result.sources) == 1
    assert result.sources[0].name == "valid"


async def test_applies_hostname_mismatch_protection() -> None:
    source = MockSource(
        "test",
        NormalizedConfig(hostname="prod.demandware.net", client_id="prod-client", client_secret="prod-secret"),
    )
    resolver = ConfigResolver([source])

    result = await resolver.resolve(
        NormalizedConfig(hostname="staging.demandware.net"),
        ResolveConfigOptions(hostname_protection=True),
    )

    assert result.config.hostname == "staging.demandware.net"
    assert result.config.client_id is None
    assert result.config.client_secret is None
    assert len(result.warnings) == 1
    assert result.warnings[0].code == "HOSTNAME_MISMATCH"


async def test_creates_source_error_warning_when_source_throws() -> None:
    throwing_source = ThrowingSource("throwing-source", "Malformed config file")
    valid_source = MockSource("valid", NormalizedConfig(hostname="example.demandware.net", client_id="valid-client"))
    resolver = ConfigResolver([throwing_source, valid_source])

    result = await resolver.resolve()

    # Should have one SOURCE_ERROR warning.
    assert len(result.warnings) == 1
    assert result.warnings[0].code == "SOURCE_ERROR"
    assert "throwing-source" in result.warnings[0].message
    assert "Malformed config file" in result.warnings[0].message
    assert result.warnings[0].details == {"source": "throwing-source", "error": "Malformed config file"}

    # Valid source should still contribute config.
    assert result.config.hostname == "example.demandware.net"
    assert result.config.client_id == "valid-client"
    assert len(result.sources) == 1
    assert result.sources[0].name == "valid"


async def test_continues_with_remaining_sources_after_source_error() -> None:
    throwing_source_1 = ThrowingSource("bad-source-1", "Error 1", priority=-1)
    valid_source = MockSource("valid", NormalizedConfig(hostname="example.com"), None, 0)
    throwing_source_2 = ThrowingSource("bad-source-2", "Error 2", priority=1)
    resolver = ConfigResolver([throwing_source_1, valid_source, throwing_source_2])

    result = await resolver.resolve()

    # Should have two SOURCE_ERROR warnings.
    assert len(result.warnings) == 2
    assert result.warnings[0].code == "SOURCE_ERROR"
    assert "bad-source-1" in result.warnings[0].message
    assert result.warnings[1].code == "SOURCE_ERROR"
    assert "bad-source-2" in result.warnings[1].message

    # Valid source contributes config.
    assert result.config.hostname == "example.com"
    assert len(result.sources) == 1


async def test_returns_empty_config_when_no_sources_have_data() -> None:
    resolver = ConfigResolver([])

    result = await resolver.resolve()

    # Config has all fields set to None (not an empty object).
    assert result.config.hostname is None
    assert result.config.client_id is None
    assert len(result.sources) == 0


# --- credential grouping -------------------------------------------------------


async def test_does_not_mix_client_id_and_client_secret_from_different_sources() -> None:
    source1 = MockSource("first", NormalizedConfig(client_id="first-client"))
    source2 = MockSource("second", NormalizedConfig(client_secret="second-secret"))
    resolver = ConfigResolver([source1, source2])

    result = await resolver.resolve()

    assert result.config.client_id == "first-client"
    assert result.config.client_secret is None  # Not mixed from source2.


async def test_does_not_mix_username_and_password_from_different_sources() -> None:
    source1 = MockSource("first", NormalizedConfig(username="user1"))
    source2 = MockSource("second", NormalizedConfig(password="pass2"))
    resolver = ConfigResolver([source1, source2])

    result = await resolver.resolve()

    assert result.config.username == "user1"
    assert result.config.password is None  # Not mixed from source2.


async def test_allows_complete_credential_pairs_from_same_source() -> None:
    source1 = MockSource("first", NormalizedConfig(hostname="example.com"))
    source2 = MockSource("second", NormalizedConfig(client_id="client", client_secret="secret"))
    resolver = ConfigResolver([source1, source2])

    result = await resolver.resolve()

    assert result.config.hostname == "example.com"
    assert result.config.client_id == "client"
    assert result.config.client_secret == "secret"


async def test_allows_non_grouped_fields_to_merge_normally() -> None:
    source1 = MockSource("first", NormalizedConfig(client_id="client"))
    source2 = MockSource("second", NormalizedConfig(hostname="example.com", code_version="v1"))
    resolver = ConfigResolver([source1, source2])

    result = await resolver.resolve()

    assert result.config.client_id == "client"
    assert result.config.hostname == "example.com"
    assert result.config.code_version == "v1"


async def test_blocks_both_oauth_fields_when_client_id_is_claimed() -> None:
    source1 = MockSource("first", NormalizedConfig(client_id="first-client"))
    source2 = MockSource("second", NormalizedConfig(client_id="second-client", client_secret="second-secret"))
    resolver = ConfigResolver([source1, source2])

    result = await resolver.resolve()

    assert result.config.client_id == "first-client"
    assert result.config.client_secret is None  # Blocked due to group claim.


async def test_blocks_both_basic_auth_fields_when_username_is_claimed() -> None:
    source1 = MockSource("first", NormalizedConfig(username="first-user"))
    source2 = MockSource("second", NormalizedConfig(username="second-user", password="second-pass"))
    resolver = ConfigResolver([source1, source2])

    result = await resolver.resolve()

    assert result.config.username == "first-user"
    assert result.config.password is None  # Blocked due to group claim.


async def test_allows_independent_credential_groups_to_come_from_different_sources() -> None:
    source1 = MockSource("first", NormalizedConfig(client_id="oauth-client", client_secret="oauth-secret"))
    source2 = MockSource("second", NormalizedConfig(username="basic-user", password="basic-pass"))
    resolver = ConfigResolver([source1, source2])

    result = await resolver.resolve()

    # OAuth from source1.
    assert result.config.client_id == "oauth-client"
    assert result.config.client_secret == "oauth-secret"
    # Basic from source2.
    assert result.config.username == "basic-user"
    assert result.config.password == "basic-pass"


# --- createAuthCredentials ------------------------------------------------------


async def test_creates_auth_credentials_from_resolved_config() -> None:
    source = MockSource(
        "test",
        NormalizedConfig(
            hostname="example.demandware.net",
            client_id="test-client",
            client_secret="test-secret",
            scopes=["mail", "roles"],
            username="user",
            password="pass",
            mrt_api_key="api-key",
        ),
    )
    resolver = ConfigResolver([source])

    credentials = await resolver.create_auth_credentials()

    assert credentials.client_id == "test-client"
    assert credentials.client_secret == "test-secret"
    assert credentials.scopes == ["mail", "roles"]
    assert credentials.username == "user"
    assert credentials.password == "pass"
    assert credentials.api_key == "api-key"


async def test_applies_overrides_to_auth_credentials() -> None:
    source = MockSource("test", NormalizedConfig(hostname="example.demandware.net", client_id="source-client"))
    resolver = ConfigResolver([source])

    credentials = await resolver.create_auth_credentials(
        NormalizedConfig(hostname="example.demandware.net", client_id="override-client"),
    )

    assert credentials.client_id == "override-client"


# --- createInstance --------------------------------------------------------------


async def test_create_instance_resolves_config_and_returns_instance() -> None:
    source = MockSource("test", NormalizedConfig(hostname="example.demandware.net", client_id="client"))
    resolver = ConfigResolver([source])

    instance = await resolver.create_instance()

    assert isinstance(instance, B2CInstance)
    assert instance.config.hostname == "example.demandware.net"


async def test_create_instance_applies_overrides() -> None:
    source = MockSource("test", NormalizedConfig(hostname="source.demandware.net"))
    resolver = ConfigResolver([source])

    instance = await resolver.create_instance(NormalizedConfig(hostname="override.demandware.net"))

    assert instance.config.hostname == "override.demandware.net"


async def test_create_instance_raises_when_no_hostname() -> None:
    resolver = ConfigResolver([])

    with pytest.raises(ValueError, match="Hostname is required"):
        await resolver.create_instance()


# --- createConfigResolver -------------------------------------------------------


async def test_create_config_resolver_creates_a_resolver_with_default_sources() -> None:
    resolver = create_config_resolver()

    # Should not raise.
    result = await resolver.resolve(NormalizedConfig(hostname="test.demandware.net"))

    assert result.config.hostname == "test.demandware.net"


# --- priority-based sorting ------------------------------------------------------


async def test_sorts_sources_by_priority_lower_number_is_higher_priority() -> None:
    # Sources added in wrong order, but should be sorted by priority.
    low_priority = MockSource("low", NormalizedConfig(client_id="low-client"), None, 100)
    high_priority = MockSource("high", NormalizedConfig(client_id="high-client"), None, -10)
    default_priority = MockSource("default", NormalizedConfig(client_id="default-client"), None, 0)

    # Pass sources in "wrong" order - they should get sorted.
    resolver = ConfigResolver([low_priority, default_priority, high_priority])
    result = await resolver.resolve()

    # High priority source (-10) wins.
    assert result.config.client_id == "high-client"


async def test_treats_undefined_priority_as_zero() -> None:
    with_priority = MockSource("with", NormalizedConfig(client_id="with-priority"), None, 10)
    no_priority = MockSource("no", NormalizedConfig(client_id="no-priority"), None, None)

    # No priority (=0) should win over priority 10.
    resolver = ConfigResolver([with_priority, no_priority])
    result = await resolver.resolve()

    assert result.config.client_id == "no-priority"


async def test_maintains_insertion_order_for_same_priority() -> None:
    first = MockSource("first", NormalizedConfig(client_id="first-client"), None, 0)
    second = MockSource("second", NormalizedConfig(client_id="second-client"), None, 0)

    resolver = ConfigResolver([first, second])
    result = await resolver.resolve()

    # First source should win since both have same priority.
    assert result.config.client_id == "first-client"


async def test_negative_priorities_come_before_zero() -> None:
    before = MockSource("before", NormalizedConfig(hostname="before.com"), None, -1)
    builtin = MockSource("builtin", NormalizedConfig(hostname="builtin.com"), None, 0)

    resolver = ConfigResolver([builtin, before])
    result = await resolver.resolve()

    # -1 priority should win.
    assert result.config.hostname == "before.com"


async def test_high_priorities_1000_come_last() -> None:
    package_json = MockSource("package", NormalizedConfig(short_code="package-code"), None, 1000)
    dw_json = MockSource("dwjson", NormalizedConfig(short_code="dw-code"), None, 0)

    resolver = ConfigResolver([package_json, dw_json])
    result = await resolver.resolve()

    # 0 priority should win over 1000.
    assert result.config.short_code == "dw-code"


async def test_plugin_priorities_work_with_before_after_pattern() -> None:
    # Simulating: plugin 'before' (-1), builtin (0), plugin 'after' (10).
    plugin_before = MockSource("plugin-before", NormalizedConfig(client_id="before-client"), None, -1)
    builtin = MockSource("builtin", NormalizedConfig(client_id="builtin-client", hostname="builtin.com"), None, 0)
    plugin_after = MockSource(
        "plugin-after",
        NormalizedConfig(client_id="after-client", mrt_project="after-project"),
        None,
        10,
    )

    resolver = ConfigResolver([plugin_after, builtin, plugin_before])
    result = await resolver.resolve()

    # 'before' plugin wins for clientId.
    assert result.config.client_id == "before-client"
    # builtin provides hostname (not in before plugin).
    assert result.config.hostname == "builtin.com"
    # 'after' plugin provides mrtProject (not in others).
    assert result.config.mrt_project == "after-project"


# --- global config source registry integration ----------------------------------


async def test_resolve_config_includes_globally_registered_sources() -> None:
    class GlobalTestSource:
        name = "global-test"
        priority = -1

        def load(self, _options: ResolveConfigOptions) -> ConfigLoadResult | None:
            return ConfigLoadResult(config=NormalizedConfig(hostname="global.example.com"), location="global")

    global_config_source_registry.register(GlobalTestSource())

    config = await resolve_config(NormalizedConfig(), ResolveConfigOptions(replace_default_sources=True))

    assert config.values.hostname == "global.example.com"
    assert len(config.sources) == 1
    assert config.sources[0].name == "global-test"


async def test_global_sources_participate_in_priority_sorting() -> None:
    class GlobalLowSource:
        name = "global-low"
        priority = 100

        def load(self, _options: ResolveConfigOptions) -> ConfigLoadResult | None:
            return ConfigLoadResult(config=NormalizedConfig(hostname="low.example.com"))

    class GlobalHighSource:
        name = "global-high"
        priority = -10

        def load(self, _options: ResolveConfigOptions) -> ConfigLoadResult | None:
            return ConfigLoadResult(config=NormalizedConfig(hostname="high.example.com"))

    global_config_source_registry.register(GlobalLowSource())
    global_config_source_registry.register(GlobalHighSource())

    config = await resolve_config(NormalizedConfig(), ResolveConfigOptions(replace_default_sources=True))

    # High priority source (-10) wins.
    assert config.values.hostname == "high.example.com"


async def test_explicit_sources_before_after_merge_with_global_sources() -> None:
    class GlobalSource:
        name = "global-source"
        priority = 10

        def load(self, _options: ResolveConfigOptions) -> ConfigLoadResult | None:
            return ConfigLoadResult(config=NormalizedConfig(client_id="global-client"))

    global_config_source_registry.register(GlobalSource())

    explicit_source: ConfigSource = MockSource(
        "explicit-source", NormalizedConfig(hostname="explicit.example.com"), None, -1
    )

    config = await resolve_config(
        NormalizedConfig(),
        ResolveConfigOptions(replace_default_sources=True, sources_before=[explicit_source]),
    )

    # Both sources should contribute.
    assert config.values.hostname == "explicit.example.com"
    assert config.values.client_id == "global-client"


async def test_global_sources_are_included_when_replace_default_sources_is_true() -> None:
    class GlobalPersistentSource:
        name = "global-persistent"
        priority = 0

        def load(self, _options: ResolveConfigOptions) -> ConfigLoadResult | None:
            return ConfigLoadResult(config=NormalizedConfig(short_code="global-code"))

    global_config_source_registry.register(GlobalPersistentSource())

    config = await resolve_config(NormalizedConfig(), ResolveConfigOptions(replace_default_sources=True))

    assert config.values.short_code == "global-code"


# --- TLS/mTLS configuration -------------------------------------------------------


async def test_resolves_tls_options_from_source() -> None:
    source = MockSource(
        "test",
        NormalizedConfig(
            hostname="example.demandware.net",
            certificate="/path/to/cert.p12",
            certificate_passphrase="secret",
            self_signed=True,
        ),
    )
    resolver = ConfigResolver([source])

    result = await resolver.resolve()

    assert result.config.certificate == "/path/to/cert.p12"
    assert result.config.certificate_passphrase == "secret"
    assert result.config.self_signed is True


async def test_allows_overrides_to_take_precedence_for_tls_options() -> None:
    source = MockSource(
        "test",
        NormalizedConfig(hostname="example.demandware.net", certificate="/source/cert.p12", self_signed=False),
    )
    resolver = ConfigResolver([source])

    result = await resolver.resolve(
        NormalizedConfig(
            hostname="example.demandware.net",
            certificate="/override/cert.p12",
            self_signed=True,
        ),
    )

    assert result.config.certificate == "/override/cert.p12"
    assert result.config.self_signed is True


async def test_merges_tls_options_from_multiple_sources() -> None:
    source1 = MockSource("first", NormalizedConfig(hostname="example.demandware.net", certificate="/path/to/cert.p12"))
    source2 = MockSource("second", NormalizedConfig(certificate_passphrase="passphrase-from-second", self_signed=True))
    resolver = ConfigResolver([source1, source2])

    result = await resolver.resolve()

    assert result.config.hostname == "example.demandware.net"
    assert result.config.certificate == "/path/to/cert.p12"
    assert result.config.certificate_passphrase == "passphrase-from-second"
    assert result.config.self_signed is True


async def test_preserves_non_instance_bound_source_fields_on_hostname_mismatch() -> None:
    instance_source = MockSource(
        "dw-json",
        NormalizedConfig(
            hostname="prod.demandware.net",
            username="admin",
            password="prod-pass",
            short_code="abcdef",
        ),
    )
    global_source = MockSource(
        "password-store",
        NormalizedConfig(client_id="my-client-id", client_secret="my-client-secret", short_code="abcdef"),
    )
    resolver = ConfigResolver([instance_source, global_source])

    result = await resolver.resolve(
        NormalizedConfig(hostname="staging.demandware.net"),
        ResolveConfigOptions(hostname_protection=True),
    )

    assert result.config.hostname == "staging.demandware.net"
    # Instance-bound fields should be dropped.
    assert result.config.username is None
    assert result.config.password is None
    # Non-instance-bound fields should survive.
    assert result.config.client_id == "my-client-id"
    assert result.config.client_secret == "my-client-secret"
    # Fields from non-instance-bound source that were previously shadowed
    # by the instance-bound source should now be available.
    assert result.config.short_code == "abcdef"
    assert len(result.warnings) == 1
    assert result.warnings[0].code == "HOSTNAME_MISMATCH"

    # Source info should reflect the drop.
    dw_json_info = next(s for s in result.sources if s.name == "dw-json")
    assert dw_json_info.fields == []
    assert dw_json_info.fields_ignored is not None
    assert "hostname" in dw_json_info.fields_ignored
    assert "username" in dw_json_info.fields_ignored
    assert "password" in dw_json_info.fields_ignored


async def test_drops_fields_from_plugin_source_that_also_provides_hostname_on_mismatch() -> None:
    plugin_source = MockSource(
        "custom-plugin",
        NormalizedConfig(
            hostname="prod.demandware.net", client_id="plugin-client-id", client_secret="plugin-client-secret"
        ),
    )
    resolver = ConfigResolver([plugin_source])

    result = await resolver.resolve(
        NormalizedConfig(hostname="staging.demandware.net"),
        ResolveConfigOptions(hostname_protection=True),
    )

    assert result.config.hostname == "staging.demandware.net"
    # Plugin provided hostname, so it's instance-bound - all its fields dropped.
    assert result.config.client_id is None
    assert result.config.client_secret is None


async def test_discards_tls_options_on_hostname_mismatch_protection() -> None:
    source = MockSource(
        "test",
        NormalizedConfig(
            hostname="prod.demandware.net",
            certificate="/prod/cert.p12",
            certificate_passphrase="prod-secret",
            self_signed=False,
        ),
    )
    resolver = ConfigResolver([source])

    result = await resolver.resolve(
        NormalizedConfig(hostname="staging.demandware.net"),
        ResolveConfigOptions(hostname_protection=True),
    )

    assert result.config.hostname == "staging.demandware.net"
    assert result.config.certificate is None
    assert result.config.certificate_passphrase is None
    assert result.config.self_signed is None
    assert len(result.warnings) == 1
    assert result.warnings[0].code == "HOSTNAME_MISMATCH"
