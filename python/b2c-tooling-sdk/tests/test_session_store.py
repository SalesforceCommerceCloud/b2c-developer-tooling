# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the shared auth-session store (cross-tool parity with the B2C CLI)."""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

import pytest

from b2c_tooling_sdk.auth.session_store import (
    AuthSession,
    FileAuthSessionBackend,
    InMemoryAuthSessionBackend,
    clear_all_auth_sessions,
    delete_auth_session,
    find_auth_session,
    get_default_data_dir,
    is_auth_session_token_valid,
    list_auth_sessions,
    save_auth_session,
    set_auth_session_backend,
)
from tests.helpers.jwt import make_jwt

_SESSION_FILE = "auth-sessions.json"


@pytest.fixture
def file_store(tmp_path: Path) -> Path:
    """Install a file-backed store rooted at a temp dir; return the dir."""
    data_dir = tmp_path / "store"
    set_auth_session_backend(FileAuthSessionBackend(data_dir))
    return data_dir


# --- Parity: read a file written in the TypeScript SDK's exact format ---------


def test_reads_ts_format_fixture(file_store: Path) -> None:
    file_store.mkdir(parents=True, exist_ok=True)
    ts_written = {
        "version": 1,
        "sessions": [
            {
                "clientId": "abc-123",
                "flow": "pkce",
                "accessToken": "tok",
                "refreshToken": "refresh",
                "sub": "user@example.com",
                "expiresAt": "2099-01-01T00:00:00.000Z",
                "scopes": ["sfcc.jobs"],
                "accountManagerHost": "account.demandware.com",
                "lastUsedAt": "2025-01-01T00:00:00.000Z",
            }
        ],
    }
    (file_store / _SESSION_FILE).write_text(json.dumps(ts_written, indent=2), encoding="utf-8")

    session = find_auth_session("abc-123")
    assert session is not None
    assert session.flow == "pkce"
    assert session.access_token == "tok"
    assert session.refresh_token == "refresh"
    assert session.sub == "user@example.com"
    assert session.scopes == ["sfcc.jobs"]
    assert session.account_manager_host == "account.demandware.com"


def test_writes_camel_case_keys(file_store: Path) -> None:
    save_auth_session(
        AuthSession(
            client_id="c1",
            flow="client-credentials",
            access_token="tok",
            scopes=["a"],
        )
    )
    on_disk = json.loads((file_store / _SESSION_FILE).read_text(encoding="utf-8"))
    assert on_disk["version"] == 1
    entry = on_disk["sessions"][0]
    assert entry["clientId"] == "c1"
    assert entry["accessToken"] == "tok"
    assert "lastUsedAt" in entry
    # None-valued fields are omitted, matching JSON.stringify behavior.
    assert "refreshToken" not in entry
    assert "sub" not in entry


def test_round_trip_preserves_fields(file_store: Path) -> None:
    original = AuthSession(
        client_id="c2",
        flow="pkce",
        access_token="tok",
        refresh_token="r",
        sub="s",
        expires_at="2099-01-01T00:00:00.000Z",
        scopes=["x", "y"],
        account_manager_host="account.demandware.com",
    )
    save_auth_session(original)
    loaded = find_auth_session("c2")
    assert loaded is not None
    assert loaded.refresh_token == "r"
    assert loaded.scopes == ["x", "y"]


# --- CRUD semantics -----------------------------------------------------------


def test_save_replaces_same_client(file_store: Path) -> None:
    save_auth_session(AuthSession(client_id="c", flow="pkce", access_token="one"))
    save_auth_session(AuthSession(client_id="c", flow="pkce", access_token="two"))
    sessions = list_auth_sessions()
    assert len(sessions) == 1
    assert sessions[0].access_token == "two"


def test_multiple_clients_coexist(file_store: Path) -> None:
    save_auth_session(AuthSession(client_id="a", flow="pkce", access_token="1"))
    save_auth_session(AuthSession(client_id="b", flow="implicit", access_token="2"))
    assert len(list_auth_sessions()) == 2


def test_delete_session(file_store: Path) -> None:
    save_auth_session(AuthSession(client_id="a", flow="pkce", access_token="1"))
    delete_auth_session("a")
    assert find_auth_session("a") is None


def test_save_stamps_last_used_at(file_store: Path) -> None:
    save_auth_session(AuthSession(client_id="a", flow="pkce", access_token="1"))
    session = find_auth_session("a")
    assert session is not None
    assert session.last_used_at is not None
    assert session.last_used_at.endswith("Z")


def test_find_missing_returns_none(file_store: Path) -> None:
    assert find_auth_session("nope") is None


