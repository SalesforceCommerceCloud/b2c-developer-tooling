# Figma Component Editing Reference

## 0. Extend before create — check this before building anything new

When a design change is requested, ask these questions in order before creating any new frame or component:

1. **Does an existing Figma component already cover this?** Search by name across all pages.
2. **Can the existing component be extended with a new variant or property?** Add a variant to the component set first.
3. **Can composition cover this?** Place the existing component inside a new wrapper frame with additional content alongside it.
4. **Only if all three are no** — create a new component or frame.

```
// ❌ WRONG — building a new "<Brand> Button" component from scratch
//            when the existing .Button component set can take a new variant

// ✅ CORRECT — add a variant="<brand>" to the existing .Button component set

// ❌ WRONG — creating a new "<Brand> Product Gallery" component
//            when the existing Gallery=Carousel just needs a wrapper with a row below it

// ✅ CORRECT — wrap Gallery=Carousel in a "Gallery Column" frame,
//             append the new row to the wrapper only
```

This maps to code: new Figma variants → new CVA variants in React. New Figma compositions → new composite components in `src/components/`. Keep design and code in sync.

## 1. Identify the correct edit layer before touching anything

| Layer | What lives here | Safe to edit for vertical changes? |
|-------|-----------------|-----------------------------------|
| **Primitive** (atom) | Icon, Button, Badge, Input | No — shared across all verticals |
| **Composite** (organism) | ProductGallery, Header, ProductOverviews | Only if the change is universal |
| **Page composition** | StorefrontHome, ProductPage sections | Yes — the right place for vertical-specific additions |

**Never add vertical-specific elements to a primitive or shared composite.** Add them at the page composition level or wrap in a new parent frame.

## 2. Tokens and variables only — never bespoke color values

Every fill, stroke, and effect applied to a new or edited node **must reference a Figma variable** from the kit's variable collections. Raw hex/RGB values and opacity overrides are forbidden.

```js
// ❌ WRONG — hardcoded hex on a new text node
node.fills = [{ type: 'SOLID', color: { r: 0, g: 0.608, b: 0.227 } }]

// ✅ CORRECT — bind to the semantic variable
const colorVar = await figma.variables.getVariableByIdAsync(semanticGreenId);
figma.variables.setBoundVariableForPaint(fill, 'color', colorVar);
```

### Variable lookup order

1. **Semantic collection first** — `text/foreground`, `background/primary`, `status/positive`, etc.
2. **Brand collection second** — `Brand/primary`, `Brand/black`, `Brand/gray-*` — only if no semantic alias fits.
3. **New variable needed?** — Stop and ask before creating it. State which node needs it, why no existing variable fits, and the proposed name/value.

| Element | Correct variable | Collection |
|---------|------------------|------------|
| Body text | `text/foreground` | Semantic |
| Secondary / meta text | `text/muted-foreground` | Semantic |
| Primary button fill | `background/primary` | Semantic |
| Primary button label | `text/primary-foreground` | Semantic |
| Card surface | `background/card` | Semantic |
| Dividers / borders | `border/border` | Semantic |
| Brand accent (vertical signature color) | `Brand/primary` | Brand |
| Brand black | `Brand/black` | Brand |

## 3. Instance vs. component boundary

- You **cannot** append children to an INSTANCE node — always find and edit the **source COMPONENT**.
- Use `node.mainComponent` to find the source from any instance.
- To add new content alongside an instance, wrap the instance in a new VERTICAL/HORIZONTAL frame.

## 4. Batch ALL font loads at the top of every script

```js
// Font errors abort mid-script and leave partial state — load everything first.
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
await figma.loadFontAsync({ family: 'Jost', style: 'Black' });
```

## 5. Figma Plugin API enum values

| Property | ❌ Wrong | ✅ Correct |
|----------|---------|-----------|
| `primaryAxisSizingMode` | `'HUG'` | `'AUTO'` |
| `counterAxisSizingMode` | `'HUG'` | `'AUTO'` |
| `layoutSizingHorizontal` | `'HUG'` | `'AUTO'` or `'FILL'` |

## 6. Screenshot after each logical edit — not at the end

Take a screenshot after each distinct change (logo, token sync, a new row). Catching a wrong-layer mistake early avoids unwinding compound changes.
