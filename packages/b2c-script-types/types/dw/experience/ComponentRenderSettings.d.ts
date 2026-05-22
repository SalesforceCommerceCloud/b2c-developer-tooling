/**
 * A config that drives how the component is rendered. One can basically decide which kind of tag is used as wrapper
 * element (e.g. `<div>...</div>`) and which attributes are to be placed into this wrapper
 * element (e.g. `class="foo bar"`). In case no attributes are provided then the system default settings will
 * apply. In case no tag name is provided then the system default one will apply.
 * 
 * - tag_name : div
 * - attributes : {"class":"experience-component experience-[COMPONENT_TYPE_ID]"}
 * 
 * As the [COMPONENT_TYPE_ID] can contain dots due to its package like naming scheme (e.g. assets.image)
 * any occurrences of these dots will be replaced by dashes (e.g. assets-image) so that CSS selectors
 * do not have to be escaped.
 * @see RegionRenderSettings
 */
declare class ComponentRenderSettings {
    /**
     * Returns the configured attributes of the wrapper element as set by setAttributes.
     */
    attributes: any;
    /**
     * Returns the tag name of the component wrapper element. Defaults to 'div'.
     */
    tagName: string;
    /**
     * Creates region render settings which can then be configured further. They are to be used for detailed
     * configuration of a RegionRenderSettings which is subsequently used for
     * PageMgr.renderRegion calls.
     * @see RegionRenderSettings
     */
    constructor();
    /**
     * Returns the configured attributes of the wrapper element as set by setAttributes.
     */
    getAttributes(): any;
    /**
     * Returns the tag name of the component wrapper element. Defaults to 'div'.
     */
    getTagName(): string;
    /**
     * Sets the to be configured <String,String> attributes of the wrapper element. Set it to `null` in case
     * you want to system defaults to be applied.
     */
    setAttributes(attributes: Object): ComponentRenderSettings;
    /**
     * Sets the tag name of the component wrapper element. Must not be empty.
     */
    setTagName(tagName: string): ComponentRenderSettings;
}

export = ComponentRenderSettings;
