# Page Designer pages, content assets and slots

API `experience/experiences/v1`. Reads take `sfcc.experiences` or `sfcc.experiences.rw`;
writes and `getContentFolder` need `sfcc.experiences.rw`. Every call needs `siteId` (query) except
library content, folder and assignment calls, which take a `libraryId` path parameter.

## Model

Page type → page → regions → components. Layout components (`Layout.grid` and similar) have their
own regions, nested in the same shape. Type IDs come from the site's cartridge path and have **no**
`page.`/`component.` prefix (library XML uses `component.Content.hero`; the API uses `Content.hero`).

## Build a page (draft)

1. `getPageTypes` and `getComponentTypes` (`siteId`, `limit` up to 200). Use
   `builtin/content-types-inspect` for a compact summary instead of returning raw types.
2. Build the body from those definitions only: region IDs from `regionDefinitions`, component
   `typeId`s from component types, attribute keys and enum `values` from `attributeDefinitionGroups`.
3. `createOrUpdatePage`: `PUT /pages/{pageId}?siteId=`. `pageId` must equal `body.id`.
   Use `builtin/page-push`, which validates against the live types and then PUTs.
4. Tell the user the page was saved as a **draft** and must be activated in Business Manager.

```json
{
  "id": "summer",
  "name": "Summer",
  "typeId": "homePage",
  "regions": [
    {
      "id": "main",
      "components": [
        {
          "id": "summer-grid",
          "typeId": "Layout.grid",
          "data": {},
          "regions": [
            {
              "id": "column_1",
              "components": [
                {"id": "summer-hero", "typeId": "Content.hero", "data": {"title": "Summer", "height": "md"}}
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

- 201 = created, 200 = updated. The response is the saved page with defaults applied.
- Updates merge per region. A region you send replaces its component list. Regions you leave out
  are kept. Send `{"id":"region","components":[]}` to empty a region. Removed components stay in
  the library unassigned.
- Component `data` merges: attributes you leave out keep their value. An attribute can't be
  cleared (`null`, and `""` for enums, give 400).
- The PUT writes the default locale only. Other locales, online and visibility state, and
  site-specific values are kept and can't be changed here; use a library import for those.
- An existing page's `typeId` cannot change. The platform ignores it and then rejects regions that
  belong to the new type (`Region 'x' not found in page type 'y'`). Use a new page ID.
- The server rejects unknown regions, unknown component types and bad enum values (400). It
  **accepts** missing required attributes and silently drops unknown attribute keys, so check
  those yourself before the PUT.
- Value shapes: `image` → `{"path":"images/hero.jpg"}`; `url`, `string`, `text`, `markup`,
  `product`, `category`, `page` → strings; `boolean`, `integer` as JSON types.
- Extra page fields must be `c_*` custom attributes.
- **No admin read, list, delete or publish for pages.** Do not try Shopper `getPage`: it only
  returns active, visible pages, never drafts. Library `getContent` returns 404 for Page Designer
  pages and components. To read a page back, the user exports the library (CLI
  `b2c content export <pageId>`).

## Content assets and folders

Classic content assets: `getContent`, `createOrUpdateContent`, `patchContent` and `deleteContent`
under `/libraries/{libraryId}/content/{contentId}`. Use the site ID for a site-private library, or
the shared library ID.

- Localized fields are maps: `{"name":{"default":"About"}}`. Asset `online` and `searchable` are
  localized too (`{"default":true}`).
- Custom attributes are localized maps. Markup attributes such as `c_body` take
  `{"default":{"source":"<p>Hi</p>"}}`, and reads return `markup` alongside `source`. A plain
  string returns 400 `invalid-custom-property`. Unknown `c_*` keys are dropped without an error.
- `patchContent` merges per field and per locale. `getContent` returns 404 for Page Designer pages
  and components.
- Folders: `createOrUpdateContentFolder` (`parentFolderId`, localized `name`, boolean `online`).
  Walk them from `root` with `getSubFolders` and `getFolderContent`. There is no library-wide list
  or search. `getContentFolder` needs `sfcc.experiences.rw`, but the walks work read-only.
- Assign content to a folder with `createOrUpdateFolderAssignment`.
  `{"default": true}` makes it the classification folder.
- `deleteContent` and `deleteContentFolder` return 204 even when the ID does not exist. Verify with a read.

## Slots

Slots cannot be created through the API; only their configurations can.

- `searchSlots` and `searchSlotConfigurations` use POST with the search DSL:
  `{"query":{"termQuery":{"fields":["slotId"],"operator":"is","values":["home-banner"]}},"limit":25}`
  or `{"query":{"matchAllQuery":{}}}`. Use `builtin/slot-configurations-inspect`.
- `getSlot`: `/slots/{slotId}/{contextType}` (`global`, `category` or `folder`, plus `contextId`
  for the non-global contexts).
- `createOrUpdateSlotConfiguration` (PUT, 201 created / 200 replaced):
  `/slots/{slotId}/slot-configurations/{configurationId}?siteId=...`. The slot must already exist
  (404 otherwise). `slotContent` and `template` are required.
- Write `slotContent.type` in snake_case: `content_assets`, `products`, `categories`, `html`,
  `recommended_products`. The spec's camelCase values (`contentAssets`) are rejected with 400.
  Content IDs must exist (assets are looked up in the site's library), or the write fails with 404.
- HTML content: `{"type":"html","body":{"default":{"source":"<p>Hi</p>"}}}`. Write `source`;
  `markup` is returned on read but ignored on write.
- `updateSlotConfiguration` (PATCH) also requires `slotContent`; send the current one back when
  changing only `enabled`, `schedule`, `rank` or `customerGroups`.
- `deleteSlotConfiguration` returns 204 even when the configuration does not exist.
- `assignmentInformation.active` shows whether a configuration is live now (enabled and in schedule).

CLI equivalents: `b2c content types list`, `b2c content push` (validates first),
`b2c content export`, `b2c content asset get|put|update|delete`,
`b2c content folder list|get|put|update|delete|assign|unassign`, `b2c content slot list|get`, and
`b2c content slot config list|get|put|update|delete`.
