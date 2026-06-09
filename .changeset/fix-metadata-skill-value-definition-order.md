---
'@salesforce/b2c-agent-plugins': patch
---

Fix `value-definition` element order in the b2c-metadata and b2c-site-import-export skills. The B2C `metadata.xsd` requires `<display>` to appear before `<value>` inside each `<value-definition>`; the skill examples had them reversed, which caused enum/set attribute imports to fail site-archive validation with `cvc-complex-type.2.4.d`. Examples now use the correct order and call out the requirement.
