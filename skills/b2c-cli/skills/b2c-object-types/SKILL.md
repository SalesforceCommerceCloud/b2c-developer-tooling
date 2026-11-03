---
name: b2c-object-types
description: Inspect and manage system object type attribute definitions and attribute groups on a live B2C Commerce instance with the b2c CLI (SCAPI Object Definitions API). Use this skill whenever the user needs to find which custom attributes exist on Product, Order, Profile, SitePreferences, or another system object, check an attribute's value type or enum values, add or change a custom attribute without a site import, or organize attributes into Business Manager attribute groups. Also use when they ask "what fields does Product have", "is c_foo an enum", "add a custom attribute to orders", or need attribute IDs before writing product.custom.* code.
---

# B2C Object Types Skill

Use `b2c object-types` to work with the attribute definitions and attribute groups of **system object types** on an instance, through the SCAPI Object Definitions API (`dx/object-definitions/v1`). The changes take effect immediately, with no site archive or import job.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli`.

## Command Structure

```text
object-types
├── list                                   - system object types with attribute/group counts
├── get <type>
├── export <type...> [-o file] [--format xml|json]   - custom attributes + groups as metadata XML
├── apply <file|dir> [--dry-run] [-t type] [--import] [--force]  - create/update from metadata XML or JSON
├── attributes
│   ├── list <type> [--custom|--system] [-q text] [-g group] [--values]
│   ├── get <type> <id>                    - includes enum values
│   ├── create <type> <id> --type <valueType> [property flags] [--file body.json] [--replace]
│   ├── update <type> <id> [property flags] [--file changes.json]    - partial (PATCH)
│   └── delete <type> <id> [--force]
└── groups
    ├── list <type>
    ├── get <type> <group>                 - includes assigned attributes
    ├── create <type> <group> [-n name] [-a attr ...]
    ├── update <type> <group> [-n name] [--position n]
    ├── delete <type> <group> [--force]
    ├── assign <type> <group> <attr...>
    └── unassign <type> <group> <attr...>
```

Attribute IDs work with or without the `c_` prefix (`fabric` or `c_fabric`). All commands support `--json`.

## Configuration

`tenantId`, `shortCode`, `clientId`, and `clientSecret` are read from `dw.json`, `SFCC_*` environment variables, or the active instance. Pass flags only when you need to override a configured value. Run `b2c setup inspect` to see where each value comes from (see the `b2c-cli:b2c-config` skill).

Scopes the API client needs:

- `sfcc.object-definitions.rw` for writes, filtered listing (`--custom`, `--system`, `-q`, `-g`), and enum values
- `sfcc.object-definitions` is enough for an unfiltered `list` and `get`
- `SALESFORCE_COMMERCE_API:<tenant_id>`

## Inspect

```bash
# Which system object types exist
b2c object-types list

# Custom attributes on Product, with enum values
b2c object-types attributes list Product --custom --extended

# Find attributes by name
b2c object-types attributes list Product -q color

# One attribute, including enum values
b2c object-types attributes get Product c_color --json

# Attributes in a Business Manager group
b2c object-types groups get Product storefrontAttributes
```

## Change

```bash
# Create a localizable string attribute with translations
b2c object-types attributes create Product fabric --type string -n Fabric -n fr=Tissu --localizable

# Change some properties (others are left as they are)
b2c object-types attributes update Product c_fabric --searchable

# Create a group and assign attributes to it
b2c object-types groups create Product materials -n Materials -a c_fabric -a c_lining
b2c object-types groups assign Product materials c_care

# Delete (asks for confirmation unless --force or --json)
b2c object-types attributes delete Product c_fabric --force
```

## Export and Apply Metadata XML

`export` writes custom attribute definitions and groups as `system-objecttype-extensions.xml`. `apply` compares a metadata XML file (or a site archive directory with `meta/*.xml`) against the instance and makes the changes through the API, with no import job.

```bash
# Snapshot Product and Order definitions into an import set
b2c object-types export Product Order -o site-data/meta/system-objecttype-extensions.xml

# Preview what applying a file would change, then apply it
b2c object-types apply site-data --dry-run
b2c object-types apply site-data --force

# Also set enum values and default values (runs a site import for just those attributes)
b2c object-types apply site-data --import --force

# Only one object type from a larger file
b2c object-types apply site-data/meta/system-objecttype-extensions.xml -t Product --dry-run
```

`apply` is additive: it creates missing attributes and groups, updates properties that differ, and assigns missing group members. It never deletes or unassigns. Enum values and default values are listed as needing an import; add `--import` to set them with a site import of just those attributes (needs the hostname and WebDAV and job access). The import keeps every value already on the instance and applies the file's changes. Value type changes and custom object types are reported as warnings.

## Limits — When to Use a Site Import Instead

- **Enum values can't be written through the API.** `valueDefinitions` is ignored on create and update. Use `apply --import`, or `meta/system-objecttype-extensions.xml` with `b2c job import` (see `b2c:b2c-metadata`). A metadata import replaces an attribute's whole value list, so include every value you want to keep. You can read the values with `attributes get`.
- **Custom object types aren't supported.** Use `custom-objecttype-definitions.xml` instead.
- **The value type can't change** after an attribute is created. Delete the attribute and recreate it, which removes its stored values.
- **`create --replace` replaces the whole definition.** Properties you leave out are reset to their defaults. Use `update` for partial changes.
- **System attributes** can't be deleted, but they can be assigned to custom groups.
- **Script API IntelliSense** for `obj.custom.*` is generated from these definitions with `b2c setup ide vscode-types --custom-attributes` (`b2c-cli:b2c-config`).
- For changes that must be repeatable across environments (CI, many sandboxes), keep metadata XML in an import set (`b2c-cli:b2c-import-set-migrations`). `apply --dry-run` shows how an instance differs from that XML.

## Related Skills

- `b2c:b2c-metadata` - Metadata XML for attributes, enum values, custom objects, and preferences
- `b2c-cli:b2c-import-set-migrations` - Repeatable metadata changes through import sets
- `b2c-cli:b2c-site-import-export` - Importing site archives
- `b2c-cli:b2c-config` - Resolving instance and credential configuration
