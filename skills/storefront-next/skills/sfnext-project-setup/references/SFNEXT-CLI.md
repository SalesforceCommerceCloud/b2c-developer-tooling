# `sfnext` CLI

The `sfnext` binary comes from `@salesforce/storefront-next-dev`. Ways to run it:

- `pnpm sfnext <command>` or a project script (`pnpm dev`, `pnpm push`, ...) inside the project
- `b2c sfnext <command>` -- the b2c CLI installs the plugin on first use and, when run inside a project, prefers the project's local copy
- `pnpm dlx @salesforce/storefront-next-dev <command>` for commands that run before a project exists (`create-storefront`)

Most commands take `-d, --project-directory` (default: current directory). `.env` in the project directory is loaded automatically (not `.env.default`).

## Project lifecycle

| Command | Purpose |
| --- | --- |
| `create-storefront` | Create a project from a starter theme. Flags: `-n` name, `-V` starter theme (`fashion`, `cosmetic`, `foundations`, `footwear`, `furniture`, `luxury`), `-t` template URL/path, `-b` branch/tag, `-d` defaults, `-o` output dir |
| `dev` | Vite dev server with SSR. `-p, --port` (default 5173) |
| `preview` | Serve the production build, building if needed. `-p, --port` (default 3000) |
| `create-bundle` | Create an MRT bundle in `.bundle/` without pushing. `-b` build dir, `-o` output dir, `-m` message, `-s` project slug |
| `push` | Upload the build to Managed Runtime. See below |

## Managed Runtime push

```bash
pnpm build && pnpm push -- -m "Release notes" -e staging --wait
```

| Flag | Meaning |
| --- | --- |
| `-m, --message` | Bundle message (default: git branch:commit) |
| `-w, --wait` | Wait for the deployment to finish; requires a target environment |
| `-b, --build-directory` | Build dir (default: auto-detected `build/`) |
| `-p, --project` | MRT project slug (env `MRT_PROJECT`, then `SFCC_MRT_PROJECT`, then dw.json `mrtProject`) |
| `-e, --environment` | Target environment (env `MRT_TARGET`). Without one the bundle is uploaded but not deployed |
| `--api-key`, `--credentials-file`, `--cloud-origin` | MRT credentials (env `MRT_API_KEY`, `MRT_CREDENTIALS_FILE`, `MRT_CLOUD_ORIGIN`; or `~/.mobify`) |

`push` does not build; it fails if the build directory is missing.

## Cartridges (Page Designer metadata)

| Command | Purpose |
| --- | --- |
| `generate-cartridge` | Generate component metadata from decorators into `cartridges/app_storefrontnext_base` |
| `validate-cartridge` | Validate the generated JSON |
| `deploy-cartridge` | Upload cartridges to a B2C instance. Instance settings come from flags, env, or `dw.json`. Flags: `-s, --server`, `-v, --code-version`, `-r, --reload` (re-activate), `--delete` (remove old files first), `-c` include / `-x` exclude cartridges |
| `setup-base-cartridge` | Register the SLAS scopes the base cartridge needs: `--slas-client-id <id>` (needs short code and tenant ID from flags/env/dw.json) |

Deploying cartridges needs WebDAV credentials; without `--code-version` it also needs OAuth credentials to discover the active code version.

## Configuration and extensions

| Command | Purpose |
| --- | --- |
| `config inspect` | Show which `config.server.ts` values are overridden by `.env` or MRT (`--project`, `--environment` to include MRT values) |
| `config aggregate-extensions`, `locales aggregate-extensions` | Merge extension config / translations (run by `dev`, `build`, `typecheck`) |
| `extensions list` | List installed extensions |
| `extensions install -e <SFDC_EXT_...>` | Install an extension |
| `extensions remove -e <A,B>` | Remove extensions (`--yes` to also remove dependents) |
| `extensions create -n "<Name>" -d "<desc>"` | Scaffold a new extension (`-p` target project dir) |
| `create-instructions` | Generate install/uninstall instruction files for an extension you author |

## SCAPI clients

`sfnext scapi available | add | list | remove` manage typed SCAPI clients, including custom APIs. See `storefront-next:sfnext-scapi`.
