---
description: Commands for inspecting and managing system object type attribute definitions and attribute groups.
---

# Object Types

Commands for system object types (Product, Order, Profile, SitePreferences, and others). You can inspect their attributes and create, update, or delete custom attribute definitions and attribute groups. The commands use the SCAPI Object Definitions API (`dx/object-definitions/v1`).

```bash
b2c object-types list
b2c object-types attributes list Product --custom
b2c object-types attributes create Product fabric --type string --display-name Fabric
b2c object-types groups create Product materials --display-name Materials -a fabric
b2c object-types export Product -o meta/system-objecttype-extensions.xml
b2c object-types apply meta/system-objecttype-extensions.xml --dry-run
```

## What the API Can and Cannot Do

- **System object types only.** Custom object types (and their attributes) are not available through this API.
- **Enum values can't be written.** The API ignores `valueDefinitions` on create and update. To add or change the values of `enum_of_string` or `enum_of_int` attributes, use a site import (`meta/system-objecttype-extensions.xml`, see [`b2c job import`](/cli/jobs#b2c-job-import)). You can still read the values with `attributes get` or `attributes list --values`.
- **The value type is fixed** once an attribute is created.
- **`--replace` replaces the whole definition.** Any property you leave out is reset to its default. If you only want to change some properties, use `attributes update`.
- **The `c_` prefix is optional.** The API addresses custom attributes by their plain ID (`fabric`). The CLI accepts either `fabric` or `c_fabric`. The `effectiveId` in the output is the ID used in OCAPI and SCAPI (`c_fabric`). Scripts use the plain ID (`product.custom.fabric`).

## Authentication

Object type commands require an Account Manager API client with OAuth credentials, a tenant ID, and a short code.

| Scope                                 | When requested                                                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `sfcc.object-definitions.rw`          | Write commands, plus filtered listing (`--custom`, `--system`, `--search`, `--group`) and enum values (`--values`, `attributes get`) |
| `sfcc.object-definitions`             | Read-only fallback for unfiltered `list` and `get`                                                                                   |
| `SALESFORCE_COMMERCE_API:<tenant_id>` | Always                                                                                                                               |

The read-only scope can't run attribute searches. If your client has only `sfcc.object-definitions`, the filtered listings and enum values fail with a 403.

```bash
export SFCC_CLIENT_ID=my-client
export SFCC_CLIENT_SECRET=my-secret
export SFCC_TENANT_ID=zzxy_prd
export SFCC_SHORTCODE=kv7kzm78
```

