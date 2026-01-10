# Package dw.experience.cms

## Classes
| Class | Description |
| --- | --- |
| [CMSRecord](dw.experience.cms.CMSRecord.md) | This class represents a Salesforce CMS record, exposing its:  <ul>      <li>`id`, see [getID()](dw.experience.cms.CMSRecord.md#getid)</li>      <li>`type`, see [getType()](dw.experience.cms.CMSRecord.md#gettype)</li>      <li>`attributes`, see [getAttributes()](dw.experience.cms.CMSRecord.md#getattributes)</li>  </ul>  The `attributes` are key value pairs:  <ul>      <li>the key being the attribute id as given in the `type.attribute_definitions` entries</li>      <li>the value being a DWScript API object resolved from the raw attribute value based on the attribute type as given in the `type.attribute_definitions` entries          (similar to how [ComponentScriptContext.getContent()](dw.experience.ComponentScriptContext.md#getcontent) exposes the raw attribute value of a [Component.getAttribute(String)](dw.experience.Component.md#getattributestring) in shape of a DWScript API object based on the attribute type)</li>  </ul> |
