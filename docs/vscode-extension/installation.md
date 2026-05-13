---
description: Install the B2C DX VS Code Extension from a pre-built .vsix release artifact.
---

<script setup>
import {data as release} from './release.data.ts';
</script>

# Installation

::: warning Not on the Marketplace yet
The extension isn't on the VS Code or Open VSX marketplaces yet. For now, grab the latest build from GitHub and install it manually — it only takes a minute.
:::

## Get the latest build

<div v-if="!release.unavailable">

Latest version: **{{ release.version }}** (released {{ new Date(release.publishedAt).toLocaleDateString(undefined, {dateStyle: 'medium'}) }}).

<p>
  <a :href="release.vsixDownloadUrl" class="vp-button">Download {{ release.vsixAssetName }}</a>
  <a :href="release.releasePageUrl" style="margin-left: 0.75rem">See what's new</a>
</p>

</div>
<div v-else>

We couldn't find a published build right now. Head over to the [releases page]({{ release.fallbackUrl }}) and grab the latest `b2c-vs-extension@*` tag.

</div>

## Install it

Once you've got the file, install it from the command line or from the Extensions view in VS Code.

::: code-group

```bash [VS Code]
code --install-extension b2c-vs-extension-X.Y.Z.vsix
```

```bash [Cursor]
cursor --install-extension b2c-vs-extension-X.Y.Z.vsix
```

```text [Extensions view]
1. Open the Extensions view (Cmd+Shift+X / Ctrl+Shift+X)
2. Click the "..." menu in the view header
3. Choose "Install from VSIX..."
4. Pick the file you just downloaded
```

:::

<!-- TODO(screenshot): replace ./images/install-vsix.svg with ./images/install-vsix.png — "Install from VSIX..." command palette entry -->
![Install from VSIX](./images/install-vsix.png)

Reload the window when prompted. You'll see new **B2C-DX**, **B2C-DX: SCAPI**, and **B2C-DX Sandboxes** icons in the activity bar.

## Before you start

A few things to have ready:

- **VS Code 1.105 or newer** (Cursor and VS Codium work too).
- **The B2C CLI** installed — `npm install -g @salesforce/b2c-cli`. The extension uses it under the hood for some workflows. See the [CLI Installation guide](../guide/installation) for other install options.

## Connect to your sandbox

The extension uses the same connection your CLI already uses, so most of the time there's nothing more to set up. Different features need different credentials though — see [Connecting to your sandbox](./configuration#connecting-to-a-b2c-instance) for what each one needs and a copy-paste example.

New here? The [Authentication Setup guide](../guide/authentication) walks through getting your credentials in the first place.

## Next Steps

- [Overview](./) — what the extension can do.
- [Connecting to your sandbox](./configuration#connecting-to-a-b2c-instance) — what each feature needs.
