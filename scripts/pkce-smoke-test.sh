#!/usr/bin/env bash
#
# pkce-smoke-test.sh — interactive smoke test for the implicit→PKCE auth migration.
#
# Walks you through manual, browser-based login scenarios and runs the b2c CLI on
# your behalf. Covers BOTH new functionality (PKCE happy path, PKCE→implicit
# fallback, 0600 session hardening, silent refresh) AND old functionality that
# must still work (explicit implicit flow, client-credentials, JWT, default
# public-client user auth, logout).
#
# See SMOKE-TEST.md (repo root) for what each scenario proves and what to look for.
#
# ─────────────────────────────────────────────────────────────────────────────
# SAFETY
#   • Sessions are isolated into a throwaway temp dir via B2C_TEST_DATA_DIR, so
#     your real ~/Library/Application Support/@salesforce/b2c-cli/auth-sessions.json
#     is NEVER touched. Set ISOLATE_SESSIONS=0 to use the real location instead.
#   • SFCC_CONFIG is unset and SFCC_PROJECT_DIRECTORY is pointed at an empty temp
#     dir so no ambient dw.json (yours or the repo's) leaks in.
#   • All SFCC_* flow-control vars are cleared at startup; each scenario sets only
#     what it needs.
#
# IMPORTANT: run from the WORKING TREE (default CLI=./cli, dev mode). The PKCE
# fallback wrapper is uncommitted — a checkout of HEAD has NO fallback.
#
# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION (override via environment, e.g. `PKCE_CLIENT_ID=... ./scripts/pkce-smoke-test.sh`)
#
#   PKCE_CLIENT_ID        Public (PKCE-capable) AM client id. Default: prod default a40a7a9b…
#   IMPLICIT_CLIENT_ID    An implicit-ONLY AM client id (for §4 fallback + §7 implicit).
#   CC_CLIENT_ID          Client-credentials client id (for §9/§10 + instance §14/§16).
#   CC_CLIENT_SECRET      Client-credentials secret.
#   JWT_CLIENT_ID         JWT Bearer client id (optional, §11).
#   JWT_CERT              Path to JWT cert PEM (optional).
#   JWT_KEY               Path to JWT private key PEM (optional).
#   AM_HOST               Account Manager host. Default: account.demandware.com
#
#   ── Default-client use cases (§8a/§8b): the built-in public client, NO --client-id ──
#   REALM                 Optional realm filter for `sandbox realm list` (§8a), e.g. zzpq.
#                         Unset → lists all your realms via ODS /me.
#   SLAS_TENANT_ID        SLAS tenant id for `slas client list` (§8b), e.g. zzpq_019. REQUIRED for §8b.
#   SLAS_SHORT_CODE       SCAPI short code for the SLAS admin host (§8b). REQUIRED for §8b.
#
#   ── Instance operations (§13–§20): exercise WebDAV + OCAPI on a real instance ──
#   INSTANCE_HOST         Target instance hostname (--server), e.g. zzzz-001.dx.commercecloud.salesforce.com.
#                         REQUIRED for all instance scenarios; if unset they are skipped.
#   INSTANCE_PKCE_CLIENT_ID  Public/PKCE client used for USER-auth instance ops. Default: $PKCE_CLIENT_ID.
#                         MUST have OCAPI Data API + WebDAV permissions ON THE INSTANCE, and the
#                         logged-in AM user must have instance access.
#                         (CC instance ops reuse CC_CLIENT_ID / CC_CLIENT_SECRET — same instance perms apply.)
#   WEBDAV_USERNAME       Business Manager user for the legacy Basic-auth WebDAV path (optional, §18).
#   WEBDAV_PASSWORD       BM password / WebDAV access key for Basic auth (optional, §18).
#   SELFSIGNED            1 = append --selfsigned (sandboxes with self-signed certs).
#   INSTANCE_EXTRA_ARGS   Extra flags appended to every instance command (e.g. "--no-verify").
#
#   CLI                   CLI invocation. Default: ./cli  (dev mode against source)
#   ISOLATE_SESSIONS      1 (default) = temp session dir; 0 = real CLI data dir.
#   LOG_LEVEL             SFCC log level. Default: debug (surfaces [Auth] Hydrated…/Login URL:/WARN).
#   AUTO                  1 = run all scenarios without the per-scenario menu.
#
set -u
set -o pipefail

# ── Defaults ─────────────────────────────────────────────────────────────────
DEFAULT_PUBLIC_CLIENT_ID="a40a7a9b-e854-4aa6-8078-d5f79872aa65"

PKCE_CLIENT_ID="${PKCE_CLIENT_ID:-$DEFAULT_PUBLIC_CLIENT_ID}"
IMPLICIT_CLIENT_ID="${IMPLICIT_CLIENT_ID:-}"
CC_CLIENT_ID="${CC_CLIENT_ID:-}"
CC_CLIENT_SECRET="${CC_CLIENT_SECRET:-}"
JWT_CLIENT_ID="${JWT_CLIENT_ID:-}"
JWT_CERT="${JWT_CERT:-}"
JWT_KEY="${JWT_KEY:-}"
AM_HOST="${AM_HOST:-account.demandware.com}"
ISOLATE_SESSIONS="${ISOLATE_SESSIONS:-1}"
LOG_LEVEL="${LOG_LEVEL:-debug}"
AUTO="${AUTO:-0}"

