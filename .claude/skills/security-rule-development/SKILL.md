---
name: security-rule-development
description: Adding or changing rules for b2c security scan (the SDK security module). Use when adding a new security rule, tuning a rule's false positives or negatives from a real-world case, writing rule fixtures, or changing the rule runner, suppressions, baselines, or SARIF output.
metadata:
  internal: true
---

# Security Rule Development

Security rules live in `packages/b2c-tooling-sdk/src/security/`. Each rule is an ESLint v9 rule, so the same object runs in three places: the SDK runner (used by `b2c security scan`, MCP, and the VS Code extension), ESLint, and oxlint's JS plugins. Tests run every rule under all three.

## Add a rule

1. **Create `src/security/rules/<rule-id>.ts`** with `defineScriptRule`:

   ```typescript
   import {defineScriptRule} from '../rule.js';
   import {isRequestDerived, propertyName} from '../script/helpers.js';

   export default defineScriptRule({
     id: 'my-rule', // kebab-case, no slashes; a public contract once released
     severity: 'medium', // critical | high | medium | low | info
     confidence: 'medium', // how sure a finding is real; low = needs human or agent judgment
     category: 'injection', // see SecurityCategory in types.ts
     cwe: ['CWE-79'],
     description: 'One sentence: what the rule finds.',
     remediation: 'How to fix a finding.',
     create(context) {
       return {
         CallExpression(node) {
           if (propertyName(node.callee) === 'writeRaw' && isRequestDerived(node.arguments[0], context.sourceCode)) {
             context.report({node, message: 'Specific, actionable message.'});
           }
         },
       };
     },
   });
   ```

2. **Register it** in `src/security/rules/index.ts` (`SCRIPT_RULES`).
3. **Add fixtures** in `test/security/fixtures/<rule-id>/`. Every `.js` file under the directory is a fixture:
   - End every line that should produce a finding with `// expect`. The finding's start line must be the marked line.
   - Files without markers must produce no findings. Include the safe versions and near-misses the rule must not flag.
   - Single-file rules use `bad.js` and `good.js`. Cross-file rules add a `project/` tree with cartridges (folders with a `.project` file) and a `project/project.json` of `{"cartridgePath": [...]}`; the harness builds the project index from the rule's directory and passes it to every runner.
   - Base fixtures on real storefront code where possible (SFRA, SiteGenesis, Storefront Next cartridges). The reference storefronts are not assumed to be clean: judge findings there on their merits.
4. **Document it** with a `## <rule-id>` section in `docs/guide/security-rules.md` (severity, confidence, CWE, what it finds, a finding/fix example) and a row in the table at the top. Regenerate the tooling index (`pnpm --filter @salesforce/b2c-tooling-sdk run generate:tooling-index`).
5. **Update the user skill** fix table in `skills/b2c-cli/skills/b2c-security/SKILL.md`.
6. **Run** `pnpm --filter @salesforce/b2c-tooling-sdk exec mocha "test/security/**/*.test.ts"`. The harness checks the ID format, fixtures, docs section, and that the SDK runner, ESLint, and oxlint all report exactly the marked lines.
7. **Add a changeset** (`@salesforce/b2c-tooling-sdk` and `@salesforce/b2c-cli`, minor for a new rule).

## Metadata rules

Rules over site import/export data live in `src/security/metadata/rules/` and are registered in `METADATA_RULES`. They don't run in ESLint or oxlint, but share findings, suppressions, baselines, and SARIF with script rules.

```typescript
import {defineMetadataRule} from '../types.js';
import {childNamed, descendantsNamed} from '../xml.js';

export const myRule = defineMetadataRule({
  id: 'service-something',
  severity: 'medium',
  confidence: 'high',
  category: 'config',
  cwe: ['CWE-16'],
  description: 'What it finds.',
  remediation: 'How to fix it.',
  kinds: ['services'], // services | preferences | metadata | csrf-allowlist | ocapi-settings
  check(document, report) {
    if (document.format !== 'xml') return;
    for (const service of descendantsNamed(document.root, 'service')) {
      const flag = childNamed(service, 'some-flag');
      if (flag?.text === 'true') report({line: flag.line, column: flag.column, message: '...'});
    }
  },
});
```

- XML elements have local `name`, `attributes`, trimmed `text`, `line`, `column`, and `children`. JSON documents (OCAPI settings) have `data` and `text`; locate lines with `jsonKeyLines(text, key, value)`.
- To read a new file kind, add its XML root element (or file name rule) to `detectMetadataKind()` in `src/security/metadata/run.ts`.
- Fixtures go in `test/security/fixtures/<rule-id>/bad/` and `good/` with real file names (`services.xml`, `wapi_shop_config.json`). Mark XML lines with `<!-- expect -->` at the end of the line; for JSON, list expected line numbers in a sidecar `<file>.expect`.

## Rule API: what you may use

Rules must run identically in all three runners, so stick to this subset:

