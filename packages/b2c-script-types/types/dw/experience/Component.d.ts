import Region = require('./Region');

/**
 * This class represents a page designer managed component as part of a
 * page. A component comprises of multiple regions that again hold components,
 * thus spanning a hierarchical tree of components. Using the PageMgr.renderRegion or
 * PageMgr.renderRegion a region can be rendered which
 * implicitly includes rendering of all contained visible components. All
 * content attributes (defined by the corresponding component type) can be
 * accessed, reading the accordant persisted values as provided by the content editor
 * who created this component.
 * @see Page
 * @see Region
 * @see PageMgr
 */
declare class Component {
    /**
     * Returns the id of this component.
     */
    readonly ID: string;
    /**
     * Returns the name of this component
     */
    readonly name: string;
    /**
     * Returns the type id of this component.
     */
    readonly typeID: string;
    private constructor();
    /**
     * 
     * Returns the raw attribute value identified by the specified attribute id.
     * By raw attribute value we denote the unprocessed value as provided for the attribute
     * driven by the type of the respective attribute definition:
     * 
     * - `boolean` -> boolean
     * - `category` -> string representing a catalog category ID
     * - `custom` -> dw.util.Map that originates from a stringified curly brackets {} JSON object
     * - `cms_record` -> dw.util.Map that originates from a stringified curly brackets {} JSON object whose entries must adhere to the `cmsrecord.json` schema
     * - `enum` -> either string or integer
     * - `file` -> string representing a file path within a library
     * - `image` -> dw.util.Map that originates from a stringified curly brackets {} JSON object whose entries must adhere to the `content/schema/image.json` schema
     * - `integer` -> integer
     * - `markup` -> string representing HTML markup
     * - `page` -> string representing a page ID
     * - `product` -> string representing a product SKU
     * - `string` -> string
     * - `text` -> string
     * - `url` -> string representing a URL
     * 
     * There is two places an attribute value can come from - either it was persisted at design time (e.g.
     * by the merchant by editing a component in Page Designer) or it was injected in shape of an aspect attribute at rendering time
     * through the execution of code. The persistent value, if existing, takes precedence over the injected aspect
     * attribute one. Injection of a value through an aspect attribute will only occur if the component attribute's
     * attribute definition was declared using the `"dynamic_lookup"` property and its aspect attribute alias matches
     * the ID of the respective aspect attribute.
     * 
     * Accessing the raw value can be helpful if render and serialization logic of the
     * component needs to operate on these unprocessed values. An unprocessed value
     * might be fundamentally different from its processed counterpart, the latter being
     * provided through the content dictionary (see ComponentScriptContext.getContent)
     * when the render/serialize function of the component is invoked.
     */
    getAttribute(attributeID: string): any | null;
    /**
     * Returns the id of this component.
     */
    getID(): string;
    /**
     * Returns the name of this component
     */
    getName(): string;
    /**
     * Returns the component region that matches the given id.
     */
    getRegion(id: string): Region | null;
    /**
     * Returns the type id of this component.
     */
    getTypeID(): string;
}

export = Component;