# Instance operation config
INSTANCE_HOST="${INSTANCE_HOST:-}"
INSTANCE_PKCE_CLIENT_ID="${INSTANCE_PKCE_CLIENT_ID:-$PKCE_CLIENT_ID}"
WEBDAV_USERNAME="${WEBDAV_USERNAME:-}"
WEBDAV_PASSWORD="${WEBDAV_PASSWORD:-}"
SELFSIGNED="${SELFSIGNED:-0}"
INSTANCE_EXTRA_ARGS="${INSTANCE_EXTRA_ARGS:-}"

# Default-client use cases (§8a/§8b): no --client-id, falls through to user/PKCE
# with the built-in public client. SLAS_TENANT_ID/SLAS_SHORT_CODE drive the SLAS
# admin list; REALM (optional) filters the sandbox realm list (omit to call ODS /me).
REALM="${REALM:-}"
SLAS_TENANT_ID="${SLAS_TENANT_ID:-}"
SLAS_SHORT_CODE="${SLAS_SHORT_CODE:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CLI="${CLI:-$REPO_ROOT/cli}"

# ── Pretty output ─────────────────────────────────────────────────────────────
if [ -t 1 ]; then
  BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; GRN=$'\033[32m'; YLW=$'\033[33m'; CYN=$'\033[36m'; RST=$'\033[0m'
else
  BOLD=""; DIM=""; RED=""; GRN=""; YLW=""; CYN=""; RST=""
fi

hr()      { printf '%s\n' "────────────────────────────────────────────────────────────────────────────"; }
title()   { echo; hr; printf '%s%s%s\n' "$BOLD" "$1" "$RST"; hr; }
info()    { printf '%s» %s%s\n' "$CYN" "$1" "$RST"; }
expect()  { printf '%s  EXPECT:%s %s\n' "$YLW" "$RST" "$1"; }
good()    { printf '%s✓ %s%s\n' "$GRN" "$1" "$RST"; }
bad()     { printf '%s✗ %s%s\n' "$RED" "$1" "$RST"; }
note()    { printf '%s  %s%s\n' "$DIM" "$1" "$RST"; }

# Run a CLI command, echoing it first. Does not abort on nonzero (auth flows
# legitimately fail in negative cases); returns the CLI's exit code.
run_cli() {
  printf '%s$ %s %s%s\n' "$DIM" "$(basename "$CLI")" "$*" "$RST"
  "$CLI" "$@"
  local rc=$?
  printf '%s  (exit %d)%s\n' "$DIM" "$rc" "$RST"
  return $rc
}

pause() {
  [ "$AUTO" = "1" ] && return 0
  printf '%s%s%s ' "$BOLD" "${1:-Press Enter to continue…}" "$RST"
  read -r _ || true
}

# Yes/no prompt; default No. Returns 0 for yes.
confirm() {
  [ "$AUTO" = "1" ] && return 0
  printf '%s%s [y/N]%s ' "$BOLD" "$1" "$RST"
  local ans; read -r ans || true
  case "$ans" in [yY]*) return 0 ;; *) return 1 ;; esac
}

need_var() {
  # need_var VARNAME "human description" → returns 1 (skip) if empty
  local val="${!1:-}"
  if [ -z "$val" ]; then
    bad "Scenario skipped: \$$1 is not set ($2)."
    note "Re-run with $1=... to exercise this scenario."
    return 1
  fi
  return 0
}

# Common instance flags (server + selfsigned + any extra args), emitted as words.
instance_base_flags() {
  printf -- '--server\n%s\n' "$INSTANCE_HOST"
  [ "$SELFSIGNED" = "1" ] && printf -- '--selfsigned\n'
  # shellcheck disable=SC2086
  for a in $INSTANCE_EXTRA_ARGS; do printf '%s\n' "$a"; done
}

# Auth flags for an instance command. $1 = user|cc.
#   user → --user-auth --client-id <INSTANCE_PKCE_CLIENT_ID>  (forces PKCE/user token; no secret)
#   cc   → --client-id <CC_CLIENT_ID> --client-secret <CC_CLIENT_SECRET>  (client-credentials)
instance_auth_flags() {
  case "$1" in
    user) printf -- '--user-auth\n--client-id\n%s\n' "$INSTANCE_PKCE_CLIENT_ID" ;;
    cc)   printf -- '--client-id\n%s\n--client-secret\n%s\n' "$CC_CLIENT_ID" "$CC_CLIENT_SECRET" ;;
  esac
}

# Read newline-delimited words into an array (portable; no mapfile dependency).
read_words() { local _l; ARR=(); while IFS= read -r _l; do [ -n "$_l" ] && ARR+=("$_l"); done; }

require_instance() {
  need_var INSTANCE_HOST "target instance hostname (--server)" || return 1
  return 0
}

show_session_file() {
  [ "$ISOLATE_SESSIONS" = "1" ] || { note "ISOLATE_SESSIONS=0 — session file is at the real CLI data dir."; return; }
  local f="$B2C_TEST_DATA_DIR/auth-sessions.json"
  if [ -f "$f" ]; then
    info "Session file: $f"
    ls -l "$f"
    if command -v jq >/dev/null 2>&1; then
      jq '.sessions[] | {clientId, flow, hasRefresh: (.refreshToken != null), sub, expiresAt}' "$f" 2>/dev/null || cat "$f"
    else
      cat "$f"; echo
    fi
  else
    note "No session file written yet at $f"
  fi
}

