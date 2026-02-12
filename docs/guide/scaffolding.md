---
description: Generate B2C Commerce cartridges, controllers, hooks, custom APIs, and more from templates using the scaffolding framework.
---

# Scaffolding

The B2C CLI includes a scaffolding framework for generating B2C Commerce components from templates. Scaffolds provide consistent project structure and reduce boilerplate when creating cartridges, controllers, hooks, custom APIs, job steps, and Page Designer components.

## Quick Start

```bash
# list available scaffolds
b2c scaffold list

# generate a new cartridge
b2c scaffold cartridge --name app_custom

# preview without creating files
b2c scaffold cartridge --name app_custom --dry-run
```

## Built-in Scaffolds

The CLI includes scaffolds for common B2C development tasks:

| Scaffold | Category | Description |
|----------|----------|-------------|
| `cartridge` | cartridge | Complete B2C cartridge with standard directory structure |
| `controller` | cartridge | SFRA controller with route handlers and middleware |
| `hook` | cartridge | Hook implementation with hooks.json registration |
| `service` | cartridge | B2C web service using LocalServiceRegistry |
| `custom-api` | cartridge | Custom SCAPI endpoint with OAS 3.0 schema |
| `job-step` | cartridge | Custom job step with steptypes.json registration |
| `page-designer-component` | cartridge | Page Designer component with meta/script/template |

## Using Scaffolds

### Interactive Mode

By default, scaffolds prompt for required parameters:

```bash
b2c scaffold generate cartridge
# ? Cartridge name: app_custom
# ? Include controllers? Yes
# ...
```

### Non-Interactive Mode

Use `--force` to skip prompts and use default values:

```bash
b2c scaffold generate cartridge --name app_custom --force
```

### Providing Parameters

Pass parameters with `--option`:

```bash
b2c scaffold generate controller \
  --option controllerName=Account \
  --option cartridgeName=app_custom \
  --option routes=Show,Submit
```

The `--name` flag is a shorthand for the primary name parameter:

```bash
# these are equivalent
b2c scaffold cartridge --name app_custom
b2c scaffold cartridge --option cartridgeName=app_custom
```

### Preview Changes

Use `--dry-run` to see what files would be created without writing them:

```bash
b2c scaffold generate controller --name Account --dry-run
# Would create: cartridges/app_custom/cartridge/controllers/Account.js
# Would create: cartridges/app_custom/cartridge/templates/default/account/account.isml
```

### Output Directory

By default, scaffolds generate files relative to the current directory. Use `--output` to specify a different location:

```bash
b2c scaffold generate cartridge --name app_custom --output ./src
```

Some scaffolds have default output directories (e.g., `cartridge` defaults to `cartridges/`).

## Scaffold Details

### cartridge

Creates a complete B2C cartridge with standard SFRA directory structure.

**Parameters:**
- `cartridgeName` (required) - Cartridge name (e.g., `app_custom`)
- `includeControllers` - Include controllers directory (default: true)
- `includeModels` - Include models directory (default: true)
- `includeScripts` - Include scripts directory (default: true)
- `includeTemplates` - Include templates directory (default: true)
- `includeStatic` - Include static directory (default: false)

```bash
b2c scaffold cartridge --name app_custom
```

### controller

Creates an SFRA controller with route handlers and optional middleware.

**Parameters:**
- `controllerName` (required) - Controller name in PascalCase (e.g., `Account`)
- `cartridgeName` (required) - Target cartridge (auto-discovered from project)
- `routes` (required) - Route handlers to create: Show, Submit, JSON, SubmitJSON
- `useMiddleware` - Include middleware guards (default: true)
- `includeTemplate` - Create corresponding ISML template (default: true)

```bash
b2c scaffold controller \
  --option controllerName=Account \
  --option cartridgeName=app_custom \
  --option routes=Show,Submit
```

### hook

Creates a hook implementation with automatic hooks.json registration.

**Parameters:**
- `hookName` (required) - Hook function name in camelCase
- `hookType` (required) - Hook type: ocapi, scapi, or system
- `hookPoint` (required) - Extension point (auto-discovered list)
- `cartridgeName` (required) - Target cartridge

