import Money = require('../value/Money');

/**
 * A tax on a line item: tax identifier, rate, and optional amount. Use with LineItem.setTaxes
 * and LineItem.getTaxes.
 * 
 * Create instances via LineItemTax.LineItemTax to have the
 * server compute the tax value, or via
 * LineItemTax.LineItemTax to provide a
 * pre-computed tax value.
 * 
 * Access is currently restricted to select pilot customers and controlled via feature toggle.
 * @see LineItem.getTaxes
 * @see LineItem.setTaxes
 */
declare class LineItemTax {
    /**
     * Gets the tax identifier (e.g. "DE_7").
     */
    readonly taxId: string;
    /**
     * Gets the tax rate as a decimal (e.g. 0.07 for 7%).
     */
    readonly taxRate: number;
    /**
     * Gets the tax value (amount) in purchase currency, or null if computed from rate and tax basis.
     */
    readonly taxValue: Money | null;
    /**
     * Creates a tax item for use with LineItem.setTaxes.
     * The tax value will be computed server-side from the tax rate and the line item's tax basis.
     * 
     * Access is currently restricted to select pilot customers and controlled via feature toggle.
     */
    constructor(taxId: string | null, taxRate: number);
    /**
     * Creates a tax item for use with LineItem.setTaxes.
     * 
     * Access is currently restricted to select pilot customers and controlled via feature toggle.
     */
    constructor(taxId: string | null, taxRate: number, taxValue: Money | null);
    /**
     * Gets the tax identifier (e.g. "DE_7").
     */
    getTaxId(): string;
    /**
     * Gets the tax rate as a decimal (e.g. 0.07 for 7%).
     */
    getTaxRate(): number;
    /**
     * Gets the tax value (amount) in purchase currency, or null if computed from rate and tax basis.
     */
    getTaxValue(): Money | null;
}

export = LineItemTax;
