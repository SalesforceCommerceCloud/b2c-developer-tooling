import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import Collection = require('../util/Collection');
import PriceBook = require('../catalog/PriceBook');

declare global {
    module ICustomAttributes {
        interface SourceCodeGroup extends CustomAttributes {
        }
    }
}

/**
 * A source code group defines a collection of source codes. Source code groups
 * are generally pattern based and any source code satisfying the pattern
 * belongs to the group. In this way, merchants may define a large set of source
 * codes which qualify a customer for site experiences (different prices, for
 * example), which customers without that source code do not receive.
 * The class dw.campaign.SourceCodeInfo represents an individual source
 * code.
 */
declare class SourceCodeGroup extends ExtensibleObject<ICustomAttributes.SourceCodeGroup> {
    /**
     * The ID of the SourceCodeGroup.
     */
    readonly ID: string;
    /**
     * Returns a Collection of PriceBooks the SourceCodeGroup is assigned to.
     */
    readonly priceBooks: Collection<PriceBook>;
    private constructor();
    /**
     * The ID of the SourceCodeGroup.
     */
    getID(): string;
    /**
     * Returns a Collection of PriceBooks the SourceCodeGroup is assigned to.
     */
    getPriceBooks(): Collection<PriceBook>;
}

export = SourceCodeGroup;
