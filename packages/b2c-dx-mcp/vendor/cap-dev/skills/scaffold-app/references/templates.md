# Inline Code Templates

Use these templates when the template files in `assets/templates/` don't cover a specific file type.

## Helper Template

For backend apps, create `cartridges/site_cartridges/<cartridgeName>/cartridge/scripts/helpers/<appName>Helper.js`:

```javascript
'use strict';

function processRequest(params) {
    var Logger = require('dw/system/Logger');
    var logger = Logger.getLogger('{{appName}}', 'helper');

    try {
        // TODO: Implement helper logic
        return { success: true, data: {} };
    } catch (e) {
        logger.error('Error: {0}', e.message);
        throw e;
    }
}

module.exports = { processRequest: processRequest };
```

## Unit Test Template

For backend apps, create `cartridges/site_cartridges/<cartridgeName>/test/unit/<appName>Helper.test.js`:

```javascript
'use strict';

const helper = require('../../cartridge/scripts/helpers/<appName>Helper');

describe('<appName>Helper', () => {
    describe('processRequest', () => {
        it('should process request successfully', () => {
            const params = {};
            const result = helper.processRequest(params);
            expect(result.success).toBe(true);
        });
    });
});
```

## Tasks Configuration

If app needs configuration tasks, create `app-configuration/tasksList.json`:

```json
{
  "tasks": [
    {
      "id": "configure-service",
      "title": "Configure Service Credentials",
      "description": "Set up API credentials for {{displayName}} service",
      "required": true
    },
    {
      "id": "configure-preferences",
      "title": "Configure Site Preferences",
      "description": "Set site-specific preferences for {{displayName}}",
      "required": true
    },
    {
      "id": "test-integration",
      "title": "Test Integration",
      "description": "Verify the integration is working correctly",
      "required": true
    }
  ]
}
```

## Storefront Next Plugin Extensions

**⚠️ For UI/Fullstack apps, see `storefront-plugin-templates.md` for complete plugin extension templates.**

The storefront-next plugin system requires:
- TypeScript (.tsx) for all components
- `plugin-config.json` (not target-config.json)
- `index.ts` barrel file
- Proper test (.test.tsx) and story (.stories.tsx) files
- Nested locale structure: `locales/en-US/translations.json`
- Context providers registered in plugin-config.json

## .gitignore

Ensure repository root has:

```gitignore
# Commerce App - Extracted directories (DO NOT COMMIT)
**/commerce-*-app-*/

# System files
.DS_Store
__MACOSX/
Thumbs.db

# IDE
.vscode/
.idea/
```
