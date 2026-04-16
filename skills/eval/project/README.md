# B2C Commerce Storefront

Custom cartridge development for our Salesforce B2C Commerce (SFCC) storefront.

## Project Structure

```
cartridges/
  app_storefront_custom/    - Our custom storefront cartridge
    cartridge/
      controllers/          - SFRA controllers
      models/               - Business logic models
      scripts/              - Server-side scripts, hooks, job steps
      templates/default/    - ISML templates
dw.json                     - Instance configuration
```

## Development

This project extends SFRA (Storefront Reference Architecture) with custom functionality including loyalty features, custom checkout steps, and integration with external services.

### Instances

Configure your sandbox connection in `dw.json`. See the B2C CLI documentation for setup instructions.