For setup details, see the [Authentication Guide](/guide/authentication#scapi-authentication).

## Localized Values

`--display-name` and `--description` accept either a plain value, which sets the default locale, or `locale=text`. Repeat the flag to set several locales:

```bash
b2c object-types attributes create Product fabric --type string -n Fabric -n fr=Tissu -n de=Stoff
```

## Script API IntelliSense

Attribute definitions also drive custom attribute IntelliSense (`product.custom.myAttribute`) in cartridge code. Generate the declarations with `b2c setup ide vscode-types --custom-attributes` (see [Setup](./setup.md#b2c-setup-ide-vscode-types)) or the VS Code command **B2C DX: Write Custom Attribute Types to Project**. See the [IDE Integration guide](/guide/ide-integration#custom-attributes).

---

## b2c object-types list

List system object types with their attribute and group counts.

```bash
b2c object-types list
b2c object-types list --extended
b2c object-types list --json
```

| Flag               | Description                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| `--columns`, `-c`  | Columns: `objectType`, `displayName`, `attributes`, `groups`, `readOnly`, `contentObject`, `description` |
| `--extended`, `-x` | Show all columns                                                                                         |
| `--json`           | Output as JSON                                                                                           |

## b2c object-types get

Show one system object type.

```bash
b2c object-types get Product
```

## b2c object-types export

Export the custom attribute definitions and attribute groups of one or more object types as metadata XML (`system-objecttype-extensions.xml`), the format used by site imports. System attribute definitions aren't exported. Groups marked internal are left out unless you pass `--include-internal`.

```bash
b2c object-types export Product
b2c object-types export Product Order -o site-data/meta/system-objecttype-extensions.xml
b2c object-types export Product --format json -o product.json
```

| Flag                 | Description                                           |
| -------------------- | ----------------------------------------------------- |
| `--output`, `-o`     | File to write. Without it, the output goes to stdout. |
| `--format`           | `xml` (default) or `json`                             |
| `--include-internal` | Include internal attribute groups                     |

## b2c object-types apply

Compare metadata XML with the instance and make the differences through the API, with no import job. The path can be a metadata XML file, a JSON file from `export --format json`, or a directory. For a directory, the command reads the `*.xml` files in it and in its `meta/` folder, so a site archive folder works.

```bash
b2c object-types apply meta/system-objecttype-extensions.xml --dry-run
b2c object-types apply site-data --force
b2c object-types apply site-data -t Product -t Order
b2c object-types apply meta/system-objecttype-extensions.xml --import
```

| Flag            | Description                                                            |
| --------------- | ---------------------------------------------------------------------- |
| `--dry-run`     | Show the changes without applying them                                 |
| `--type`, `-t`  | Only apply these object types (repeatable)                             |
| `--import`      | Also set enum values and default values with a site import (see below) |
| `--force`, `-f` | Skip the confirmation prompt                                           |

The changes are additive:

- Missing custom attributes are created.
- Properties that differ are updated. For localized values, only the locales in the file are compared and written, and other locales on the instance are kept.
- System attribute overrides (`<system-attribute-definitions>`) update the display name, description, visibility, and order-required flag.
- Missing groups are created, and missing attributes are assigned to groups.

Nothing is deleted or unassigned. The API ignores enum values and default values, so the command lists custom attributes whose new or changed values, display values, or default value differ from the instance. With `--import`, it builds a minimal `meta/system-objecttype-extensions.xml` for just those attributes and imports it with the site archive import job. That needs the instance hostname and WebDAV and job access. An import replaces an attribute's whole value list, so the import includes every value already on the instance, with your changes applied. Values missing from the file are kept, not removed.

Value type changes and custom object types are listed as warnings. To apply those, import the file with [`b2c job import`](/cli/jobs#b2c-job-import).

---

## b2c object-types attributes list

List the attribute definitions of an object type.

```bash
b2c object-types attributes list Product
b2c object-types attributes list Product --custom
b2c object-types attributes list Product --search color --values
b2c object-types attributes list Product --group storefrontAttributes
b2c object-types attributes list Order --custom --json
```

| Flag               | Description                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `--custom`         | Only custom attributes                                                                                                                |
| `--system`         | Only system attributes                                                                                                                |
| `--search`, `-q`   | Filter by text in the attribute ID or display name                                                                                    |
| `--group`, `-g`    | Only attributes assigned to this group                                                                                                |
| `--values`         | Include enum values (always on with `--extended`)                                                                                     |
| `--columns`, `-c`  | Columns: `id`, `displayName`, `valueType`, `system`, `mandatory`, `localizable`, `siteSpecific`, `searchable`, `multiValue`, `values` |
| `--extended`, `-x` | Show all columns                                                                                                                      |
| `--json`           | Output as JSON                                                                                                                        |

## b2c object-types attributes get

Show one attribute definition, including its enum values.

```bash
b2c object-types attributes get Product c_fabric
b2c object-types attributes get Product name --json
```

## b2c object-types attributes create

Create a custom attribute definition.

```bash
b2c object-types attributes create Product fabric --type string --display-name Fabric
b2c object-types attributes create Product careLevel --type int --searchable --site-specific
b2c object-types attributes create Order erpId --type string --no-visible --externally-managed
b2c object-types attributes create Product fabric --file fabric.json --replace
```

| Flag                                                                                                                                                                                | Description                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--type`, `-t`                                                                                                                                                                      | Value type: `string`, `int`, `double`, `text`, `html`, `date`, `image`, `boolean`, `money`, `quantity`, `datetime`, `email`, `password`, `set_of_string`, `set_of_int`, `set_of_double`, `enum_of_string`, `enum_of_int`. Required unless the file sets `valueType`. |
| `--file`                                                                                                                                                                            | JSON body in the API's `ObjectAttributeDefinition` shape. Use `-` to read stdin. Flags override values from the file.                                                                                                                                                |
| `--replace`                                                                                                                                                                         | Overwrite an existing definition. Properties you leave out are reset.                                                                                                                                                                                                |
| `--display-name`, `-n`                                                                                                                                                              | Display name; repeatable as `locale=text`                                                                                                                                                                                                                            |
| `--description`                                                                                                                                                                     | Description; repeatable as `locale=text`                                                                                                                                                                                                                             |
| `--[no-]mandatory`, `--[no-]localizable`, `--[no-]site-specific`, `--[no-]searchable`, `--[no-]visible`, `--[no-]multi-value`, `--[no-]externally-managed`, `--[no-]order-required` | Boolean properties                                                                                                                                                                                                                                                   |
| `--min-length`, `--field-length`, `--regular-expression`                                                                                                                            | String constraints                                                                                                                                                                                                                                                   |

Without `--replace`, the command fails if the attribute already exists.

## b2c object-types attributes update

Change only the properties you pass. Other properties are left as they are.

```bash
b2c object-types attributes update Product c_fabric --searchable --display-name "Fabric type"
b2c object-types attributes update Product c_fabric --file changes.json
```

It accepts the same property flags and `--file` as `create`, but not `--type`, because the value type can't change.

## b2c object-types attributes delete

Delete a custom attribute definition. The command asks for confirmation unless you pass `--force` or `--json`. The attribute's stored values on every object are removed.

```bash
b2c object-types attributes delete Product c_fabric
b2c object-types attributes delete Product c_fabric --force
```

You can't delete system attributes.

---

## b2c object-types groups list

List the attribute groups of an object type.

```bash
b2c object-types groups list Product
b2c object-types groups list Product --extended
```

Columns: `id`, `displayName`, `attributes`, `internal`, `position`, `description`.

## b2c object-types groups get

Show an attribute group and the attributes assigned to it.

```bash
b2c object-types groups get Product storefrontAttributes
```

## b2c object-types groups create

Create an attribute group and, if you pass `--attribute`, assign attributes to it.

```bash
b2c object-types groups create Product materials --display-name Materials -a c_fabric -a c_lining
```

| Flag                   | Description                                                              |
| ---------------------- | ------------------------------------------------------------------------ |
| `--display-name`, `-n` | Display name; repeatable as `locale=text`                                |
| `--description`        | Description; repeatable as `locale=text`                                 |
| `--position`           | Sort position in Business Manager                                        |
| `--attribute`, `-a`    | Attribute to assign (repeatable). System attributes can be assigned too. |

The command fails if the group already exists. Use `groups update` to change it.

## b2c object-types groups update

Update a group's display name, description, or position.

```bash
b2c object-types groups update Product materials --position 3
```

## b2c object-types groups delete

Delete an attribute group. The attributes themselves are kept. The command asks for confirmation unless you pass `--force` or `--json`.

```bash
b2c object-types groups delete Product materials --force
```

## b2c object-types groups assign

Assign one or more attributes to a group.

```bash
b2c object-types groups assign Product materials c_fabric c_lining
```

## b2c object-types groups unassign

Remove one or more attributes from a group.

```bash
b2c object-types groups unassign Product materials c_lining
```
