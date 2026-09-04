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

## How consumers install

All installs build from source in the `python/` subdirectory (pure Python, no
compilers needed).

- **Latest (moves with the branch):**
  ```bash
  pip install "git+https://github.com/priandsf/b2c-developer-tooling.git@python#subdirectory=python"
  ```
- **Pinned to a release (recommended for reproducibility):**
  ```bash
  pip install "git+https://github.com/priandsf/b2c-developer-tooling.git@python-v0.1.0#subdirectory=python"
  ```

The importable package is `b2c_tooling_sdk`; the distribution name is
`salesforce-b2c-tooling-sdk`.

## Cutting a release

All commands run from the `python/` package directory unless noted. `origin` is
the fork (`git@github.com:priandsf/b2c-developer-tooling.git`); we release from
the `python` branch.

1. **Green gate.** Make sure everything passes:
   ```bash
   ./.venv/bin/ruff check src tests
   ./.venv/bin/ruff format --check src tests
   ./.venv/bin/mypy src
   ./.venv/bin/python -m pytest -q
   ```

2. **Bump the version** in `python/pyproject.toml`:
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
   git add python/pyproject.toml
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
/tmp/verify/bin/pip install "git+https://github.com/priandsf/b2c-developer-tooling.git@python-v0.2.0#subdirectory=python"
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