logout_all() {
  run_cli auth logout >/dev/null 2>&1 || true
}

# ── Environment isolation ─────────────────────────────────────────────────────
setup_env() {
  # Strip ambient config / flow-control vars so the host environment can't skew results.
  unset SFCC_CONFIG
  unset SFCC_CLIENT_ID SFCC_OAUTH_CLIENT_ID SFCC_CLIENT_SECRET SFCC_OAUTH_CLIENT_SECRET
  unset SFCC_AUTH_METHODS SFCC_OAUTH_SCOPES SFCC_JWT_CERT SFCC_JWT_KEY SFCC_JWT_PASSPHRASE
  unset SFCC_DISABLE_PKCE_FALLBACK SFCC_OAUTH_LOCAL_PORT SFCC_REDIRECT_URI SFCC_LOGIN_URL
  unset SFCC_INSTANCE

  export SFCC_LOG_LEVEL="$LOG_LEVEL"
  export SFCC_ACCOUNT_MANAGER_HOST="$AM_HOST"

  # Empty project dir → no dw.json discovery from cwd or the repo.
  PROJECT_TMP="$(mktemp -d "${TMPDIR:-/tmp}/pkce-smoke-proj.XXXXXX")"
  export SFCC_PROJECT_DIRECTORY="$PROJECT_TMP"

  if [ "$ISOLATE_SESSIONS" = "1" ]; then
    B2C_TEST_DATA_DIR="$(mktemp -d "${TMPDIR:-/tmp}/pkce-smoke-data.XXXXXX")"
    export B2C_TEST_DATA_DIR
  fi
}

cleanup() {
  echo
  title "Teardown"
  logout_all
  good "Cleared stored sessions (auth logout)."
  [ -n "${PROJECT_TMP:-}" ] && rm -rf "$PROJECT_TMP" 2>/dev/null && note "Removed temp project dir."
  if [ "$ISOLATE_SESSIONS" = "1" ] && [ -n "${B2C_TEST_DATA_DIR:-}" ]; then
    rm -rf "$B2C_TEST_DATA_DIR" 2>/dev/null && note "Removed temp session dir."
  fi
}
trap cleanup EXIT

# ─────────────────────────────────────────────────────────────────────────────
# SCENARIOS
# ─────────────────────────────────────────────────────────────────────────────

scenario_preflight() {
  title "Preflight — environment & build provenance"
  info "CLI:                $CLI"
  info "AM host:            $AM_HOST"
  info "PKCE client:        $PKCE_CLIENT_ID"
  info "Implicit client:    ${IMPLICIT_CLIENT_ID:-<unset>}"
  info "Client-creds:       ${CC_CLIENT_ID:+set}${CC_CLIENT_ID:-<unset>}"
  info "JWT client:         ${JWT_CLIENT_ID:-<unset>}"
  info "Realm (§8a):        ${REALM:-<unset — lists all via ODS /me>}"
  info "SLAS tenant (§8b):  ${SLAS_TENANT_ID:-<unset — §8b skipped>}"
  info "SLAS short code:    ${SLAS_SHORT_CODE:-<unset — §8b skipped>}"
  info "Instance host:      ${INSTANCE_HOST:-<unset — §13–§20 skipped>}"
  info "Instance PKCE clnt: ${INSTANCE_PKCE_CLIENT_ID:-<unset>}"
  info "WebDAV Basic user:  ${WEBDAV_USERNAME:-<unset — §18 skipped>}"
  info "Self-signed certs:  $SELFSIGNED"
  info "Isolated sessions:  $ISOLATE_SESSIONS  ${B2C_TEST_DATA_DIR:+($B2C_TEST_DATA_DIR)}"
  info "Project dir:        $SFCC_PROJECT_DIRECTORY (empty)"
  info "SFCC_CONFIG:        ${SFCC_CONFIG:-<unset, good>}"
  info "Log level:          $SFCC_LOG_LEVEL"
  echo
  note "Build provenance: confirm '$(basename "$CLI")' runs the WORKING TREE."
  note "The PKCE fallback wrapper is uncommitted; a checkout of HEAD has no fallback."
  if [ "$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null)" = "feature/pkce-support" ]; then
    good "On branch feature/pkce-support."
  else
    bad "Not on feature/pkce-support — verify you intend this."
  fi
  run_cli --version || true
}

scenario_1_pkce_happy() {
  title "§1 — PKCE happy path (the core change)"
  logout_all
  info "Will open a browser for Authorization Code + PKCE login."
  expect "Browser URL contains response_type=code AND code_challenge_method=S256 (see 'Login URL:' debug line)."
  expect "Browser page: 'Authentication successful! You may close this browser window…'."
  expect "Terminal: 'Login succeeded. Session saved for stateful auth.'  (NO implicit-deprecation warning)"
  pause "Press Enter to launch the PKCE login…"
  run_cli auth login "$PKCE_CLIENT_ID"
  echo
  expect "Session record below: flow = 'pkce', hasRefresh = true."
  show_session_file
}

