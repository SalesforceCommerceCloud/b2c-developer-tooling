# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the dw.json / ~/.mobify / package.json configuration sources.

Mirrors ``packages/b2c-tooling-sdk/test/config/sources.test.ts``. Each test runs
with the current working directory pointed at a fresh temp dir (via the
autouse ``_chdir_tmp`` fixture below), matching the TypeScript suite's
``process.chdir(tempDir)`` in ``beforeEach``.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import pytest

from b2c_tooling_sdk.config.resolver import ConfigResolver
from b2c_tooling_sdk.config.sources.dw_json_source import DwJsonSource
from b2c_tooling_sdk.config.sources.package_json_source import PackageJsonSource
from b2c_tooling_sdk.config.types import CreateInstanceOptions, NormalizedConfig, ResolveConfigOptions


@pytest.fixture(autouse=True)
def _chdir_tmp(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """Run each test with cwd pointed at a fresh temp dir (mirrors the TS suite)."""
    monkeypatch.chdir(tmp_path)
    return tmp_path


def _write_json(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data), encoding="utf-8")


# --- DwJsonSource -------------------------------------------------------------


async def test_loads_config_from_dw_json_in_current_directory(tmp_path: Path) -> None:
    _write_json(tmp_path / "dw.json", {"hostname": "test.demandware.net", "code-version": "v1"})

    resolver = ConfigResolver()
    result = await resolver.resolve()

    assert result.config.hostname == "test.demandware.net"
    assert result.config.code_version == "v1"


