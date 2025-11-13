@salesforce/b2c-cli
=================

A Salesforce Commerce Cloud B2C CLI


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@salesforce/b2c-cli.svg)](https://npmjs.org/package/@salesforce/b2c-cli)
[![Downloads/week](https://img.shields.io/npm/dw/@salesforce/b2c-cli.svg)](https://npmjs.org/package/@salesforce/b2c-cli)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @salesforce/b2c-cli
$ b2c COMMAND
running command...
$ b2c (--version)
@salesforce/b2c-cli/0.0.0 darwin-arm64 node-v22.20.0
$ b2c --help [COMMAND]
USAGE
  $ b2c COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`b2c hello PERSON`](#b2c-hello-person)
* [`b2c hello world`](#b2c-hello-world)
* [`b2c help [COMMAND]`](#b2c-help-command)
* [`b2c plugins`](#b2c-plugins)
* [`b2c plugins add PLUGIN`](#b2c-plugins-add-plugin)
* [`b2c plugins:inspect PLUGIN...`](#b2c-pluginsinspect-plugin)
* [`b2c plugins install PLUGIN`](#b2c-plugins-install-plugin)
* [`b2c plugins link PATH`](#b2c-plugins-link-path)
* [`b2c plugins remove [PLUGIN]`](#b2c-plugins-remove-plugin)
* [`b2c plugins reset`](#b2c-plugins-reset)
* [`b2c plugins uninstall [PLUGIN]`](#b2c-plugins-uninstall-plugin)
* [`b2c plugins unlink [PLUGIN]`](#b2c-plugins-unlink-plugin)
* [`b2c plugins update`](#b2c-plugins-update)

## `b2c hello PERSON`

Say hello

```
USAGE
  $ b2c hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ b2c hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/SalesforceCommerceCloud/b2c-cli/blob/v0.0.0/src/commands/hello/index.ts)_

## `b2c hello world`

Say hello world

```
USAGE
  $ b2c hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ b2c hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/SalesforceCommerceCloud/b2c-cli/blob/v0.0.0/src/commands/hello/world.ts)_

## `b2c help [COMMAND]`

Display help for b2c.

```
USAGE
  $ b2c help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for b2c.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.35/src/commands/help.ts)_

## `b2c plugins`

List installed plugins.

```
USAGE
  $ b2c plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ b2c plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/index.ts)_

## `b2c plugins add PLUGIN`

Installs a plugin into b2c.

```
USAGE
  $ b2c plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into b2c.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the B2C_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the B2C_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ b2c plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ b2c plugins add myplugin

  Install a plugin from a github url.

    $ b2c plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ b2c plugins add someuser/someplugin
```

## `b2c plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ b2c plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ b2c plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/inspect.ts)_

## `b2c plugins install PLUGIN`

Installs a plugin into b2c.

```
USAGE
  $ b2c plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into b2c.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the B2C_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the B2C_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ b2c plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ b2c plugins install myplugin

  Install a plugin from a github url.

    $ b2c plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ b2c plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/install.ts)_

## `b2c plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ b2c plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ b2c plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/link.ts)_

## `b2c plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ b2c plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ b2c plugins unlink
  $ b2c plugins remove

EXAMPLES
  $ b2c plugins remove myplugin
```

## `b2c plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ b2c plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/reset.ts)_

## `b2c plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ b2c plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ b2c plugins unlink
  $ b2c plugins remove

EXAMPLES
  $ b2c plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/uninstall.ts)_

## `b2c plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ b2c plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ b2c plugins unlink
  $ b2c plugins remove

EXAMPLES
  $ b2c plugins unlink myplugin
```

## `b2c plugins update`

Update installed plugins.

```
USAGE
  $ b2c plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.53/src/commands/plugins/update.ts)_
<!-- commandsstop -->
