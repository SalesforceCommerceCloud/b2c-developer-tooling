import utilMap = require('../../util/Map');

/**
 * This class represents a Salesforce CMS record, exposing its:
 * 
 * - `id`, see getID
 * - `type`, see getType
 * - `attributes`, see getAttributes
 * 
 * The `attributes` are key value pairs:
 * 
 * - the key being the attribute id as given in the `type.attribute_definitions` entries
 * - the value being a DWScript API object resolved from the raw attribute value based on the attribute type as given in the `type.attribute_definitions` entries
 * (similar to how dw.experience.ComponentScriptContext.getContent exposes the raw attribute value of a dw.experience.Component.getAttribute in shape of a DWScript API object based on the attribute type)
 */
declare class CMSRecord {
    /**
     * Return the id of the Salesforce CMS record.
     */
    readonly ID: string;
    /**
     * Return the Salesforce CMS record attributes as key value pairs:
     * 
     * - the key being the attribute id as given in the `getType.attribute_definitions` entries
     * - the value being a DWScript API object resolved from the raw attribute value based on the attribute type as given in the `getType.attribute_definitions` entries
     * (similar to how dw.experience.ComponentScriptContext.getContent exposes the raw attribute value of a dw.experience.Component.getAttribute in shape of a DWScript API object based on the attribute type)
     * 
     * The attributes are also conveniently accessible through named property support. That means if `myCmsRecord.getAttributes().get('foo')` yields value `'bar'`,
     * then `myCmsRecord.foo` will give the same results.
     */
    readonly attributes: utilMap<any, any>;
    /**
     * Return the type of the Salesforce CMS record sufficing the `content/schema/cmsrecord.json#/definitions/cms_content_type` schema. Properties
     * can be accessed accordingly:
     * 
     * - `getType().id : string`
     * - `getType().name : string`
     * - `getType().attribute_definitions : Map` (see `content/schema/attributedefinition.json`)
     */
    readonly type: utilMap<any, any>;
    private constructor();
    /**
     * Return the Salesforce CMS record attributes as key value pairs:
     * 
     * - the key being the attribute id as given in the `getType.attribute_definitions` entries
     * - the value being a DWScript API object resolved from the raw attribute value based on the attribute type as given in the `getType.attribute_definitions` entries
     * (similar to how dw.experience.ComponentScriptContext.getContent exposes the raw attribute value of a dw.experience.Component.getAttribute in shape of a DWScript API object based on the attribute type)
     * 
     * The attributes are also conveniently accessible through named property support. That means if `myCmsRecord.getAttributes().get('foo')` yields value `'bar'`,
     * then `myCmsRecord.foo` will give the same results.
     */
    getAttributes(): utilMap<any, any>;
    /**
     * Return the id of the Salesforce CMS record.
     */
    getID(): string;
    /**
     * Return the type of the Salesforce CMS record sufficing the `content/schema/cmsrecord.json#/definitions/cms_content_type` schema. Properties
     * can be accessed accordingly:
     * 
     * - `getType().id : string`
     * - `getType().name : string`
     * - `getType().attribute_definitions : Map` (see `content/schema/attributedefinition.json`)
     */
    getType(): utilMap<any, any>;
}

export = CMSRecord;