- Visitors keyed by ESTree node type, plus `'<Type>:exit'`. **No selector syntax** (`CallExpression > Identifier`).
- `node.parent` (set on every node).
- `context.report({node, message})`. No `messageId`, `data`, `fix`, or `suggest`.
- `context.sourceCode.getText(node)`, `.getScope(node)`, `.getAncestors(node)`, `.ast`, `.text`.
- `context.filename`, `context.settings`, `context.options` (no rule options are configured today).

Rules must not:

- **Depend on the top-level scope's `type`.** ESLint wraps CommonJS files in a `function` scope; oxlint reports `global`. Look variables up by name with `findVariable()`, which walks `scope.upper`.
- **Keep state across files.** oxlint runs rules on worker threads. Collect per-file state in `create()` and report in `'Program:exit'`.
- **Read the filesystem.** Cross-file facts come from the project index (`@salesforce/b2c-tooling-sdk/project-index`) that runners pass as `context.settings.b2cSecurity.projectIndex`. Read it with `projectIndexOf(context)` from `script/project.ts`, match files with `isIndexedFile()`/`endpointForStatement()` (suffix matching on `<cartridge>/<relPath>`, so paths from any runner work), and keep working without it: ESLint and oxlint users may not pass an index.

## Helpers (`src/security/script/helpers.ts`)

| Helper                                                   | Use                                                                                                                                       |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `requireSpecifier(node)`                                 | `'dw/web/Cookie'` for `require('dw/web/Cookie')`                                                                                          |
| `requiredModuleOf(identifier, sourceCode)`               | The module a variable was bound to with `require`                                                                                         |
| `memberChain(node)` / `propertyName(node)`               | `['req', 'querystring', 'url']` / the property name of a member expression                                                                |
| `calleeName(call)`                                       | Method or function name of a call                                                                                                         |
| `isRequestDerived(node, sourceCode, options)`            | Whether a value carries request input (`req.querystring`, `request.httpParameterMap`, ...), through string operations and local variables |
| `isDynamicString(node)`                                  | Concatenation, template literal with expressions, or `.concat()`                                                                          |
| `concatenationParts(node)`                               | Operands of a concatenation or template literal, in order                                                                                 |
| `collectCheckedVariables(sourceCode)`                    | Variables passed to a call inside an `if`/ternary test (a light "was validated" signal)                                                   |
| `findVariable(scope, name)` / `assignedValues(variable)` | Resolve identifiers and the values assigned to them                                                                                       |

Route recognizers in `src/security/script/routes.ts`, shared with the project index:

| Helper                                                      | Use                                                                                                                                                                                                 |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sfraRouteCall(node, sourceCode)`                           | `server.get/post/use/replace/append/prepend('Name', ...chain)` with each middleware identified (`csrf.validateAjaxRequest`, `server.middleware.https`, `function` with `validatesCsrf`/`readsForm`) |
| `sfraExtendTarget(node, sourceCode)`                        | `server.extend(module.superModule \| require('...'))`                                                                                                                                               |
| `sgControllerExport(node, sourceCode)`                      | `exports.Name = guard.ensure([...filters], action)` and guard shortcuts                                                                                                                             |
| `isCsrfValidator(id)`, `isLoginValidator(id)`               | Classify middleware IDs                                                                                                                                                                             |
| `callsCsrfValidation(fn, sourceCode)`, `readsFormInput(fn)` | In-handler CSRF checks; form submission handling (`req.form`, `handleAction()`)                                                                                                                     |

Extend `REQUEST_SOURCES` or `PASS_THROUGH_METHODS` in `helpers.ts` when a real case shows another input source or string operation; add a fixture line that covers it.

## Tuning from a real case

1. Reduce the case to a few lines and add it to `bad.js` (missed finding) or `good.js` (false positive).
2. Run the tests and watch it fail.
3. Fix the rule or helper. Prefer narrowing by Script API or framework idiom (for example, a fixed origin in a redirect) over broad name heuristics.
4. Scan the reference storefronts (SFRA, SiteGenesis) and check that the change adds no noise:

   ```bash
   cd path/to/storefront-reference-architecture && b2c security scan
   ```

## Severity and confidence

- **Severity** is the impact if the finding is real: `critical` (remote takeover, data exposure at scale), `high` (injection, credential exposure), `medium` (redirects, weak crypto), `low` (hardening such as cookie flags), `info`.
- **Confidence** is how often a finding is real: `high` (the pattern is the problem, such as `eval`), `medium` (usually real, sometimes validated elsewhere), `low` (needs judgment, such as "is this logged value personal data").

## Other pieces

- `script/runner.ts`: parses with espree (CommonJS, falling back to modules) and eslint-scope, sets `parent`, and dispatches visitors.
- `suppressions.ts`: `b2c-dx-disable-next-line` / `b2c-dx-disable-line` comments; IDs required, `-- reason` optional.
- `baseline.ts`: fingerprints from rule, file, and trimmed line text plus an occurrence index.
- `sarif.ts`: SARIF 2.1.0 with `security-severity` for GitHub code scanning.
- `eslint-plugin.ts`: the rules as an ESLint/oxlint plugin (`b2c-security/<rule-id>`); not exported from the package yet.
