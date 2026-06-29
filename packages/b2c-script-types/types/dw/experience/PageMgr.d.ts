import Page = require('./Page');
import utilMap = require('../util/Map');
import Region = require('./Region');
import RegionRenderSettings = require('./RegionRenderSettings');
import CustomEditor = require('./CustomEditor');
import Category = require('../catalog/Category');
import Product = require('../catalog/Product');

/**
 * Provides functionality for getting, rendering and serializing page designer managed pages.
 * 
 * The basic flow is to determine a page by either id, category or product
 * 
 * - getPage
 * - getPageByCategory
 * - getPageByProduct
 * 
 * and then to initiate rendering of this page via
 * 
 * - renderPage
 * - renderPage
 * 
 * This will trigger page rendering from a top level perspective, i.e. the page serves as entry point and root container of components.
 * 
 * As a related page or component template will likely want to trigger rendering of nested components
 * within its regions it can do this by first fetching the desired region by ID via
 * Page.getRegion or Component.getRegion and then call to PageMgr.renderRegion
 * with the recently retrieved region (and optionally provide RegionRenderSettings for customized
 * rendering of region and component wrapper elements).
 * 
 * Similar to the rendering you can also serialize such page to json via
 * 
 * - serializePage
 * - serializePage
 * 
 * This will trigger page serialization from a top level perspective, i.e. the page serves as entry point and root container of components,
 * which will automatically traverse all visible components and attach their serialization result to the emitted json.
 * 
 * Various attributes required for rendering and serialization in the corresponding template can be accessed with the
 * accordant methods of Page and Component.
 * @see Page
 * @see Region
 * @see Component
 */
