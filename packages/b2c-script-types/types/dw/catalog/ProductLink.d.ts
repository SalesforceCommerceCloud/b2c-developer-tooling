import Product = require('./Product');

/**
 * The class represents a link between two products.
 */
declare class ProductLink {
    /**
     * Represents an accessory product link.
     */
    static readonly LINKTYPE_ACCESSORY = 4;
    /**
     * Represents an alternative order unit product link.
     */
    static readonly LINKTYPE_ALT_ORDERUNIT = 6;
    /**
     * Represents a cross-sell product link.
     */
    static readonly LINKTYPE_CROSS_SELL = 1;
    /**
     * Represents a newer verion link.
     */
    static readonly LINKTYPE_NEWER_VERSION = 5;
    /**
     * Represents a miscellaneous product link.
     */
    static readonly LINKTYPE_OTHER = 8;
    /**
     * Represents a replacement product link.
     */
    static readonly LINKTYPE_REPLACEMENT = 2;
    /**
     * Represents a spare part product link.
     */
    static readonly LINKTYPE_SPARE_PART = 7;
    /**
     * Represents an up-sell product link.
     */
    static readonly LINKTYPE_UP_SELL = 3;
    /**
     * Returns the source product for this link.
     */
    readonly sourceProduct: Product<any>;
    /**
     * Returns the target product for this link.
     */
    readonly targetProduct: Product<any>;
    /**
     * Returns the type of this link (see constants).
     */
    readonly typeCode: number;
    private constructor();
    /**
     * Returns the source product for this link.
     */
    getSourceProduct(): Product<any>;
    /**
     * Returns the target product for this link.
     */
    getTargetProduct(): Product<any>;
    /**
     * Returns the type of this link (see constants).
     */
    getTypeCode(): number;
}

export = ProductLink;