def test_corrupt_file_is_non_fatal(file_store: Path) -> None:
    file_store.mkdir(parents=True, exist_ok=True)
    (file_store / _SESSION_FILE).write_text("{ not json", encoding="utf-8")
    assert list_auth_sessions() == []


# --- File security & atomicity ------------------------------------------------


@pytest.mark.skipif(sys.platform == "win32", reason="POSIX permission bits")
def test_file_and_dir_permissions(file_store: Path) -> None:
    save_auth_session(AuthSession(client_id="a", flow="pkce", access_token="1"))
    dir_mode = os.stat(file_store).st_mode & 0o777
    file_mode = os.stat(file_store / _SESSION_FILE).st_mode & 0o777
    assert dir_mode == 0o700
    assert file_mode == 0o600


def test_no_temp_files_left_behind(file_store: Path) -> None:
    save_auth_session(AuthSession(client_id="a", flow="pkce", access_token="1"))
    leftovers = [p.name for p in file_store.iterdir() if p.name != _SESSION_FILE]
    assert leftovers == []


def test_clear_all_removes_file_and_legacy(file_store: Path) -> None:
    file_store.mkdir(parents=True, exist_ok=True)
    save_auth_session(AuthSession(client_id="a", flow="pkce", access_token="1"))
    legacy = file_store / "auth-session.json"
    legacy.write_text("{}", encoding="utf-8")
    clear_all_auth_sessions()
    assert not (file_store / _SESSION_FILE).exists()
    assert not legacy.exists()


# --- In-memory backend --------------------------------------------------------


def test_in_memory_backend() -> None:
    backend = InMemoryAuthSessionBackend()
    set_auth_session_backend(backend)
    save_auth_session(AuthSession(client_id="a", flow="pkce", access_token="1"))
    assert find_auth_session("a") is not None
    clear_all_auth_sessions()
    assert find_auth_session("a") is None


# --- Data-dir resolution ------------------------------------------------------


def test_default_data_dir_posix_default() -> None:
    """No env overrides: oclif uses ``~/.local/share/b2c`` on macOS *and* Linux."""
    for plat in ("darwin", "linux"):
        result = get_default_data_dir(environment={}, home_directory="/home/tester", platform=plat)
        assert result == Path("/home/tester/.local/share/b2c")


def test_default_data_dir_honors_xdg_data_home() -> None:
    """``XDG_DATA_HOME`` wins on every platform, with ``/b2c`` appended."""
    for plat in ("darwin", "linux", "win32"):
        result = get_default_data_dir(
            environment={"XDG_DATA_HOME": "/xdg/data"}, home_directory="/home/tester", platform=plat
        )
        assert result == Path("/xdg/data/b2c")


def test_default_data_dir_windows_uses_localappdata() -> None:
    result = get_default_data_dir(
        environment={"LOCALAPPDATA": "/c/AppData/Local"}, home_directory="/home/tester", platform="win32"
    )
    assert result == Path("/c/AppData/Local/b2c")


def test_default_data_dir_b2c_data_dir_override() -> None:
    result = get_default_data_dir(
        environment={"B2C_DATA_DIR": "/custom/base"}, home_directory="/home/tester", platform="darwin"
    )
    assert result == Path("/custom/base/b2c")


def test_default_data_dir_explicit_argument_wins() -> None:
    result = get_default_data_dir(
        data_directory="/explicit/dir", environment={"XDG_DATA_HOME": "/xdg"}, platform="linux"
    )
    assert result == Path("/explicit/dir").resolve()


# --- Token validity -----------------------------------------------------------


def test_is_auth_session_token_valid_true() -> None:
    session = AuthSession(
        client_id="c",
        flow="pkce",
        access_token=make_jwt(expires_in=3600, scope="sfcc.jobs"),
    )
    assert is_auth_session_token_valid(session, ["sfcc.jobs"]) is True


def test_is_auth_session_token_valid_expired() -> None:
    session = AuthSession(client_id="c", flow="pkce", access_token=make_jwt(exp=int(time.time()) - 10))
    assert is_auth_session_token_valid(session) is False


def test_is_auth_session_token_valid_client_mismatch() -> None:
    session = AuthSession(client_id="c", flow="pkce", access_token=make_jwt(expires_in=3600))
    assert is_auth_session_token_valid(session, required_client_id="other") is False


def test_is_auth_session_token_valid_non_jwt() -> None:
    session = AuthSession(client_id="c", flow="client-credentials", access_token="opaque")
    assert is_auth_session_token_valid(session) is False
