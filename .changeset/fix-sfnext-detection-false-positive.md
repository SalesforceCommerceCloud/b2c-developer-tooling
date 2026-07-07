---
'@salesforce/b2c-tooling-sdk': patch
---

Fix Storefront Next workspace detection misclassifying PWA Kit projects. A PWA Kit app that depends on `@salesforce/storefront-next-runtime` (now common) was incorrectly detected as Storefront Next as well. Detection now keys on the `@salesforce/storefront-next-dev` toolchain dependency, and a positive PWA Kit signal rules out Storefront Next.
