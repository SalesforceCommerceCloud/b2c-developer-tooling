# Base Audit Reference

Use this before building an extension or adding a section to a page. The goal is to decide **whether to extend at all**, and if so, **at which layer** — so you never ship a component that duplicates something the base template already renders.

## The gate, step by step

1. **Find the base component.** Open the route in `src/routes/` and trace what it renders down to the section you care about.
2. **Check every rendered section.** For each thing you want to add, ask: does the base already render equivalent content here?
3. **Branch:**
   - **Already rendered** → restyle via token/brand layer or a CVA variant, or inject into a UITarget slot on the existing content. Do **not** create a parallel component.
   - **Not rendered** → an extension (or a base slot) is justified.
4. **Pick the layer for what's genuinely missing:**

   ```
   Purely visual (color, font, spacing)?
     └─ YES → Token / CVA change. No extension.
     └─ NO  → Needed by only one storefront/vertical?
                 └─ YES → Extension at a UITarget slot.
                 └─ NO  → Shared pattern → add a slot/render-prop to the BASE component.
   ```

## Worked examples

### Example 1 — duplicate section (wrong) vs additive section (right)

```
❌ WRONG — base ProductView already renders a description accordion ("What's in it:").
           The extension adds its own "What's in it" section → duplicate content on the PDP.

✅ CORRECT — base already renders description + adapter sections (Ingredients, How to Use…).
             The extension adds ONLY the sections the base does not have
             (e.g. "Shipping & Fresh Guarantee", a brand story block).
```

### Example 2 — restyle, don't re-render

```
❌ WRONG — base renders the product title in ProductInfo.
           A brand "stamp" extension renders the product title again.

✅ CORRECT — the stamp adds ONLY the brand line ("ACME · Handmade")
             above the existing ProductInfo. The title stays where the base renders it.
```

### Example 3 — pick the right layer

| Desired change | Already in base? | Correct layer |
|----------------|------------------|---------------|
| Make the primary button green | Button exists | Token change in `brand.css` (no extension) |
| Add a "compact" tile density | Tile exists | New CVA variant on the tile |
| Add a site-wide promo banner above nav | Not rendered, one storefront only | Extension at `header.before.nav` |
| Add a "sustainability meta" line every storefront will want | Not rendered, shared pattern | Slot / render-prop on the BASE tile/product component |

## Finding the slots and base render points

```bash
# from packages/template-retail-rsc-app — list every UITarget slot in use
rg "UITarget" src/ -l

# read a target file to find its targetId values, e.g.
#   <UITarget targetId="header.before.nav" />
#   <UITarget targetId="pdp.add-to-cart.below" />
```

If no suitable slot exists where you need it and the page is one you own, a direct route edit is acceptable — but still run the audit first so you don't duplicate existing content. Prefer a UITarget slot when one fits.
