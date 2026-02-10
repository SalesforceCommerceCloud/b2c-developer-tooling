---
name: b2c-scaffold
description: Generate B2C Commerce cartridges, controllers, hooks, custom APIs, job steps, and Page Designer components from scaffold templates.
---

# B2C Scaffold Skill

Use the `b2c scaffold` commands to generate B2C Commerce components from templates.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead.

## Examples

### List Available Scaffolds

```bash
# list all scaffolds
b2c scaffold list

# list only cartridge scaffolds
b2c scaffold list --category cartridge

# show extended info (description, tags)
b2c scaffold list -x
```

### Generate a Cartridge

```bash
# generate interactively
b2c scaffold cartridge

# generate with name
b2c scaffold cartridge --name app_custom

# generate to specific directory
b2c scaffold cartridge --name app_custom --output ./src/cartridges

# skip prompts, use defaults
b2c scaffold cartridge --name app_custom --force

# preview without creating files
b2c scaffold cartridge --name app_custom --dry-run
```

### Generate a Controller

```bash
# generate interactively (prompts for cartridge selection)
b2c scaffold controller

# generate with all options
b2c scaffold controller \
  --option controllerName=Account \
  --option cartridgeName=app_custom \
  --option routes=Show,Submit
```

### Generate a Hook

```bash
# generate a system hook
b2c scaffold hook \
  --option hookName=validateBasket \
  --option hookType=system \
  --option hookPoint=dw.order.calculate \
  --option cartridgeName=app_custom

# generate an OCAPI hook
b2c scaffold hook \
  --option hookName=modifyBasket \
  --option hookType=ocapi \
  --option hookPoint=dw.ocapi.shop.basket.beforePOST \
  --option cartridgeName=app_custom
```

### Generate a Custom API

```bash
# generate a shopper API
b2c scaffold custom-api \
  --option apiName=loyalty-points \
  --option apiType=shopper \
  --option cartridgeName=app_custom

# generate an admin API
b2c scaffold custom-api \
  --option apiName=inventory-sync \
  --option apiType=admin \
  --option cartridgeName=app_custom
```

### Generate a Job Step

```bash
# generate a task-based job step
b2c scaffold job-step \
  --option stepId=custom.CleanupOrders \
  --option stepType=task \
  --option cartridgeName=app_custom

# generate a chunk-based job step
b2c scaffold job-step \
  --option stepId=custom.ImportProducts \
  --option stepType=chunk \
  --option cartridgeName=app_custom
```

### Generate a Page Designer Component

```bash
b2c scaffold page-designer-component \
  --option componentId=heroCarousel \
  --option componentName="Hero Carousel" \
  --option componentGroup=content \
  --option cartridgeName=app_custom
```

### Get Scaffold Info

```bash
# see parameters and usage for a scaffold
b2c scaffold info cartridge
b2c scaffold info controller
```

### Search Scaffolds

```bash
# search by keyword
b2c scaffold search api

# search within a category
b2c scaffold search template --category page-designer
```

### Create Custom Scaffolds

```bash
# create a project-local scaffold
b2c scaffold init my-component --project

# create a user scaffold
b2c scaffold init my-component --user

# validate a custom scaffold
b2c scaffold validate ./.b2c/scaffolds/my-component
```

## Built-in Scaffolds

| Scaffold | Category | Description |
|----------|----------|-------------|
| `cartridge` | cartridge | B2C cartridge with standard structure |
| `controller` | cartridge | SFRA controller with routes and middleware |
| `hook` | cartridge | Hook with hooks.json registration |
| `custom-api` | custom-api | Custom SCAPI with OAS 3.0 schema |
| `job-step` | job | Job step with steptypes.json registration |
| `page-designer-component` | page-designer | Page Designer component |

## Related Skills

- `b2c-cli:b2c-code` - Deploy generated cartridges to B2C instances
- `b2c:b2c-controllers` - SFRA controller patterns and best practices
- `b2c:b2c-hooks` - B2C hook extension points
- `b2c:b2c-custom-api-development` - Custom API development guide
- `b2c:b2c-custom-job-steps` - Job step implementation patterns
- `b2c:b2c-page-designer` - Page Designer component development