```bash
b2c scaffold hook \
  --option hookName=validateBasket \
  --option hookType=ocapi \
  --option hookPoint=dw.ocapi.shop.basket.beforePOST \
  --option cartridgeName=app_custom
```

### service

Creates a B2C Commerce web service using LocalServiceRegistry.

**Parameters:**
- `serviceName` (required) - Service name in PascalCase (e.g., `PaymentGateway`)
- `cartridgeName` (required) - Target cartridge (auto-discovered from project)
- `serviceType` (required) - Service type: HTTP, SOAP, SFTP (default: HTTP)
- `authType` - Authentication method: NONE, BASIC, BEARER, API_KEY (default: NONE, HTTP only)
- `includeErrorHandling` - Include robust error handling (default: true)
- `includeMocking` - Include mock callback for testing (default: false)

```bash
b2c scaffold service \
  --option serviceName=PaymentGateway \
  --option cartridgeName=app_custom \
  --option serviceType=HTTP \
  --option authType=BASIC
```

### custom-api

Creates a Custom SCAPI endpoint with OAS 3.0 schema.

**Parameters:**
- `apiName` (required) - API name in kebab-case (e.g., `my-api`)
- `apiType` (required) - API type: shopper or admin (default: shopper)
- `apiDescription` - API description
- `cartridgeName` (required) - Target cartridge
- `includeExampleEndpoints` - Include example endpoints (default: true)

```bash
b2c scaffold custom-api \
  --option apiName=loyalty-points \
  --option apiType=shopper \
  --option cartridgeName=app_custom
```

### job-step

Creates a custom job step with steptypes.json registration.

**Parameters:**
- `stepId` (required) - Step ID (e.g., `custom.ImportProducts`)
- `stepType` (required) - Step type: task or chunk (default: task)
- `stepDescription` - Step description
- `cartridgeName` (required) - Target cartridge

```bash
b2c scaffold job-step \
  --option stepId=custom.ImportProducts \
  --option stepType=chunk \
  --option cartridgeName=app_custom
```

### page-designer-component

Creates a Page Designer component with meta JSON, script, and template.

**Parameters:**
- `componentId` (required) - Component ID in camelCase
- `componentName` (required) - Display name
- `componentGroup` (required) - Component group: content, commerce, layouts, custom
- `hasRegions` - Support nested components (default: false)
- `cartridgeName` (required) - Target cartridge

```bash
b2c scaffold page-designer-component \
  --option componentId=heroCarousel \
  --option componentName="Hero Carousel" \
  --option componentGroup=content \
  --option cartridgeName=app_custom
```

## Creating Custom Scaffolds

You can create your own scaffolds for project-specific patterns.

### Scaffold Locations

Scaffolds are discovered from multiple locations (later sources override earlier ones with the same ID):

1. **Built-in** - Included with the CLI
2. **User** - `~/.b2c/scaffolds/` (personal scaffolds)
3. **Project** - `.b2c/scaffolds/` (project-specific scaffolds)
4. **Plugin** - Provided by installed plugins

### Initialize a New Scaffold

Use `scaffold init` to create the scaffold structure:

```bash
# create a project-local scaffold
b2c scaffold init my-component --project

# create a user scaffold
b2c scaffold init my-component --user
```

This creates:
```
.b2c/scaffolds/my-component/
├── scaffold.json      # Manifest defining parameters and files
└── files/
    └── example.txt.ejs  # Template file
```

### Scaffold Manifest

The `scaffold.json` manifest defines the scaffold:

```json
{
  "name": "my-component",
  "displayName": "My Component",
  "description": "Creates a custom component",
  "category": "cartridge",
  "version": "1.0",
  "tags": ["component", "custom"],
  "defaultOutputDir": "cartridges",
  "parameters": [
    {
      "name": "componentName",
      "prompt": "Component name",
      "type": "string",
      "required": true,
      "pattern": "^[A-Z][a-zA-Z0-9]*$",
      "validationMessage": "Must be PascalCase"
    },
    {
      "name": "cartridgeName",
      "prompt": "Target cartridge",
      "type": "string",
      "required": true,
      "source": "cartridges"
    },
    {
      "name": "includeTests",
      "prompt": "Include test files?",
      "type": "boolean",
      "required": false,
      "default": true
    }
  ],
  "files": [
    {
      "template": "component.js.ejs",
      "destination": "{{cartridgeName}}/cartridge/scripts/{{kebabCase componentName}}.js"
    },
    {
      "template": "test.js.ejs",
      "destination": "{{cartridgeName}}/test/{{kebabCase componentName}}.test.js",
      "condition": "includeTests"
    }
  ],
  "postInstructions": "Component created! Add to your cartridge path."
}
```

