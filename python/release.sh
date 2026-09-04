#!/usr/bin/env bash
#
# release.sh — cut a Python SDK release (temporary tag-based process).
#
# Reads the current version from pyproject.toml, proposes the next minor
# version, runs the quality gate, bumps the version, commits, tags
# (python-v<version>), and pushes the branch + tag to the fork.
#
# Usage:
#   ./release.sh                # interactive; proposes next minor version
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
  warn "Working tree has uncommitted tracked changes; only pyproject.toml will be committed."
  git status --short
  read -r -p "Continue? [y/N] " ans
  [[ "$ans" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 1; }
fi

# --- Determine versions ------------------------------------------------------
CURRENT="$(grep -E '^version[[:space:]]*=' pyproject.toml | head -1 | sed -E 's/.*"([^"]+)".*/\1/')"
if [[ ! "$CURRENT" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  error "Could not parse a valid current version from pyproject.toml (got '$CURRENT')"; exit 1
fi

IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"
PROPOSED="${MAJOR}.$((MINOR + 1)).0"   # next minor

info "Current version: $CURRENT"
read -r -p "New version [$PROPOSED]: " INPUT
VERSION="${INPUT:-$PROPOSED}"

if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  error "Version '$VERSION' is not valid semver (expected MAJOR.MINOR.PATCH)"; exit 1
fi
if [ "$VERSION" = "$CURRENT" ]; then
  error "New version equals the current version ($CURRENT). Bump it."; exit 1
fi

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
echo "    version : $CURRENT -> $VERSION"
echo "    commit  : chore(python): release v$VERSION  (bumps pyproject.toml)"
echo "    tag     : $TAG"
echo "    push to : $REMOTE  (branch $BRANCH + tag $TAG)"
echo
read -r -p "Proceed with commit, tag, and push? [y/N] " ans
[[ "$ans" =~ ^[Yy]$ ]] || { echo "Aborted. No changes pushed."; exit 1; }

# --- Bump, commit, tag, push -------------------------------------------------
info "Bumping version in pyproject.toml..."
run "sed -i.bak -E 's/^version[[:space:]]*=.*/version = \"${VERSION}\"/' pyproject.toml && rm -f pyproject.toml.bak"

info "Committing..."
run "git add pyproject.toml"
run "git commit -m 'chore(python): release v${VERSION}'"

info "Tagging $TAG..."
run "git tag '${TAG}'"

info "Pushing branch and tag to $REMOTE..."
run "git push '${REMOTE}' '${BRANCH}'"
run "git push '${REMOTE}' '${TAG}'"

echo
info "Released v${VERSION} (tag ${TAG})."
echo "Install with:"
echo "    pip install \"git+https://github.com/priandsf/b2c-developer-tooling.git@${TAG}#subdirectory=python\""
