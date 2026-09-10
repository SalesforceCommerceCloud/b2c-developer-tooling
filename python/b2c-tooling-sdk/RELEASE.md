# Releasing the Python SDK

> **Temporary process.** The package (`salesforce-b2c-tooling-sdk`) is **not yet
> published to PyPI**. During development, "releasing" simply means tagging a
> commit so consumers can install a pinned version straight from the GitHub
> repository with `pip`. There is no build/publish workflow and no GitHub Release
> assets — `pip` builds the SDK from source at the tagged ref.
>
> When the package is later published to PyPI, this process is replaced by a
> standard `python -m build` + `twine upload` (or a trusted-publishing workflow),
> and consumers switch to `pip install salesforce-b2c-tooling-sdk`.

## Quick release (recommended)

Just run the script from the `python/b2c-tooling-sdk/` directory:

```bash
./release.sh
```

It does everything for you:

1. Reads the current version and **proposes the next minor version** (press
   Enter to accept, or type another semver value).
2. Runs the quality gate (ruff, format, mypy, pytest).
3. Bumps `pyproject.toml`, commits, tags `python-v<version>`, and pushes the
   branch + tag to the fork (`origin`).

It shows exactly what it will do and **asks for confirmation before pushing**.

Options:

```bash
./release.sh --dry-run     # print the steps without changing anything
./release.sh --skip-gate   # skip the tests/lint gate (not recommended)
./release.sh --help        # usage
```

The manual steps below document what the script automates — reach for them only
if you need to deviate.

## How consumers install

All installs build from source in the `python/b2c-tooling-sdk/` subdirectory (pure Python, no
compilers needed).

- **Latest (moves with the branch):**
  ```bash
  pip install "git+https://github.com/priandsf/b2c-developer-tooling.git@python#subdirectory=python/b2c-tooling-sdk"
  ```
- **Pinned to a release (recommended for reproducibility):**
  ```bash
  pip install "git+https://github.com/priandsf/b2c-developer-tooling.git@python-v0.1.0#subdirectory=python/b2c-tooling-sdk"
  ```

The importable package is `b2c_tooling_sdk`; the distribution name is
`salesforce-b2c-tooling-sdk`.

## Manual release (what `release.sh` automates)

All commands run from the `python/b2c-tooling-sdk/` package directory unless noted. `origin` is
the fork (`git@github.com:priandsf/b2c-developer-tooling.git`); we release from
the `python` branch.

1. **Green gate.** Make sure everything passes:
   ```bash
   ./.venv/bin/ruff check src tests
   ./.venv/bin/ruff format --check src tests
   ./.venv/bin/mypy src
   ./.venv/bin/python -m pytest -q
   ```

2. **Bump the version** in `python/b2c-tooling-sdk/pyproject.toml`:
   ```toml
   [project]
   version = "0.2.0"
   ```
   Use [semantic versioning](https://semver.org/): `patch` for fixes, `minor`
   for backwards-compatible features, `major` for breaking changes. Treat the
   shared on-disk auth-session / config format as a public contract — a breaking
   change there warrants a `major` bump.

3. **Commit** the bump to the `python` branch:
   ```bash
   git add python/b2c-tooling-sdk/pyproject.toml
   git commit -m "chore(python): release v0.2.0"
   git push origin python
   ```

4. **Tag and push.** The tag name must be `python-v<version>` and match the
   `pyproject.toml` version exactly:
   ```bash
   git tag python-v0.2.0
   git push origin python-v0.2.0
   ```

That's the whole release. The tag is immutable in practice — treat a pushed tag
as final and cut a new version rather than moving it.

## Verifying a release

Install the freshly tagged version into a throwaway environment and import it:

```bash
python -m venv /tmp/verify
/tmp/verify/bin/pip install "git+https://github.com/priandsf/b2c-developer-tooling.git@python-v0.2.0#subdirectory=python/b2c-tooling-sdk"
/tmp/verify/bin/python -c "import b2c_tooling_sdk; print(b2c_tooling_sdk.SDK_VERSION)"
```

The printed version should match the tag.

## Notes & caveats

- **Tag naming is significant.** The `python-v*` prefix namespaces these tags
  away from the monorepo's JavaScript release tags. Keep the prefix.
- **`pyproject.toml` is the single source of truth for the version.** The tag
  should mirror it; nothing derives the version from the tag.
- **No PyPI, no name claim yet.** Publishing under the `salesforce-` name on
  public PyPI is an organization/trademark decision and is intentionally out of
  scope for this temporary process.
- **This package is independent of the repo's Changesets flow.** JavaScript
  packages release via Changesets; the Python SDK releases only via the tag
  process described here.
