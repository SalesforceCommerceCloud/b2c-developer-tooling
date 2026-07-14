import Decimal = require('../util/Decimal');

/**
 * Contains the formal definition of a tax including a type (it's just the key), a getRate
 * if provided, a getCaption and a getDescription.
 */
declare class TaxGroup {
    /**
     * Gets the caption.
     */
    readonly caption: string;
    /**
     * Gets the description.
     */
    readonly description: string;
    /**
     * Gets the percentage amount of the rate.
     */
    readonly rate: number;
    /**
     * Gets the tax type.
     */
    readonly taxType: string;
    private constructor();
    /**
     * Creates a TaxGroup.
     * 
     * This TaxGroup can be used for example in ReturnItem.addTaxItem.
     */
    static create(taxType: string, caption: string, description: string, taxRate: Decimal): TaxGroup;
    /**
     * Gets the caption.
     */
    getCaption(): string;
    /**
     * Gets the description.
     */
    getDescription(): string;
    /**
     * Gets the percentage amount of the rate.
     */
    getRate(): number;
    /**
     * Gets the tax type.
     */
    getTaxType(): string;
}

export = TaxGroup;