scenario_2_silent_refresh() {
  title "§2 — Silent refresh, no second browser (H4)"

  # 2a — Immediately after §1 the just-minted access token is still valid, so a
  # fresh process returns it straight from hydration (the early cached-hit branch
  # in getTokenResponse) with NO network call. This proves persistence+hydration
  # only — it does NOT exercise the refresh_token grant. 2b forces the real refresh.
  info "2a) Cached hit: a fresh process returns the still-valid token via hydration (NO refresh)."
  expect "No browser; debug line '[Auth] Hydrated PKCE session from store'; a token prints."
  note  "This is hydration only — the token is still fresh, so the refresh branch is never reached."
  pause "Press Enter to read the token again (expected: cached hit)…"
  run_cli auth token --client-id "$PKCE_CLIENT_ID"

  # 2b — The actual H4 test: make the stored access token stale while KEEPING the
  # refresh token, so the next call must take the refresh_token grant path.
  echo
  info "2b) Force-stale the access token (keep the refresh token) → real refresh_token grant."
  if [ "$ISOLATE_SESSIONS" != "1" ]; then
    bad "Skipped: needs ISOLATE_SESSIONS=1 to safely edit the throwaway session file."; return
  fi
  if ! command -v jq >/dev/null 2>&1; then
    bad "Skipped: needs 'jq' to expire the stored access token in place."; return
  fi
  local f="$B2C_TEST_DATA_DIR/auth-sessions.json"
  if [ ! -f "$f" ]; then
    bad "No session file yet — run §1 (PKCE login) first."; return
  fi
  local has_refresh old_token
  has_refresh=$(jq -r --arg c "$PKCE_CLIENT_ID" '.sessions[]|select(.clientId==$c)|(.refreshToken!=null)' "$f" 2>/dev/null)
  if [ "$has_refresh" != "true" ]; then
    bad "No stored refresh token for $PKCE_CLIENT_ID — run §1 (PKCE login) first."; return
  fi
  old_token=$(jq -r --arg c "$PKCE_CLIENT_ID" '.sessions[]|select(.clientId==$c)|.accessToken' "$f" 2>/dev/null)
  # Expire ONLY the recorded expiry; leave accessToken + refreshToken untouched.
  if jq --arg c "$PKCE_CLIENT_ID" \
        '(.sessions[]|select(.clientId==$c)|.expiresAt)="2000-01-01T00:00:00.000Z"' \
        "$f" > "$f.tmp" 2>/dev/null && mv "$f.tmp" "$f"; then
    chmod 600 "$f" 2>/dev/null || true
    good "Set expiresAt to a past timestamp (refresh token preserved)."
  else
    rm -f "$f.tmp" 2>/dev/null
    bad "Could not rewrite the session file with jq."; return
  fi
  expect "Debug shows BOTH '[Auth] Hydrated PKCE session from store' AND '[Auth] PKCE token refreshed silently'."
  expect "No browser opens; a token prints; the stored access token rotates."
  note  "If a browser opens here, refresh FAILED and it fell back to a full login — that's a regression."
  pause "Press Enter to trigger the silent refresh…"
  printf '%s$ %s auth token --client-id %s%s\n' "$DIM" "$(basename "$CLI")" "$PKCE_CLIENT_ID" "$RST"
  local out
  out="$("$CLI" auth token --client-id "$PKCE_CLIENT_ID" 2>&1)"
  printf '%s\n' "$out"
  echo
  if printf '%s' "$out" | grep -q 'PKCE token refreshed silently'; then
    good "Refresh confirmed — refresh_token grant ran ('[Auth] PKCE token refreshed silently')."
  else
    bad "No refresh observed — token wasn't stale, or refresh failed (would re-open the browser → regression)."
  fi
  local new_token
  new_token=$(jq -r --arg c "$PKCE_CLIENT_ID" '.sessions[]|select(.clientId==$c)|.accessToken' "$f" 2>/dev/null)
  if [ -n "$new_token" ] && [ "$new_token" != "$old_token" ]; then
    good "Stored access token rotated — a new token was minted and persisted."
  else
    bad "Stored access token unchanged — refresh did not persist a new token."
  fi
}

scenario_3_permissions() {
  title "§3 — Session file hardening (H3, POSIX)"
  if [ "$ISOLATE_SESSIONS" != "1" ]; then
    bad "Skipped: needs ISOLATE_SESSIONS=1 to inspect the temp session file safely."
    return
  fi
  if [ "$(uname -s)" = "Darwin" ] || [ "$(uname -s)" = "Linux" ]; then :; else
    bad "Skipped: mode bits are POSIX-only."; return
  fi
  local f="$B2C_TEST_DATA_DIR/auth-sessions.json"
  if [ ! -f "$f" ]; then
    bad "No session file yet — run §1 first."; return
  fi
  info "Current mode:"
  ls -ld "$B2C_TEST_DATA_DIR"; ls -l "$f"
  local dmode fmode
  dmode=$(stat -f '%Lp' "$B2C_TEST_DATA_DIR" 2>/dev/null || stat -c '%a' "$B2C_TEST_DATA_DIR")
  fmode=$(stat -f '%Lp' "$f" 2>/dev/null || stat -c '%a' "$f")
  [ "$fmode" = "600" ] && good "File is 0600." || bad "File is $fmode (expected 600)."
  [ "$dmode" = "700" ] && good "Dir is 0700."  || bad "Dir is $dmode (expected 700)."
  echo
  info "Now simulate an older insecure file (chmod 644) and re-write via login."
  chmod 644 "$f"
  ls -l "$f"
  expect "After the next session write, the file returns to 0600 (atomic tmp+rename)."
  pause "Press Enter to re-login (re-hardens the file)…"
  run_cli auth login "$PKCE_CLIENT_ID"
  fmode=$(stat -f '%Lp' "$f" 2>/dev/null || stat -c '%a' "$f")
  ls -l "$f"
  [ "$fmode" = "600" ] && good "Re-hardened to 0600." || bad "Still $fmode (expected 600)."
}

