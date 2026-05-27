import Component = require('./Component');
import ComponentRenderSettings = require('./ComponentRenderSettings');
import utilMap = require('../util/Map');

/**
 * This is the context that is handed over to the `render` and `serialize` function of the respective component type
 * script.
 * @example
 * `String : render( ComponentScriptContext context)`
 * `Object : serialize( ComponentScriptContext context)`
 */
declare class ComponentScriptContext {
    /**
     * Returns the component for which the corresponding component type script is currently executed.
     */
    readonly component: Component;
    /**
     * As components are implicitly rendered as part of their hosting region via
     * PageMgr.renderRegion there is the possibility
     * to define render settings for the region itself but also for its contained components.
     * The latter will be provided here so you further set or refine them for your component
     * as part of the `render` function, i.e. to drive the shape of the
     * component wrapper element.
     */
    readonly componentRenderSettings: ComponentRenderSettings;
    /**
     * Returns the processed version of the underlying unprocessed raw values (also see Component.getAttribute)
     * of this component's attributes which you can use in your respective component type `render` and `serialize` function
     * implementing your business and rendering/serialization functionality. Processing the raw value is comprised of expansion
     * and conversion, in this order.
     * 
     * - expansion - dynamic placeholders are transformed into actual values, for example url/link placeholders in
     * markup text are resolved to real URLs
     * - conversion - the raw value (see Component.getAttribute) is resolved into an actual
     * DWScript object depending on the type of the attribute as specified in its respective attribute definition
     * 
     * - `boolean` -> boolean
     * - `category` -> dw.catalog.Category
     * - `custom` -> dw.util.Map
     * - `cms_record` -> dw.experience.cms.CMSRecord
     * - `enum` -> either string or integer
     * - `file` -> dw.content.MediaFile
     * - `image` -> dw.experience.image.Image
     * - `integer` -> integer
     * - `markup` -> string
     * - `page` -> string
     * - `product` -> dw.catalog.Product
     * - `string` -> string
     * - `text` -> string
     * - `url` -> string
     */
    readonly content: utilMap<any, any>;
    private constructor();
    /**
     * Returns the component for which the corresponding component type script is currently executed.
     */
    getComponent(): Component;
    /**
     * As components are implicitly rendered as part of their hosting region via
     * PageMgr.renderRegion there is the possibility
     * to define render settings for the region itself but also for its contained components.
     * The latter will be provided here so you further set or refine them for your component
     * as part of the `render` function, i.e. to drive the shape of the
     * component wrapper element.
     */
    getComponentRenderSettings(): ComponentRenderSettings;
    /**
     * Returns the processed version of the underlying unprocessed raw values (also see Component.getAttribute)
     * of this component's attributes which you can use in your respective component type `render` and `serialize` function
     * implementing your business and rendering/serialization functionality. Processing the raw value is comprised of expansion
     * and conversion, in this order.
     * 
     * - expansion - dynamic placeholders are transformed into actual values, for example url/link placeholders in
     * markup text are resolved to real URLs
     * - conversion - the raw value (see Component.getAttribute) is resolved into an actual
     * DWScript object depending on the type of the attribute as specified in its respective attribute definition
     * 
     * - `boolean` -> boolean
     * - `category` -> dw.catalog.Category
     * - `custom` -> dw.util.Map
     * - `cms_record` -> dw.experience.cms.CMSRecord
     * - `enum` -> either string or integer
     * - `file` -> dw.content.MediaFile
     * - `image` -> dw.experience.image.Image
     * - `integer` -> integer
     * - `markup` -> string
     * - `page` -> string
     * - `product` -> dw.catalog.Product
     * - `string` -> string
     * - `text` -> string
     * - `url` -> string
     */
    getContent(): utilMap<any, any>;
}

export = ComponentScriptContext;