### Parameter Types

| Type | Description | Options |
|------|-------------|---------|
| `string` | Text input | `pattern`, `validationMessage` |
| `boolean` | Yes/no choice | `default` |
| `choice` | Single selection | `choices` array |
| `multi-choice` | Multiple selections | `choices` array |

#### Dynamic Sources

Parameters can be populated from dynamic sources:

```json
{
  "name": "cartridgeName",
  "prompt": "Select cartridge",
  "type": "choice",
  "source": "cartridges"
}
```

Available sources:
- `cartridges` - Discovers cartridges in the project via `.project` files
- `hook-points` - Common B2C hook extension points
- `sites` - Sites from the connected B2C instance (requires authentication)

#### Conditional Parameters

Show parameters based on other parameter values:

```json
{
  "name": "hookPoint",
  "prompt": "Select hook point",
  "type": "choice",
  "source": "hook-points",
  "when": "hookType=system"
}
```

### Template Files

Template files use [EJS](https://ejs.co/) syntax and are stored in the `files/` directory:

```javascript
// files/component.js.ejs
'use strict';

/**
 * <%= componentName %> component
 * Created: <%= date %>
 */

var Component = {
    name: '<%= kebabCase(componentName) %>',

    <% if (includeLogging) { %>
    log: function(message) {
        require('dw/system/Logger').info(message);
    },
    <% } %>

    execute: function() {
        // Implementation
    }
};

module.exports = Component;
```

### Template Helpers

These helpers are available in templates and path patterns:

| Helper | Description | Example |
|--------|-------------|---------|
| `kebabCase(str)` | Convert to kebab-case | `my-component` |
| `camelCase(str)` | Convert to camelCase | `myComponent` |
| `pascalCase(str)` | Convert to PascalCase | `MyComponent` |
| `snakeCase(str)` | Convert to snake_case | `my_component` |
| `year` | Current year | `2025` |
| `date` | Current date (YYYY-MM-DD) | `2025-02-01` |
| `uuid()` | Generate a UUID v4 | `550e8400-e29b-41d4-a716-446655440000` |

### File Mappings

The `files` array maps templates to output paths:

```json
{
  "files": [
    {
      "template": "controller.js.ejs",
      "destination": "{{cartridgeName}}/cartridge/controllers/{{controllerName}}.js",
      "condition": "includeControllers",
      "overwrite": "prompt"
    }
  ]
}
```

| Property | Description |
|----------|-------------|
| `template` | Path to template in `files/` directory |
| `destination` | Output path with `{{variable}}` substitution |
| `condition` | Conditional expression (optional) |
| `overwrite` | Behavior if file exists: `never`, `always`, `prompt`, `merge` |

Path templates support the same helpers:

```json
{
  "destination": "{{cartridgeName}}/cartridge/scripts/{{kebabCase componentName}}.js"
}
```

### File Modifications

Modify existing files instead of creating new ones:

```json
{
  "modifications": [
    {
      "target": "{{cartridgeName}}/cartridge/hooks.json",
      "type": "json-merge",
      "jsonPath": "hooks",
      "contentTemplate": "hooks-entry.json.ejs"
    },
    {
      "target": "{{cartridgeName}}/cartridge/package.json",
      "type": "insert-after",
      "marker": "\"dependencies\": {",
      "content": "    \"my-dep\": \"^1.0.0\","
    }
  ]
}
```

| Modification Type | Description |
|-------------------|-------------|
| `json-merge` | Merge JSON objects at `jsonPath` |
| `insert-after` | Insert content after `marker` string |
| `insert-before` | Insert content before `marker` string |
| `append` | Append content to end of file |
| `prepend` | Prepend content to start of file |

### Post Instructions

Display instructions after generation:

```json
{
  "postInstructions": "Component <%= componentName %> created!\n\nNext steps:\n1. Add <%= cartridgeName %> to your cartridge path\n2. Run `b2c code deploy` to upload"
}
```

Post instructions support EJS templates.

### Validation

Validate your scaffold before use:

```bash
b2c scaffold validate ./.b2c/scaffolds/my-component
```

This checks:
- Required manifest fields
- Parameter definitions
- Template file existence
- EJS syntax errors

## Scaffold Discovery Priority

When multiple scaffolds have the same ID, later sources take precedence:

1. Built-in scaffolds (lowest priority)
2. Plugin-provided scaffolds
3. User scaffolds (`~/.b2c/scaffolds/`)
4. Project scaffolds (`.b2c/scaffolds/`) (highest priority)

This allows you to override built-in scaffolds with project-specific versions.

## Programmatic Usage (SDK)

The scaffold functionality is also available as a programmatic API for IDE integrations, MCP servers, and custom tooling.

### Discovery and Generation

```typescript
import {
  createScaffoldRegistry,
  generateFromScaffold,
  resolveScaffoldParameters,
  parseParameterOptions,
  resolveOutputDirectory,
} from '@salesforce/b2c-tooling-sdk/scaffold';

// Create registry and discover scaffolds
const registry = createScaffoldRegistry();
const scaffolds = await registry.getScaffolds({ projectRoot: '/path/to/project' });
const scaffold = await registry.getScaffold('service', { projectRoot: '/path/to/project' });

// Parse command-line style options
const providedVariables = parseParameterOptions(
  ['serviceName=PaymentGateway', 'serviceType=HTTP'],
  scaffold
);

// Resolve parameters (validate, apply defaults, resolve sources)
const resolved = await resolveScaffoldParameters(scaffold, {
  providedVariables,
  projectRoot: '/path/to/project',
  useDefaults: true,  // Apply defaults for missing optional params
});

// Check for errors or missing required parameters
if (resolved.errors.length > 0) {
  console.error('Validation errors:', resolved.errors);
}
if (resolved.missingParameters.length > 0) {
  console.log('Missing parameters:', resolved.missingParameters.map(p => p.name));
}

// Resolve output directory
const outputDir = resolveOutputDirectory({
  outputDir: undefined,  // Optional explicit override
  scaffold,
  projectRoot: '/path/to/project',
});

// Generate files
const result = await generateFromScaffold(scaffold, {
  outputDir,
  variables: resolved.variables,
  dryRun: false,
  force: false,
});

console.log('Generated files:', result.files);
console.log('Post instructions:', result.postInstructions);
```

### Parameter Schema Discovery

For building dynamic UIs or input schemas:

```typescript
import { getParameterSchemas } from '@salesforce/b2c-tooling-sdk/scaffold';

// Get parameter schemas with resolved choices
const schemas = await getParameterSchemas(scaffold, {
  projectRoot: '/path/to/project',
});

for (const schema of schemas) {
  console.log(`${schema.parameter.name}: ${schema.parameter.type}`);
  if (schema.resolvedChoices) {
    console.log('  Choices:', schema.resolvedChoices.map(c => c.value));
  }
  if (schema.warning) {
    console.log('  Warning:', schema.warning);
  }
}
```

### Validation

```typescript
import {
  validateScaffoldDirectory,
  validateEjsSyntax,
} from '@salesforce/b2c-tooling-sdk/scaffold';

// Validate a scaffold directory
const result = await validateScaffoldDirectory('/path/to/scaffold', {
  strict: false,  // Set true to treat warnings as errors
});

console.log('Valid:', result.valid);
console.log('Errors:', result.errors);
console.log('Warnings:', result.warnings);
for (const issue of result.issues) {
  console.log(`${issue.severity}: ${issue.message} (${issue.file})`);
}

// Validate EJS template syntax directly
const ejsIssues = validateEjsSyntax('<%= name %>', 'template.ejs');
```