scenario_4_fallback() {
  title "§4 — Transitional PKCE→implicit fallback"
  need_var IMPLICIT_CLIENT_ID "an implicit-ONLY AM client id" || {
    note "Without an implicit-only client this scenario is BLOCKED (not passed)."
    note "Note: pod5 now maps to a PKCE-capable client (3f41a930…), so it is NO LONGER a fallback test."
    note "You need a separately-registered implicit-only client to exercise the fallback."
    return
  }
  logout_all
  info "4a) Default behavior: PKCE attempted, fails, WARN, auto-falls-back to implicit."
  expect "A single WARN: '[Auth] Authorization Code + PKCE failed … Falling back to the deprecated implicit flow…'"
  expect "Then implicit login completes; session record flow = 'implicit', hasRefresh = false."
  pause "Press Enter to test automatic fallback…"
  run_cli auth login "$IMPLICIT_CLIENT_ID"
  show_session_file

  echo
  logout_all
  info "4b) Fallback DISABLED: SFCC_DISABLE_PKCE_FALLBACK=1 → raw error, no fallback, no WARN."
  expect "PkceGrantUnsupportedError surfaces; NO implicit fallback; NO fallback WARN."
  pause "Press Enter to test with fallback disabled…"
  SFCC_DISABLE_PKCE_FALLBACK=1 run_cli auth login "$IMPLICIT_CLIENT_ID" || true

  echo
  info "4c) NEGATIVE — these must NOT fall back (they are plain errors, not PkceGrantUnsupportedError):"
  note "  • User cancels the browser consent  → error, no implicit retry."
  note "  • State mismatch ('OAuth state mismatch — aborting') → error, no implicit retry."
  note "  • Port 8080 already in use (EADDRINUSE) → error, no implicit retry."
  if confirm "Run the user-cancel negative case now (cancel/close the browser when it opens)?"; then
    logout_all
    expect "After you cancel, the command errors WITHOUT silently falling back to implicit."
    run_cli auth login "$PKCE_CLIENT_ID" || true
  fi
}

scenario_5_removed_pkce_cmd() {
  title "§5 — Removed surface ('auth pkce')"
  expect "'auth pkce' is NOT a command (the POC subcommand was deleted)."
  if run_cli auth pkce >/dev/null 2>&1; then
    bad "'auth pkce' unexpectedly succeeded — the command still exists!"
  else
    good "'auth pkce' is gone (command not found / errored), as expected."
  fi
}

scenario_6_dwjson_conflict() {
  title "§6 — dw.json conflict: user-auth + auth-methods (browser-free)"
  local bad_json="$PROJECT_TMP/dw-conflict.json"
  cat > "$bad_json" <<'JSON'
{
  "hostname": "example.demandware.net",
  "client-id": "00000000-0000-0000-0000-000000000000",
  "user-auth": true,
  "auth-methods": ["user"]
}
JSON
  info "Wrote a dw.json with BOTH user-auth and auth-methods: $bad_json"
  info "Loaded via 'setup instance list' — exercises dw.json normalization with NO auth/browser."
  expect "A WARN surfaces: 'dw.json: \`user-auth\` and \`auth-methods\` are mutually exclusive…'"
  note "Note: this is a config-load WARN (the DwJsonSource is skipped), not a hard command failure."
  pause "Press Enter to load the conflicting config…"
  run_cli setup instance list --config "$bad_json" || true
  note "Seeing the mutual-exclusivity WARN above = pass."
}

scenario_7_implicit_explicit() {
  title "§7 — Old flow: explicit implicit (deprecated, still selectable)"
  local cid="${IMPLICIT_CLIENT_ID:-$PKCE_CLIENT_ID}"
  logout_all
  info "Forcing the implicit flow with --auth-methods implicit on client $cid."
  expect "Deprecation WARN: 'The OAuth implicit flow is deprecated…'"
  expect "Browser implicit login; session record flow = 'implicit', hasRefresh = false."
  expect "A second process logs '[Auth] Hydrated implicit session from store'."
  pause "Press Enter to run the explicit implicit login…"
  run_cli auth login "$cid" --auth-methods implicit || true
  show_session_file
}

scenario_8_default_public_user() {
  title "§8 — Old flow: default public client via user/PKCE (am users list, no creds)"
  logout_all
  info "With no client-id/secret, the chain falls through client-creds→jwt→user (PKCE)"
  info "using the default public client $DEFAULT_PUBLIC_CLIENT_ID, then hits live AM."
  expect "Browser PKCE login, then a list of Account Manager users (requires an AM role)."
  pause "Press Enter to run 'am users list' (opens browser)…"
  run_cli am users list || true
}

