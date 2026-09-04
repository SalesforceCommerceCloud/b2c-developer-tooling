# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Persistent auth-session store, shared with the B2C CLI / TypeScript SDK.

This reads and writes the **same** ``auth-sessions.json`` file as
``src/auth/session-store.ts``, in the same oclif *data* directory for the
``@salesforce/b2c-cli`` application. A token minted by ``b2c auth login`` is
therefore usable from Python and vice-versa.

- ``auth login`` / PKCE — stores access + refresh tokens.
- Implicit (legacy) — stores access token only.
- ``auth client`` — stores access token only; the client secret is NEVER
  persisted and client-credentials sessions do not auto-renew.

Sessions are keyed by ``client_id``, one record per client. Backends are
pluggable via :class:`AuthSessionBackend`; the default is
:class:`FileAuthSessionBackend`.
"""

from __future__ import annotations

import contextlib
import json
import os
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal, Protocol

from b2c_tooling_sdk.auth.jwt_utils import DEFAULT_EXPIRY_BUFFER_SEC, decode_jwt_token_info
from b2c_tooling_sdk.logging import get_logger

_SESSION_FILE = "auth-sessions.json"
#: Pre-PKCE stateful store; may contain base64-encoded client renewal credentials.
_LEGACY_SESSION_FILE = "auth-session.json"

_APP_NAME = "@salesforce/b2c-cli"

#: The auth flow that produced a stored session.
AuthSessionFlow = Literal["pkce", "implicit", "client-credentials"]

# Maps snake_case dataclass fields to the camelCase JSON keys the TS SDK uses.
_FIELD_TO_JSON = {
    "client_id": "clientId",
    "flow": "flow",
    "pkce_unsupported": "pkceUnsupported",
    "access_token": "accessToken",
    "refresh_token": "refreshToken",
    "sub": "sub",
    "expires_at": "expiresAt",
    "scopes": "scopes",
    "account_manager_host": "accountManagerHost",
    "last_used_at": "lastUsedAt",
}
_JSON_TO_FIELD = {v: k for k, v in _FIELD_TO_JSON.items()}


@dataclass
class AuthSession:
    """One persisted authentication session, keyed by :attr:`client_id`.

    Field names are snake_case in Python but serialize to the camelCase keys the
    TypeScript SDK writes (``clientId``, ``accessToken``, ``refreshToken``, ...).
    """

    client_id: str
    flow: AuthSessionFlow
    access_token: str
    pkce_unsupported: bool | None = None
    refresh_token: str | None = None
    sub: str | None = None
    expires_at: str | None = None
    scopes: list[str] | None = None
    account_manager_host: str | None = None
    last_used_at: str | None = None

    def to_json(self) -> dict[str, Any]:
        """Serialize to a dict with camelCase keys, omitting ``None`` fields (matching JSON.stringify)."""
        out: dict[str, Any] = {}
        for py_field, json_key in _FIELD_TO_JSON.items():
            value = getattr(self, py_field)
            if value is not None:
                out[json_key] = value
        return out

    @classmethod
    def from_json(cls, data: dict[str, Any]) -> AuthSession:
        """Build an :class:`AuthSession` from a camelCase dict written by any backend."""
        kwargs: dict[str, Any] = {}
        for json_key, value in data.items():
            field_name = _JSON_TO_FIELD.get(json_key)
            if field_name is not None:
                kwargs[field_name] = value
        return cls(**kwargs)


class AuthSessionBackend(Protocol):
    """Pluggable backend for the auth-session store."""

    def find(self, client_id: str) -> AuthSession | None: ...

    def save(self, session: AuthSession) -> None: ...

    def delete(self, client_id: str) -> None: ...

    def list(self) -> list[AuthSession]: ...

    def clear_all(self) -> None: ...


def _now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat().replace("+00:00", "Z")


def get_default_data_dir() -> Path:
    """Compute the oclif-compatible *data* directory for ``@salesforce/b2c-cli``.

    Matches ``getDefaultDataDir`` in ``session-store.ts`` exactly:

    - macOS: ``~/Library/Application Support/@salesforce/b2c-cli``
    - Windows: ``%LOCALAPPDATA%\\@salesforce\\b2c-cli``
    - Linux/other: ``$XDG_DATA_HOME/@salesforce/b2c-cli`` (fallback ``~/.local/share``)
    """
    home = Path.home()
    if sys.platform == "darwin":
        return home / "Library" / "Application Support" / _APP_NAME
    if sys.platform == "win32":
        base = os.environ.get("LOCALAPPDATA") or str(home / "AppData" / "Local")
        return Path(base) / _APP_NAME
    base = os.environ.get("XDG_DATA_HOME") or str(home / ".local" / "share")
    return Path(base) / _APP_NAME


@dataclass
class FileAuthSessionBackend:
    """Default JSON-file backend at ``<data dir>/auth-sessions.json``.

    Writes atomically via a temp file + rename, with the directory created
    ``0o700`` and the file written ``0o600`` (matching the TS backend, since the
    file holds long-lived PKCE refresh tokens).
    """

    data_dir: Path

    def __post_init__(self) -> None:
        self.data_dir = Path(self.data_dir)

    def _file_path(self) -> Path:
        return self.data_dir / _SESSION_FILE

    def _read(self) -> list[AuthSession]:
        path = self._file_path()
        if not path.exists():
            return []
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception as error:  # noqa: BLE001 - corrupt file is non-fatal
            get_logger("auth.session_store").debug("Failed to read store %s: %s", path, error)
            return []
        sessions = data.get("sessions") if isinstance(data, dict) else None
        if not isinstance(sessions, list):
            return []
        return [AuthSession.from_json(s) for s in sessions if isinstance(s, dict)]

    def _write(self, sessions: list[AuthSession]) -> None:
        if not self.data_dir.exists():
            self.data_dir.mkdir(parents=True, exist_ok=True)
            # Best-effort: chmod is a no-op / may fail on non-POSIX filesystems.
            with contextlib.suppress(OSError):
                os.chmod(self.data_dir, 0o700)
        store = {"version": 1, "sessions": [s.to_json() for s in sessions]}
        tmp_path = self.data_dir / f"{_SESSION_FILE}.{os.getpid()}.{time.time_ns()}.tmp"
        # JSON.stringify(store, null, 2) — 2-space indent, no trailing newline.
        tmp_path.write_text(json.dumps(store, indent=2), encoding="utf-8")
        with contextlib.suppress(OSError):
            os.chmod(tmp_path, 0o600)
        os.replace(tmp_path, self._file_path())

    def find(self, client_id: str) -> AuthSession | None:
        return next((s for s in self._read() if s.client_id == client_id), None)

    def save(self, session: AuthSession) -> None:
        sessions = self._read()
        session.last_used_at = _now_iso()
        for i, existing in enumerate(sessions):
            if existing.client_id == session.client_id:
                sessions[i] = session
                break
        else:
            sessions.append(session)
        self._write(sessions)

    def delete(self, client_id: str) -> None:
        sessions = self._read()
        remaining = [s for s in sessions if s.client_id != client_id]
        if len(remaining) != len(sessions):
            self._write(remaining)

    def list(self) -> list[AuthSession]:
        return self._read()

    def clear_all(self) -> None:
        # Remove both the current multi-session store and the pre-PKCE single-session
        # file (which may contain client renewal credentials).
        failures: list[str] = []
        for path in (self._file_path(), self.data_dir / _LEGACY_SESSION_FILE):
            if not path.exists():
                continue
            try:
                path.unlink()
            except OSError as error:
                get_logger("auth.session_store").error("Failed to remove session file %s: %s", path, error)
                failures.append(str(path))
        if failures:
            raise RuntimeError(f"Failed to remove stored authentication data: {', '.join(failures)}")


@dataclass
class InMemoryAuthSessionBackend:
    """In-memory backend, useful for tests and IDE adapters."""

    _sessions: dict[str, AuthSession] = field(default_factory=dict)

    def find(self, client_id: str) -> AuthSession | None:
        return self._sessions.get(client_id)

    def save(self, session: AuthSession) -> None:
        session.last_used_at = _now_iso()
        self._sessions[session.client_id] = session

    def delete(self, client_id: str) -> None:
        self._sessions.pop(client_id, None)

    def list(self) -> list[AuthSession]:
        return list(self._sessions.values())

    def clear_all(self) -> None:
        self._sessions.clear()


_active_backend: AuthSessionBackend | None = None


def _get_backend() -> AuthSessionBackend:
    global _active_backend
    if _active_backend is None:
        _active_backend = FileAuthSessionBackend(get_default_data_dir())
    return _active_backend


def set_auth_session_backend(backend: AuthSessionBackend | None) -> None:
    """Register an auth-session backend. Pass ``None`` to fall back to the file backend."""
    global _active_backend
    _active_backend = backend


def get_auth_session_backend() -> AuthSessionBackend:
    """Return the active backend (lazily creating the file-backed default)."""
    return _get_backend()


def initialize_file_auth_session_store(data_dir: str | os.PathLike[str]) -> None:
    """Install a :class:`FileAuthSessionBackend` pointed at ``data_dir``."""
    set_auth_session_backend(FileAuthSessionBackend(Path(data_dir)))


def find_auth_session(client_id: str) -> AuthSession | None:
    """Read the stored session for ``client_id`` (or ``None``)."""
    return _get_backend().find(client_id)


def save_auth_session(session: AuthSession) -> None:
    """Write a session, replacing any prior record for the same ``client_id``."""
    _get_backend().save(session)


def delete_auth_session(client_id: str) -> None:
    """Delete the session for ``client_id``."""
    _get_backend().delete(client_id)


def list_auth_sessions() -> list[AuthSession]:
    """List all stored sessions (for diagnostics)."""
    return _get_backend().list()


def clear_all_auth_sessions() -> None:
    """Remove every stored session. Used by ``auth logout``."""
    _get_backend().clear_all()


def is_auth_session_token_valid(
    session: AuthSession,
    required_scopes: list[str] | None = None,
    expiry_buffer_sec: int = DEFAULT_EXPIRY_BUFFER_SEC,
    required_client_id: str | None = None,
) -> bool:
    """Return ``True`` if the session's access token is present, unexpired, and in-scope.

    Performs no network calls — validity is derived from the JWT ``exp``/``scope``.
    """
    logger = get_logger("auth.session_store")
    required_scopes = required_scopes or []
    if required_client_id and session.client_id != required_client_id:
        logger.debug("Token client ID mismatch: %s != %s", session.client_id, required_client_id)
        return False
    try:
        expires, scopes = decode_jwt_token_info(session.access_token)
    except Exception:
        logger.debug("Token invalid (e.g. not a JWT)")
        return False
    exp_sec = int(expires.timestamp())
    if exp_sec == 0:
        logger.debug("Token has no exp claim; treating as invalid")
        return False
    now_sec = int(time.time())
    if now_sec >= exp_sec - expiry_buffer_sec:
        logger.debug("Token missing or expired")
        return False
    if required_scopes and not all(s in scopes for s in required_scopes):
        logger.debug("Token missing required scopes")
        return False
    return True


def reset_auth_session_store_for_testing() -> None:
    """Reset the active backend (tests). The next call falls back to the file default."""
    global _active_backend
    _active_backend = None


__all__ = [
    "AuthSession",
    "AuthSessionFlow",
    "AuthSessionBackend",
    "FileAuthSessionBackend",
    "InMemoryAuthSessionBackend",
    "get_default_data_dir",
    "set_auth_session_backend",
    "get_auth_session_backend",
    "initialize_file_auth_session_store",
    "find_auth_session",
    "save_auth_session",
    "delete_auth_session",
    "list_auth_sessions",
    "clear_all_auth_sessions",
    "is_auth_session_token_valid",
    "reset_auth_session_store_for_testing",
]
