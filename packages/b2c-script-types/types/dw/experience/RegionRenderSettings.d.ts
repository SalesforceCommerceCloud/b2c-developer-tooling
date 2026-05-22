import ComponentRenderSettings = require('./ComponentRenderSettings');
import Component = require('./Component');

/**
 * A config that drives how the region is rendered. One can basically decide which kind of tag is used as wrapper
 * element (e.g. `<div>...</div>`) and which attributes are to be placed into this wrapper
 * element (e.g. `class="foo bar"`).
 * 
 * If no attributes are provided for the region render settings then the system default ones will apply. Also if no tag
 * name is provided then the system default one will apply.
 * 
 * - tag_name : div
 * - attributes : {"class":"experience-region experience-[REGION_ID]"}
 * 
 * Furthermore the render settings for components in this region can be specified - in case nothing is set per component
 * then the default component render setting will be applied during rendering. If also no default component render
 * setting is provided then the system default one will apply (see ComponentRenderSettings).
 * @see PageMgr.renderRegion
 * @see PageMgr.renderRegion
 */
declare class RegionRenderSettings {
    /**
     * Returns the configured attributes of the wrapper element as set by setAttributes.
     */
    attributes: any;
    /**
     * Returns the default component render settings. These will be used during rendering of the components contained in
     * the region in case no dedicated component render settings were provided per component. If also no default is
     * supplied then the system default will be used during rendering.
     */
    defaultComponentRenderSettings: ComponentRenderSettings;
    /**
     * Returns the tag name of the region wrapper element. Defaults to 'div'.
     */
    tagName: string;
    /**
     * Creates region render settings which can then be configured further. They are to be used for
     * PageMgr.renderRegion calls.
     * @see ComponentRenderSettings
     */
    constructor();
    /**
     * Returns the configured attributes of the wrapper element as set by setAttributes.
     */
    getAttributes(): any;
    /**
     * Returns the component render settings for the given component. In case no explicitly specified settings are found
     * for this component then the default one will be provided.
     */
    getComponentRenderSettings(component: Component): ComponentRenderSettings;
    /**
     * Returns the default component render settings. These will be used during rendering of the components contained in
     * the region in case no dedicated component render settings were provided per component. If also no default is
     * supplied then the system default will be used during rendering.
     */
    getDefaultComponentRenderSettings(): ComponentRenderSettings;
    /**
     * Returns the tag name of the region wrapper element. Defaults to 'div'.
     */
    getTagName(): string;
    /**
     * Sets the to be configured <String,String> attributes of the wrapper element. Set to `null` in case you
     * want to system defaults to be applied.
     */
    setAttributes(attributes: Object): RegionRenderSettings;
    /**
     * Sets the component render settings for the given component.
     */
    setComponentRenderSettings(component: Component, componentRenderSettings: ComponentRenderSettings): RegionRenderSettings;
    /**
     * Sets the default component render settings. These will be used during rendering of the components contained in
     * the region in case no dedicated component render settings were provided per component.
     */
    setDefaultComponentRenderSettings(defaultComponentRenderSettings: ComponentRenderSettings): RegionRenderSettings;
    /**
     * Sets the tag name of the region wrapper element. Must not be empty.
     */
    setTagName(tagName: string): RegionRenderSettings;
}

export = RegionRenderSettings;
