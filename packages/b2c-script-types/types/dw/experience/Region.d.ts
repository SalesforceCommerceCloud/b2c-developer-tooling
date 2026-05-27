import Collection = require('../util/Collection');
import Component = require('./Component');

/**
 * This class represents a region which serves as container of components.
 * Using the PageMgr.renderRegion or PageMgr.renderRegion
 * a region can be rendered.
 * @see Page
 * @see Component
 * @see PageMgr
 */
declare class Region {
    /**
     * Returns the id of this region.
     */
    readonly ID: string;
    /**
     * Returns the number of components that would be rendered by this region
     * when calling PageMgr.renderRegion or PageMgr.renderRegion.
     * <p style="color:red">
     * Due to its time and customer group depending nature this call should NOT happen in a pagecached context
     * outside of the processing induced by the above mentioned render methods.
     */
    readonly size: number;
    /**
     * Returns the components that would be rendered by this region
     * when calling PageMgr.renderRegion or PageMgr.renderRegion.
     * <p style="color:red">
     * As visibility is driven by the merchant configured dynamic visibility rules, e.g. scheduling and custom segmentation, this
     * call should NOT happen in a pagecached context outside of the processing induced by the above mentioned render methods.
     */
    readonly visibleComponents: Collection<Component>;
    private constructor();
    /**
     * Returns the id of this region.
     */
    getID(): string;
    /**
     * Returns the number of components that would be rendered by this region
     * when calling PageMgr.renderRegion or PageMgr.renderRegion.
     * <p style="color:red">
     * Due to its time and customer group depending nature this call should NOT happen in a pagecached context
     * outside of the processing induced by the above mentioned render methods.
     */
    getSize(): number;
    /**
     * Returns the components that would be rendered by this region
     * when calling PageMgr.renderRegion or PageMgr.renderRegion.
     * <p style="color:red">
     * As visibility is driven by the merchant configured dynamic visibility rules, e.g. scheduling and custom segmentation, this
     * call should NOT happen in a pagecached context outside of the processing induced by the above mentioned render methods.
     */
    getVisibleComponents(): Collection<Component>;
}

export = Region;