scenario_8a_default_ods_realm() {
  title "§8a — Default public client: list a sandbox realm (ODS, no creds)"
  logout_all
  info "'sandbox realm list' uses OdsCommand's default public client ($DEFAULT_PUBLIC_CLIENT_ID)."
  info "With no --client-id, the chain falls through client-creds→jwt→user (PKCE) and calls ODS."
  if [ -n "$REALM" ]; then
    info "REALM=$REALM set → lists that realm (no ODS /me call needed once authed)."
  else
    note "No REALM set → discovers your realms via ODS /me (a real authenticated call)."
    note "Tip: set REALM=zzpq (the test realm) to target a specific one."
  fi
  expect "Browser PKCE login, then a realm listing from ODS (requires Sandbox API access)."
  pause "Press Enter to run 'sandbox realm list' (opens browser)…"
  if [ -n "$REALM" ]; then
    run_cli sandbox realm list "$REALM" || true
  else
    run_cli sandbox realm list || true
  fi
  show_session_file
}

scenario_8b_default_slas_clients() {
  title "§8b — Default public client: list SLAS clients for a tenant (no creds)"
  need_var SLAS_TENANT_ID "SLAS tenant id (e.g. zzpq_019)" || return
  need_var SLAS_SHORT_CODE "SCAPI short code for the SLAS admin host" || {
    note "SLAS admin host is https://<short-code>.api.commercecloud.salesforce.com — short code is required."
    return
  }
  logout_all
  info "'slas client list' uses SlasClientCommand's default public client ($DEFAULT_PUBLIC_CLIENT_ID)."
  info "No --client-id: falls through to user/PKCE, then hits the SLAS Admin API for tenant $SLAS_TENANT_ID."
  expect "Browser PKCE login, then a table of SLAS clients (Client ID / Name / Private)."
  expect "An empty/no-clients result still PASSES the migration check — it proves the token was accepted."
  pause "Press Enter to run 'slas client list' (opens browser)…"
  run_cli slas client list --tenant-id "$SLAS_TENANT_ID" --short-code "$SLAS_SHORT_CODE" || true
  show_session_file
}

scenario_9_client_credentials() {
  title "§9 — Old flow: client-credentials (no browser)"
  need_var CC_CLIENT_ID "client-credentials client id" || return
  need_var CC_CLIENT_SECRET "client-credentials secret" || return
  logout_all
  info "Storing a client-credentials session (server-to-server, no browser)."
  expect "'Authentication succeeded.'  Session record flow = 'client-credentials', hasRefresh = false."
  run_cli auth client --client-id "$CC_CLIENT_ID" --client-secret "$CC_CLIENT_SECRET" || true
  echo
  info "Read the stored client-credentials token back:"
  run_cli auth client token --client-id "$CC_CLIENT_ID" || true
  show_session_file
}

scenario_10_cc_against_am() {
  title "§10 — Old flow: client-credentials against a live API (am users list)"
  need_var CC_CLIENT_ID "client-credentials client id" || return
  need_var CC_CLIENT_SECRET "client-credentials secret" || return
  info "Same client-credentials client, used directly against Account Manager."
  expect "Lists AM users using the SERVICE client (requires User Administrator/API role). No browser."
  run_cli am users list --client-id "$CC_CLIENT_ID" --client-secret "$CC_CLIENT_SECRET" || true
}

scenario_11_jwt() {
  title "§11 — Old flow: JWT Bearer (optional)"
  need_var JWT_CLIENT_ID "JWT client id" || return
  need_var JWT_CERT "path to JWT cert PEM" || return
  need_var JWT_KEY "path to JWT private key PEM" || return
  info "Requesting a token via JWT Bearer (no secret, no browser)."
  expect "A token is printed (JWT flow requires only client-id + cert + key)."
  run_cli auth token --client-id "$JWT_CLIENT_ID" --jwt-cert "$JWT_CERT" --jwt-key "$JWT_KEY" || true
}

scenario_12_logout() {
  title "§12 — Logout clears stored session"
  expect "'Logged out. Stored session cleared.'  Then 'auth token' reports no token."
  run_cli auth logout
  run_cli auth token --client-id "$PKCE_CLIENT_ID" || true
  note "Seeing 'No authentication token found…' (or a fresh browser prompt) confirms the clear."
}

# ─────────────────────────────────────────────────────────────────────────────
# INSTANCE OPERATIONS (§13–§20) — prove tokens actually WORK against the instance.
#
# The migration's real risk: a user/PKCE access token must authenticate WebDAV
# AND OCAPI against the instance, not just Account Manager. WebDAV auth priority
# is ['basic','client-credentials','user'] — with no --username/--password a
# WebDAV op uses the OAuth token; OCAPI always uses OAuth.
#
# Instance commands require an explicit --client-id (no default, unlike am/ods).
# The OAuth client must have OCAPI Data API + WebDAV permissions ON THE INSTANCE;
# for user/PKCE the AM user must also have instance access.
# ─────────────────────────────────────────────────────────────────────────────

# Run an instance command: $1=auth(user|cc), then the command words, e.g.
#   run_instance_cmd user code list
run_instance_cmd() {
  local auth="$1"; shift
  local -a flags
  read_words < <(instance_base_flags); flags=("${ARR[@]}")
  read_words < <(instance_auth_flags "$auth"); flags+=("${ARR[@]}")
  run_cli "$@" "${flags[@]}"
}

