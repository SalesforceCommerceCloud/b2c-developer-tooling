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

## Limits — When to Use a Site Import Instead

- **Enum values can't be written.** `valueDefinitions` is ignored on create and update. For `enum_of_string` or `enum_of_int` values, use `meta/system-objecttype-extensions.xml` with `b2c job import` (see `b2c:b2c-metadata`). You can read the values with `attributes get`.
- **Custom object types aren't supported.** Use `custom-objecttype-definitions.xml` instead.
- **The value type can't change** after an attribute is created. Delete the attribute and recreate it, which removes its stored values.
- **`create --replace` replaces the whole definition.** Properties you leave out are reset to their defaults. Use `update` for partial changes.
- **System attributes** can't be deleted, but they can be assigned to custom groups.
- For changes that must be repeatable across environments (CI, many sandboxes), prefer metadata XML in an import set (`b2c-cli:b2c-import-set-migrations`). The CLI commands are best for exploring, quick changes, and sandboxes.

## Related Skills

- `b2c:b2c-metadata` - Metadata XML for attributes, enum values, custom objects, and preferences
- `b2c-cli:b2c-import-set-migrations` - Repeatable metadata changes through import sets
- `b2c-cli:b2c-site-import-export` - Importing site archives
- `b2c-cli:b2c-config` - Resolving instance and credential configuration
