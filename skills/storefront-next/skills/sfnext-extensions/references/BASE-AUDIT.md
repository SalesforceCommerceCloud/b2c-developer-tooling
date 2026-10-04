# Base Audit: Extend, Restyle, or Edit

Use this before building an extension or adding a section to a page. The goal is to decide whether to extend at all, and if so at which layer, so you never ship a component that duplicates something the storefront already renders. You own the whole project, so the choices are about keeping changes small and upgrade-friendly, not about who is allowed to edit what.

## The gate

1. **Find what renders today.** Open the route in `src/routes/` and follow it down to the component for the area you care about.
2. **Check every section you plan to add.** Does the base already render equivalent content there (a description, accordion, badge, banner, title)?
3. **Branch:**
   - Already rendered: change its look or behavior in place, or fill an existing slot next to it. Do not add a parallel component.
   - Not rendered: continue to step 4.
4. **Choose the layer:**

```
Purely visual (color, font, radius, spacing)?
  YES -> Token or component-variant change (storefront-next:sfnext-theming). No extension.
  NO  -> Does a UITarget slot exist where it belongs?
           YES -> Extension filling that slot (this skill).
           NO  -> Is it a one-off for this storefront?
                    YES -> Edit the route or component directly.
                    NO  -> Edit the base component to add a <UITarget> slot (or a render prop),
                           then fill it from an extension.
```

Rule of thumb: extensions add what is missing; they do not recreate what exists. If you keep editing the same base file for the same feature, give it a slot.

## Worked examples (real slots)

Find them with `pnpm extensions:list`. The ids below are from a current project; confirm in yours.

| You want | Already in base? | Layer |
|----------|------------------|-------|
| A "store finder" link beside the cart icon | No; `sfcc.header.before.cart` exists | Extension component on that slot (how the store locator does it) |
| An installment-payment message under the PDP price | No; `sfcc.pdp.bnpl.message` exists | Extension component on that slot (the BNPL demo does this) |
| A reviews section on the PDP | No; `sfcc.pdp.reviews.section` and `sfcc.pdp.reviews.rating` exist | Extension (the ratings and reviews demo) |
| A returns and warranty card on the PDP | Yes: `sfcc.pdp.returnsWarranty` and `sfcc.pdp.collapsibles` already render content | Replace or extend what the product-content extension fills; do not add another card |
| Make the primary button a new color | Button exists | Token change, no extension |
| A denser product tile | Tile exists | New component variant, no extension |
| A promo strip above the header, nothing fits | No slot | Edit the header component, and add a `<UITarget>` if you expect to reuse the seam |
| Block an order when a fraud check fails | Server hook `sfcc.checkout.fraud.beforePlace` exists | Action hook (see [Action Hooks](ACTION-HOOKS.md)), not UI |

### Duplicate section (wrong) vs additive section (right)

```
WRONG: the PDP already renders collapsible product-detail sections. The extension adds its own
       accordion with the same headings -> two copies of the same content.

RIGHT: fill or extend what the existing collapsibles slot renders, or add only sections
       the base lacks.
```

### Restyle, do not re-render

```
WRONG: an extension renders the product title again so it can style it.
RIGHT: adjust the title's token or variant; add only the new line (for example a badge) in a slot.
```

## Finding slots and render points

```bash
pnpm extensions:list              # every UITarget id and action hook id, with where it is used
pnpm extensions:list -- --json    # machine-readable
rg "UITarget" src/ -l             # files that render slots
rg 'targetId="sfcc.pdp' src/      # slots for one area
```

The build fails when `target-config.json` names a `targetId` that no `<UITarget>` renders, so a typo is caught immediately. If no slot suits and the page is yours to change, a direct edit is fine, after running the audit so you do not duplicate existing content.
