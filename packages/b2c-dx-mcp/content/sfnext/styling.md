# Styling Guidelines

## Rules

- ✅ **Use Tailwind utility classes** in component JSX
- ✅ **Use `cn()` utility** for conditional classes (`import { cn } from '@/lib/utils'`)
- ✅ **Follow mobile-first** responsive patterns (`md:`, `lg:` breakpoints)
- ❌ **NO inline styles** (`style={{...}}`)
- ❌ **NO CSS modules** (`.module.css` files)
- ❌ **NO separate CSS files** for component styles
- ✅ **Custom CSS** only in `src/app.css` for global styles and theme configuration

## Shadcn/ui Components

**Adding components:**

```bash
npx shadcn@latest add <component-name>
```

**Rules:**

- ✅ **DO** customize components by editing files in `src/components/ui/`
- ❌ **DON'T** create custom components inside `src/components/ui/`
- ❌ **DON'T** manually copy components (use CLI instead)

## Dark Mode

Dark mode is supported via CSS variables and the `.dark` class. Theme variables automatically adapt:

```typescript
<div className="bg-background text-foreground border-border">
    <button className="bg-primary text-primary-foreground">
        Click me
    </button>
</div>
```

## Responsive Design

Follow mobile-first responsive design:

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Content */}
</div>
```

---

**Reference:** See [README-UI-STYLING.md](README-UI-STYLING.md) for complete UI and styling documentation.
