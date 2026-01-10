# Package dw.experience

## Classes
| Class | Description |
| --- | --- |
| [AspectAttributeValidationException](dw.experience.AspectAttributeValidationException.md) | This APIException is thrown by method [PageMgr.renderPage(String, Map, String)](dw.experience.PageMgr.md#renderpagestring-map-string)  and [PageMgr.serializePage(String, Map, String)](dw.experience.PageMgr.md#serializepagestring-map-string)  to indicate that the passed aspect attributes failed during validation against the  definition provided through the aspect type of the page. |
| [Component](dw.experience.Component.md) | This class represents a page designer managed component as part of a  page. |
| [ComponentRenderSettings](dw.experience.ComponentRenderSettings.md) | A config that drives how the component is rendered. |
| [ComponentScriptContext](dw.experience.ComponentScriptContext.md) | This is the context that is handed over to the `render` and `serialize` function of the respective component type  script. |
| [CustomEditor](dw.experience.CustomEditor.md) | This class represents a custom editor for component attributes of type `custom`. |
| [CustomEditorResources](dw.experience.CustomEditorResources.md) | This class represents the resources of a custom editor, i.e. |
| [Page](dw.experience.Page.md) | <p>  This class represents a page designer managed page. |
| [PageMgr](dw.experience.PageMgr.md) | Provides functionality for getting, rendering and serializing page designer managed pages. |
| [PageScriptContext](dw.experience.PageScriptContext.md) | This is the context that is handed over to the `render` and `serialize` function of the respective page type  script. |
| [Region](dw.experience.Region.md) | This class represents a region which serves as container of components. |
| [RegionRenderSettings](dw.experience.RegionRenderSettings.md) | A config that drives how the region is rendered. |
