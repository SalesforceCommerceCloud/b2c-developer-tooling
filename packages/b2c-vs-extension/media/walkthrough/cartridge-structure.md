# Cartridge Development

Cartridges are the building blocks of B2C Commerce applications. The extension automatically detects cartridges in your workspace.

## What is a Cartridge?

A cartridge is a modular unit of code that contains:
- **Scripts**: Server-side JavaScript (ISML templates, controllers)
- **Static assets**: CSS, JavaScript, images
- **Templates**: ISML templates for rendering pages
- **Forms and metadata**: XML configuration files

## Cartridge Structure

A typical cartridge looks like this:

```
my_cartridge/
├── .project                 ← Required for detection!
├── cartridge/
│   ├── scripts/             ← Server-side scripts
│   ├── templates/           ← ISML templates
│   ├── static/              ← CSS, JS, images
│   │   ├── default/
│   │   │   ├── css/
│   │   │   ├── js/
│   │   │   └── images/
│   ├── controllers/         ← Page controllers
│   ├── models/              ← Business logic
│   └── forms/               ← Form definitions
└── package.json             ← Node.js dependencies (optional)
```

## How Cartridges are Detected

The extension looks for folders containing a **`.project`** file. This is the Eclipse project file that identifies a cartridge.

### Sample `.project` File

```xml
<?xml version="1.0" encoding="UTF-8"?>
<projectDescription>
    <name>my_cartridge</name>
    <comment></comment>
    <projects></projects>
    <buildSpec>
        <buildCommand>
            <name>com.demandware.studio.core.beehiveElementBuilder</name>
            <arguments></arguments>
        </buildCommand>
    </buildSpec>
    <natures>
        <nature>com.demandware.studio.core.beehiveNature</nature>
    </natures>
</projectDescription>
```

## Creating a New Cartridge

### Option 1: Use the Scaffold Generator
Click **Create New Cartridge** above to use the built-in scaffold generator.

### Option 2: Manual Creation
1. Create a new folder in your workspace
2. Add a `.project` file (see example above)
3. Create the `cartridge/` directory structure
4. Click **Refresh Cartridge List**

## Viewing Your Cartridges

Open the **Cartridges** view in the B2C-DX activity bar to see all detected cartridges.

### Cartridge Actions

Right-click a cartridge to:
- 📤 **Upload Cartridge**: Deploy to your instance
- 📥 **Download from Instance**: Sync remote version to local
- ↔️ **Compare with Instance**: See differences
- ➕ **Add to Site Cartridge Path**: Add to site's cartridge path
- ➖ **Remove from Site Cartridge Path**: Remove from cartridge path

## Multiple Cartridges

Your workspace can contain multiple cartridges. The extension will detect all of them automatically.

```
workspace/
├── cartridge_1/
│   ├── .project
│   └── cartridge/
├── cartridge_2/
│   ├── .project
│   └── cartridge/
└── cartridge_3/
    ├── .project
    └── cartridge/
```

---

Once cartridges are detected, the **Cartridges** view will open automatically!