declare class PageMgr {
    private constructor();
    /**
     * 
     * 
     * Initialize the custom editor of given type id using the passed configuration. The initialization
     * will trigger the `init` function of the respective custom editor type for which the passed
     * custom editor object is being preinitialized with the given configuration (similar to what would
     * happen through the `editor_definition` reference by any component type attribute definition).
     * 
     * This method is useful to obtain any custom editor instance you want to reuse within the `init`
     * method of another custom editor, e.g. as dependent breakout element.
     */
    static getCustomEditor(customEditorTypeID: string, configuration: utilMap<any, any>): CustomEditor;
    /**
     * Returns the page identified by the specified id.
     */
    static getPage(pageID: string): Page | null;
    /**
     * Get the dynamic page for the given category (including bottom up traversal of the category tree) and aspect type.
     * @deprecated Please use getPageByCategory instead.
     */
    static getPage(category: Category, pageMustBeVisible: boolean, aspectTypeID: string): Page | null;
    /**
     * Get the dynamic page for the given category (including bottom up traversal of the category tree) and aspect type.
     */
    static getPageByCategory(category: Category, pageMustBeVisible: boolean, aspectTypeID: string): Page | null;
    /**
     * Get the dynamic page for the given product and aspect type.
     * 
     * No bottom up traversal of the product's category tree is performed. If you require this then  a
     * separate call to getPageByCategory (with the category of your choice, e.g. the default
     * category of the product) needs to be made.
     */
    static getPageByProduct(product: Product<any>, pageMustBeVisible: boolean, aspectTypeID: string): Page | null;
    /**
     * Render a page. All of this is going to happen in two layers of remote includes, therefore pagecaching of page rendering
     * is separated from the pagecache lifecycle of the caller. The first one is going to be returned by this method.
     * 
     * - layer 1 - determines visibility fingerprint for the page and all its nested components driven by its visibility rules. This remote include will only be pagecached for a fixed duration if neither the page nor any of its
     * nested components carries a visibility rule (configurable in Business Manager via the site's page caching settings). It will then delegate to layer 2.
     * - layer 2 - does the actual rendering of the page by invoking its render function. This remote include will factor the previously determined visibility fingerprint in to the pagecache key, in case you decide to use pagecaching.
     * 
     * The layer 1 remote include is what is returned when calling this method.
     * 
     * The provided `parameters` argument is passed through till the layer 2 remote include which does the actual rendering so that it will be available
     * for the `render` function of the invoked page as part of PageScriptContext.getRuntimeParameters. You probably want to
     * provide caller parameters from the outside in shape of a json String to the inside of the page rendering, e.g. to loop through query parameters.
     * 
     * The layer 2 remote include performs the rendering of the page and all its nested components within one request. Thus data sharing between
     * the page and its nested components can happen in scope of this request.
     * 
     * The rendering of a page invokes the `render` function of the respective page type.
     * 
     * ```
     * `String : render( PageScriptContext context)`
     * ```
     * 
     * The return value of the `render` function finally represents the markup produced by this page type.
     * 
     * Nested page rendering, i.e. rendering a page within a page (or respectively its components), is not a supported use case.
     * 
     * Due to the nature of the remote includes mentioned above this comes with the url length restriction as you already know it from
     * remote includes you implement by hand within your templates. Thus the size of the `parameters` parameter of this
     * method has a length limitation accordingly because it just translates into a url parameter of the aforementioned remote includes.
     * As a best practice refrain from passing complex objects (e.g. full blown product models) but keep it rather slim (e.g. only product IDs).
     * @see renderPage
     */
    static renderPage(pageID: string, parameters: string): string;
    /**
     * Render a page. This is an extension of renderPage for the purpose of rendering a
     * page that needs to determine pieces of its content at rendering time instead of design time only. Therefore it
     * is possible to pass aspect attributes in case the given page is subject to an aspect type. The latter specifies the
     * eligible aspect attribute definitions which the passed in aspect attributes will be validated against.
     * If the validation fails for any of the following reasons an AspectAttributeValidationException
     * will be thrown:
     * 
     * - any aspect attribute value violates the value domain of the corresponding attribute definition
     * - any required aspect attribute value is `null`
     * 
     * Aspect attributes without corresponding attribute definition will be omitted. Once they made it into the rendering
     * they will apply if no persistent attribute value exists (taking precedence over default attribute values
     * as coming from the attribute definition json) and the attribute has the `dynamic_lookup`
     * property defined which contains the aspect attribute alias. The aspect attribute value lookup then happens by taking
     * this aspect attribute alias and using it as attribute identifier within the given map of aspect attributes.
     * 
     * Due to the nature of using remote includes, also see renderPage, this comes with the url length
     * restriction as you already know it from remote includes you implement by hand within your templates. Thus the size of both the
     * `aspectAttributes` (keys and values) as well as the `parameters` parameter of this method
     * are subject to a length limitation accordingly because they just translate into url parameters of the aforementioned remote includes.
     * As a best practice refrain from passing complex objects (e.g. full blown product models) but keep it rather slim (e.g. only product IDs).
     * @throws dw.experience.AspectAttributeValidationException if any given aspect attribute value does fulfill its respective attribute definition
     * @see renderPage
     */
    static renderPage(pageID: string, aspectAttributes: utilMap<any, any>, parameters: string): string;
    /**
     * 
     * Renders a region by triggering rendering of all visible components within
     * this region. For each of these components the render function of the respective component
     * type is invoked.
     * 
     * ```
     * String : render( ComponentScriptContext context)
     * ```
     * 
     * The return value of the `render` function will be wrapped by an HTML element - this
     * finally represents the markup produced by this component type. The markup of the region
     * accordingly represents the concatenation of all the components markup within an
     * own wrapper element.
     * 
     * In order to provide styling for these wrapper
     * elements of the components and the region some render settings can optionally be provided,
     * which basically allows to configure which kind of tag is used for the wrapper element and
     * which attributes the wrapper element contains. A sample output could look like this if
     * RegionRenderSettings are applied with customized tag names and attributes
     * for the region and component wrapper elements.
     * 
     * ```
     * <p class="myRegionCssClass">
     * <span class="myComponentCssClass myComponentCssClass1" data-foo="bar">
     * ...
     * </span>
     * <span class="myComponentCssClass myComponentCssClass2">
     * ...
     * </span>
     * </p>
     * ```
     * 
     * In order to go with the default settings for the wrapper elements see
     * PageMgr.renderRegion.
     * 
     * <p style="color:red">
     * You must NOT call this method outside of the processing induced by PageMgr.renderPage.
     * @see RegionRenderSettings
     */
    static renderRegion(region: Region, regionRenderSettings: RegionRenderSettings): string;
    /**
     * 
     * Renders a region by triggering rendering of all visible components within
     * this region. For each of these components the render function  of the respective component
     * type is invoked.
     * 
     * ```
     * String : render( ComponentScriptContext params)
     * ```
     * 
     * The return value of the `render` function will be wrapped by an HTML element - this
     * finally represents the markup produced by this component type. The markup of the region
     * accordingly represents the concatenation of all the components markup within an
     * own wrapper element.
     * 
     * The following sample shows how this would look like for a 'pictures' region
     * that contains two components of type 'assets.image'.
     * 
     * ```
     * <div class="experience-region experience-pictures">
     * <div class="experience-component experience-assets-image">
     * ...
     * </div>
     * <div class="experience-component experience-assets-image">
     * ..
     * </div>
     * </div>
     * ```
     * 
     * The system default for region render settings are:
     * 
     * - tag_name : div
     * - attributes : {"class":"experience-region experience-[REGION_ID]"}
     * 
     * The system default for component render settings are:
     * 
     * - tag name : div
     * - attributes : {"class":"experience-component experience-[COMPONENT_TYPE_ID]"}
     * 
     * As the [COMPONENT_TYPE_ID] can contain dots due to its package like naming scheme (e.g. assets.image)
     * any occurrences of these dots will be replaced by dashes (e.g. assets-image) so that CSS selectors
     * do not have to be escaped.
     * 
     * In order to provide your own settings for the wrapper elements see
     * PageMgr.renderRegion.
     * 
     * <p style="color:red">
     * You must NOT call this method outside of the processing induced by PageMgr.renderPage.
     */
    static renderRegion(region: Region): string;
    /**
     * Serialize a page as json string with the following properties:
     * 
     * - `String id` - the id of the page
     * - `String type_id` - the id of the page type
     * - `Map<String, Object> data` - the content attribute key value pairs
     * - `Map<String, Object> custom` - the custom key value pairs as produced by the optional page type `serialize` function
     * - `List<Region> regions` - the regions of this page. A region consists of the following properties
     * 
     * - `String id` - the id of the region
     * - `List<Component> components` - the components of this region. A component consists of the following properties
     * 
     * - `String id` - the id of the component
     * - `String type_id` - the id of the component type
     * - `Map<String, Object> data` - the content attribute key value pairs
     * - `Map<String, Object> custom` - the custom key value pairs as produced by the optional component type `serialize` function
     * - `List<Region> regions` - the regions of this component
     * 
     * All of this is going to happen in two layers of remote includes, therefore pagecaching of page serialization
     * is separated from the pagecache lifecycle of the caller. The first one is going to be returned by this method.
     * 
     * - layer 1 - determines visibility fingerprint for the page and all its nested components driven by its visibility rules. This remote include will only be pagecached for a fixed duration if neither the page nor any of its
     * nested components carries a visibility rule (configurable in Business Manager via the site's page caching settings). It will then delegate to layer 2.
     * - layer 2 - does the actual rendering of the page by invoking its render function. This remote include will factor the previously determined visibility fingerprint in to the pagecache key, in case you decide to use pagecaching.
     * 
     * The layer 1 remote include is what is returned when calling this method.
     * 
     * The provided `parameters` argument is passed through till the layer 2 remote include which does the actual serialization so that it will be available
     * for the `serialize` function of the invoked page as part of PageScriptContext.getRuntimeParameters. You probably want to
     * provide caller parameters from the outside in shape of a json String to the inside of the page serialization, e.g. to loop through query parameters.
     * 
     * The layer 2 remote include performs the serialization of the page and all its nested components within one request. Thus data sharing between
     * the page and its nested components can happen in scope of this request.
     * 
     * The serialization of a page also invokes the `serialize` function of the respective page type.
     * 
     * ```
     * `Object : serialize( PageScriptContext context)`
     * ```
     * 
     * The return value of the `serialize` function will be injected as property `custom`
     * into the json string produced as serialization result for this page type.
     * 
     * Nested page serialization, i.e. serializing a page within a page (or respectively its components), is not a supported use case.
     * 
     * Due to the nature of the remote includes mentioned above this comes with the url length restriction as you already know it from
     * remote includes you implement by hand within your templates. Thus the size of the `parameters` parameter of this
     * method has a length limitation accordingly because it just translates into a url parameter of the aforementioned remote includes.
     * As a best practice refrain from passing complex objects (e.g. full blown product models) but keep it rather slim (e.g. only product IDs).
     * @see serializePage
     */
    static serializePage(pageID: string, parameters: string): string;
    /**
     * Serialize a page as json string. This is an extension of serializePage for the purpose of serializing a
     * page that needs to determine pieces of its content at serialization time instead of design time only. Therefore it
     * is possible to pass aspect attributes in case the given page is subject to an aspect type. The latter specifies the
     * eligible aspect attribute definitions which the passed in aspect attributes will be validated against.
     * If the validation fails for any of the following reasons an AspectAttributeValidationException
     * will be thrown:
     * 
     * - any aspect attribute value violates the value domain of the corresponding attribute definition
     * - any required aspect attribute value is `null`
     * 
     * Aspect attributes without corresponding attribute definition will be omitted. Once they made it into the serialization
     * they will apply if no persistent attribute value exists (taking precedence over default attribute values
     * as coming from the attribute definition json) and the attribute has the `dynamic_lookup`
     * property defined which contains the aspect attribute alias. The aspect attribute value lookup then happens by taking
     * this aspect attribute alias and using it as attribute identifier within the given map of aspect attributes.
     * 
     * Due to the nature of using remote includes, also see serializePage, this comes with the url length
     * restriction as you already know it from remote includes you implement by hand within your templates. Thus the size of both the
     * `aspectAttributes` (keys and values) as well as the `parameters` parameter of this method
     * are subject to a length limitation accordingly because they just translate into url parameters of the aforementioned remote includes.
     * As a best practice refrain from passing complex objects (e.g. full blown product models) but keep it rather slim (e.g. only product IDs).
     * @throws dw.experience.AspectAttributeValidationException if any given aspect attribute value doesn't fulfill its respective attribute definition
     * @see serializePage
     */
    static serializePage(pageID: string, aspectAttributes: utilMap<any, any>, parameters: string): string;
}

export = PageMgr;