scenario_13_ocapi_user() {
  title "§13 — OCAPI read via USER/PKCE (the migration-critical case)"
  require_instance || return
  logout_all
  info "Proves a user/PKCE access token authenticates the OCAPI Data API on $INSTANCE_HOST."
  info "Client $INSTANCE_PKCE_CLIENT_ID must have OCAPI permissions on the instance; you need instance access."
  expect "Browser PKCE login, then a list of code versions (OCAPI GET /code_versions)."
  pause "Press Enter to run 'code list' with --user-auth…"
  run_instance_cmd user code list
}

scenario_14_ocapi_cc() {
  title "§14 — OCAPI read via CLIENT-CREDENTIALS (old flow regression)"
  require_instance || return
  need_var CC_CLIENT_ID "client-credentials client id" || return
  need_var CC_CLIENT_SECRET "client-credentials secret" || return
  logout_all
  info "Same OCAPI read, but with a service client (no browser)."
  expect "No browser; a list of code versions."
  run_instance_cmd cc code list
}

scenario_15_bm_whoami_user() {
  title "§15 — OCAPI identity via USER/PKCE (token resolves to a real BM user)"
  require_instance || return
  logout_all
  info "'bm whoami' forces user-auth and hits OCAPI /users/this — proves the token is a USER, not a service client."
  info "(bm whoami still needs --client-id; it has no default.)"
  expect "Browser PKCE login, then your resolved Business Manager user is printed."
  pause "Press Enter to run 'bm whoami'…"
  # bm whoami defaults to user-auth already; pass the client id explicitly.
  local -a flags
  read_words < <(instance_base_flags); flags=("${ARR[@]}")
  run_cli bm whoami --client-id "$INSTANCE_PKCE_CLIENT_ID" "${flags[@]}"
}

scenario_16_webdav_read_user() {
  title "§16 — WebDAV read via USER/PKCE"
  require_instance || return
  logout_all
  info "Lists the Impex WebDAV root using the user/PKCE OAuth token (no Basic auth provided)."
  expect "Browser PKCE login, then a directory listing of Impex/."
  pause "Press Enter to run 'webdav ls --root impex' with --user-auth…"
  run_instance_cmd user webdav ls --root impex
}

scenario_17_webdav_read_cc() {
  title "§17 — WebDAV read via CLIENT-CREDENTIALS (old flow regression)"
  require_instance || return
  need_var CC_CLIENT_ID "client-credentials client id" || return
  need_var CC_CLIENT_SECRET "client-credentials secret" || return
  logout_all
  info "Same WebDAV listing via the service client's OAuth token (no browser)."
  expect "No browser; a directory listing of Impex/."
  run_instance_cmd cc webdav ls --root impex
}

scenario_18_webdav_read_basic() {
  title "§18 — WebDAV read via BASIC auth (legacy username/password path)"
  require_instance || return
  need_var WEBDAV_USERNAME "Business Manager user for Basic-auth WebDAV" || return
  need_var WEBDAV_PASSWORD "BM password / WebDAV access key" || return
  info "WebDAV priority is ['basic','client-credentials','user'] — with --username/--password, Basic wins."
  expect "No browser, no OAuth; a directory listing of Impex/ using Basic auth."
  local -a flags
  read_words < <(instance_base_flags); flags=("${ARR[@]}")
  run_cli webdav ls --root impex --username "$WEBDAV_USERNAME" --password "$WEBDAV_PASSWORD" "${flags[@]}"
}

scenario_19_webdav_write_user() {
  title "§19 — WebDAV write round-trip via USER/PKCE (put → ls → rm, self-cleaning)"
  require_instance || return
  logout_all
  local stamp="pkce-smoke-${PPID:-x}-$$"
  local localf="$PROJECT_TMP/$stamp.txt"
  printf 'pkce smoke test write check\n' > "$localf"
  info "Uploads a scratch file to the Temp/ WebDAV root, lists it, then deletes it — using the user/PKCE token."
  info "Temp/ is safe scratch space; the file is removed at the end of this scenario."
  expect "Browser PKCE login; 'Uploading…' then the file appears in Temp/; then 'Deleted: …Temp/$stamp.txt'."
  pause "Press Enter to start the write round-trip…"
  echo; info "1/3 PUT:"
  run_instance_cmd user webdav put "$localf" / --root temp
  echo; info "2/3 LS (confirm it landed):"
  run_instance_cmd user webdav ls "$stamp.txt" --root temp || run_instance_cmd user webdav ls --root temp
  echo; info "3/3 RM (cleanup):"
  run_instance_cmd user webdav rm "$stamp.txt" --root temp --force
  good "Round-trip complete; scratch file removed from Temp/."
}

