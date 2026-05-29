---
'b2c-vs-extension': patch
---

Make the published VSIX OPC-compliant by declaring a content type for `.ts` files (introduced by the bundled Script API types). The packaging step now patches `[Content_Types].xml` after injection so every file extension in the archive has a registered content type. Strict OPC consumers — observed on some Windows installs — may otherwise reject the package.