async def test_does_not_load_config_from_parent_directory(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    sub_dir = tmp_path / "subdir"
    sub_dir.mkdir()
    _write_json(tmp_path / "dw.json", {"hostname": "parent.demandware.net"})

    monkeypatch.chdir(sub_dir)
    resolver = ConfigResolver()
    result = await resolver.resolve()

    assert result.config.hostname is None


async def test_handles_oauth_credentials_from_dw_json(tmp_path: Path) -> None:
    _write_json(
        tmp_path / "dw.json",
        {
            "hostname": "test.demandware.net",
            "client-id": "test-client",
            "client-secret": "test-secret",
            "oauth-scopes": ["mail", "roles"],
        },
    )

    resolver = ConfigResolver()
    result = await resolver.resolve()

    assert result.config.client_id == "test-client"
    assert result.config.client_secret == "test-secret"
    assert result.config.scopes == ["mail", "roles"]


async def test_loads_tenant_id_from_dw_json(tmp_path: Path) -> None:
    _write_json(tmp_path / "dw.json", {"hostname": "test.demandware.net", "tenant-id": "abcd_prd"})

    resolver = ConfigResolver()
    result = await resolver.resolve()

    assert result.config.tenant_id == "abcd_prd"


async def test_loads_import_set_exclude_from_dw_json(tmp_path: Path) -> None:
    _write_json(
        tmp_path / "dw.json",
        {"hostname": "test.demandware.net", "import-set-exclude": ["fixtures", "test/integration"]},
    )

    resolver = ConfigResolver()
    result = await resolver.resolve()

    assert result.config.import_set_exclude == ["fixtures", "test/integration"]


async def test_returns_none_when_dw_json_does_not_exist() -> None:
    resolver = ConfigResolver()
    result = await resolver.resolve()

    assert result.config.hostname is None


async def test_uses_global_default_config_when_project_has_no_dw_json(tmp_path: Path) -> None:
    default_config_path = tmp_path / "shared.dw.json"
    project_directory = tmp_path / "project"
    project_directory.mkdir()
    _write_json(default_config_path, {"hostname": "global-default.demandware.net"})

    resolver = ConfigResolver()
    result = await resolver.resolve(
        options=ResolveConfigOptions(
            project_directory=str(project_directory), default_config_path=str(default_config_path)
        )
    )

    assert result.config.hostname == "global-default.demandware.net"
    dw_json_source = next(s for s in result.sources if s.name == "DwJsonSource")
    assert dw_json_source.scope == "global"


async def test_prefers_project_dw_json_over_global_default(tmp_path: Path) -> None:
    default_config_path = tmp_path / "shared.dw.json"
    project_directory = tmp_path / "project"
    project_directory.mkdir()
    _write_json(default_config_path, {"hostname": "global-default.demandware.net"})
    _write_json(project_directory / "dw.json", {"hostname": "project.demandware.net"})

    resolver = ConfigResolver()
    result = await resolver.resolve(
        options=ResolveConfigOptions(
            project_directory=str(project_directory), default_config_path=str(default_config_path)
        )
    )

    assert result.config.hostname == "project.demandware.net"
    dw_json_source = next(s for s in result.sources if s.name == "DwJsonSource")
    assert dw_json_source.scope is None


async def test_prefers_explicit_config_path_over_project_and_global_defaults(tmp_path: Path) -> None:
    explicit_config_path = tmp_path / "explicit.dw.json"
    default_config_path = tmp_path / "shared.dw.json"
    project_directory = tmp_path / "project"
    project_directory.mkdir()
    _write_json(explicit_config_path, {"hostname": "explicit.demandware.net"})
    _write_json(default_config_path, {"hostname": "global-default.demandware.net"})
    _write_json(project_directory / "dw.json", {"hostname": "project.demandware.net"})

    resolver = ConfigResolver()
    result = await resolver.resolve(
        options=ResolveConfigOptions(
            project_directory=str(project_directory),
            config_path=str(explicit_config_path),
            default_config_path=str(default_config_path),
        )
    )

    assert result.config.hostname == "explicit.demandware.net"


async def test_prefers_explicit_file_default_over_active_global_instance(tmp_path: Path) -> None:
    explicit_config_path = tmp_path / "explicit.dw.json"
    default_config_path = tmp_path / "shared.dw.json"
    _write_json(explicit_config_path, {"hostname": "explicit.demandware.net"})
    _write_json(
        default_config_path,
        {"configs": [{"name": "global", "hostname": "global.demandware.net", "active": True}]},
    )

    resolver = ConfigResolver()
    result = await resolver.resolve(
        options=ResolveConfigOptions(
            config_path=str(explicit_config_path), default_config_path=str(default_config_path)
        )
    )

    assert result.config.hostname == "explicit.demandware.net"


async def test_lets_active_global_instance_win_when_primary_root_is_explicitly_inactive(tmp_path: Path) -> None:
    default_config_path = tmp_path / "shared.dw.json"
    dw_json_path = tmp_path / "dw.json"
    _write_json(dw_json_path, {"hostname": "local.demandware.net", "active": False})
    _write_json(
        default_config_path,
        {"configs": [{"name": "global", "hostname": "global.demandware.net", "active": True}]},
    )

    resolver = ConfigResolver()
    result = await resolver.resolve(options=ResolveConfigOptions(default_config_path=str(default_config_path)))

    assert result.config.hostname == "global.demandware.net"
    dw_json_source = next(s for s in result.sources if s.name == "DwJsonSource")
    assert dw_json_source.scope == "global"
    catalog = [
        {"location": os.path.realpath(f.location), "scope": f.scope, "selected": f.selected}
        for f in (dw_json_source.instance_catalog or [])
    ]
    assert catalog == [
        {"location": os.path.realpath(str(dw_json_path)), "scope": "primary", "selected": False},
        {"location": os.path.realpath(str(default_config_path)), "scope": "global", "selected": True},
    ]


async def test_prefers_active_primary_child_over_active_global_instance(tmp_path: Path) -> None:
    default_config_path = tmp_path / "shared.dw.json"
    _write_json(
        tmp_path / "dw.json",
        {
            "hostname": "inactive-root.demandware.net",
            "active": False,
            "configs": [{"name": "local", "hostname": "local.demandware.net", "active": True}],
        },
    )
    _write_json(
        default_config_path,
        {"configs": [{"name": "global", "hostname": "global.demandware.net", "active": True}]},
    )

    resolver = ConfigResolver()
    result = await resolver.resolve(options=ResolveConfigOptions(default_config_path=str(default_config_path)))

    assert result.config.hostname == "local.demandware.net"
    assert result.config.instance_name == "local"


async def test_handles_named_instance_from_multi_config(tmp_path: Path) -> None:
    _write_json(
        tmp_path / "dw.json",
        {
            "hostname": "root.demandware.net",
            "configs": [
                {"name": "staging", "hostname": "staging.demandware.net"},
                {"name": "production", "hostname": "prod.demandware.net"},
            ],
        },
    )

    resolver = ConfigResolver()
    result = await resolver.resolve(options=ResolveConfigOptions(instance="staging"))

    assert result.config.hostname == "staging.demandware.net"


async def test_selects_named_instance_from_global_catalog_when_absent_locally(tmp_path: Path) -> None:
    default_config_path = tmp_path / "shared.dw.json"
    _write_json(tmp_path / "dw.json", {"configs": [{"name": "local", "hostname": "local.demandware.net"}]})
    _write_json(default_config_path, {"configs": [{"name": "global", "hostname": "global.demandware.net"}]})

    resolver = ConfigResolver()
    result = await resolver.resolve(
        options=ResolveConfigOptions(instance="global", default_config_path=str(default_config_path))
    )

    assert result.config.hostname == "global.demandware.net"


async def test_shadows_same_name_global_instance_with_complete_local_instance(tmp_path: Path) -> None:
    default_config_path = tmp_path / "shared.dw.json"
    _write_json(tmp_path / "dw.json", {"configs": [{"name": "shared", "hostname": "local.demandware.net"}]})
    _write_json(
        default_config_path,
        {"configs": [{"name": "shared", "hostname": "global.demandware.net", "username": "global-user"}]},
    )

    resolver = ConfigResolver()
    result = await resolver.resolve(
        options=ResolveConfigOptions(instance="shared", default_config_path=str(default_config_path))
    )

    assert result.config.hostname == "local.demandware.net"
    assert result.config.username is None


async def test_provides_location_from_load_result_dw_json(tmp_path: Path) -> None:
    dw_json_path = tmp_path / "dw.json"
    _write_json(dw_json_path, {"hostname": "test.demandware.net"})

    resolver = ConfigResolver()
    result = await resolver.resolve()

    dw_json_source = next(s for s in result.sources if s.name == "DwJsonSource")
    assert dw_json_source.location is not None
    assert os.path.realpath(dw_json_source.location) == os.path.realpath(str(dw_json_path))


# --- DwJsonSource.list_instances -----------------------------------------------


async def test_list_instances_returns_empty_when_no_dw_json_exists() -> None:
    source = DwJsonSource()
    instances = await source.list_instances()
    assert instances == []


async def test_list_instances_returns_instances_from_configs_array(tmp_path: Path) -> None:
    _write_json(
        tmp_path / "dw.json",
        {
            "configs": [
                {"name": "staging", "hostname": "staging.demandware.net"},
                {"name": "production", "hostname": "prod.demandware.net", "active": True},
            ]
        },
    )

    source = DwJsonSource()
    instances = await source.list_instances()

    assert len(instances) == 2
    assert instances[0].name == "staging"
    assert instances[0].hostname == "staging.demandware.net"
    assert instances[1].name == "production"
    assert instances[1].active is True


async def test_list_instances_includes_root_config_if_it_has_a_name(tmp_path: Path) -> None:
    _write_json(
        tmp_path / "dw.json",
        {
            "name": "root",
            "hostname": "root.demandware.net",
            "active": True,
            "configs": [{"name": "staging", "hostname": "staging.demandware.net"}],
        },
    )

    source = DwJsonSource()
    instances = await source.list_instances()

    assert len(instances) == 2
    assert instances[0].name == "root"
    assert instances[0].active is True
    assert instances[1].name == "staging"


async def test_list_instances_returns_empty_when_dw_json_is_malformed(tmp_path: Path) -> None:
    (tmp_path / "dw.json").write_text('{ "hostname": "broken.demandware.net", }', encoding="utf-8")

    source = DwJsonSource()
    instances = await source.list_instances()

    assert instances == []


async def test_list_instances_unions_local_and_global_with_local_precedence(tmp_path: Path) -> None:
    default_config_path = tmp_path / "shared.dw.json"
    local_config_path = tmp_path / "dw.json"
    _write_json(
        local_config_path,
        {
            "configs": [
                {"name": "local", "hostname": "local.demandware.net"},
                {"name": "shared", "hostname": "local-shared.demandware.net"},
            ]
        },
    )
    _write_json(
        default_config_path,
        {
            "configs": [
                {"name": "global", "hostname": "global.demandware.net"},
                {"name": "shared", "hostname": "global-shared.demandware.net"},
            ]
        },
    )

    source = DwJsonSource()
    instances = await source.list_instances(ResolveConfigOptions(default_config_path=str(default_config_path)))

    assert [i.name for i in instances] == ["local", "shared", "global"]
    shared = next(i for i in instances if i.name == "shared")
    assert shared.hostname == "local-shared.demandware.net"
    assert shared.location is not None
    assert os.path.realpath(shared.location) == os.path.realpath(str(local_config_path))


# --- DwJsonSource.create_instance ----------------------------------------------


async def test_create_instance_creates_a_new_instance() -> None:
    source = DwJsonSource()
    await source.create_instance(
        CreateInstanceOptions(name="staging", config=NormalizedConfig(hostname="staging.demandware.net"))
    )

    instances = await source.list_instances()
    assert len(instances) == 1
    assert instances[0].name == "staging"
    assert instances[0].hostname == "staging.demandware.net"


async def test_create_instance_with_set_active() -> None:
    source = DwJsonSource()
    await source.create_instance(
        CreateInstanceOptions(
            name="staging", config=NormalizedConfig(hostname="staging.demandware.net"), set_active=True
        )
    )

    instances = await source.list_instances()
    assert instances[0].active is True


async def test_create_instance_uses_primary_file_when_present_otherwise_global_fallback(tmp_path: Path) -> None:
    project_directory = tmp_path / "project"
    local_config_path = project_directory / "dw.json"
    default_config_path = tmp_path / "shared.dw.json"
    project_directory.mkdir()
    _write_json(local_config_path, {"configs": []})
    _write_json(default_config_path, {"configs": []})
    source = DwJsonSource()

    await source.create_instance(
        CreateInstanceOptions(
            name="local",
            config=NormalizedConfig(hostname="local.demandware.net"),
            project_directory=str(project_directory),
            default_config_path=str(default_config_path),
        )
    )
    local_config_path.unlink()
    await source.create_instance(
        CreateInstanceOptions(
            name="global",
            config=NormalizedConfig(hostname="global.demandware.net"),
            project_directory=str(project_directory),
            default_config_path=str(default_config_path),
        )
    )

    saved = json.loads(default_config_path.read_text(encoding="utf-8"))
    assert saved["configs"] == [{"name": "global", "hostname": "global.demandware.net"}]


async def test_create_instance_clears_fallback_active_when_creating_active_primary_instance(
    tmp_path: Path,
) -> None:
    default_config_path = tmp_path / "shared.dw.json"
    _write_json(tmp_path / "dw.json", {"configs": []})
    _write_json(default_config_path, {"configs": [{"name": "global", "active": True}]})
    source = DwJsonSource()

    await source.create_instance(
        CreateInstanceOptions(
            name="local",
            config=NormalizedConfig(hostname="local.demandware.net"),
            set_active=True,
            default_config_path=str(default_config_path),
        )
    )

    saved = json.loads(default_config_path.read_text(encoding="utf-8"))
    assert saved["configs"][0]["active"] is False


# --- DwJsonSource.remove_instance -----------------------------------------------


async def test_remove_instance_removes_an_instance(tmp_path: Path) -> None:
    _write_json(
        tmp_path / "dw.json",
        {
            "configs": [
                {"name": "staging", "hostname": "staging.demandware.net"},
                {"name": "production", "hostname": "prod.demandware.net"},
            ]
        },
    )

    source = DwJsonSource()
    await source.remove_instance("staging")

    instances = await source.list_instances()
    assert len(instances) == 1
    assert instances[0].name == "production"


async def test_remove_instance_removes_from_fallback_when_not_in_primary(tmp_path: Path) -> None:
    default_config_path = tmp_path / "shared.dw.json"
    _write_json(tmp_path / "dw.json", {"configs": [{"name": "local"}]})
    _write_json(default_config_path, {"configs": [{"name": "global"}]})
    source = DwJsonSource()

    await source.remove_instance("global", ResolveConfigOptions(default_config_path=str(default_config_path)))

    saved = json.loads(default_config_path.read_text(encoding="utf-8"))
    assert saved["configs"] == []


# --- DwJsonSource.set_active_instance -------------------------------------------


async def test_set_active_instance_sets_an_instance_as_active(tmp_path: Path) -> None:
    _write_json(
        tmp_path / "dw.json",
        {
            "configs": [
                {"name": "staging", "hostname": "staging.demandware.net"},
                {"name": "production", "hostname": "prod.demandware.net"},
            ]
        },
    )

    source = DwJsonSource()
    await source.set_active_instance("staging")

    instances = await source.list_instances()
    staging = next(i for i in instances if i.name == "staging")
    assert staging.active is True


async def test_set_active_instance_sets_fallback_active_and_clears_primary_active_markers(
    tmp_path: Path,
) -> None:
    default_config_path = tmp_path / "shared.dw.json"
    dw_json_path = tmp_path / "dw.json"
    _write_json(dw_json_path, {"configs": [{"name": "local", "hostname": "local.demandware.net", "active": True}]})
    _write_json(default_config_path, {"configs": [{"name": "global", "hostname": "global.demandware.net"}]})
    source = DwJsonSource()

    await source.set_active_instance("global", ResolveConfigOptions(default_config_path=str(default_config_path)))
    resolver = ConfigResolver()
    result = await resolver.resolve(options=ResolveConfigOptions(default_config_path=str(default_config_path)))

    saved = json.loads(dw_json_path.read_text(encoding="utf-8"))
    assert saved["configs"][0]["active"] is False
    assert result.config.hostname == "global.demandware.net"


# --- MobifySource ---------------------------------------------------------------


async def test_mobify_loads_mrt_api_key_from_credentials_file_path(tmp_path: Path) -> None:
    mobify_path = tmp_path / ".mobify"
    _write_json(mobify_path, {"username": "user@example.com", "api_key": "test-api-key"})

    resolver = ConfigResolver()
    result = await resolver.resolve(options=ResolveConfigOptions(credentials_file=str(mobify_path)))

    assert result.config.mrt_api_key == "test-api-key"


async def test_mobify_returns_none_when_credentials_file_does_not_exist(tmp_path: Path) -> None:
    resolver = ConfigResolver()
    result = await resolver.resolve(options=ResolveConfigOptions(credentials_file=str(tmp_path / ".mobify-missing")))

    assert result.config.mrt_api_key is None


async def test_mobify_returns_none_when_api_key_missing(tmp_path: Path) -> None:
    mobify_path = tmp_path / ".mobify"
    _write_json(mobify_path, {"username": "user@example.com"})

    resolver = ConfigResolver()
    result = await resolver.resolve(options=ResolveConfigOptions(credentials_file=str(mobify_path)))

    assert result.config.mrt_api_key is None


async def test_mobify_handles_cloud_origin_suffixed_credentials_file(tmp_path: Path) -> None:
    mobify_path = tmp_path / ".mobify--example.com"
    _write_json(mobify_path, {"api_key": "cloud-api-key"})

    resolver = ConfigResolver()
    result = await resolver.resolve(
        options=ResolveConfigOptions(credentials_file=str(mobify_path), cloud_origin="https://example.com")
    )

    assert result.config.mrt_api_key == "cloud-api-key"


async def test_mobify_creates_source_error_warning_for_invalid_json(tmp_path: Path) -> None:
    mobify_path = tmp_path / ".mobify"
    mobify_path.write_text("invalid json", encoding="utf-8")

    resolver = ConfigResolver()
    result = await resolver.resolve(options=ResolveConfigOptions(credentials_file=str(mobify_path)))

    assert result.config.mrt_api_key is None
    source_error = next((w for w in result.warnings if w.code == "SOURCE_ERROR" and "MobifySource" in w.message), None)
    assert source_error is not None
    assert "Failed to load configuration" in source_error.message


async def test_mobify_provides_location_from_load_result(tmp_path: Path) -> None:
    mobify_path = tmp_path / ".mobify"
    _write_json(mobify_path, {"api_key": "test-api-key"})

    resolver = ConfigResolver()
    result = await resolver.resolve(options=ResolveConfigOptions(credentials_file=str(mobify_path)))

    mobify_source = next(s for s in result.sources if s.name == "MobifySource")
    assert mobify_source.location is not None
    assert os.path.realpath(mobify_source.location) == os.path.realpath(str(mobify_path))


# --- PackageJsonSource -----------------------------------------------------------


async def test_package_json_loads_allowed_fields_from_b2c_key(tmp_path: Path) -> None:
    _write_json(
        tmp_path / "package.json",
        {
            "name": "test-project",
            "b2c": {
                "shortCode": "abc123",
                "clientId": "test-client-id",
                "siteId": "RefArch",
                "mrtProject": "my-project",
                "mrtOrigin": "https://custom.cloud.com",
                "accountManagerHost": "account.demandware.com",
                "importSetExclude": ["fixtures", "test/integration"],
            },
        },
    )

    resolver = ConfigResolver()
    result = await resolver.resolve()

    assert result.config.short_code == "abc123"
    assert result.config.client_id == "test-client-id"
    assert result.config.site_id == "RefArch"
    assert result.config.mrt_project == "my-project"
    assert result.config.mrt_origin == "https://custom.cloud.com"
    assert result.config.account_manager_host == "account.demandware.com"
    assert result.config.import_set_exclude == ["fixtures", "test/integration"]


async def test_package_json_loads_libraries_as_string_array(tmp_path: Path) -> None:
    _write_json(tmp_path / "package.json", {"name": "test-project", "b2c": {"libraries": ["RefArch", "OtherLib"]}})

    resolver = ConfigResolver()
    result = await resolver.resolve()

    assert result.config.libraries == ["RefArch", "OtherLib"]


async def test_package_json_loads_libraries_with_site_library_entries(tmp_path: Path) -> None:
    _write_json(
        tmp_path / "package.json",
        {"name": "test-project", "b2c": {"libraries": ["RefArch", {"id": "homepage", "siteLibrary": True}]}},
    )

    resolver = ConfigResolver()
    result = await resolver.resolve()

    assert result.config.libraries == ["RefArch", {"id": "homepage", "siteLibrary": True}]


async def test_package_json_ignores_sensitive_instance_specific_fields(tmp_path: Path) -> None:
    _write_json(
        tmp_path / "package.json",
        {
            "name": "test-project",
            "b2c": {
                "shortCode": "abc123",
                "hostname": "should-be-ignored.demandware.net",
                "password": "secret-password",
                "clientSecret": "secret-client-secret",
                "username": "secret-user",
                "mrtApiKey": "secret-api-key",
            },
        },
    )

    source = PackageJsonSource()
    result = await source.load(ResolveConfigOptions(project_directory=str(tmp_path)))

    assert result is not None
    assert result.config.short_code == "abc123"
    assert result.config.hostname is None
    assert result.config.password is None
    assert result.config.client_secret is None
    assert result.config.username is None
    assert result.config.mrt_api_key is None


async def test_package_json_returns_none_when_file_does_not_exist() -> None:
    resolver = ConfigResolver()
    result = await resolver.resolve()

    package_json_source = next((s for s in result.sources if s.name == "PackageJsonSource"), None)
    assert package_json_source is None


async def test_package_json_returns_none_when_b2c_key_missing(tmp_path: Path) -> None:
    _write_json(tmp_path / "package.json", {"name": "test-project"})

    resolver = ConfigResolver()
    result = await resolver.resolve()

    package_json_source = next((s for s in result.sources if s.name == "PackageJsonSource"), None)
    assert package_json_source is None


async def test_package_json_returns_none_when_b2c_key_has_only_disallowed_fields(tmp_path: Path) -> None:
    _write_json(
        tmp_path / "package.json",
        {"name": "test-project", "b2c": {"hostname": "should-be-ignored.demandware.net", "password": "secret"}},
    )

    resolver = ConfigResolver()
    result = await resolver.resolve()

    package_json_source = next((s for s in result.sources if s.name == "PackageJsonSource"), None)
    assert package_json_source is None


async def test_package_json_has_lowest_priority_and_does_not_override_other_sources(tmp_path: Path) -> None:
    _write_json(
        tmp_path / "dw.json",
        {"hostname": "test.demandware.net", "client-id": "dw-client-id", "shortCode": "dw-short-code"},
    )
    _write_json(
        tmp_path / "package.json",
        {
            "name": "test-project",
            "b2c": {
                "clientId": "package-client-id",
                "shortCode": "package-short-code",
                "mrtProject": "package-project",
            },
        },
    )

    resolver = ConfigResolver()
    result = await resolver.resolve()

    assert result.config.client_id == "dw-client-id"
    assert result.config.short_code == "dw-short-code"
    assert result.config.mrt_project == "package-project"


async def test_package_json_provides_location_from_load_result(tmp_path: Path) -> None:
    package_json_path = tmp_path / "package.json"
    _write_json(package_json_path, {"name": "test-project", "b2c": {"shortCode": "abc123"}})

    resolver = ConfigResolver()
    result = await resolver.resolve()

    package_json_source = next(s for s in result.sources if s.name == "PackageJsonSource")
    assert package_json_source.location is not None
    assert os.path.realpath(package_json_source.location) == os.path.realpath(str(package_json_path))


async def test_package_json_accepts_kebab_case_fields_and_normalizes_to_camel_case(tmp_path: Path) -> None:
    _write_json(
        tmp_path / "package.json",
        {
            "name": "test-project",
            "b2c": {
                "short-code": "abc123",
                "client-id": "test-client-id",
                "site-id": "RefArch",
                "mrt-project": "my-project",
                "account-manager-host": "account.demandware.com",
                "sandbox-api-host": "admin.dx.commercecloud.salesforce.com",
            },
        },
    )

    source = PackageJsonSource()
    result = await source.load(ResolveConfigOptions(project_directory=str(tmp_path)))

    assert result is not None
    assert result.config.short_code == "abc123"
    assert result.config.client_id == "test-client-id"
    assert result.config.site_id == "RefArch"
    assert result.config.mrt_project == "my-project"
    assert result.config.account_manager_host == "account.demandware.com"
    assert result.config.sandbox_api_host == "admin.dx.commercecloud.salesforce.com"


async def test_package_json_rejects_disallowed_fields_even_in_kebab_case(tmp_path: Path) -> None:
    _write_json(
        tmp_path / "package.json",
        {
            "name": "test-project",
            "b2c": {"short-code": "abc123", "password": "secret", "client-secret": "secret"},
        },
    )

    source = PackageJsonSource()
    result = await source.load(ResolveConfigOptions(project_directory=str(tmp_path)))

    assert result is not None
    assert result.config.short_code == "abc123"
    assert result.config.password is None
    assert result.config.client_secret is None


async def test_package_json_handles_invalid_json_gracefully(tmp_path: Path) -> None:
    (tmp_path / "package.json").write_text("invalid json", encoding="utf-8")

    resolver = ConfigResolver()
    result = await resolver.resolve()

    package_json_source = next((s for s in result.sources if s.name == "PackageJsonSource"), None)
    assert package_json_source is None
