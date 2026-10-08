# CLI and Install

The `sfnext` CLI (from `@salesforce/storefront-next-dev`, available in your project) manages extensions. Run commands from the project root, or pass `--project-directory`.

```bash
sfnext extensions list                                   # installed extensions
sfnext extensions create -n "My Extension" -d "What it does"   # scaffold a new extension
sfnext extensions install -e SFDC_EXT_STORE_LOCATOR      # install a registered extension
sfnext extensions remove -e SFDC_EXT_BOPIS               # remove one (comma-separate several)
sfnext extensions remove -e SFDC_EXT_STORE_LOCATOR --yes # also remove dependents without prompting
pnpm extensions:list                                     # UITarget ids and action hook ids (not the same as `list`)
```

Run `sfnext extensions <command> --help` for the exact flags in your version.

## create

Scaffolds `src/extensions/<kebab-name>/` (components, locales, hooks, routes, README) and registers a `SFDC_EXT_*` entry in `src/extensions/config.json`. It does not create `target-config.json` content for you; add it when you have a component to plug in.

## install and remove

Registered extensions are listed in `src/extensions/config.json`, each with a marker key, `name`, `description`, `folder`, optional `dependencies`, and `installationInstructions` / `uninstallationInstructions` pointing at files in `instructions/`. Shipped registrations include Store Locator, BOPIS (depends on Store Locator and Multiship), Multiship, and the demo extensions BNPL, Customer Preferences, Ratings and Reviews, Product Content, and Shipping Delivery. The theme-switcher folder is present but not registered.

- `install` copies the extension folder and merges the marked snippets (see markers below) into base files from a source template repository (`--source-git-url`/`-s` overrides the default).
- `remove` reverses that and, when other installed extensions depend on the target, asks before removing them (`--yes` skips the prompt).
- Always commit or stash first and review the diff: installs touch base files such as `root.tsx`, the header and the footer.

## Agent-driven install instructions

`instructions/*.mdc` are step-by-step prompts a coding agent can follow to install or uninstall an extension. Treat them as a starting point: they are generated from the source template repository and can lag behind your project (for example file paths or a temporary clone folder name). If a step mentions a file that does not exist in your project, prefer `sfnext extensions install`, or compare against the extension's own `README.md`.

To author instructions for your own extension (an extension whose integration edits are marked with `SFDC_EXT_*` markers):

```bash
sfnext create-instructions -d . -c <extension-config.json> -e SFDC_EXT_MY_FEATURE
```

Options include `-f` for the specific files that contain markers, `-b` for the template branch, and `-o` for the output directory (default `./instructions`).

## Markers

| Marker | Meaning |
|--------|---------|
| `@sfdc-extension-line SFDC_EXT_X` | The comment line and the single line that follows it belong to the extension |
| `@sfdc-extension-block-start SFDC_EXT_X` / `@sfdc-extension-block-end SFDC_EXT_X` | Everything between belongs to the extension |
| `@sfdc-extension-file SFDC_EXT_X` | The whole file belongs to the extension and is removed on uninstall |

Rules: use the exact `SFDC_EXT_*` key from `config.json`; never nest different markers; only mark code the extension truly needs outside its folder.

## After install or remove

```bash
pnpm locales:aggregate-extensions   # regenerate src/extensions/locales (also runs in dev/build)
pnpm config:aggregate-extensions    # regenerate src/extensions/config (also runs in dev/build)
pnpm typecheck && pnpm lint
```

Then read the extension's README for environment variables, SLAS scopes, or custom SCAPI endpoints it needs. Store Locator, for example, relies on the store data your instance exposes; check its README.
