---
'b2c-vs-extension': minor
---

Saving an edited Page Designer page in the Content Libraries view now writes it through the Experiences API, which is faster than a site archive import. Edits the API can't write, and instances without Experiences API access, still save through the import. Turn this off with `b2c-dx.content.saveWithExperiencesApi`.
