---
id: site-preferences
title: Site Preferences
category: configuration
tags: [preferences, site, configuration, custom]
---

Site preferences are typed key-value pairs scoped to a single site. Use them
for runtime configuration that should be editable by Merchants without a
release.

## Where to manage

`Merchant Tools > Site Preferences > Custom Preferences`

## Custom preference groups

Custom site preferences live under group definitions you create in
`bm_custom_site_preferences`. Each group corresponds to an attribute group on
the `SitePreferences` system object.

To add a new group:

1. `Administration > Site Development > System Object Types > SitePreferences`.
2. Add a new attribute group with a meaningful identifier.
3. Add typed attributes (string, boolean, int, double, datetime, enum-of-string,
   set-of-string, password, html, …).
4. Set values per site under `Merchant Tools > Site Preferences`.

## Reading from script

```javascript
var Site = require('dw/system/Site');
var prefs = Site.getCurrent().getPreferences();
var customPrefs = prefs.getCustom();
var apiKey = customPrefs.myExternalServiceApiKey;
```

## Tips

- Mark sensitive preferences as **password** so they are masked in BM.
- Group preferences by feature, not by technical layer — Merchants navigate by
  business intent.
- Preferences cache aggressively — use replication to roll out changes between
  staging and production.
