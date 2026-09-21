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

## Versioning is via Changesets; tagging is manual

The **version number** comes from the monorepo's
[Changesets](https://github.com/changesets/changesets) flow, same as the
JavaScript packages: a changeset targeting `@salesforce/b2c-tooling-sdk-python`
(a private, unpublished `package.json` that exists purely so Changesets can
version and changelog this package) gets merged, `pnpm run version` bumps that
`package.json`, and `scripts/sync-python-sdk-version.mjs` propagates the new
number into `pyproject.toml` and `version.py`. See the root `CLAUDE.md`'s
Changesets section for how to write a changeset.

The **actual release** — tagging the commit and pushing to the fork so `pip`
can install it — is still a separate, manual step; there is no CI automation
for it (the monorepo's `publish.yml` tag/release automation is not wired up
for this package). Run the script from the `python/b2c-tooling-sdk/` directory
once the version bump above is committed on the `python` branch:

```bash
./release.sh
```

It does everything for you:

1. Reads the version already committed in `pyproject.toml` (no prompting — it
   does not choose or bump a version itself).
2. Runs the quality gate (ruff, format, mypy, pytest).
3. Tags `python-v<version>` and pushes the branch + tag to the fork (`origin`).

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

1. **Get the version bump onto the `python` branch.** Write a changeset
   targeting `@salesforce/b2c-tooling-sdk-python` (see the root `CLAUDE.md`),
   merge it, let the Changesets "Version Packages" PR bump
   `python/b2c-tooling-sdk/package.json` and land on `main`, then bring that
   commit onto the `python` branch (merge/rebase as usual). `pyproject.toml`
   and `version.py` are updated automatically by
   `scripts/sync-python-sdk-version.mjs` as part of that version bump — do not
   hand-edit them.

2. **Green gate.** Make sure everything passes:
   ```bash
   ./.venv/bin/ruff check src tests
   ./.venv/bin/ruff format --check src tests
   ./.venv/bin/mypy src
   ./.venv/bin/python -m pytest -q
   ```

3. **Tag and push.** The tag name must be `python-v<version>` and match the
   `pyproject.toml` version exactly:
   ```bash
   git tag python-v0.2.0
   git push origin python
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
- **`pyproject.toml` is the single source of truth for the version**, but it is
  now *derived*: Changesets bumps `python/b2c-tooling-sdk/package.json`, and
  `scripts/sync-python-sdk-version.mjs` writes that number into
  `pyproject.toml`/`version.py`. Don't hand-edit either file's version.
- **No PyPI, no name claim yet.** Publishing under the `salesforce-` name on
  public PyPI is an organization/trademark decision and is intentionally out of
  scope for this temporary process.
- **Versioning uses Changesets; tagging/publishing does not.** The version
  number and CHANGELOG come from the same Changesets flow as the JavaScript
  packages (`@salesforce/b2c-tooling-sdk-python` is a private,
  Changesets-only `package.json` — it is never published to npm). The
  monorepo's automated tag/release CI (`publish.yml`) is intentionally *not*
  wired up for this package, since Python releases happen from the separate
  `python` branch/fork rather than `main` — the tag + push above stays a
  manual step via `release.sh`.
