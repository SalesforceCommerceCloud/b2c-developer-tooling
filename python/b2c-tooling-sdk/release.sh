#!/usr/bin/env bash
#
# release.sh — cut a Python SDK release (temporary tag-based process).
#
# The version is no longer chosen here: Changesets owns it. Merging a
# changeset targeting @salesforce/b2c-tooling-sdk-python bumps
# python/b2c-tooling-sdk/package.json on `main`, and the sync script
# (scripts/sync-python-sdk-version.mjs, run as part of `pnpm run version`)
# propagates that number into pyproject.toml and version.py. This script just
# reads whatever version is already committed in pyproject.toml on the current
# branch, runs the quality gate, and tags + pushes it.
#
# Usage:
#   ./release.sh                # reads the version from pyproject.toml
#   ./release.sh --skip-gate    # skip ruff/mypy/pytest (not recommended)
#   ./release.sh --dry-run      # show what would happen; make no changes
#
# See RELEASE.md for the full manual process and background.

set -euo pipefail

# --- Config ------------------------------------------------------------------
REMOTE="origin"   # the fork: git@github.com:priandsf/b2c-developer-tooling.git
BRANCH="python"
TAG_PREFIX="python-v"

# --- Locate the package dir (this script lives in python/) -------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# --- Args --------------------------------------------------------------------
SKIP_GATE=false
DRY_RUN=false
for arg in "$@"; do
  case "$arg" in
    --skip-gate) SKIP_GATE=true ;;
    --dry-run)   DRY_RUN=true ;;
    -h|--help)   grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $arg (use --help)"; exit 1 ;;
  esac
done

info()  { printf '\033[36m==>\033[0m %s\n' "$1"; }
warn()  { printf '\033[33mWARN:\033[0m %s\n' "$1"; }
error() { printf '\033[31mERROR:\033[0m %s\n' "$1" >&2; }
run()   { if $DRY_RUN; then echo "  [dry-run] $*"; else eval "$@"; fi; }

# --- Preconditions -----------------------------------------------------------
if [ ! -f pyproject.toml ]; then
  error "pyproject.toml not found in $SCRIPT_DIR"; exit 1
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  warn "You are on '$CURRENT_BRANCH', not '$BRANCH'."
  read -r -p "Continue releasing from '$CURRENT_BRANCH'? [y/N] " ans
  [[ "$ans" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 1; }
fi

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  warn "Working tree has uncommitted tracked changes; the release tags whatever is already committed."
  git status --short
  read -r -p "Continue? [y/N] " ans
  [[ "$ans" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 1; }
fi

# --- Determine version (owned by Changesets, already committed here) --------
VERSION="$(grep -E '^version[[:space:]]*=' pyproject.toml | head -1 | sed -E 's/.*"([^"]+)".*/\1/')"
if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  error "Could not parse a valid version from pyproject.toml (got '$VERSION')"; exit 1
fi

info "Version to release: $VERSION (from pyproject.toml)"

TAG="${TAG_PREFIX}${VERSION}"
if git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null; then
  error "Tag '$TAG' already exists. Tags are immutable — pick a new version."; exit 1
fi

# --- Quality gate ------------------------------------------------------------
if $SKIP_GATE; then
  warn "Skipping quality gate (--skip-gate)."
else
  if [ ! -x ./.venv/bin/python ]; then
    error "No ./.venv found. Create it first: python3 -m venv .venv && ./.venv/bin/pip install -e '.[dev,docs]'"
    error "(or re-run with --skip-gate)"; exit 1
  fi
  info "Running quality gate (ruff, format, mypy, pytest)..."
  run "./.venv/bin/ruff check src tests"
  run "./.venv/bin/ruff format --check src tests"
  run "./.venv/bin/mypy src"
  run "./.venv/bin/python -m pytest -q"
fi

# --- Confirm the outward actions ---------------------------------------------
echo
info "Ready to release:"
echo "    version : $VERSION  (already committed in pyproject.toml)"
echo "    tag     : $TAG"
echo "    push to : $REMOTE  (branch $BRANCH + tag $TAG)"
echo
read -r -p "Proceed with tag and push? [y/N] " ans
[[ "$ans" =~ ^[Yy]$ ]] || { echo "Aborted. No changes pushed."; exit 1; }

# --- Tag, push -----------------------------------------------------------
info "Tagging $TAG..."
run "git tag '${TAG}'"

info "Pushing branch and tag to $REMOTE..."
run "git push '${REMOTE}' '${BRANCH}'"
run "git push '${REMOTE}' '${TAG}'"

echo
info "Released v${VERSION} (tag ${TAG})."
echo "Install with:"
echo "    pip install \"git+https://github.com/priandsf/b2c-developer-tooling.git@${TAG}#subdirectory=python/b2c-tooling-sdk\""
