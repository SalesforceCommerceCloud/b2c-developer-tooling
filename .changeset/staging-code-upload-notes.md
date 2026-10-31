---
'@salesforce/b2c-agent-plugins': patch
'@salesforce/b2c-dx-docs': patch
---

Setup and code skills, and the Realm Setup guide, now explain that staging code upload normally requires a client certificate (a Salesforce Support CA bundle on legacy realms, or a self-registered eCDN CA on Hyperforce). They also cover the feature switch that Commerce API hooks need and how to reload when an instance has only one code version.