scenario_20_job_export() {
  title "§20 — OCAPI + WebDAV: site-archive EXPORT (import/export operation)"
  require_instance || return
  local auth_choice="user"
  if [ "$AUTO" != "1" ]; then
    if confirm "Use client-credentials for the export instead of user/PKCE? (default: user/PKCE)"; then
      auth_choice="cc"
    fi
  fi
  if [ "$auth_choice" = "cc" ]; then
    need_var CC_CLIENT_ID "client-credentials client id" || return
    need_var CC_CLIENT_SECRET "client-credentials secret" || return
  fi
  logout_all
  local outdir="$PROJECT_TMP/site-export"
  info "Runs the sfcc-site-archive-export system job for GLOBAL meta_data only, then downloads via WebDAV."
  info "This is READ-ONLY on the instance: the export archive is downloaded and then deleted from Impex/."
  info "Auth: $auth_choice.  Output → $outdir"
  expect "Job runs; archive downloads to $outdir; the temporary archive is removed from the instance."
  note "Exercises BOTH an OCAPI job-execution call AND a WebDAV download with the same token."
  pause "Press Enter to run 'job export --global-data meta_data'…"
  run_instance_cmd "$auth_choice" job export --global-data meta_data --output "$outdir"
  if [ -d "$outdir" ]; then
    good "Export landed locally:"; ls -la "$outdir" 2>/dev/null | head
  else
    note "No local output dir found — check the job output above for errors."
  fi
}

# ── Menu / driver ─────────────────────────────────────────────────────────────
declare -a SCENARIOS=(
  "preflight:scenario_preflight:Preflight (env, build provenance)"
  "1:scenario_1_pkce_happy:§1  PKCE happy path [NEW]"
  "2:scenario_2_silent_refresh:§2  Silent refresh (cached hit + forced refresh_token grant) [NEW]"
  "3:scenario_3_permissions:§3  Session file 0600/0700 hardening [NEW]"
  "4:scenario_4_fallback:§4  PKCE→implicit fallback (+disabled +negative) [NEW]"
  "5:scenario_5_removed_pkce_cmd:§5  'auth pkce' removed [NEW]"
  "6:scenario_6_dwjson_conflict:§6  dw.json user-auth/auth-methods conflict [NEW]"
  "7:scenario_7_implicit_explicit:§7  Explicit implicit flow [OLD]"
  "8:scenario_8_default_public_user:§8  Default public client user/PKCE (am users list) [OLD]"
  "8a:scenario_8a_default_ods_realm:§8a Default client: sandbox realm list (ODS) [NEW/critical]"
  "8b:scenario_8b_default_slas_clients:§8b Default client: slas client list (SLAS admin) [NEW/critical]"
  "9:scenario_9_client_credentials:§9  Client-credentials store+read [OLD]"
  "10:scenario_10_cc_against_am:§10 Client-credentials vs live AM [OLD]"
  "11:scenario_11_jwt:§11 JWT Bearer [OLD]"
  "12:scenario_12_logout:§12 Logout clears session"
  "13:scenario_13_ocapi_user:§13 INSTANCE OCAPI read via user/PKCE [NEW/critical]"
  "14:scenario_14_ocapi_cc:§14 INSTANCE OCAPI read via client-credentials [OLD]"
  "15:scenario_15_bm_whoami_user:§15 INSTANCE OCAPI identity (bm whoami) via user/PKCE [NEW]"
  "16:scenario_16_webdav_read_user:§16 INSTANCE WebDAV read via user/PKCE [NEW/critical]"
  "17:scenario_17_webdav_read_cc:§17 INSTANCE WebDAV read via client-credentials [OLD]"
  "18:scenario_18_webdav_read_basic:§18 INSTANCE WebDAV read via Basic auth [OLD]"
  "19:scenario_19_webdav_write_user:§19 INSTANCE WebDAV write round-trip (put/ls/rm) via user/PKCE [NEW]"
  "20:scenario_20_job_export:§20 INSTANCE site-archive export (OCAPI+WebDAV) [NEW]"
)

run_all() {
  for entry in "${SCENARIOS[@]}"; do
    local fn="${entry#*:}"; fn="${fn%%:*}"
    "$fn"
  done
}

print_menu() {
  title "PKCE Migration Smoke Test"
  note "Reference: SMOKE-TEST.md   |   [NEW] = new behavior, [OLD] = regression of existing flows"
  echo
  for entry in "${SCENARIOS[@]}"; do
    local key="${entry%%:*}"; local desc="${entry##*:}"
    printf "  %s%4s%s  %s\n" "$BOLD" "$key" "$RST" "$desc"
  done
  echo
  printf "  %sall%s   Run every scenario in order\n" "$BOLD" "$RST"
  printf "  %sq%s     Quit\n" "$BOLD" "$RST"
  echo
}

dispatch() {
  local choice="$1"
  case "$choice" in
    all) run_all ;;
    q|quit|exit) return 1 ;;
    *)
      local matched=0
      for entry in "${SCENARIOS[@]}"; do
        local key="${entry%%:*}"; local fn="${entry#*:}"; fn="${fn%%:*}"
        if [ "$key" = "$choice" ]; then "$fn"; matched=1; break; fi
      done
      [ "$matched" = "0" ] && bad "Unknown choice: $choice"
      ;;
  esac
  return 0
}

main() {
  setup_env
  if [ ! -x "$CLI" ] && [ ! -f "$CLI" ]; then
    bad "CLI not found/executable at: $CLI"; exit 1
  fi

  if [ "$AUTO" = "1" ]; then
    scenario_preflight
    run_all
    return
  fi

  scenario_preflight
  while true; do
    print_menu
    printf "%sSelect a scenario (or 'all'):%s " "$BOLD" "$RST"
    read -r choice || break
    dispatch "$choice" || break
  done
}

main "$@"
